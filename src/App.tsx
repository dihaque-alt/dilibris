import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoginForm } from './components/LoginForm';
import { OfflineProvider } from './components/OfflineProvider';
import { useAuth } from './hooks/useAuth';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { BuddyReadDetailPage } from './pages/BuddyReadDetailPage';
import { BuddyReadJoinPage } from './pages/BuddyReadJoinPage';
import { BuddyReadsPage } from './pages/BuddyReadsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';

function AuthenticatedRoutes({ userId, userEmail }: { userId: string; userEmail: string }) {
  return (
    <OfflineProvider userId={userId}>
      <Routes>
        <Route path="/" element={<LibraryPage userId={userId} userEmail={userEmail} />} />
        <Route path="/dashboard" element={<DashboardPage userId={userId} userEmail={userEmail} />} />
        <Route path="/buddy-reads" element={<BuddyReadsPage userId={userId} userEmail={userEmail} />} />
        <Route path="/buddy-reads/join/:token" element={<BuddyReadJoinPage />} />
        <Route path="/buddy-reads/:id" element={<BuddyReadDetailPage userId={userId} userEmail={userEmail} />} />
        <Route path="/auth/callback" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OfflineProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-page">Завантаження…</div>;
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
            <div className="center-page">
              <LoginForm />
            </div>
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
