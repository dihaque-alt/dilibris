interface OfflineBannerProps {
  online: boolean;
  pending: number;
  syncing: boolean;
  pageDetail: string | null;
}

export function OfflineBanner({ online, pending, syncing, pageDetail }: OfflineBannerProps) {
  if (online && pending === 0 && !syncing && !pageDetail) return null;

  const mode = !online ? 'offline' : syncing || pending > 0 ? 'sync' : 'offline';

  return (
    <div
      className={`offline-banner offline-banner--${mode}`}
      role={!online || pageDetail ? 'status' : undefined}
    >
      {!online && (
        <span>
          Показано збережену копію — сервер тимчасово недоступний
          {pending > 0 && <> ({pending} змін у черзі)</>}
        </span>
      )}
      {online && syncing && <span>Синхронізуємо зміни…</span>}
      {online && !syncing && pending > 0 && (
        <span>Є {pending} змін, що очікують підтвердження</span>
      )}
      {online && !syncing && pending === 0 && pageDetail && <span>{pageDetail}</span>}
    </div>
  );
}
