import type { CoverPalette } from '../lib/bookVisual';
import { darken, lighten } from '../lib/colorMix';
import { formatAuthorsShort } from '../lib/bookVisual';

interface CoverArtProps {
  title: string;
  authors: string[];
  cover: CoverPalette;
  art: string;
  width: number;
  entryId: string;
}

export function CoverArt({ title, authors, cover, art, width, entryId }: CoverArtProps) {
  const c = cover;
  const author = formatAuthorsShort(authors);
  const pad = Math.round(width * 0.11);

  const titleStyle = (sz: number, col: string, align: 'left' | 'center' = 'left') => ({
    fontFamily: 'var(--font-serif)',
    fontWeight: 700,
    fontSize: Math.max(11, Math.round(width * sz)),
    lineHeight: 1.08,
    color: col,
    textAlign: align as 'left' | 'center',
    letterSpacing: '0.1px',
    textWrap: 'balance' as const,
  });

  const authorStyle = (col: string, align: 'left' | 'center' = 'left') => ({
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: Math.max(8, Math.round(width * 0.075)),
    color: col,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    textAlign: align as 'left' | 'center',
    opacity: 0.9,
  });

  switch (art) {
    case 'type':
      return (
        <div
          className="dl-cover-art-inner"
          style={{
            background: `linear-gradient(160deg, ${lighten(c.bg, 8)}, ${darken(c.bg, 12)})`,
            padding: pad,
          }}
        >
          <div style={{ width: '40%', height: 3, background: c.rule, marginBottom: pad * 0.6 }} />
          <div style={titleStyle(0.165, c.ink)}>{title}</div>
          <div style={{ flex: 1 }} />
          <div style={authorStyle(c.ink)}>{author}</div>
        </div>
      );
    case 'band':
      return (
        <div
          className="dl-cover-art-inner"
          style={{ background: `linear-gradient(180deg, ${lighten(c.bg, 6)}, ${darken(c.bg, 8)})` }}
        >
          <div
            style={{
              position: 'absolute',
              top: '34%',
              left: 0,
              right: 0,
              bottom: '30%',
              background: lighten(c.bg, 54),
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)',
              display: 'grid',
              placeItems: 'center',
              padding: `0 ${pad * 0.7}px`,
            }}
          >
            <div style={titleStyle(0.135, darken(c.bg, 30), 'center')}>{title}</div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: pad * 0.7,
              ...authorStyle(c.ink, 'center'),
            }}
          >
            {author}
          </div>
        </div>
      );
    case 'arc':
      return (
        <div
          className="dl-cover-art-inner"
          style={{
            overflow: 'hidden',
            background: `linear-gradient(180deg, ${darken(c.bg, 6)} 0%, ${c.bg} 52%, ${darken(c.bg, 16)} 100%)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: width * 0.16,
              left: '50%',
              transform: 'translateX(-50%)',
              width: width * 0.52,
              height: width * 0.52,
              borderRadius: '50%',
              background: `radial-gradient(circle at 38% 34%, ${lighten(c.rule, 22)}, ${c.rule})`,
              boxShadow: `0 0 ${width * 0.12}px ${lighten(c.rule, 10)}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: pad * 0.8,
              right: pad * 0.8,
              bottom: pad * 0.55,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: pad * 0.3,
            }}
          >
            <div style={titleStyle(0.12, c.ink, 'center')}>{title}</div>
            <div style={authorStyle(c.ink, 'center')}>{author}</div>
          </div>
        </div>
      );
    case 'frame':
      return (
        <div
          className="dl-cover-art-inner"
          style={{
            padding: Math.round(width * 0.07),
            background: `linear-gradient(165deg, ${lighten(c.bg, 5)}, ${darken(c.bg, 10)})`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              border: `1.5px solid ${c.rule}`,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `0 ${pad * 0.6}px`,
            }}
          >
            <div style={{ width: width * 0.12, height: 2, background: c.rule, marginBottom: pad * 0.5 }} />
            <div style={titleStyle(0.125, c.ink, 'center')}>{title}</div>
            <div
              style={{
                width: width * 0.12,
                height: 2,
                background: c.rule,
                margin: `${pad * 0.5}px 0 ${pad * 0.6}px`,
              }}
            />
            <div style={authorStyle(c.ink, 'center')}>{author}</div>
          </div>
        </div>
      );
    case 'split':
    default: {
      const motif = ['circle', 'hills', 'stripes'][(title.length + entryId.length) % 3];
      return (
        <div className="dl-cover-art-inner dl-cover-art-inner--split">
          <div
            style={{
              flex: '0 0 54%',
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(150deg, ${lighten(c.bg, 14)}, ${darken(c.bg, 16)})`,
            }}
          >
            {motif === 'circle' && (
              <div
                style={{
                  position: 'absolute',
                  right: width * 0.14,
                  top: width * 0.1,
                  width: width * 0.34,
                  height: width * 0.34,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 38% 34%, ${lighten(c.rule, 18)}, ${c.rule})`,
                  opacity: 0.85,
                }}
              />
            )}
            {motif === 'hills' && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: '-12%',
                    bottom: '-22%',
                    width: '80%',
                    height: '70%',
                    borderRadius: '50%',
                    background: darken(c.bg, 22),
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    right: '-16%',
                    bottom: '-30%',
                    width: '80%',
                    height: '74%',
                    borderRadius: '50%',
                    background: lighten(c.rule, 8),
                    opacity: 0.6,
                  }}
                />
              </>
            )}
            {motif === 'stripes' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `repeating-linear-gradient(135deg, ${lighten(c.rule, 6)} 0 ${width * 0.06}px, ${darken(c.bg, 8)} ${width * 0.06}px ${width * 0.12}px)`,
                  opacity: 0.55,
                }}
              />
            )}
          </div>
          <div
            style={{
              flex: 1,
              background: lighten(c.bg, 58),
              padding: `${pad * 0.7}px`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={titleStyle(0.115, darken(c.bg, 32))}>{title}</div>
            <div style={{ ...authorStyle(darken(c.bg, 18)), marginTop: pad * 0.35 }}>{author}</div>
          </div>
        </div>
      );
    }
  }
}
