import { useId } from 'react';

function Star({ fill, size, gradId }: { fill: number; size: number; gradId: string }) {
  const pct = Math.max(0, Math.min(100, fill * 100));
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={gradId}>
          <stop offset={`${pct}%`} stopColor="var(--gold-highlight)" />
          <stop offset={`${pct}%`} stopColor="#E7DFD0" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 16.9 6.1 19.9l1.3-6.3L2.7 9.1l6.3-.7z"
        fill={`url(#${gradId})`}
        stroke="var(--gold-deep)"
        strokeWidth="0.8"
        strokeOpacity="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface StarRatingProps {
  value?: number;
  size?: number;
  onChange?: (value: number) => void;
  /** Allow clearing by clicking the same half again */
  clearable?: boolean;
}

export function StarRating({ value = 0, size = 22, onChange, clearable = true }: StarRatingProps) {
  const baseId = useId();
  const interactive = !!onChange;

  function pick(star: number, half: boolean) {
    if (!onChange) return;
    const next = half ? star - 0.5 : star;
    if (clearable && Math.abs(next - value) < 0.01) {
      onChange(0);
    } else {
      onChange(next);
    }
  }

  return (
    <span className="dl-star-rating" style={{ ['--star-size' as string]: `${size}px` }}>
      {Array.from({ length: 5 }, (_, i) => {
        const star = i + 1;
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={star} className="dl-star-rating-star">
            <Star fill={fill} size={size} gradId={`${baseId}-s${star}`} />
            {interactive && (
              <>
                <button
                  type="button"
                  className="dl-star-hit dl-star-hit--left"
                  aria-label={`${star - 0.5} зірок`}
                  onClick={() => pick(star, true)}
                />
                <button
                  type="button"
                  className="dl-star-hit dl-star-hit--right"
                  aria-label={`${star} зірок`}
                  onClick={() => pick(star, false)}
                />
              </>
            )}
          </span>
        );
      })}
      {value > 0 && (
        <span className="dl-star-rating-value">{value.toFixed(1).replace('.0', '')}</span>
      )}
    </span>
  );
}
