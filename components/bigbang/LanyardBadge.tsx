'use client';

// A tiny decorative ID badge hanging from a cord behind the nav logo.
// The cord is a verlet chain of linked points under gravity + air drag, so it
// sways and settles like a real string. The card can be grabbed from any
// corner and dragged anywhere on screen (mouse or touch via Pointer Events);
// throwing it fast imparts spin from the grab-point lever arm.
import React, { useEffect, useRef } from 'react';

const SEGMENTS = 8;
const SEG_LEN = 5.5; // px per rope segment at rest
const GRAVITY = 0.55;
const AIR_DAMPING = 0.995; // velocity retained per frame (< 1 = air resistance) — closer to 1 = swings longer before resting
// Fewer relaxation passes = a slightly looser cord, so a hard punch doesn't get
// absorbed by the constraint in one frame (which read as a sudden hard stop) —
// the energy instead rings out through several frames of visible swinging.
const CONSTRAINT_ITERATIONS = 3;
const SPIN_DAMPING = 0.978;
const SPIN_RETURN_K = 0.009; // pulls spin back toward 0 so a thrown card always un-twists and re-hangs normally
const TORQUE_SCALE = 0.0016;
const NUDGE_MARGIN = 40; // halo distance beyond the card's own edge that still counts as "close"

interface Pt { x: number; y: number; ox: number; oy: number; }

// Shared across every mounted badge (they're siblings in the same nav row) so
// a card swinging past its neighbors can knock into them — each instance
// registers its live card position + an impulse setter here, and checks the
// others against its own position once per simulation frame.
interface RegEntry { id: number; radius: number; getX: () => number; getY: () => number; applyImpulse: (vx: number, vy: number) => void; }
const registry: RegEntry[] = [];
let nextBadgeId = 0;
const CARD_COLLIDE_MARGIN = 8; // extra clearance added on top of each pair's combined half-widths

type Props = {
  letter?: string;
  /** Renders a bigger card with real name/role text instead of the small
   * letter-only nav badge — same cord physics, same material, more room. */
  large?: boolean;
  name?: string;
  role?: string;
  /** Avatar circle color for the `large` card (defaults to the accent gold). */
  color?: string;
};

