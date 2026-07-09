import { supabase } from './supabase';
import { notifyProfileUpdated } from './profileHeader';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_EDGE = 512;

function formatUploadError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message);
  }
  return 'Не вдалося завантажити фото';
}

async function requireSession(userId: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Сесія закінчилась — увійди знову');
  if (data.session.user.id !== userId) throw new Error('Невідповідність сесії — онови сторінку');
}

async function prepareAvatarBlob(file: File): Promise<Blob> {
  if (file.size > MAX_BYTES * 4) {
    throw new Error('Фото занадто велике — спробуй інше');
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      'Не вдалося прочитати фото. Спробуй JPEG або PNG (HEIC з iPhone часто не підтримується).',
    );
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Не вдалося обробити фото');
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Не вдалося стиснути фото'));
          return;
        }
        if (result.size > MAX_BYTES) {
          reject(new Error('Фото має бути не більше 2 МБ'));
          return;
        }
        resolve(result);
      },
      'image/jpeg',
      0.88,
    );
  });

  return blob;
}

async function removeKnownAvatarPaths(userId: string) {
  const paths = ['jpg', 'png', 'webp'].map((ext) => `${userId}/avatar.${ext}`);
  await supabase.storage.from('avatars').remove(paths);
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  await requireSession(userId);

  const blob = await prepareAvatarBlob(file);
  const path = `${userId}/avatar.jpg`;

  await removeKnownAvatarPaths(userId);

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, blob, {
      upsert: false,
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(formatUploadError(uploadError));
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (profileError) {
    throw new Error(formatUploadError(profileError));
  }

  notifyProfileUpdated();
  return publicUrl;
}

export async function removeAvatar(userId: string): Promise<void> {
  await requireSession(userId);
  await removeKnownAvatarPaths(userId);

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId);

  if (profileError) {
    throw new Error(formatUploadError(profileError));
  }

  notifyProfileUpdated();
}
