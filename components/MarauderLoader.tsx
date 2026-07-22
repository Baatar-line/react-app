'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * MarauderLoader — footprint preloader (Big Bang dark + neon-green theme).
 *
 * Two trails of footprints walk in from opposite screen corners, winding toward
 * the centre; when they meet, a green location pin drops in with an ink bloom.
 * The whole thing tracks a 0-100% progress and (optionally) loops.
 *
 * Usage:
 *   // simple looping ambient loader
 *   <MarauderLoader />
 *
 *   // real preloader: run once, then reveal your app
 *   const [loading, setLoading] = useState(true);
 *   {loading && <MarauderLoader loop={false} onFinish={() => setLoading(false)} />}
 */

type Props = {
  /** Loop forever (default) or run once and call onFinish. */
  loop?: boolean;
  /** Called when the trails meet at 100%. */
  onFinish?: () => void;
  /** ms for the 0-100% build. */
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Optional full-bleed photo behind the grid/footprints (admin-set via the
   * "Ачаалж буй дэлгэцийн фон" tab) — falls back to the plain dark gradient below. */
  backgroundImage?: string;
};

// ---- tunables -------------------------------------------------------------
const N = 15;              // footprints per trail
const SCALE_NEAR = 0.82;   // uniform footprint size (all prints the same size)
const SCALE_FAR = 0.82;    // == NEAR, no perspective growth
const AMP_FRAC = 0.15;     // winding as a fraction of the corner-centre distance
const HOLD = 1500;         // ms to hold after meeting (loop)
const FADE = 800;          // ms fade before restarting (loop)

// ---- footprint shapes (toe up, centred near origin) -----------------------
const BOOT =
  'M0,-25 C5,-25 9,-22 9.5,-15 C10,-9 9.5,-3 8,1 C7,3.5 5,4.8 0,4.8 ' +
  'C-5,4.8 -7,3.5 -8,1 C-9.5,-3 -10,-9 -9.5,-15 C-9,-22 -5,-25 0,-25 Z ' +
  'M0,8.5 C4,8.5 7,11 7,15.5 C7,20 4,23.5 0,23.5 C-4,23.5 -7,20 -7,15.5 C-7,11 -4,8.5 0,8.5 Z';
const HEEL =
  'M0,-26 C3,-25 5.5,-22 6,-17 C6.6,-12 6.6,-7 5.5,-2 C4.5,2 3,4 2.6,7 ' +
  'C2.2,10 2.6,13 3.6,16 C4.6,19 3.6,22 1,22.6 C-0.6,23 -2,23 -3.6,22 ' +
  'C-5,20 -4.6,17 -3.6,14 C-2.6,11 -2.2,9 -2.6,6 C-3,2 -5,-2 -5.6,-7 C-6,-12 -5,-20 0,-26 Z';
const SHAPES: { d: string; rule: 'evenodd' | 'nonzero' }[] = [
  { d: BOOT, rule: 'evenodd' }, // top-right trail: men's shoe
  { d: HEEL, rule: 'nonzero' }, // bottom-left trail: women's shoe
];

type Foot = {
  x: number; y: number; angle: number; o: number;
  scale: number; flip: boolean; order: number; shape: number;
};
type Trail = { S: P; E: P; amp: number; cyc: number; phase: number };
type P = { x: number; y: number };

// loader curve: quick, brief stall, jump, stall, finish
const KEYS: [number, number][] = [[0, 0], [0.16, 0.34], [0.34, 0.4], [0.56, 0.72], [0.74, 0.76], [1, 1]];
function curve(t: number) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [t0, p0] = KEYS[i], [t1, p1] = KEYS[i + 1];
    if (t <= t1) { const k = (t - t0) / (t1 - t0 || 1); return p0 + (p1 - p0) * k; }
  }
  return 1;
}

function trailPoint(s: number, T: Trail): P {
  const bx = T.S.x + (T.E.x - T.S.x) * s, by = T.S.y + (T.E.y - T.S.y) * s;
  const dx = T.E.x - T.S.x, dy = T.E.y - T.S.y, L = Math.hypot(dx, dy) || 1;
  const px = -dy / L, py = dx / L;            // perpendicular to the corner-centre line
  const env = Math.sin(s * Math.PI);          // pinch to the exact endpoints
  const off = T.amp * Math.sin(s * Math.PI * T.cyc + T.phase) * env;
  return { x: bx + px * off, y: by + py * off };
}

