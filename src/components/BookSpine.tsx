import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { formatAuthorsShort, type BookVisualMeta } from '../lib/bookVisual';

interface BookSpineProps {
  book: BookVisualMeta;
  width?: number;
  className?: string;
  hover?: boolean;
}

function spineLum(hex: string): number {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function spineTextLabel(text: string): string {
  return text.replace(/\s+/g, '\u00A0');
}

function VertFit({
  text,
  baseSize,
  minSize = 5,
  weight = 600,
  color,
  letterSpacing = '0.2px',
  opacity = 0.92,
  shadow,
}: {
  text: string;
  baseSize: number;
  minSize?: number;
  weight?: number;
  color: string;
  letterSpacing?: string;
  opacity?: number;
  shadow?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;

    const label = spineTextLabel(text);

    const fit = () => {
      const maxH = box.clientHeight;
      const maxW = box.clientWidth;
      if (maxH <= 0 || maxW <= 0) return;

      el.textContent = label;
      let size = baseSize;
      el.style.fontSize = `${size}px`;

      let guard = 120;
      while (guard-- > 0 && size > minSize) {
        const tooTall = el.offsetHeight > maxH + 1;
        const tooWide = el.offsetWidth > maxW + 1;
        if (!tooTall && !tooWide) break;
        size -= 0.25;
        el.style.fontSize = `${size}px`;
      }

      if (el.offsetHeight > maxH + 1 || el.offsetWidth > maxW + 1) {
        let trimmed = label;
        while (trimmed.length > 3) {
          trimmed = trimmed.slice(0, -1);
          el.textContent = `${trimmed}…`;
          if (el.offsetHeight <= maxH + 1 && el.offsetWidth <= maxW + 1) break;
        }
      }
    };

    fit();
    void document.fonts?.ready.then(fit);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(box);
    return () => ro?.disconnect();
  }, [text, baseSize, minSize]);

  return (
    <div
      ref={boxRef}
      className="dl-spine-vert-box"
      style={{
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        ref={textRef}
        className="dl-spine-vert-text"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          whiteSpace: 'nowrap',
          wordBreak: 'keep-all',
          overflowWrap: 'normal',
          fontFamily: 'var(--font-serif)',
          fontWeight: weight,
          fontSize: baseSize,
          letterSpacing,
          color,
          opacity,
          lineHeight: 1,
          width: '1em',
          blockSize: '1em',
          maxHeight: '100%',
          overflow: 'hidden',
          display: 'inline-block',
          textShadow: shadow,
        }}
      >
        {spineTextLabel(text)}
      </span>
    </div>
  );
}

