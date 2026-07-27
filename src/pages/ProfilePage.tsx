import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { PageHead } from '../components/PageHead';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { PublicHeader } from '../components/PublicHeader';
import { RoomBackdrop } from '../components/RoomBackdrop';
import { useAuth } from '../hooks/useAuth';
import { fetchPublicProfileStats, type PublicProfileStats } from '../lib/publicProfileStats';
import { formatMinutes, formatStarRating } from '../lib/rating';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';
import '../styles/library.css';
import '../styles/screens-ui.css';

const YEAR = new Date().getFullYear();

function ProfileStats({ stats }: { stats: PublicProfileStats }) {
  const hasYearActivity =
    stats.booksFinishedYear > 0 || stats.pagesReadYear > 0 || stats.minutesReadYear > 0;

  return (
    <section className="profile-stats" aria-label="Статистика читання">
      <h3 className="profile-stats-title">Статистика</h3>
      <div className="profile-stats-grid">
        <article className="profile-stat-card">
          <span className="profile-stat-value">{stats.booksFinished}</span>
          <span className="profile-stat-label">книг прочитано</span>
        </article>
        <article className="profile-stat-card">
          <span className="profile-stat-value">{stats.currentlyReading}</span>
          <span className="profile-stat-label">зараз читає</span>
        </article>
      </div>

      {hasYearActivity && (
        <>
          <p className="profile-stats-year">{YEAR}</p>
          <div className="profile-stats-grid">
            <article className="profile-stat-card">
              <span className="profile-stat-value">{stats.booksFinishedYear}</span>
              <span className="profile-stat-label">книг за рік</span>
            </article>
            <article className="profile-stat-card">
              <span className="profile-stat-value">{stats.pagesReadYear}</span>
              <span className="profile-stat-label">сторінок</span>
            </article>
            <article className="profile-stat-card">
              <span className="profile-stat-value">{formatMinutes(stats.minutesReadYear)}</span>
              <span className="profile-stat-label">час читання</span>
            </article>
            {stats.avgRatingYear != null && (
              <article className="profile-stat-card">
                <span className="profile-stat-value">{formatStarRating(stats.avgRatingYear)}</span>
                <span className="profile-stat-label">середня оцінка</span>
              </article>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function ProfilePage() {
  const { profileId = '' } = useParams();
  const { user, loading: authLoading } = useAuth();
  const viewerId = user?.id ?? null;
  const viewerEmail = user?.email ?? '';
  const isOwn = Boolean(viewerId && profileId === viewerId);
  const isGuest = !viewerId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<PublicProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setStats(null);

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

      if (data.is_profile_public || isOwn) {
        try {
          const nextStats = await fetchPublicProfileStats(profileId);
          if (!cancelled) setStats(nextStats);
        } catch {
          /* stats are optional */
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [profileId, isOwn]);

  const displayName = profile?.display_name?.trim() || 'Читач';

  return (
    <div className="app-shell">
      <RoomBackdrop />
      {isGuest ? (
        <PublicHeader />
      ) : (
        <AppNav userEmail={viewerEmail} userId={viewerId!} active="library" />
      )}

      <main className="dl-page profile-page">
        <PageHead eyebrow="Профіль" title={isOwn ? 'Твій профіль' : displayName} />

        {(loading || authLoading) && <p className="empty-hint">Завантажуємо профіль…</p>}
        {error && !loading && !authLoading && <p className="banner-error">{error}</p>}

        {profile && !loading && !authLoading && (
          <section className="dl-panel profile-card">
            <div className="profile-card-head">
              <ProfileAvatar name={profile.display_name} avatarUrl={profile.avatar_url} size="lg" />
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

            {stats && (profile.is_profile_public || isOwn) && <ProfileStats stats={stats} />}

            <footer className="profile-card-foot">
              {isOwn ? (
                <Link to="/" className="dl-ghost">
                  До бібліотеки
                </Link>
              ) : isGuest ? (
                <Link to="/" className="dl-primary">
                  Увійти в DiLibris
                </Link>
              ) : (
                <Link to="/" className="dl-ghost">
                  До бібліотеки
                </Link>
              )}
            </footer>
          </section>
        )}
      </main>
    </div>
  );
}
