import { Link } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useIsMobile } from '../hooks/useIsMobile';
import { removeAvatar, uploadAvatar } from '../lib/avatarUpload';
import {
  ACCENT_PRESETS,
  loadAppearancePrefs,
  saveAppearancePrefs,
  applyAppearancePrefs,
  type AccentPreset,
  type AppearancePrefs,
  type RoomMood,
} from '../lib/appearancePrefs';
import {
  BOOK_SIZE_LABELS,
  loadLibraryDisplayPrefs,
  saveLibraryDisplayPrefs,
  type BookSizePreset,
  type BookViewMode,
  type LibraryDisplayPrefs,
} from '../lib/libraryDisplayPrefs';
import { loadUserSettings, saveUserSettings, type UserSettings } from '../lib/userSettings';
import { ProfileAvatar } from './ProfileAvatar';

interface SettingsSheetProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
}

type SettingsForm = {
  profile: UserSettings;
  library: LibraryDisplayPrefs;
  appearance: AppearancePrefs;
};

function SettingsModalShell({
  mobile,
  onClose,
  children,
}: {
  mobile: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      className={`dl-modal-backdrop${mobile ? ' is-sheet-backdrop' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div className="dl-modal-backdrop-inner">{children}</div>
    </div>,
    document.body,
  );
}

export function SettingsSheet({ userId, userEmail, onClose }: SettingsSheetProps) {
  const mobile = useIsMobile();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarBust, setAvatarBust] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    applyAppearancePrefs(loadAppearancePrefs(userId));
    onClose();
  }, [userId, onClose]);

  useDialogA11y(dialogRef, handleClose);
  useBodyScrollLock();

  useEffect(() => {
    void loadUserSettings(userId, userEmail)
      .then((profile) => {
        setForm({
          profile,
          library: loadLibraryDisplayPrefs(userId),
          appearance: loadAppearancePrefs(userId),
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Помилка завантаження'));
  }, [userId, userEmail]);

  useEffect(() => {
    if (form) applyAppearancePrefs(form.appearance);
  }, [form?.appearance]);

  function patchProfile<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setForm((f) => (f ? { ...f, profile: { ...f.profile, [key]: value } } : f));
  }

  function patchLibrary<K extends keyof LibraryDisplayPrefs>(key: K, value: LibraryDisplayPrefs[K]) {
    setForm((f) => (f ? { ...f, library: { ...f.library, [key]: value } } : f));
  }

  function patchAppearance<K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) {
    setForm((f) => (f ? { ...f, appearance: { ...f.appearance, [key]: value } } : f));
  }

  async function handleAvatarPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarBusy(true);
    setError('');
    try {
      const url = await uploadAvatar(userId, file);
      patchProfile('avatarUrl', url);
      setAvatarBust(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося завантажити фото');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleAvatarRemove() {
    if (!window.confirm('Прибрати фото профілю?')) return;
    setAvatarBusy(true);
    setError('');
    try {
      await removeAvatar(userId);
      patchProfile('avatarUrl', null);
      setAvatarBust(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося прибрати фото');
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      await saveUserSettings(userId, form.profile);
      await saveAppearancePrefs(userId, form.appearance);
      await saveLibraryDisplayPrefs(userId, form.library);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалося зберегти');
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <SettingsModalShell mobile={mobile} onClose={handleClose}>
        <div
          ref={dialogRef}
          className={`dl-detailcard settings-sheet ${mobile ? 'is-sheet' : 'is-modal'}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <header className="dl-settings-head">
            <h2 id="settings-title">Профіль і налаштування</h2>
            <button type="button" className="dl-close" onClick={handleClose} aria-label="Закрити">
              ✕
            </button>
          </header>
          <p className="settings-sheet-loading">{error || 'Завантаження…'}</p>
        </div>
      </SettingsModalShell>
    );
  }


  return (
    <SettingsModalShell mobile={mobile} onClose={handleClose}>
      <div
        ref={dialogRef}
        className={`dl-detailcard settings-sheet ${mobile ? 'is-sheet' : 'is-modal'}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {mobile && <div className="dl-sheet-handle" aria-hidden="true" />}
        <header className="dl-settings-head">
          <ProfileAvatar
            name={form.profile.name}
            email={form.profile.email}
            avatarUrl={form.profile.avatarUrl}
            size="lg"
            cacheBust={avatarBust || undefined}
          />
          <div className="dl-settings-head-text">
            <h2 id="settings-title">Профіль і налаштування</h2>
            <p>{form.profile.email}</p>
            <div className="settings-avatar-actions">
              <button
                type="button"
                className="dl-ghost"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarBusy ? 'Завантаження…' : 'Змінити фото'}
              </button>
              {form.profile.avatarUrl && (
                <button
                  type="button"
                  className="dl-ghost"
                  disabled={avatarBusy}
                  onClick={() => void handleAvatarRemove()}
                >
                  Прибрати
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(e) => void handleAvatarPick(e)}
              />
            </div>
            <Link to={`/u/${userId}`} className="settings-profile-link">
              Переглянути профіль
            </Link>
          </div>
          <button type="button" className="dl-close" onClick={handleClose} aria-label="Закрити">
            ✕
          </button>
        </header>

        <div className="dl-settings-body">
          <label className="dl-field">
            <span className="dl-field-label">Ім&apos;я</span>
            <input
              className="dl-field-input"
              value={form.profile.name}
              onChange={(e) => patchProfile('name', e.target.value)}
              placeholder="Твоє ім'я"
            />
          </label>

          <div className="dl-field-row">
            <label className="dl-field">
              <span className="dl-field-label">Пошта</span>
              <input className="dl-field-input" value={form.profile.email} readOnly />
            </label>
            <label className="dl-field">
              <span className="dl-field-label">Місто</span>
              <input
                className="dl-field-input"
                value={form.profile.city}
                onChange={(e) => patchProfile('city', e.target.value)}
                placeholder="Київ"
              />
            </label>
          </div>

          <label className="dl-field">
            <span className="dl-field-label">
              Ціль на рік · {form.profile.yearTarget} книг
            </span>
            <input
              type="range"
              min={6}
              max={60}
              step={1}
              value={form.profile.yearTarget}
              onChange={(e) => patchProfile('yearTarget', Number(e.target.value))}
              className="dl-range"
            />
          </label>

          <label className="dl-field">
            <span className="dl-field-label">Про себе</span>
            <textarea
              className="dl-field-input"
              value={form.profile.bio}
              onChange={(e) => patchProfile('bio', e.target.value)}
              placeholder="Кілька слів про себе як читача"
              rows={3}
            />
          </label>

          <Toggle
            checked={form.profile.isProfilePublic}
            onChange={(v) => patchProfile('isProfilePublic', v)}
            label="Публічний профіль"
            hint="Інші бачать твоє ім'я, фото та біо в відгуках і нотатках"
          />

          <hr className="dl-settings-divider" />

          <Toggle
            checked={form.profile.defaultPrivate}
            onChange={(v) => patchProfile('defaultPrivate', v)}
            label="Нові нотатки"
            hint="За замовчуванням ховати нотатки від інших"
          />
          <Toggle
            checked={form.profile.weeklyDigest}
            onChange={(v) => patchProfile('weeklyDigest', v)}
            label="Тижневий дайджест"
            hint="Лист щонеділі з підсумком читання"
          />
          <Toggle
            checked={form.profile.reminders}
            onChange={(v) => patchProfile('reminders', v)}
            label="Нагадування читати"
            hint="Делікатний поштовх у тихий вечір"
          />

          <hr className="dl-settings-divider" />

          <SettingsSection title="Бібліотека" />
          <SegmentedField
            label="На полиці"
            value={form.library.bookView}
            options={[
              ['spine', 'Корінці'],
              ['cover', 'Обкладинки'],
            ]}
            onChange={(v) => patchLibrary('bookView', v as BookViewMode)}
          />
          <SegmentedField
            label="Обкладинки"
            value={form.library.realCovers ? 'real' : 'typo'}
            options={[
              ['real', 'Справжні'],
              ['typo', 'Типографічні'],
            ]}
            onChange={(v) => patchLibrary('realCovers', v === 'real')}
          />
          <SegmentedField
            label="Розмір"
            value={form.library.bookSize}
            options={(Object.keys(BOOK_SIZE_LABELS) as BookSizePreset[]).map((key) => [
              key,
              BOOK_SIZE_LABELS[key],
            ])}
            onChange={(v) => patchLibrary('bookSize', v as BookSizePreset)}
          />
          <Toggle
            checked={form.library.hoverTitles}
            onChange={(v) => patchLibrary('hoverTitles', v)}
            label="Підпис при наведенні"
            hint="Короткий tooltip з назвою книги на полиці"
          />

          <hr className="dl-settings-divider" />

          <SettingsSection title="Кімната" />
          <label className="dl-field">
            <span className="dl-field-label">
              Затемнення фону · {Math.round(form.appearance.dim * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={0.85}
              step={0.05}
              value={form.appearance.dim}
              onChange={(e) => patchAppearance('dim', Number(e.target.value))}
              className="dl-range"
            />
          </label>
          <SegmentedField
            label="Настрій"
            value={form.appearance.mood}
            options={[
              ['evening', 'Вечір'],
              ['day', 'День'],
            ]}
            onChange={(v) => patchAppearance('mood', v as RoomMood)}
          />
          <SegmentedField
            label="Колір акценту"
            value={form.appearance.accent}
            options={(Object.keys(ACCENT_PRESETS) as AccentPreset[]).map((key) => [key, key])}
            onChange={(v) => patchAppearance('accent', v as AccentPreset)}
          />

          {error && <p className="banner-error">{error}</p>}
        </div>

        <footer className="dl-settings-foot">
          <button type="button" className="dl-ghost" onClick={handleClose}>
            Скасувати
          </button>
          <button type="button" className="dl-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Збереження…' : 'Зберегти'}
          </button>
        </footer>
      </div>
    </SettingsModalShell>
  );
}

function SettingsSection({ title }: { title: string }) {
  return <h3 className="dl-settings-section">{title}</h3>;
}

function SegmentedField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="dl-field">
      <span className="dl-field-label">{label}</span>
      <div className="dl-settings-segments" role="group" aria-label={label}>
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            className={value === key ? 'is-active' : ''}
            onClick={() => onChange(key)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="dl-toggle-row"
      onClick={() => onChange(!checked)}
    >
      <span className={`dl-toggle-track${checked ? ' is-on' : ''}`} aria-hidden="true">
        <span className="dl-toggle-thumb" />
      </span>
      <span className="dl-toggle-text">
        <span className="dl-toggle-label">{label}</span>
        {hint && <span className="dl-toggle-hint">{hint}</span>}
      </span>
    </button>
  );
}
