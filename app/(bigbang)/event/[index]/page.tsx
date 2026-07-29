'use client';

// Big Bang — Event detail (/event/:index). `:index` is the position of the
// event inside V.events (myEvents first, then EVENTS — see BigBangLayout's
// `events:` field) — read via context rather than rebuilt from data.ts like
// PlaceDetail does, since myEvents (user-submitted) only ever lives on this
// layout's own state, not in any static file this page could import.
import { useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Users, MapPin } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { mapsUrlFor } from '@/components/bigbang/data';
import { BgMedia } from '@/components/bigbang/ui';

export default function EventDetail() {
  const V: any = useContext(BigBangContext);
  const router = useRouter();
  const { index } = useParams<{ index: string }>();

  const events: any[] = V.events || [];
  const i = Math.max(0, Math.min(Number(index) || 0, events.length - 1));
  const ev = events[i];

  if (!ev) return null;

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

  return (
    <section data-screen-label="Эвентийн дэлгэрэнгүй" className="box-border min-h-screen" style={{ padding: V.isMobile ? '88px 18px 40px' : '96px 48px 60px' }}>
      <button onClick={() => router.push('/event')} className="mb-[26px] inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent text-[13px] font-semibold text-[rgba(242,237,227,.6)] transition-colors duration-[250ms] hover:text-[var(--accent,#E8B84B)]">{L.back}</button>
      <div className={V.isTablet ? 'flex flex-col gap-7' : 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-start gap-12'}>
        <div className="flex flex-col gap-2.5">
          <div className="relative aspect-[4/3] max-h-[420px] overflow-hidden rounded-[22px] border border-[rgba(255,255,255,.1)]">
            <BgMedia bg={ev.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center" />
            <div className="absolute left-[18px] top-[18px] flex min-w-[58px] h-[58px] flex-col items-center justify-center rounded-[13px] border border-[rgba(232,184,75,.45)] bg-[rgba(0,0,0,.62)] backdrop-blur-[8px]">
              <span className="text-[20px] font-extrabold leading-none text-[var(--accent,#E8B84B)]">{ev.day}</span>
              <span className="mt-[3px] text-[10px] font-semibold text-[rgba(242,237,227,.7)]">{ev.mon}</span>
            </div>
          </div>
        </div>
        <div>
          <h1 className="m-0 text-[clamp(32px,3.4vw,50px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-cream">{ev.name}</h1>
          <div className="mt-[18px] flex flex-wrap gap-2">
            <span className="rounded-full border border-[rgba(242,237,227,.2)] py-1.5 px-3.5 text-xs font-bold text-[rgba(242,237,227,.8)]">{ev.tag}</span>
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
