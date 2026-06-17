import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { todayIsoDate } from '../lib/dates';
import {
  clearActiveSession,
  elapsedSeconds,
  fetchActiveSession,
  formatSessionClock,
  subscribeActiveSession,
} from '../lib/offline/activeSessionSync';
import { addSession, fetchEntry } from '../lib/offline/librarySync';
import type { ActiveReadingSession, UserBookEntry } from '../types/database';
import { ActiveSessionBanner } from './ActiveSessionBanner';
import { useOffline } from './OfflineProvider';
import { GoodreadsImportSheet } from './GoodreadsImportSheet';
import { ReaderView } from './ReaderView';
import { SessionTimer } from './SessionTimer';
import { SettingsSheet } from './SettingsSheet';

interface AppOverlaysContextValue {
  openSettings: () => void;
  openGoodreadsImport: () => void;
  openReader: (entry: UserBookEntry) => void;
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
  const [readerEntry, setReaderEntry] = useState<UserBookEntry | null>(null);
  const [sessionEntry, setSessionEntry] = useState<UserBookEntry | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveReadingSession | null>(null);
  const [activeEntry, setActiveEntry] = useState<UserBookEntry | null>(null);
  const [bannerClock, setBannerClock] = useState('00:00');

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
    if (!activeSession?.is_running || sessionEntry) return;
    const t = setInterval(() => {
      setBannerClock(formatSessionClock(elapsedSeconds(activeSession)));
    }, 1000);
    return () => clearInterval(t);
  }, [activeSession, sessionEntry]);

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
      await refreshPending();
      await refreshActiveSession();
    },
    [userId, refreshPending, refreshActiveSession],
  );

  const value: AppOverlaysContextValue = {
    openSettings: () => setSettingsOpen(true),
    openGoodreadsImport: () => setGoodreadsOpen(true),
    openReader: (entry) => setReaderEntry(entry),
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
          onContinue={() => setSessionEntry(activeEntry)}
          onDiscard={() => {
            void clearActiveSession(userId).then(refreshActiveSession);
          }}
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
      {readerEntry && (
        <ReaderView
          entry={readerEntry}
          onClose={() => setReaderEntry(null)}
          onFinish={(payload) => {
            void logSession(readerEntry.id, { ...payload, note: null });
          }}
        />
      )}
      {sessionEntry && (
        <SessionTimer
          entry={sessionEntry}
          userId={userId}
          onDismiss={() => {
            setSessionEntry(null);
            void refreshActiveSession();
          }}
          onDiscard={() => {
            setSessionEntry(null);
            void refreshActiveSession();
          }}
          onFinish={(payload) => {
            void logSession(sessionEntry.id, payload);
            setSessionEntry(null);
          }}
        />
      )}
    </AppOverlaysContext.Provider>
  );
}
