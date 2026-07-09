import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { OnboardingWelcome } from './components/OnboardingWelcome';
import { AppearancePrefsEffect } from './components/AppearancePrefsEffect';
import { AppPrefsSyncEffect } from './components/AppPrefsSyncEffect';
import { AppOverlaysProvider } from './components/AppOverlays';
import { NotificationSyncEffect } from './components/NotificationSyncEffect';
import { OfflineProvider } from './components/OfflineProvider';
import { RoomBackdrop } from './components/RoomBackdrop';
import { useAuth } from './hooks/useAuth';
import { resolveOnboardingStatus } from './lib/onboarding';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { BuddyReadDetailPage } from './pages/BuddyReadDetailPage';
import { BuddyReadJoinPage } from './pages/BuddyReadJoinPage';
import { BuddyReadsPage } from './pages/BuddyReadsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { NotesPage } from './pages/NotesPage';
import { ProfilePage } from './pages/ProfilePage';

function AuthenticatedRoutes({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    void resolveOnboardingStatus(userId)
      .then((complete) => {
        if (!cancelled) setOnboarded(complete);
      })
      .catch(() => {
        if (!cancelled) setOnboarded(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (onboarded === null) {
    return (
      <>
        <RoomBackdrop />
        <div className="auth-onboard-wrap">
          <p className="auth-onboard-loading">Завантаження…</p>
        </div>
      </>
    );
  }

  if (!onboarded) {
    return (
      <OnboardingWelcome
        userId={userId}
        userEmail={userEmail}
        onComplete={() => setOnboarded(true)}
      />
    );
  }

  return (
    <OfflineProvider userId={userId}>
      <AppPrefsSyncEffect userId={userId} />
      <AppearancePrefsEffect userId={userId} />
      <NotificationSyncEffect userId={userId} />
      <AppOverlaysProvider userId={userId} userEmail={userEmail}>
        <Routes>
          <Route path="/" element={<LibraryPage userId={userId} userEmail={userEmail} />} />
          <Route path="/dashboard" element={<DashboardPage userId={userId} userEmail={userEmail} />} />
          <Route path="/notes" element={<NotesPage userId={userId} userEmail={userEmail} />} />
          <Route path="/u/:profileId" element={<ProfilePage userId={userId} userEmail={userEmail} />} />
          <Route path="/buddy-reads" element={<BuddyReadsPage userId={userId} userEmail={userEmail} />} />
          <Route path="/buddy-reads/join/:token" element={<BuddyReadJoinPage />} />
          <Route path="/buddy-reads/:id" element={<BuddyReadDetailPage userId={userId} userEmail={userEmail} />} />
          <Route path="/auth/callback" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppOverlaysProvider>
    </OfflineProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <>
        <RoomBackdrop />
        <div className="auth-onboard-wrap">
          <p className="auth-onboard-loading">Завантаження…</p>
        </div>
      </>
    );
  }

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/*"
        element={
          user ? (
            <AuthenticatedRoutes userId={user.id} userEmail={user.email ?? ''} />
          ) : (
            <>
              <RoomBackdrop />
              <LoginForm />
            </>
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
