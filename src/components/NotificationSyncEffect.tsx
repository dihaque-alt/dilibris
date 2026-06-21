import { useEffect } from 'react';
import { syncNotifications } from '../lib/notificationsStore';
import { syncActivityNotifications } from '../lib/syncActivityNotifications';

interface NotificationSyncEffectProps {
  userId: string;
}

export function NotificationSyncEffect({ userId }: NotificationSyncEffectProps) {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await syncNotifications(userId);
        if (cancelled) return;
        await syncActivityNotifications(userId);
        if (cancelled) return;
        await syncNotifications(userId);
        if (cancelled) return;
        window.dispatchEvent(new CustomEvent('dilibris:notifications'));
      } catch {
        /* offline / auth edge */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return null;
}
