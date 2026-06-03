import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { OfflineBanner } from './OfflineBanner';
import { flushPendingOps, getPendingCount } from '../lib/offline/librarySync';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

type OfflineContextValue = {
  online: boolean;
  pending: number;
  syncing: boolean;
  refreshPending: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    return {
      online: true,
      pending: 0,
      syncing: false,
      refreshPending: async () => {},
    };
  }
  return ctx;
}

export function OfflineProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    setPending(await getPendingCount(userId));
  }, [userId]);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return;
    const count = await getPendingCount(userId);
    if (count === 0) {
      setPending(0);
      return;
    }
    setSyncing(true);
    await flushPendingOps(userId);
    setPending(await getPendingCount(userId));
    setSyncing(false);
  }, [userId]);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    if (!online) return;
    runSync();
  }, [online, runSync]);

  return (
    <OfflineContext.Provider value={{ online, pending, syncing, refreshPending }}>
      <OfflineBanner online={online} pending={pending} syncing={syncing} />
      {children}
    </OfflineContext.Provider>
  );
}
