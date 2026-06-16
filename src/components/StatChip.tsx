interface StatChipProps {
  label: string;
  value: string;
  accent?: string;
}

export function StatChip({ label, value, accent }: StatChipProps) {
  return (
    <div className="dl-stat-chip">
      <div className="dl-stat-chip-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="dl-stat-chip-label">{label}</div>
    </div>
  );
}