export default function LanyardBadge({ letter = 'b', large = false, name, role, color }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const cordRef = useRef<SVGPathElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cardW = large ? 128 : 29;

  useEffect(() => {
    const anchor = anchorRef.current;
    const cord = cordRef.current;
    const card = cardRef.current;
    const svg = svgRef.current;
    if (!anchor || !cord || !card || !svg) return;

    const ringOffsetX = large ? cardW / 2 : 14; // ring sits centered over the anchor slot either way
    // The card's own footprint (see the `large` JSX below — must match).
    const cardHeight = large ? 172 : 37;
    // Nudge halo wraps the whole card body, not just its pivot point at the
    // top — with a fixed small radius the ~170px-tall About-page cards only
    // reacted when the cursor passed within a few px of their very top edge,
    // which read as broken/unresponsive over most of the card.
    const nudgeRadius = Math.max(cardW, cardHeight) / 2 + NUDGE_MARGIN;
    // Card-to-card collision was checked against a flat 34px — plenty for the
    // 29px-wide nav badges, but the 128px-wide About-page team cards could
    // sail deep into each other (visibly overlapping like paper cutouts)
    // before that tiny radius ever registered a touch. Scale it to the
    // card's own half-width instead so contact reads as bodies actually
    // meeting, not pivots.
    const collideRadius = cardW / 2;
    let anchorX = 0, anchorY = 0;
    const measureAnchor = () => {
      const rect = anchor.getBoundingClientRect();
      anchorX = rect.left + ringOffsetX;
      anchorY = rect.top + 5; // ring's bottom edge
    };
    measureAnchor();
    window.addEventListener('resize', measureAnchor);
    // The nav row this was built for is `position:fixed`, so the ring never
    // moves and a resize listener alone was enough. Used inside normal
    // scrolling content (e.g. the About page team grid) the ring moves with
    // the page though. A fast scroll (flick, "End", trackpad fling) can jump
    // the anchor hundreds of px in one event — feeding that straight into the
    // verlet chain as a position delta reads as a hard yank, which can whip
    // the cord past vertical and leave the card hanging upside down. Scroll
    // isn't something a lanyard actually feels, so instead of simulating it,
    // just re-pin the whole cord straight under the new anchor position —
    // real swinging is still reserved for an actual grab/release/knock.
    const onScroll = () => {
      measureAnchor();
      if (dragging) return;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x = anchorX; p.y = anchorY + i * SEG_LEN;
        p.ox = p.x; p.oy = p.y;
      }
      spin = 0; spinVel = 0;
      render();
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    const pts: Pt[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const y = anchorY + i * SEG_LEN;
      pts.push({ x: anchorX, y, ox: anchorX, oy: y });
    }

    // Each collision push is small on its own, but contact can persist for
    // many consecutive frames (e.g. a dragged card held against a neighbor)
    // and every one of those frames adds more velocity on top of what's
    // already there — with nothing to cap it, that stacks into a launch that
    // can whip the cord past vertical (see the scroll-flip fix above for the
    // same underlying failure mode). Clamp the resulting velocity right after
    // a collision nudges it, so sustained contact reads as a firm push
    // against the neighbor, not a runaway spin.
    const MAX_COLLIDE_SPEED = 24;
    const clampSpeed = (p: Pt, max: number) => {
      const vx = p.x - p.ox, vy = p.y - p.oy;
      const v = Math.hypot(vx, vy);
      if (v > max) {
        const s = max / v;
        p.ox = p.x - vx * s;
        p.oy = p.y - vy * s;
      }
    };

    let spin = 0;
    let spinVel = 0;
    let dragging = false;
    let dragTarget: { x: number; y: number } | null = null;
    let grabOffX = 0, grabOffY = 0; // lever arm: grab point minus card pivot, at grab time
    let prevPX = 0, prevPY = 0, prevPT = 0;
    let velX = 0, velY = 0; // last known pointer velocity, for the release throw
    let rafId: number | null = null;

    const wake = () => { if (rafId == null) rafId = requestAnimationFrame(tick); };

    const myId = nextBadgeId++;
    const myEntry: RegEntry = {
      id: myId,
      radius: collideRadius,
      getX: () => pts[pts.length - 1].x,
      // Card's visual center, not its pivot at the top edge — for a tall
      // card those are far apart, and collision should react to where the
      // body actually is.
      getY: () => pts[pts.length - 1].y + cardHeight / 2,
      applyImpulse: (vx, vy) => {
        const last = pts[pts.length - 1];
        last.ox -= vx; last.oy -= vy;
        clampSpeed(last, MAX_COLLIDE_SPEED);
        wake();
      },
    };
    registry.push(myEntry);

    // Checked once per own simulation frame (not per-neighbor-frame, so a card
    // that's actively swinging can knock a resting neighbor awake even though
    // the neighbor's own loop isn't currently running to notice the approach).
    const checkCollisions = () => {
      const last = pts[pts.length - 1];
      const lastCenterY = last.y + cardHeight / 2;
      for (const other of registry) {
        if (other.id === myId) continue;
        const collideDist = collideRadius + other.radius + CARD_COLLIDE_MARGIN;
        const dx = last.x - other.getX(), dy = lastCenterY - other.getY();
        const dist = Math.hypot(dx, dy);
        if (dist >= collideDist || dist < 0.5) continue;
        const overlap = collideDist - dist;
        const nx = dx / dist, ny = dy / dist;
        // Larger cards can now overlap by much more before contact registers
        // (their radius is bigger), so the push is capped instead of scaling
        // unbounded with overlap — otherwise a deep overlap would launch the
        // card away instead of just nudging it apart.
        const push = Math.min(overlap * 0.12, 10);
        last.ox -= nx * push; last.oy -= ny * push;
        clampSpeed(last, MAX_COLLIDE_SPEED);
        other.applyImpulse(-nx * push, -ny * push);
      }
    };

    const simulate = () => {
      pts[0].x = anchorX; pts[0].y = anchorY;
      const last = pts.length - 1;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        if (i === last && dragTarget) {
          p.x = dragTarget.x; p.y = dragTarget.y; p.ox = p.x; p.oy = p.y;
          continue;
        }
        const vx = (p.x - p.ox) * AIR_DAMPING;
        const vy = (p.y - p.oy) * AIR_DAMPING;
        p.ox = p.x; p.oy = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
      }
      for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = (dist - SEG_LEN) / dist;
          const bPinned = i + 1 === last && dragTarget;
          if (i === 0 && bPinned) continue;
          if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
          else if (bPinned) { a.x += dx * diff; a.y += dy * diff; }
          else {
            a.x += dx * diff * 0.5; a.y += dy * diff * 0.5;
            b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5;
          }
        }
      }
      if (!dragging) {
        // spin is a damped oscillator around 0 — any twist from a throw always
        // unwinds back to hanging upright, never leaves a permanent tilt.
        spinVel += -SPIN_RETURN_K * spin;
        spinVel *= SPIN_DAMPING;
        spin += spinVel;
      }
      if (!dragTarget) checkCollisions();
    };

    const render = () => {
      const last = pts[pts.length - 1];
      const prev = pts[pts.length - 2];
      const hangAngle = Math.atan2(last.x - prev.x, last.y - prev.y) * (180 / Math.PI);
      const total = hangAngle + spin;

      // rope path, screen-fixed SVG, drawn through every verlet point.
      // Curving through midpoints keeps the line smooth, but that alone stops
      // one midpoint short of the real last point — finish with an explicit
      // segment to pts[last] so the cord actually meets the card, no gap.
      let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)} `;
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i - 1].x + pts[i].x) / 2;
        const midY = (pts[i - 1].y + pts[i].y) / 2;
        d += `Q${pts[i - 1].x.toFixed(1)},${pts[i - 1].y.toFixed(1)} ${midX.toFixed(1)},${midY.toFixed(1)} `;
      }
      const n = pts.length;
      d += `Q${pts[n - 2].x.toFixed(1)},${pts[n - 2].y.toFixed(1)} ${pts[n - 1].x.toFixed(1)},${pts[n - 1].y.toFixed(1)}`;
      cord.setAttribute('d', d);
      card.style.transform = `translate(${last.x.toFixed(1)}px, ${last.y.toFixed(1)}px) rotate(${total.toFixed(2)}deg)`;
    };

    const settled = () => {
      const last = pts[pts.length - 1];
      const vx = last.x - last.ox, vy = last.y - last.oy;
      // Tight thresholds so the loop keeps running (and visibly damping down)
      // until the card is truly still and hanging dead straight, not just "slow".
      return Math.hypot(vx, vy) < 0.012 && Math.abs(spinVel) < 0.006 && Math.abs(spin) < 0.03 && !dragging;
    };

    const tick = () => {
      simulate();
      if (settled()) {
        // final frame: snap the last dust of float drift to a perfectly
        // straight, motionless hang instead of freezing mid-shudder.
        spin = 0; spinVel = 0;
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i];
          p.x = anchorX; p.y = anchorY + i * SEG_LEN;
          p.ox = p.x; p.oy = p.y;
        }
        render();
        rafId = null;
        return;
      }
      render();
      rafId = requestAnimationFrame(tick);
    };

    const onPointerDown = (ev: PointerEvent) => {
      dragging = true;
      spinVel = 0;
      card.setPointerCapture(ev.pointerId);
      card.style.cursor = 'grabbing';
      const last = pts[pts.length - 1];
      grabOffX = ev.clientX - last.x;
      grabOffY = ev.clientY - last.y;
      dragTarget = { x: ev.clientX - grabOffX, y: ev.clientY - grabOffY };
      prevPX = ev.clientX; prevPY = ev.clientY; prevPT = performance.now();
      wake();
      ev.preventDefault();
    };
    const onPointerMove = (ev: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(1, now - prevPT);
      velX = ((ev.clientX - prevPX) / dt) * 16;
      velY = ((ev.clientY - prevPY) / dt) * 16;
      dragTarget = { x: ev.clientX - grabOffX, y: ev.clientY - grabOffY };
      prevPX = ev.clientX; prevPY = ev.clientY; prevPT = now;
    };
    const onPointerUp = (ev: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      dragTarget = null;
      card.style.cursor = 'grab';
      try { card.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      const last = pts[pts.length - 1];
      // carry the throw's momentum into the rope end (verlet velocity = pos - oldPos)
      last.ox = last.x - velX;
      last.oy = last.y - velY;
      // spin from the lever arm (grab offset) crossed with the release velocity
      const torque = grabOffX * velY - grabOffY * velX;
      spinVel += torque * TORQUE_SCALE;
      wake();
    };

    // Nudges the card along the cursor's own direction of travel as it passes
    // near — reads as a hand brushing by, not just a jab away from a point.
    let proxPX = 0, proxPY = 0, proxPT = 0, proxHasPrev = false;
    const onProximityMove = (ev: PointerEvent) => {
      const now = performance.now();
      if (!proxHasPrev) { proxPX = ev.clientX; proxPY = ev.clientY; proxPT = now; proxHasPrev = true; return; }
      const dt = Math.max(1, now - proxPT);
      const curVX = (ev.clientX - proxPX) / dt;
      const curVY = (ev.clientY - proxPY) / dt;
      proxPX = ev.clientX; proxPY = ev.clientY; proxPT = now;
      if (dragging) return;
      const last = pts[pts.length - 1];
      // Detection center is the card's own visual center (it hangs from
      // `last` downward by cardHeight), not the pivot point at its top edge.
      const dx = ev.clientX - last.x;
      const dy = ev.clientY - (last.y + cardHeight / 2);
      const dist = Math.hypot(dx, dy);
      if (dist >= nudgeRadius) return;
      const closeness = (1 - dist / nudgeRadius) ** 2;
      const speed = Math.hypot(curVX, curVY);
      if (speed < 0.025) return; // hovering still, not swiping past
      // Punch scales super-linearly with speed — a slow drift barely nudges it,
      // a fast swipe reads as a real knock, direction taken from the swipe itself.
      const punch = Math.min(55, speed ** 1.4 * 34) * closeness;
      last.ox = last.x - (curVX / speed) * punch;
      last.oy = last.y - (curVY / speed) * punch;
      wake();
    };

    render();
    card.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointermove', onProximityMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('resize', measureAnchor);
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      card.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointermove', onProximityMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (rafId != null) cancelAnimationFrame(rafId);
      const idx = registry.indexOf(myEntry);
      if (idx !== -1) registry.splice(idx, 1);
    };
  }, []);

  const anchorW = large ? cardW : 28;
  const ringLeft = large ? cardW / 2 - 4 : 10; // centers the 8px ring on the anchor slot
  const cardH = large ? 172 : 37;

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: anchorW, height: 1, flex: 'none', zIndex: 1, pointerEvents: 'none' }}>
      {/* clip ring */}
      <div style={{
        position: 'absolute', left: ringLeft, top: -3, width: 8, height: 8, borderRadius: '50%',
        border: '1.6px solid rgba(242,237,227,.55)', background: 'transparent',
      }} />
      {/* rope — screen-fixed so it can swing/stretch anywhere without layout constraints */}
      <svg ref={svgRef} width="100vw" height="100vh" style={{ position: 'fixed', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 61 }}>
        <path ref={cordRef} fill="none" stroke="rgba(242,237,227,.4)" strokeWidth={1.4} strokeLinecap="round" />
      </svg>
      <div
        ref={cardRef}
        style={{
          position: 'fixed', left: -cardW / 2, top: 0, transformOrigin: `${cardW / 2}px 0px`,
          cursor: 'grab', pointerEvents: 'auto', touchAction: 'none', userSelect: 'none', zIndex: 61,
        }}
      >
        {large ? (
          <div style={{
            width: cardW, height: cardH, borderRadius: 14, overflow: 'hidden', boxSizing: 'border-box',
            background: 'linear-gradient(165deg, rgba(255,255,255,.1), rgba(255,255,255,.03))',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,.22)',
            boxShadow: '0 14px 30px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.16)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            padding: '18px 10px 16px', gap: 10,
          } as React.CSSProperties}>
            <div style={{ width: '62%', height: 2, borderRadius: 1, background: 'var(--accent,#E8B84B)', opacity: .85 }} />
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: color || 'var(--accent,#E8B84B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, fontWeight: 800, color: '#14100b', marginTop: 4,
              boxShadow: '0 0 0 3px rgba(255,255,255,.09), 0 4px 10px rgba(0,0,0,.4)',
            }}>{letter}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)', marginTop: 4 }}>{role}</div>
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
              <span style={{ width: 16, height: 1.6, borderRadius: 1, background: 'rgba(255,255,255,.28)' }} />
              <span style={{ width: 11, height: 1.6, borderRadius: 1, background: 'rgba(255,255,255,.16)' }} />
            </div>
          </div>
        ) : (
          <div style={{
            width: cardW, height: cardH, borderRadius: 7, overflow: 'hidden',
            background: 'linear-gradient(165deg, rgba(30,25,18,.96), rgba(13,11,8,.96))',
            border: '1px solid rgba(255,255,255,.18)',
            boxShadow: '0 8px 18px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, gap: 3,
          }}>
            <div style={{ width: '62%', height: 2, borderRadius: 1, background: 'var(--accent,#E8B84B)', opacity: .8 }} />
            <div style={{
              width: 15, height: 15, borderRadius: '50%', background: 'var(--accent,#E8B84B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8.5, fontWeight: 800, color: '#14100b',
              boxShadow: '0 0 0 2px rgba(255,255,255,.09), 0 2px 4px rgba(0,0,0,.35)',
            }}>{letter}</div>
            <div style={{ width: 16, height: 1.6, borderRadius: 1, background: 'rgba(255,255,255,.28)' }} />
            <div style={{ width: 11, height: 1.6, borderRadius: 1, background: 'rgba(255,255,255,.16)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
