interface ChallengeBarProps {
  value: number;
  target: number;
  height?: number;
}

export function ChallengeBar({ value, target, height = 14 }: ChallengeBarProps) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;

  return (
    <div className="dl-challenge-bar" style={{ height }}>
      <div className="dl-challenge-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
