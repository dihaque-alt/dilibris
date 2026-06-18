import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { todayIsoDate } from '../lib/dates';
import {
  clearActiveSession,
  elapsedSeconds,
  fetchActiveSession,
  formatSessionClock,
  saveActiveSession,
  snapshotSession,
  subscribeActiveSession,
} from '../lib/offline/activeSessionSync';
import { addSession, fetchEntry } from '../lib/offline/librarySync';
import type { ActiveReadingSession, UserBookEntry } from '../types/database';
import { ActiveSessionBanner } from './ActiveSessionBanner';
import { useOffline } from './OfflineProvider';
import { GoodreadsImportSheet } from './GoodreadsImportSheet';
import { SessionTimer } from './SessionTimer';
import { SettingsSheet } from './SettingsSheet';

interface AppOverlaysContextValue {
  openSettings: () => void;
  openGoodreadsImport: () => void;
  openSession: (entry: UserBookEntry) => void;
}

const AppOverlaysContext = createContext<AppOverlaysContextValue | null>(null);

export function useAppOverlays(): AppOverlaysContextValue {
  const ctx = useContext(AppOverlaysContext);
  if (!ctx) {
    throw new Error('useAppOverlays must be used within AppOverlaysProvider');
  }
  return ctx;
}

interface AppOverlaysProviderProps {
  userId: string;
  userEmail: string;
  children: ReactNode;
}

export function AppOverlaysProvider({ userId, userEmail, children }: AppOverlaysProviderProps) {
  const { refreshPending } = useOffline();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goodreadsOpen, setGoodreadsOpen] = useState(false);
  const [sessionEntry, setSessionEntry] = useState<UserBookEntry | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveReadingSession | null>(null);
  const [activeEntry, setActiveEntry] = useState<UserBookEntry | null>(null);
  const [bannerClock, setBannerClock] = useState('00:00');
  const activeSessionRef = useRef<ActiveReadingSession | null>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  const refreshActiveSession = useCallback(async () => {
    const session = await fetchActiveSession(userId);
    setActiveSession(session);
    if (session) {
      const entry = await fetchEntry(session.entry_id);
      setActiveEntry(entry);
      setBannerClock(formatSessionClock(elapsedSeconds(session)));
    } else {
      setActiveEntry(null);
    }
  }, [userId]);

  useEffect(() => {
    void refreshActiveSession();
  }, [refreshActiveSession]);

  useEffect(() => {
    return subscribeActiveSession(userId, (session) => {
      setActiveSession(session);
      if (session) {
        void fetchEntry(session.entry_id).then(setActiveEntry);
        setBannerClock(formatSessionClock(elapsedSeconds(session)));
      } else {
        setActiveEntry(null);
      }
    });
  }, [userId]);

  useEffect(() => {
    if (!activeSession || sessionEntry) return;

    const tick = () => {
      const session = activeSessionRef.current;
      if (!session) return;
      setBannerClock(formatSessionClock(elapsedSeconds(session)));
    };

    tick();
    if (!activeSession.is_running) return;

    const t = setInterval(() => {
      const session = activeSessionRef.current;
      if (!session?.is_running) return;
      setBannerClock(formatSessionClock(elapsedSeconds(session)));
    }, 1000);
    return () => clearInterval(t);
  }, [activeSession?.is_running, activeSession?.accumulated_seconds, activeSession?.last_tick_at, sessionEntry, activeSession]);

  const logSession = useCallback(
    async (
      entryId: string,
      payload: { minutes: number; pages: number; note: string | null },
    ) => {
      await addSession(userId, entryId, {
        sessionDate: todayIsoDate(),
        pages: payload.pages,
        minutes: payload.minutes,
        note: payload.note,
      });
      await clearActiveSession(userId);
      await refreshPending();
      await refreshActiveSession();
    },
    [userId, refreshPending, refreshActiveSession],
  );

  const discardActiveSession = useCallback(async () => {
    if (!window.confirm('Скинути сесію без запису в журнал?')) return;
    await clearActiveSession(userId);
    await refreshActiveSession();
  }, [userId, refreshActiveSession]);

  const toggleActiveSessionPause = useCallback(async () => {
    const session = activeSessionRef.current;
    if (!session) return;

    const nextRunning = !session.is_running;
    const next = snapshotSession(session, { is_running: nextRunning });
    await saveActiveSession(next);
    setActiveSession(next);
    setBannerClock(formatSessionClock(elapsedSeconds(next)));
  }, []);

  const finishActiveSession = useCallback(async () => {
    const session = activeSessionRef.current;
    if (!session) return;

    try {
      const snap = session.is_running
        ? snapshotSession(session, { is_running: false })
        : session;
      if (session.is_running) {
        await saveActiveSession(snap);
      }
      const minutes = Math.max(1, Math.round(elapsedSeconds(snap) / 60));
      const pages = parseInt(snap.pages_draft, 10) || 0;
      const note = snap.note_draft.trim() || null;
      await logSession(session.entry_id, { minutes, pages, note });
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Не вдалося записати сесію');
    }
  }, [logSession]);

  const value: AppOverlaysContextValue = {
    openSettings: () => setSettingsOpen(true),
    openGoodreadsImport: () => setGoodreadsOpen(true),
    openSession: (entry) => setSessionEntry(entry),
  };

  const showBanner = Boolean(activeSession && activeEntry && !sessionEntry);

  return (
    <AppOverlaysContext.Provider value={value}>
      {children}
      {showBanner && activeEntry && (
        <ActiveSessionBanner
          title={activeEntry.book?.title ?? 'Книга'}
          clock={bannerClock}
          isRunning={activeSession?.is_running ?? false}
          onOpen={() => setSessionEntry(activeEntry)}
          onTogglePause={() => void toggleActiveSessionPause()}
          onFinish={() => void finishActiveSession()}
          onDiscard={discardActiveSession}
        />
      )}
      {settingsOpen && (
        <SettingsSheet
          userId={userId}
          userEmail={userEmail}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {goodreadsOpen && (
        <GoodreadsImportSheet userId={userId} onClose={() => setGoodreadsOpen(false)} />
      )}
      {sessionEntry && (
        <SessionTimer
          entry={sessionEntry}
          userId={userId}
          syncedSession={activeSession?.entry_id === sessionEntry.id ? activeSession : null}
          onDismiss={() => {
            setSessionEntry(null);
            void refreshActiveSession();
          }}
          onDiscard={() => {
            setSessionEntry(null);
            void refreshActiveSession();
          }}
          onFinish={async (payload) => {
            await logSession(sessionEntry.id, payload);
            setSessionEntry(null);
          }}
        />
      )}
    </AppOverlaysContext.Provider>
  );
}
