type DetailTab = 'progress' | 'review' | 'notes' | 'sessions';

interface DetailTabsProps {
  active: DetailTab;
  onChange: (tab: DetailTab) => void;
}

const TABS: { id: DetailTab; label: string }[] = [
  { id: 'progress', label: 'Прогрес' },
  { id: 'review', label: 'Відгук' },
  { id: 'notes', label: 'Нотатки' },
  { id: 'sessions', label: 'Сесії' },
];

export function DetailTabs({ active, onChange }: DetailTabsProps) {
  return (
    <div className="detail-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={active === tab.id ? 'detail-tab active' : 'detail-tab'}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export type { DetailTab };
