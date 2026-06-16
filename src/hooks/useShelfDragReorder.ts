import { useCallback, useState, type PointerEvent as ReactPointerEvent } from 'react';

function moveId(list: string[], id: string, toIndex: number): string[] {
  const from = list.indexOf(id);
  if (from === -1 || from === toIndex) return list;
  const next = [...list];
  next.splice(from, 1);
  next.splice(toIndex, 0, id);
  return next;
}

export function useShelfDragReorder(
  shelfIds: string[],
  enabled: boolean,
  onCommit: (orderedIds: string[]) => void,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draftIds, setDraftIds] = useState<string[] | null>(null);

  const displayIds = draftIds ?? shelfIds;

  const finishDrag = useCallback(() => {
    if (draftIds) onCommit(draftIds);
    setDraggingId(null);
    setDraftIds(null);
  }, [draftIds, onCommit]);

  const onGripPointerDown = useCallback(
    (shelfId: string, e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDraggingId(shelfId);
      setDraftIds(shelfIds);
    },
    [enabled, shelfIds],
  );

  const onGripPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!draggingId || !draftIds) return;
      const sections = document.querySelectorAll<HTMLElement>('[data-shelf-id]');
      let targetIndex = draftIds.indexOf(draggingId);
      sections.forEach((el) => {
        const id = el.dataset.shelfId;
        if (!id) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const idx = draftIds.indexOf(id);
        if (idx === -1) return;
        if (e.clientY >= mid && idx > targetIndex) targetIndex = idx;
        if (e.clientY < mid && idx < targetIndex) targetIndex = idx;
      });
      const next = moveId(draftIds, draggingId, targetIndex);
      if (next.join(',') !== draftIds.join(',')) setDraftIds(next);
    },
    [draggingId, draftIds],
  );

  const onGripPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (!draggingId) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      finishDrag();
    },
    [draggingId, finishDrag],
  );

  const moveShelf = useCallback(
    (shelfId: string, direction: -1 | 1) => {
      if (!enabled) return;
      const idx = shelfIds.indexOf(shelfId);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= shelfIds.length) return;
      onCommit(moveId(shelfIds, shelfId, target));
    },
    [enabled, onCommit, shelfIds],
  );

  return {
    displayIds,
    draggingId,
    onGripPointerDown,
    onGripPointerMove,
    onGripPointerUp,
    moveShelf,
  };
}
