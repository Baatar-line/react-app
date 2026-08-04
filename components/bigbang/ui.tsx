'use client';

// Small runtime helpers used by the Big Bang port.
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Pulls the `url("...")` portion out of a composed CSS background value
// (e.g. 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.4)), url("https://...")')
// and returns what's left (the gradient/scrim layers, if any) separately —
// used by BgMedia so it can preload just the photo and still show the scrim
// underneath a <video> (which can't take a CSS background-image itself).
function parseBg(bg?: string): { url: string; scrim: string } {
  if (!bg) return { url: '', scrim: '' };
  const m = /url\((['"]?)(.*?)\1\)/.exec(bg);
  if (!m) return { url: '', scrim: bg };
  const scrim = (bg.slice(0, m.index) + bg.slice(m.index + m[0].length)).replace(/^\s*,\s*|\s*,\s*$/g, '').trim();
  return { url: m[2], scrim };
}

const POSITIONED = /(^|\s)(absolute|relative|fixed|sticky)(\s|$)/;

// Drop-in replacement for a plain `<div style={{ backgroundImage: bg }} />`
// (or a photo/video pair) that shows a shimmering skeleton in place of the
// photo/video until it has actually finished loading, instead of a flash of
// blank/black. `bg` is the full CSS background value (gradient scrim + the
// real `url(...)`, same string these call sites already compute) — pass
// `isVideo`/`videoSrc` for the spots that can hold an admin-uploaded video
// instead of a photo.
export function BgMedia({
  bg, isVideo, videoSrc, className = '', imgClassName = '', videoClassName = '', style, children,
}: {
  bg?: string;
  isVideo?: boolean;
  videoSrc?: string;
  className?: string;
  imgClassName?: string;
  videoClassName?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const { url, scrim } = useMemo(() => parseBg(bg), [bg]);
  const vSrc = videoSrc || url;
  const [ready, setReady] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  // A page with a long grid of these (category pages, admin lists, the home
  // hero's preview cards, ...) used to kick off every single photo/video
  // fetch the instant it mounted, regardless of whether it was ever on
  // screen — dozens of requests all competing for bandwidth at once, which
  // is what made even the visible/above-the-fold images crawl. Only start
  // loading once a card is actually near the viewport, same as a native
  // `<img loading="lazy">` would stagger it.
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (inView) return;
    const node = wrapRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { setInView(true); io.disconnect(); }
    }, { rootMargin: '600px 0px' });
    io.observe(node);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (isVideo) { setReady(false); return; }
    if (!url) { setReady(true); return; }
    if (!inView) return;
    setReady(false);
    let alive = true;
    const im = new Image();
    im.onload = () => { if (alive) setReady(true); };
    im.onerror = () => { if (alive) setReady(true); };
    im.src = url;
    return () => { alive = false; };
  }, [url, isVideo, inView]);

  return (
    <div ref={wrapRef} className={(POSITIONED.test(className) ? '' : 'relative ') + 'overflow-hidden ' + className} style={style}>
      {!ready && <div className="absolute inset-0 bb-skeleton" />}
      {isVideo ? (
        inView && (
          <>
            <video
              src={vSrc} autoPlay loop muted playsInline
              onLoadedData={() => setReady(true)}
              className={'absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ' + videoClassName}
              style={{ opacity: ready ? 1 : 0 }}
            />
            {scrim && (
              <div className="absolute inset-0 transition-opacity duration-300" style={{ background: scrim, opacity: ready ? 1 : 0 }} />
            )}
          </>
        )
      ) : (
        <div
          className={'absolute inset-0 transition-opacity duration-300 ' + imgClassName}
          style={{ backgroundImage: ready ? bg : undefined, opacity: ready ? 1 : 0 }}
        />
      )}
      {children}
    </div>
  );
}

// Styling across the app is Tailwind utility classes now — no @media queries
// available for inline `style` values (genuinely dynamic/per-instance colors,
// positions, backgrounds still use `style` alongside `className`), so this
// hook covers the few cases that need a JS-computed breakpoint instead
// (a boolean baked into two different literal class strings, picked by index.tsx).
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

// Small isometric "3D-ish" icons (layered flat-shaded faces + outline strokes,
// no photoreal render) for the "add content" cards — a lightweight CSS/SVG
// stand-in for a purchased 3D icon pack, built from polygons, not a rendered
// asset. Richer pass: outlined edges, a soft ground glow, and a couple of
// floating accent details so they read as more than a flat silhouette.
export type Iso3DKind = 'place' | 'scenic' | 'event' | 'chess' | 'gaming' | 'controller' | 'movie' | 'travel';

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
  if (kind === 'place') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 66" style={{ overflow: 'visible' }}>
        {glow(50)}
        <ellipse cx="32" cy="52" rx="22" ry="8" fill="rgba(255,255,255,.05)" stroke={outline} strokeWidth={0.8} />
        {/* map pin, isometric-ish teardrop with a flat base shadow */}
        <path d="M32 6 C20 6 12 15 12 26 C12 38 32 54 32 54 C32 54 52 38 52 26 C52 15 44 6 32 6 Z" fill={accent} opacity={0.92} stroke={outline} strokeWidth={0.8} strokeLinejoin="round" />
        <circle cx="32" cy="25" r="9.5" fill="rgba(20,16,11,.55)" stroke={outline} strokeWidth={0.7} />
        {/* small building silhouette inside the pin's head */}
        <rect x="27" y="21" width="10" height="9" fill="#f2ede3" opacity={0.9} />
        <rect x="29" y="23.5" width="2" height="2" fill="rgba(20,16,11,.6)" />
        <rect x="33" y="23.5" width="2" height="2" fill="rgba(20,16,11,.6)" />
        <rect x="29" y="27" width="2" height="2" fill="rgba(20,16,11,.6)" />
        <rect x="33" y="27" width="2" height="2" fill="rgba(20,16,11,.6)" />
        <circle cx="10" cy="18" r="1.4" fill="#f2ede3" opacity={0.6} />
        <circle cx="55" cy="30" r="1.6" fill={accent} opacity={0.85} />
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