function buildTrails(w: number, h: number): Foot[] {
  const m = Math.min(w, h);
  const pscale = m / 900, side = m * 0.028;
  const inset = m * 0.06, gap = m * 0.05, cx = w / 2, cy = h / 2;
  const mk = (S: P, E: P, cyc: number, phase: number): Trail =>
    ({ S, E, amp: Math.hypot(E.x - S.x, E.y - S.y) * AMP_FRAC, cyc, phase });
  const trails: { t: Trail; shape: number }[] = [
    { t: mk({ x: w - inset, y: inset }, { x: cx, y: cy - gap }, 2.3, 0.5), shape: 0 },   // top-right
    { t: mk({ x: inset, y: h - inset }, { x: cx, y: cy + gap }, 2.5, -0.4), shape: 1 },  // bottom-left
  ];
  const feet: Foot[] = [];
  for (const { t, shape } of trails) {
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1);
      const p = trailPoint(s, t);
      const a = trailPoint(Math.max(0, s - 0.01), t), b = trailPoint(Math.min(1, s + 0.01), t);
      const tv = { x: b.x - a.x, y: b.y - a.y };            // travel direction toward centre
      const angle = Math.atan2(tv.x, -tv.y) * 180 / Math.PI;
      const len = Math.hypot(tv.x, tv.y) || 1;
      const px = -tv.y / len, py = tv.x / len;
      const s2 = i % 2 === 0 ? 1 : -1;
      const o = 0.6 + 0.32 * (i / (N - 1));
      const scale = pscale * (SCALE_FAR + (SCALE_NEAR - SCALE_FAR) * (i / (N - 1)));
      feet.push({ x: p.x + px * side * s2, y: p.y + py * side * s2, angle, o, scale, flip: i % 2 === 0, order: i, shape });
    }
  }
  return feet;
}

