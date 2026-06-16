import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { todayIsoDate } from '../lib/dates';
import { addSession } from '../lib/offline/librarySync';
import type { UserBookEntry } from '../types/database';
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
    },
    [userId, refreshPending],
  );

  const value: AppOverlaysContextValue = {
    openSettings: () => setSettingsOpen(true),
    openGoodreadsImport: () => setGoodreadsOpen(true),
    openReader: (entry) => setReaderEntry(entry),
    openSession: (entry) => setSessionEntry(entry),
  };

  return (
    <AppOverlaysContext.Provider value={value}>
      {children}
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
          onClose={() => setSessionEntry(null)}
          onFinish={(payload) => {
            void logSession(sessionEntry.id, payload);
          }}
        />
      )}
    </AppOverlaysContext.Provider>
  );
}
