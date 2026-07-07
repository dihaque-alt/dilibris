import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true',
  );
}

export function useDialogA11y(
  containerRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  active = true,
) {
  const restoreFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    restoreFocusRef.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    const closeBtn = container.querySelector<HTMLElement>('.dl-close');
    const items = focusableElements(container);
    (closeBtn ?? items[0] ?? container).focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const root = containerRef.current;
      if (!root) return;

      const focusables = focusableElements(root);
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      if (focusables.length === 1) {
        e.preventDefault();
        focusables[0].focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (!root.contains(current)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const restore = restoreFocusRef.current;
      if (restore instanceof HTMLElement) {
        restore.focus();
      }
    };
  }, [active, containerRef, onClose]);
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
