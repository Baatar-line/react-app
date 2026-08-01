'use client';

// Ad carousel — admin-authored Ad rows (see app/admin's "ads" tab), shown on
// every page load/refresh. Coverflow-style stack: the active ad sits
// front-and-center at full size/brightness, its neighbors fan out behind it
// — smaller, rotated, dimmed — so more-than-one-ad is obvious at a glance
// without needing separate dots. Click a side card, drag, or use the arrows
// to move; closeable via the X or the backdrop.
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { imgUrl } from './bigbang/data';

interface AdRow {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';
// How many neighbors on each side stay in the fan before fading out entirely.
const MAX_SPREAD = 2;

export default function AdModal() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const seenRef = useRef<Set<number>>(new Set());
  const dragStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/ads/active`)
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: AdRow[]) => {
        if (!rows.length) return;
        setAds(rows);
        // Start centered on the middle ad, not the first one — with 3+ ads
        // that puts a card fanned on both sides right away instead of
        // opening lopsided (only a right-side neighbor, none on the left).
        setIdx(Math.floor((rows.length - 1) / 2));
        setOpen(true);
      })
      .catch(() => {});
  }, []);

  // Fires once per ad the visitor actually brings to front (not just
  // fetched) — gives the admin panel's "views" counter its first real signal.
  useEffect(() => {
    const ad = ads[idx];
    if (!open || !ad || seenRef.current.has(ad.id)) return;
    seenRef.current.add(ad.id);
    fetch(`${API_BASE}/ads/${ad.id}/view`, { method: 'POST' }).catch(() => {});
  }, [open, ads, idx]);

  const close = () => setOpen(false);

  const goTo = (i: number) => setIdx(Math.max(0, Math.min(ads.length - 1, i)));
  const prev = () => goTo(idx - 1);
  const next = () => goTo(idx + 1);

  const onPointerDown = (e: React.PointerEvent) => { dragStartX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (dragStartX.current == null) return;
    const dx = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (dx > 40) prev();
    else if (dx < -40) next();
  };

  if (!open || !ads.length) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-6 bg-[rgba(6,8,12,.78)] p-4 [animation:bbFadeUp_.3s_ease_both]"
      onClick={close}
    >
      <div
        className="relative h-[500px] w-full max-w-[1300px] select-none touch-pan-y"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <button
          onClick={close}
          aria-label="Хаах"
          className="absolute z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-[rgba(255,255,255,.08)] text-cream backdrop-blur-[6px] transition-colors duration-200 hover:bg-[rgba(255,255,255,.18)]"
          style={{ left: 'calc(50% + 170px)', top: 'calc(50% - 230px)', transform: 'translate(-50%, -50%)' }}
        >
          <X size={18} />
        </button>

        {ads.map((ad, i) => {
          const offset = i - idx;
          const abs = Math.abs(offset);
          if (abs > MAX_SPREAD) return null;
          const active = offset === 0;
          return (
            <div
              key={ad.id}
              onClick={() => !active && goTo(i)}
              className="absolute left-1/2 top-1/2 overflow-hidden rounded-[20px] transition-[transform,opacity,filter] duration-500 ease-[cubic-bezier(.22,.8,.3,1)]"
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * 240}px) rotate(${offset * 9}deg) scale(${1 - abs * 0.13})`,
                opacity: 1 - abs * 0.35,
                filter: active ? 'none' : `brightness(${0.55 - abs * 0.08})`,
                zIndex: 10 - abs,
                cursor: active ? 'default' : 'pointer',
                boxShadow: active ? '0 24px 60px rgba(0,0,0,.55)' : 'none',
              }}
            >
              {/* Fixed height, auto width — the card takes on the image's own
                  aspect ratio instead of being force-fit into one shape, so
                  there's no letterboxing/fill color showing around it. Ad
                  graphics are fully self-designed (title/branding already
                  baked into the image) — no gradient scrim or duplicate
                  title text on top; that's only a fallback for an ad with no
                  image at all. */}
              {ad.image ? (
                <img src={imgUrl(ad.image, 1400)} alt={ad.title} className="block h-[460px] w-auto max-w-[680px]" />
              ) : (
                <div className="flex h-[460px] w-[500px] flex-col justify-end bg-[#171410] p-5">
                  <div className="text-[19px] font-extrabold leading-[1.2] text-cream">{ad.title}</div>
                  {ad.description && <div className="mt-1.5 text-[13px] leading-[1.5] text-[rgba(242,237,227,.75)]">{ad.description}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
