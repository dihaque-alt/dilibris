import type { PointerEvent as ReactPointerEvent } from 'react';

interface ShelfReorderGripProps {
  enabled: boolean;
  active: boolean;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
}

export function ShelfReorderGrip({
  enabled,
  active,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: ShelfReorderGripProps) {
  if (!enabled) return null;

  return (
    <button
      type="button"
      className={`dl-shelf-grip${active ? ' is-dragging' : ''}`}
      aria-label="Перетягни для зміни порядку полиць"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      ⋮⋮
    </button>
  );
}
