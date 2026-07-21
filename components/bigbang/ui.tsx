'use client';

// Small runtime helpers used by the Big Bang port.
// `css` parses an inline CSS declaration string into a React style object,
// so the ported JSX can keep the original style strings almost verbatim.
// `Hover` reproduces the DC `style-hover` / `style-focus` / `style-active` behaviour.
import React, { useEffect, useMemo, useState } from 'react';

// Same "no @media queries, branch on JS state" pattern BigBang.tsx uses for its
// own inline styles — shared here so the other screens (which render inline
// style strings via `css`, not Tailwind) can collapse fixed/multi-column
// layouts on small screens without duplicating a resize listener each.
export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < breakpoint : false));
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

export function css(decl?: string): React.CSSProperties {
  const out: Record<string, string | number> = {};
  if (!decl) return out;
  for (const part of decl.split(';')) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    const rawProp = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!rawProp || value === '') continue;
    // -webkit-foo -> WebkitFoo ; foo-bar -> fooBar
    const prop = rawProp
      .replace(/^-ms-/, 'ms-')
      .replace(/^-/, '')
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[prop] = value;
  }
  return out as React.CSSProperties;
}

type HoverProps = {
  as?: keyof JSX.IntrinsicElements;
  s: string;           // base style string
  h?: string;          // hover style string (merged on hover)
  f?: string;          // focus style string
  a?: string;          // active style string
  children?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, 'style'> & Record<string, unknown>;

export function Hover({ as = 'div', s, h, f, a, children, ...rest }: HoverProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(false);

  const style = useMemo(() => {
    let str = s;
    if (hovered && h) str += ';' + h;
    if (focused && f) str += ';' + f;
    if (active && a) str += ';' + a;
    return css(str);
  }, [s, h, f, a, hovered, focused, active]);

  const handlers: Record<string, unknown> = {
    onMouseEnter: (e: React.MouseEvent) => { setHovered(true); (rest.onMouseEnter as ((e: React.MouseEvent) => void) | undefined)?.(e); },
    onMouseLeave: (e: React.MouseEvent) => { setHovered(false); setActive(false); (rest.onMouseLeave as ((e: React.MouseEvent) => void) | undefined)?.(e); },
  };
  if (f) {
    handlers.onFocus = (e: React.FocusEvent) => { setFocused(true); (rest.onFocus as ((e: React.FocusEvent) => void) | undefined)?.(e); };
    handlers.onBlur = (e: React.FocusEvent) => { setFocused(false); (rest.onBlur as ((e: React.FocusEvent) => void) | undefined)?.(e); };
  }
  if (a) {
    handlers.onMouseDown = (e: React.MouseEvent) => { setActive(true); (rest.onMouseDown as ((e: React.MouseEvent) => void) | undefined)?.(e); };
    handlers.onMouseUp = (e: React.MouseEvent) => { setActive(false); (rest.onMouseUp as ((e: React.MouseEvent) => void) | undefined)?.(e); };
  }

  return React.createElement(as, { ...rest, ...handlers, style }, children);
}

// Small isometric "3D-ish" icons (layered flat-shaded faces + outline strokes,
// no photoreal render) for the "add content" cards — a lightweight CSS/SVG
// stand-in for a purchased 3D icon pack, built from polygons, not a rendered
// asset. Richer pass: outlined edges, a soft ground glow, and a couple of
// floating accent details so they read as more than a flat silhouette.
export type Iso3DKind = 'scenic' | 'event' | 'chess' | 'gaming' | 'controller' | 'movie' | 'travel';

export function Isometric3DIcon({ kind, size = 56 }: { kind: Iso3DKind; size?: number }) {
  const accent = 'var(--accent,#E8B84B)';
  const outline = 'rgba(242,237,227,.5)';
  const glowId = 'isoGlow_' + kind;
  const glow = (cy: number) => (
    <>
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy={cy} rx="25" ry="9" fill={`url(#${glowId})`} />
    </>
  );
  if (kind === 'chess') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 60" style={{ overflow: 'visible' }}>
        {glow(48)}
        <polygon points="32,34 58,45 32,56 6,45" fill="rgba(255,255,255,.05)" stroke={outline} strokeWidth={0.8} />
        {/* checkerboard top face */}
        <polygon points="32,34 50,42 32,50 14,42" fill="#f2ede3" stroke={outline} strokeWidth={0.6} />
        {[0, 1, 2, 3].map((i) => (
          <polygon key={i} points={`${23 + i * 4.5},${38 + (i % 2) * 4} ${27.5 + i * 4.5},${40 + (i % 2) * 4} ${23 + i * 4.5},${42 + (i % 2) * 4} ${18.5 + i * 4.5},${40 + (i % 2) * 4}`} fill="rgba(20,16,11,.4)" />
        ))}
        {/* pawn */}
        <circle cx="40" cy="30" r="4.2" fill="#f2ede3" stroke={outline} strokeWidth={0.7} />
        <polygon points="35,38 45,38 43,44 37,44" fill="#f2ede3" stroke={outline} strokeWidth={0.7} />
        {/* knight silhouette */}
        <path d="M20 40 L20 30 Q20 24 26 23 Q30 22 29 18 L25 20 L23 17 L27 15 Q33 14 33 22 L33 40 Z" fill="rgba(20,16,11,.85)" stroke={outline} strokeWidth={0.7} strokeLinejoin="round" />
        <circle cx="9" cy="20" r="1.4" fill={accent} opacity={0.8} />
      </svg>
    );
  }
  if (kind === 'gaming') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 62" style={{ overflow: 'visible' }}>
        {glow(50)}
        <polygon points="32,36 58,47 32,58 6,47" fill="rgba(255,255,255,.05)" stroke={outline} strokeWidth={0.8} />
        {/* two facing seats */}
        <polygon points="16,38 26,42 20,46 10,42" fill={accent} opacity={0.85} stroke={outline} strokeWidth={0.6} />
        <polygon points="48,38 38,42 44,46 54,42" fill="rgba(232,140,90,.85)" stroke={outline} strokeWidth={0.6} />
        {/* two monitors, angled toward each other */}
        <rect x="10" y="16" width="16" height="11" rx="1.5" fill="rgba(20,16,11,.85)" stroke={outline} strokeWidth={0.7} transform="skewX(-6)" />
        <rect x="38" y="16" width="16" height="11" rx="1.5" fill="rgba(20,16,11,.85)" stroke={outline} strokeWidth={0.7} transform="skewX(6)" />
        <rect x="12" y="18" width="12" height="7" fill={accent} opacity={0.5} transform="skewX(-6)" />
        <rect x="40" y="18" width="12" height="7" fill="rgba(232,140,90,.5)" transform="skewX(6)" />
        <circle cx="6" cy="26" r="1.3" fill="#f2ede3" opacity={0.6} />
      </svg>
    );
  }
  if (kind === 'controller') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 58" style={{ overflow: 'visible' }}>
        {glow(46)}
        <ellipse cx="32" cy="48" rx="20" ry="7" fill="rgba(255,255,255,.05)" stroke={outline} strokeWidth={0.8} />
        {/* generic gamepad body, isometric-ish */}
        <path d="M14 26 Q14 16 24 16 L40 16 Q50 16 50 26 L48 34 Q46 40 40 38 L36 34 L28 34 L24 38 Q18 40 16 34 Z" fill="#f2ede3" stroke={outline} strokeWidth={0.8} strokeLinejoin="round" />
        <circle cx="22" cy="26" r="3.4" fill="rgba(20,16,11,.35)" />
        <path d="M22 23.4 L22 28.6 M19.4 26 L24.6 26" stroke="rgba(20,16,11,.7)" strokeWidth={1.1} />
        <circle cx="41" cy="24" r="1.6" fill={accent} />
        <circle cx="45" cy="28" r="1.6" fill="rgba(232,140,90,.9)" />
      </svg>
    );
  }
  if (kind === 'movie') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 62" style={{ overflow: 'visible' }}>
        {glow(50)}
        <polygon points="32,38 58,49 32,60 6,49" fill="rgba(255,255,255,.05)" stroke={outline} strokeWidth={0.8} />
        {/* couch, isometric block */}
        <polygon points="14,40 44,40 44,50 14,50" fill={accent} opacity={0.85} stroke={outline} strokeWidth={0.7} />
        <polygon points="14,32 44,32 44,40 14,40" fill={accent} opacity={0.55} stroke={outline} strokeWidth={0.7} />
        {/* two small heads peeking over the back cushion */}
        <circle cx="24" cy="30" r="3.4" fill="rgba(20,16,11,.85)" />
        <circle cx="32" cy="30" r="3.4" fill="rgba(20,16,11,.85)" />
        {/* screen */}
        <rect x="38" y="10" width="18" height="12" rx="1.2" fill="rgba(20,16,11,.85)" stroke={outline} strokeWidth={0.7} />
        <rect x="40" y="12" width="14" height="8" fill={accent} opacity={0.5} />
        <circle cx="10" cy="20" r="1.4" fill="#f2ede3" opacity={0.6} />
      </svg>
    );
  }
  if (kind === 'travel') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 62" style={{ overflow: 'visible' }}>
        {glow(50)}
        <ellipse cx="32" cy="50" rx="22" ry="8" fill="rgba(255,255,255,.05)" stroke={outline} strokeWidth={0.8} />
        {/* suitcase */}
        <rect x="18" y="24" width="20" height="22" rx="2.5" fill={accent} opacity={0.9} stroke={outline} strokeWidth={0.8} />
        <rect x="24" y="19" width="8" height="6" rx="1.5" fill="none" stroke={outline} strokeWidth={1} />
        <line x1="18" y1="34" x2="38" y2="34" stroke={outline} strokeWidth={0.6} />
        {/* globe */}
        <circle cx="44" cy="40" r="8" fill="#f2ede3" stroke={outline} strokeWidth={0.7} />
        <path d="M37 40 A7 7 0 0 0 51 40 M44 33 A10 7 0 0 1 44 47 M44 33 A10 7 0 0 0 44 47" stroke="rgba(20,16,11,.5)" strokeWidth={0.7} fill="none" />
        {/* small paper plane */}
        <path d="M50 12 L58 15 L52 17 L50 22 L48 17 Z" fill="#f2ede3" stroke={outline} strokeWidth={0.6} strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'scenic') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 68" style={{ overflow: 'visible' }}>
        {glow(52)}
        {/* ground plane, thin outline only so the mountain reads as the subject */}
        <polygon points="32,42 58,53 32,64 6,53" fill="rgba(255,255,255,.05)" stroke={outline} strokeWidth={0.8} />
        {/* small isometric rocks flanking the base for a bit of scenery */}
        <polygon points="14,50 19,52.5 14,55 9,52.5" fill="rgba(255,255,255,.12)" stroke={outline} strokeWidth={0.6} />
        <polygon points="49,48 54,50.5 49,53 44,50.5" fill="rgba(255,255,255,.08)" stroke={outline} strokeWidth={0.6} />
        {/* mountain — three shaded faces, each edge outlined for definition */}
        <polygon points="32,8 51,45 32,54" fill={accent} opacity={0.92} stroke={outline} strokeWidth={0.8} strokeLinejoin="round" />
        <polygon points="32,8 13,45 32,54" fill={accent} opacity={0.58} stroke={outline} strokeWidth={0.8} strokeLinejoin="round" />
        <polygon points="25,25 39,25 46,41 18,41" fill="rgba(20,16,11,.4)" stroke={outline} strokeWidth={0.6} strokeLinejoin="round" />
        {/* snow cap */}
        <polygon points="32,8 39,21 25,21" fill="rgba(255,255,255,.9)" stroke={outline} strokeWidth={0.6} strokeLinejoin="round" />
        {/* flag on the peak, planted on a short pole */}
        <line x1="32" y1="8" x2="32" y2="-4" stroke="#f2ede3" strokeWidth={1.6} />
        <polygon points="32,-4 45,-0.2 32,3.6" fill="#f2ede3" stroke={outline} strokeWidth={0.6} strokeLinejoin="round" />
        {/* a couple of floating sparkle accents, like the reference set */}
        <circle cx="9" cy="18" r="1.6" fill={accent} opacity={0.85} />
        <circle cx="54" cy="30" r="1.2" fill="#f2ede3" opacity={0.6} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 68" style={{ overflow: 'visible' }}>
      {glow(46)}
      {/* isometric calendar block — top, front, side faces, all edges outlined */}
      <polygon points="32,10 52,21 32,32 12,21" fill={accent} opacity={0.95} stroke={outline} strokeWidth={0.8} strokeLinejoin="round" />
      <polygon points="12,21 32,32 32,52 12,41" fill={accent} opacity={0.55} stroke={outline} strokeWidth={0.8} strokeLinejoin="round" />
      <polygon points="32,32 52,21 52,41 32,52" fill={accent} opacity={0.75} stroke={outline} strokeWidth={0.8} strokeLinejoin="round" />
      {/* faint grid on the top face for a bit of texture */}
      <path d="M22 15.5 L22 26.5 M42 15.5 L42 26.5" stroke="rgba(20,16,11,.3)" strokeWidth={0.6} />
      {/* binder rings */}
      <rect x="22" y="4" width="3" height="12" rx="1.5" fill="#f2ede3" stroke={outline} strokeWidth={0.5} />
      <rect x="39" y="4" width="3" height="12" rx="1.5" fill="#f2ede3" stroke={outline} strokeWidth={0.5} />
      {/* a marked date on the front face */}
      <circle cx="22" cy="37" r="5.5" fill="rgba(20,16,11,.55)" stroke={outline} strokeWidth={0.6} />
      <path d="M19.3 37 L21.2 39 L25 34.6" stroke="#f2ede3" strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* small floating "+" badge, echoing the reference set's orbiting details */}
      <circle cx="53" cy="12" r="6" fill="rgba(20,16,11,.75)" stroke={outline} strokeWidth={0.7} />
      <path d="M53 9 L53 15 M50 12 L56 12" stroke={accent} strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}
