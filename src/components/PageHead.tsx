import type { ReactNode } from 'react';

interface PageHeadProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  children?: ReactNode;
}

export function PageHead({ eyebrow, title, sub, children }: PageHeadProps) {
  return (
    <header className="dl-pagehead">
      <div>
        {eyebrow && <p className="dl-pagehead-eyebrow">{eyebrow}</p>}
        <h1 className="dl-pagehead-title">{title}</h1>
        {sub && <p className="dl-pagehead-sub">{sub}</p>}
      </div>
      {children}
    </header>
  );
}
