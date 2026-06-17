import type { ReactNode } from 'react';

interface BookcaseChromeProps {
  children: ReactNode;
}

/** Wooden bookcase frame: lamp, cornice, side posts, plinth (design-handoff). */
export function BookcaseChrome({ children }: BookcaseChromeProps) {
  return (
    <div className="dl-bookcase-shell">
      <div className="dl-pendant" aria-hidden="true">
        <span className="dl-pendant-cord" />
        <span className="dl-pendant-shade" />
      </div>
      <div className="dl-bookcase">
        <div className="dl-cornice" aria-hidden="true" />
        <div className="dl-case-body">
          <span className="dl-case-post dl-case-post--left" aria-hidden="true" />
          <span className="dl-case-post dl-case-post--right" aria-hidden="true" />
          <div className="dl-case-shelves">{children}</div>
        </div>
        <div className="dl-plinth" aria-hidden="true">
          <span className="dl-plinth-foot dl-plinth-foot--left" />
          <span className="dl-plinth-foot dl-plinth-foot--right" />
        </div>
      </div>
    </div>
  );
}
