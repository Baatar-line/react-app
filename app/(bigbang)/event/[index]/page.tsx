'use client';

// Big Bang — Event detail (/event/:index). `:index` is the position of the
// event inside V.events (see BigBangLayout's `events:` field, built from the
// live-fetched Event rows) — read via context since that list comes from the
// backend, not a static file this page could import and rebuild from.
import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, MapPin, Star } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { mapsUrlFor, imgUrl } from '@/components/bigbang/data';
import { BgMedia } from '@/components/bigbang/ui';
import { getRatingSummary, ratingTargetKey, submitRating, type RatingSummary } from '@/lib/ratings';

export default function EventDetail() {
  const V: any = useContext(BigBangContext);
  const router = useRouter();
  const { index } = useParams<{ index: string }>();
  const [hoverStar, setHoverStar] = useState(0);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({ average: null, count: 0, mine: null });
  const [pdImgIdx, setPdImgIdx] = useState(0);
  useEffect(() => { setPdImgIdx(0); }, [index]);

  const events: any[] = V.events || [];
  const i = Math.max(0, Math.min(Number(index) || 0, events.length - 1));
  const ev = events[i];

  const targetKey = ev ? ratingTargetKey('event', ev.id) : '';
  useEffect(() => {
    if (!targetKey) return;
    let cancelled = false;
    getRatingSummary(targetKey, V.mySessionToken).then((s) => { if (!cancelled) setRatingSummary(s); }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, V.mySessionToken]);

  if (!ev) return null;

  const rateThis = async (score: number) => {
    if (!V.loggedIn) { V.openUserAuth(); return; }
    try {
      setRatingSummary((s) => ({ ...s, mine: score }));
      const updated = await submitRating(V.mySessionToken, targetKey, score);
      setRatingSummary(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };
  const myRating = ratingSummary.mine || 0;

  const L = V.L;
  const accent = V.accent;
  const parts = String(ev.meta || '').split(' · ');
  const time = parts.length > 1 ? parts[0] : '';
  const location = parts.length > 1 ? parts.slice(1).join(' · ') : parts[0] || '';
  const aimag = ev.aimag || 'Улаанбаатар';

  const info = [
    { label: L.evDate, value: `${ev.day} ${ev.mon}` },
    ...(time ? [{ label: L.evTime, value: time }] : []),
    ...(location ? [{ label: L.pdLoc, value: location }] : []),
    { label: L.evTag, value: ev.tag },
  ];

  const gallery: string[] = ev.images && ev.images.length ? ev.images : [];
  const sel = Math.min(pdImgIdx, Math.max(0, gallery.length - 1));
  const mainBg = gallery.length
    ? 'linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.35)), url("' + imgUrl(gallery[sel], 1200) + '")'
    : ev.thumb;

  return (
    <section data-screen-label="Эвентийн дэлгэрэнгүй" className="box-border min-h-screen" style={{ padding: V.isMobile ? '88px 18px 40px' : '96px 48px 60px' }}>
      <button onClick={() => router.push('/event')} className="mb-[26px] inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent text-[13px] font-semibold text-[rgba(242,237,227,.6)] transition-colors duration-[250ms] hover:text-[var(--accent,#E8B84B)]">{L.back}</button>
      <div className={V.isTablet ? 'flex flex-col gap-7' : 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-start gap-12'}>
        <div className="flex flex-col gap-2.5">
          <div className="relative aspect-[4/3] max-h-[420px] overflow-hidden rounded-[22px] border border-[rgba(255,255,255,.1)]">
            <BgMedia bg={mainBg} className="absolute inset-0" imgClassName="bg-cover bg-center" />
            <div className="absolute left-[18px] top-[18px] flex min-w-[58px] h-[58px] flex-col items-center justify-center rounded-[13px] border border-[rgba(232,184,75,.45)] bg-[rgba(0,0,0,.62)] backdrop-blur-[8px]">
              <span className="text-[20px] font-extrabold leading-none text-[var(--accent,#E8B84B)]">{ev.day}</span>
              <span className="mt-[3px] text-[10px] font-semibold text-[rgba(242,237,227,.7)]">{ev.mon}</span>
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2.5">
              {gallery.map((id, k) => (
                <button
                  key={k}
                  onClick={() => setPdImgIdx(k)}
                  className={`relative aspect-[4/3] max-h-24 flex-1 cursor-pointer overflow-hidden rounded-xl p-0 ${k === sel ? 'opacity-100' : 'opacity-60'}`}
                  style={{ border: `1.5px solid ${k === sel ? accent : 'rgba(255,255,255,.14)'}` }}
                >
                  <BgMedia bg={`url("${imgUrl(id, 300)}")`} className="absolute inset-0" imgClassName="bg-cover bg-center" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="m-0 text-[clamp(32px,3.4vw,50px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-cream">{ev.name}</h1>
          <div className="mt-[18px] flex flex-wrap gap-2">
            <span className="rounded-full border border-[rgba(242,237,227,.2)] py-1.5 px-3.5 text-xs font-bold text-[rgba(242,237,227,.8)]">{ev.tag}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-[26px]">
            <div className="flex items-center gap-[11px]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(232,184,75,.4)] text-base text-[var(--accent,#E8B84B)]">★</span>
              <span className="flex flex-col"><span className="text-[15px] font-extrabold text-cream">{ratingSummary.average != null ? ratingSummary.average.toFixed(1) : '—'}</span><span className="text-[11px] text-[rgba(242,237,227,.5)]">{L.pdRating}{ratingSummary.count > 0 ? ` · ${ratingSummary.count}` : ''}</span></span>
            </div>
          </div>
          <div className="my-[30px] h-px bg-[rgba(255,255,255,.1)]"></div>
          <h2 className="m-0 mb-3.5 inline-block border-b-2 border-[var(--accent,#E8B84B)] pb-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-cream">{L.pdInfo}</h2>
          <div className="flex max-w-[560px] flex-col gap-[11px]">
            {info.map((row, i2) => (
              <div key={i2} className="flex items-baseline gap-3">
                <span className="h-1.5 w-1.5 flex-none -translate-y-0.5 rounded-full bg-[var(--accent,#E8B84B)]"></span>
                <span className="min-w-[130px] text-[13.5px] text-[rgba(242,237,227,.5)]">{row.label}</span>
                <span className="text-sm font-semibold text-cream">{row.value}</span>
              </div>
            ))}
          </div>
          <h2 className="mt-[34px] mb-3.5 inline-block border-b-2 border-[var(--accent,#E8B84B)] pb-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-cream">{L.pdRateTitle}</h2>
          <div className="flex items-center gap-3.5">
            <div className="flex gap-1.5" onMouseLeave={() => setHoverStar(0)}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = n <= (hoverStar || myRating);
                return (
                  <button
                    key={n}
                    onClick={() => rateThis(n)}
                    onMouseEnter={() => setHoverStar(n)}
                    aria-label={String(n)}
                    className="cursor-pointer border-0 bg-transparent p-0 transition-transform duration-150 hover:scale-110"
                    style={{ color: on ? accent : 'rgba(242,237,227,.28)' }}
                  >
                    <Star size={26} fill={on ? 'currentColor' : 'none'} />
                  </button>
                );
              })}
            </div>
            <span className="text-[13px] font-semibold text-[rgba(242,237,227,.6)]">
              {myRating ? `${L.pdRateThanks}: ${myRating}/5` : L.pdRateHint}
            </span>
          </div>
          <div className="mt-[30px] flex flex-wrap gap-3">
            <a href={mapsUrlFor({ name: location || ev.name, aimag })} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-[rgba(66,133,244,.4)] bg-[rgba(66,133,244,.14)] py-3 px-[22px] text-[13px] font-bold text-[#8ab4f8] no-underline transition-all duration-[200ms] hover:bg-[rgba(66,133,244,.22)]"><MapPin size={14} />{L.openMaps}</a>
            <button
              onClick={ev.toggleJoin}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full py-3 px-[22px] text-[13px] font-bold transition-all duration-[250ms]"
              style={{ border: `1px solid ${ev.joinBorder}`, background: ev.joinBg, color: ev.joinColor }}
            >
              <Users size={15} />{ev.joinLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
