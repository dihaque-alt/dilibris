interface OfflineBannerProps {
  online: boolean;
  pending: number;
  syncing: boolean;
}

export function OfflineBanner({ online, pending, syncing }: OfflineBannerProps) {
  if (online && pending === 0) return null;

  return (
    <div className={`offline-banner ${online ? 'offline-banner--sync' : 'offline-banner--offline'}`}>
      {!online && <span>Offline — показуємо збережену бібліотеку.</span>}
      {online && syncing && <span>Синхронізуємо зміни…</span>}
      {online && !syncing && pending > 0 && (
        <span>Є {pending} змін, що очікують синхронізації.</span>
      )}
      {!online && pending > 0 && <span> ({pending} змін у черзі)</span>}
    </div>
  );
}