export default function MarauderLoader({ loop = true, onFinish, duration = 5000, className, style, backgroundImage }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [feet, setFeet] = useState<Foot[]>([]);
  const [progress, setProgress] = useState(0);
  const [finished, setFinished] = useState(false);
  const [fading, setFading] = useState(false);
  const [cycle, setCycle] = useState(0);

  // measure the container and (re)build the trails; re-measure on resize / restart
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      setDims({ w, h });
      setFeet(buildTrails(w, h));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cycle]);

  // drive the 0-100% animation whenever the trails are (re)built
  useEffect(() => {
    if (!feet.length) return;
    setProgress(0);
    setFinished(false);
    setFading(false);
    let raf = 0;
    let start: number | null = null;
    const timers: number[] = [];
    const frame = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / duration, 1);
      setProgress(curve(t));
      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setFinished(true);
        // Wait for the pin to actually land (ml-pindrop is .72s) before handing
        // off to the caller — calling onFinish right at 100% used to swap the
        // real site in the same instant the pin started dropping, so the drop
        // (and the bloom flash under it) never got to visibly play.
        timers.push(window.setTimeout(() => finishRef.current?.(), 900));
        if (loop) {
          timers.push(window.setTimeout(() => setFading(true), HOLD));
          timers.push(window.setTimeout(() => setCycle(c => c + 1), HOLD + FADE));
        }
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
  }, [feet, loop, duration]);

  const revealCount = Math.round(progress * N);

  return (
    <div ref={wrapRef} className={`mloader${className ? ' ' + className : ''}`} style={style}>
      <style>{CSS}</style>

      {backgroundImage && (
        <div
          className="mloader__photo"
          style={{ backgroundImage: `linear-gradient(rgba(5,6,4,.48), rgba(5,6,4,.62)), url("${backgroundImage}")` }}
        />
      )}

      <svg
        className={`mloader__trail${fading ? ' fade' : ''}`}
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter id="mloader-ink" x="-60%" y="-60%" width="220%" height="220%">
            <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="7" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        {feet.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.angle}) scale(${f.flip ? -f.scale : f.scale} ${f.scale})`}>
            <g
              className={`mloader__foot${f.order < revealCount ? ' on' : ''}`}
              style={{ ['--o' as string]: f.o.toFixed(2) } as React.CSSProperties}
            >
              <path d={SHAPES[f.shape].d} fillRule={SHAPES[f.shape].rule} />
            </g>
          </g>
        ))}
      </svg>

      <div className={`mloader__bloom${finished ? ' go' : ''}`} />

      <div className={`mloader__pin${finished ? ' drop' : ''}`}>
        <svg viewBox="0 0 24 34" aria-hidden>
          <g className="body">
            <path d="M12 1 C6 1 1 5.6 1 11.6 C1 19.6 12 33 12 33 C12 33 23 19.6 23 11.6 C23 5.6 18 1 12 1 Z" fill="var(--ml-accent)" />
            <circle cx="12" cy="11.4" r="4.2" fill="var(--ml-bg)" />
          </g>
        </svg>
      </div>

      <div className={`mloader__oath top${finished ? ' gone' : ''}`}>i solemnly swear that</div>
      <div className={`mloader__oath bottom${finished ? ' gone' : ''}`}>i am up to no good</div>
    </div>
  );
}

const CSS = `
.mloader{
  --ml-bg:#0b0d0b; --ml-bg-hi:#171b16; --ml-bg-lo:#050705;
  --ml-ink:#e8ece2; --ml-ink-soft:#8f968a; --ml-accent:#E8B84B;
  position:fixed; inset:0; z-index:9999; overflow:hidden;
  font-family:Georgia,"Times New Roman",serif; color:var(--ml-ink);
  background:
    radial-gradient(60% 45% at 22% 18%, rgba(232, 184, 75,.06) 0%, transparent 60%),
    radial-gradient(45% 40% at 82% 30%, rgba(232, 184, 75,.05) 0%, transparent 60%),
    radial-gradient(55% 45% at 68% 82%, rgba(232, 184, 75,.06) 0%, transparent 60%),
    radial-gradient(130% 100% at 30% 12%, var(--ml-bg-hi) 0%, transparent 55%),
    radial-gradient(150% 130% at 50% 55%, var(--ml-bg) 0%, var(--ml-bg-lo) 100%);
}
.mloader::before{
  content:""; position:absolute; inset:0; z-index:1; pointer-events:none;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/></svg>");
  mix-blend-mode:soft-light; opacity:.06;
}
.mloader::after{
  content:""; position:absolute; inset:0; z-index:4; pointer-events:none;
  box-shadow:inset 0 0 120px 20px rgba(0,0,0,.45), inset 0 0 300px 80px rgba(0,0,0,.55);
  animation:ml-candle 7s ease-in-out infinite;
}
@keyframes ml-candle{ 0%,100%{opacity:.85;} 50%{opacity:1;} }
.mloader__photo{
  position:absolute; inset:0; z-index:0; background-size:cover; background-position:center;
  pointer-events:none;
}
.mloader__trail{ position:absolute; inset:0; width:100%; height:100%; z-index:2; transition:opacity .8s ease; }
.mloader__trail.fade{ opacity:0; }
.mloader__foot{ transform-box:fill-box; transform-origin:center; opacity:0; }
.mloader__foot path{ fill:var(--ml-ink); filter:url(#mloader-ink); }
.mloader__foot.on{ animation:ml-stamp .4s cubic-bezier(.22,.9,.28,1) forwards; }
@keyframes ml-stamp{
  0%{ opacity:0; transform:scale(1.28); }
  45%{ opacity:.55; transform:scale(.95); }
  100%{ opacity:var(--o,.9); transform:scale(1); }
}

.mloader__bloom{
  position:absolute; left:50%; top:50%; width:220px; height:220px; margin:-110px;
  z-index:3; border-radius:50%; pointer-events:none; opacity:0; transform:scale(.2);
  background:radial-gradient(circle, rgba(232, 184, 75,.30) 0%, rgba(232, 184, 75,.12) 42%, transparent 72%);
}
.mloader__bloom.go{ animation:ml-bloom 1.2s ease-out forwards; }
@keyframes ml-bloom{ 0%{opacity:0; transform:scale(.2);} 22%{opacity:.85;} 100%{opacity:0; transform:scale(3.2);} }

.mloader__pin{ position:absolute; z-index:5; left:50%; top:50%; transform:translate(-50%,-100%); pointer-events:none; }
.mloader__pin svg{ width:clamp(24px,6vw,34px); display:block; filter:drop-shadow(0 0 7px rgba(232, 184, 75,.55)) drop-shadow(0 2px 4px rgba(0,0,0,.5)); }
.mloader__pin .body{ opacity:0; transform:translateY(-52px) scale(.6); transform-origin:bottom center; }
.mloader__pin.drop .body{ animation:ml-pindrop .72s cubic-bezier(.34,1.5,.5,1) forwards; }
@keyframes ml-pindrop{ 0%{opacity:0; transform:translateY(-52px) scale(.6);} 55%{opacity:1;} 100%{opacity:1; transform:translateY(0) scale(1);} }

.mloader__oath{
  position:absolute; z-index:4; font-size:clamp(15px,3.6vw,22px);
  letter-spacing:.15em; color:var(--ml-ink-soft); text-transform:lowercase;
  opacity:.9; transition:opacity .5s ease;
}
.mloader__oath.top{ top:6.5%; left:7%; } .mloader__oath.bottom{ bottom:6.5%; right:7%; }
.mloader__oath.gone{ opacity:0; }

@media (prefers-reduced-motion:reduce){
  .mloader__foot.on,.mloader__bloom.go,.mloader__pin.drop .body{ animation-duration:.01s; }
  .mloader::after{ animation:none; }
}
`;
