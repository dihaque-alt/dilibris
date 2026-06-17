import { useEffect } from 'react';
import { hydrateNotificationTimes, loadNotifications } from '../lib/notificationsStore';
import { syncActivityNotifications } from '../lib/syncActivityNotifications';

interface NotificationSyncEffectProps {
  userId: string;
}

export function NotificationSyncEffect({ userId }: NotificationSyncEffectProps) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await syncActivityNotifications(userId);
        if (cancelled) return;
        hydrateNotificationTimes(loadNotifications(userId));
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
