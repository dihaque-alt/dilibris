import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { PageHead } from '../components/PageHead';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import '../styles/library.css';
import '../styles/screens-ui.css';

interface ProfilePageProps {
  userId: string;
  userEmail: string;
}

export function ProfilePage({ userId, userEmail }: ProfilePageProps) {
  const { profileId = '' } = useParams();
  const isOwn = profileId === userId;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    void (async () => {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio, is_profile_public')
        .eq('id', profileId)
        .maybeSingle();

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setProfile(null);
        setLoading(false);
        return;
      }
      if (!data) {
        setError('Профіль не знайдено');
        setProfile(null);
        setLoading(false);
        return;
      }
      if (!isOwn && !data.is_profile_public) {
        setError('Цей профіль приватний');
        setProfile(null);
        setLoading(false);
        return;
      }
      setProfile(data as Profile);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId, isOwn]);

  const displayName = profile?.display_name?.trim() || 'Читач';

  return (
    <div className="app-shell">
      <RoomBackdrop />
      <AppNav userEmail={userEmail} userId={userId} active="library" />

      <main className="dl-page profile-page">
        <PageHead eyebrow="Профіль" title={isOwn ? 'Твій профіль' : displayName} />

        {loading && <p className="empty-hint">Завантажуємо профіль…</p>}
        {error && !loading && <p className="banner-error">{error}</p>}

        {profile && !loading && (
          <section className="dl-panel profile-card">
            <div className="profile-card-head">
              <ProfileAvatar
                name={profile.display_name}
                avatarUrl={profile.avatar_url}
                size="lg"
              />
              <div>
                <h2 className="profile-card-name">{displayName}</h2>
                {isOwn && (
                  <p className="profile-card-meta">
                    {profile.is_profile_public ? 'Публічний профіль' : 'Приватний профіль'}
                  </p>
                )}
              </div>
            </div>

            {profile.bio?.trim() ? (
              <p className="profile-card-bio">{profile.bio}</p>
            ) : (
              <p className="empty-hint">{isOwn ? 'Додай біо в налаштуваннях' : 'Без опису'}</p>
            )}

            {isOwn && (
              <footer className="profile-card-foot">
                <Link to="/" className="dl-ghost">
                  До бібліотеки
                </Link>
              </footer>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
