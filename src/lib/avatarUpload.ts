import { supabase } from './supabase';
import { notifyProfileUpdated } from './profileHeader';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export function validateAvatarFile(file: File): string | null {
  const mime = resolveMime(file);
  if (!ALLOWED.includes(mime)) {
    return 'Дозволені формати: JPEG, PNG або WebP. Якщо фото з iPhone (HEIC) — спочатку конвертуй у JPEG.';
  }
  if (file.size > MAX_BYTES) return 'Фото має бути не більше 2 МБ';
  return null;
}

function resolveMime(file: File): string {
  if (file.type && ALLOWED.includes(file.type)) return file.type;

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';

  return file.type || '';
}

function extForMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const validation = validateAvatarFile(file);
  if (validation) throw new Error(validation);

  const mime = resolveMime(file);
  const ext = extForMime(mime);
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: mime, cacheControl: '3600' });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);
  if (profileError) throw profileError;

  notifyProfileUpdated();
  return publicUrl;
}

export async function removeAvatar(userId: string): Promise<void> {
  const { data: files, error: listError } = await supabase.storage.from('avatars').list(userId);
  if (listError) throw listError;

  if (files?.length) {
    const paths = files.map((f) => `${userId}/${f.name}`);
    const { error: removeError } = await supabase.storage.from('avatars').remove(paths);
    if (removeError) throw removeError;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);
  if (profileError) throw profileError;

  notifyProfileUpdated();
}