function Hub({ p, h }: { p: number; h: number }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${p * 100}%`,
        height: Math.max(5, Math.round(h * 0.026)),
        background:
          'linear-gradient(180deg, rgba(255,228,172,0.22) 0%, rgba(255,210,150,0.05) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)',
        boxShadow: '0 1px 1px rgba(0,0,0,0.5)',
      }}
      aria-hidden
    />
  );
}

export function BookSpine({ book, width = 120, className = '', hover = false }: BookSpineProps) {
  const sid = `${book.entryId}|${book.title}`;
  let s = 0;
  for (let i = 0; i < sid.length; i++) s = (s * 131 + sid.charCodeAt(i)) >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };

  let s2 = 0;
  for (let i = 0; i < sid.length; i++) s2 = (s2 * 73 + sid.charCodeAt(i) * 19 + 7) >>> 0;
  const lean =
    s2 % 100 < 16 ? ((s2 & 1 ? 1 : -1) * (0.8 + (s2 % 17) / 12)) : 0;

  const ratio = book.ratio || 1.5;
  const h = Math.round(width * ratio * (book.scale || 1) * (0.9 + rand() * 0.2));
  const thick = Math.round(
    Math.max(26, Math.min(62, 26 + (book.pageCount || 320) / 14 + rand() * 8)) * (width / 120),
  );

  const cover = book.cover;
  const raw = book.placeholder ? '#6E5A44' : cover.bg;
  const tones = ['#4A3320', '#3A2818', '#573A22', '#43301F', '#6A4A2B', '#332515', '#5A3E26'];
  const tone = tones[Math.floor(rand() * tones.length)];
  const base = `color-mix(in oklab, ${raw} 30%, ${tone})`;
  const isLight = spineLum(raw) > 0.62;
  const ink = isLight ? '#241608' : `color-mix(in oklab, ${cover.ink} 55%, #d6bf92)`;
  const gilt = '#B59247';
  const fs = Math.max(9, Math.min(14, Math.round(thick * 0.32)));

  const titleShadow = isLight
    ? '0 1px 0 rgba(255,255,255,0.2)'
    : '0 1px 1px rgba(0,0,0,0.5)';

  const Title = ({
    color,
    weight = 600,
    top = '15%',
    bottom = '16%',
    shadow,
  }: {
    color: string;
    weight?: number;
    top?: string;
    bottom?: string;
    shadow?: string;
  }) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top,
        bottom,
        overflow: 'hidden',
        padding: '2% 0',
      }}
    >
      <VertFit
        text={book.title}
        baseSize={fs}
        weight={weight}
        color={color}
        shadow={shadow || titleShadow}
      />
    </div>
  );

  const pageBlock = (
    <span
      style={{
        position: 'absolute',
        top: 0,
        left: 1,
        right: 1,
        height: Math.max(3, Math.round(h * 0.015)),
        background: 'linear-gradient(180deg, #E4D2AC 0%, #B89D72 70%, rgba(0,0,0,0.4) 100%)',
        borderRadius: '2px 2px 0 0',
        opacity: 0.9,
      }}
      aria-hidden
    />
  );

  const r = rand();
  const kind = r < 0.6 ? 'antique' : r < 0.84 ? 'cloth' : 'printed';

  let deco: ReactNode;
  if (kind === 'antique') {
    const cordTop = 0.135;
    const cordBot = 0.8;
    deco = (
      <>
        {pageBlock}
        <div
          style={{
            position: 'absolute',
            left: '12%',
            right: '12%',
            top: `${cordTop * 100 + 2.5}%`,
            bottom: '8%',
            background: `color-mix(in oklab, ${base} 58%, #170d06)`,
            borderRadius: 1,
            boxShadow:
              'inset 0 0 0 1px rgba(181,146,71,0.3), inset 0 2px 5px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            padding: '4% 0',
          }}
        >
          <VertFit
            text={book.title}
            baseSize={fs}
            minSize={5}
            weight={700}
            color={gilt}
            shadow="0 1px 0 rgba(0,0,0,0.6)"
          />
        </div>
        <Hub p={cordTop} h={h} />
        <Hub p={cordBot} h={h} />
      </>
    );
  } else if (kind === 'cloth') {
    deco = (
      <>
        {pageBlock}
        <span
          style={{
            position: 'absolute',
            top: '8%',
            left: '22%',
            right: '22%',
            height: 1,
            background: gilt,
            opacity: 0.5,
            boxShadow: '0 1px 0 rgba(255,255,255,0.1)',
          }}
          aria-hidden
        />
        <span
          style={{
            position: 'absolute',
            top: '9.6%',
            left: '28%',
            right: '28%',
            height: 1,
            background: gilt,
            opacity: 0.28,
          }}
          aria-hidden
        />
        <Title color={ink} top="14%" bottom="10%" />
        <span
          style={{
            position: 'absolute',
            bottom: '9.5%',
            left: '22%',
            right: '22%',
            height: 1,
            background: gilt,
            opacity: 0.45,
          }}
          aria-hidden
        />
      </>
    );
  } else {
    const bandCol = `color-mix(in oklab, ${base} 40%, #160d06)`;
    const titleCol = isLight ? '#241608' : ink;
    const capH = 7 + rand() * 2.5;
    deco = (
      <>
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${capH}%`,
            background: bandCol,
            opacity: 0.92,
          }}
          aria-hidden
        />
        <span
          style={{
            position: 'absolute',
            top: `${capH + 0.6}%`,
            left: '18%',
            right: '18%',
            height: 1,
            background: gilt,
            opacity: 0.45,
          }}
          aria-hidden
        />
        <Title color={titleCol} top={`${capH + 6}%`} bottom="8%" />
      </>
    );
  }

  const spineStyle: CSSProperties = {
    width: thick,
    height: h,
    background: base,
    transform: lean ? `rotate(${lean}deg)` : undefined,
    transformOrigin: 'bottom center',
    boxShadow: hover ? 'var(--shadow-book-hover)' : '2px 2px 6px rgba(0,0,0,0.5)',
  };

  return (
    <div className={`dl-spine ${className}`.trim()} style={spineStyle}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 16%, rgba(255,232,180,0.05) 48%, rgba(0,0,0,0.12) 82%, rgba(0,0,0,0.44) 100%)',
          pointerEvents: 'none',
        }}
        aria-hidden
      />
      {deco}
      <div className="mottle" aria-hidden />
      <div className="cloth" aria-hidden />
      <div className="wear" aria-hidden />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.05) 14%, rgba(0,0,0,0) 52%, rgba(255,196,116,0.06) 86%, rgba(120,70,24,0.10) 100%)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
        aria-hidden
      />
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: Math.max(5, Math.round(h * 0.03)),
          background: 'linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0))',
          zIndex: 5,
        }}
        aria-hidden
      />
    </div>
  );
}

export { formatAuthorsShort };
