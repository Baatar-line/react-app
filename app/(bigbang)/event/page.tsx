'use client';

// Big Bang — Event (/event).
import { useContext } from 'react';
import { Users } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia } from '@/components/bigbang/ui';

export default function EventPage() {
  const V: any = useContext(BigBangContext);
  return (
    <section
      data-screen-label="Эвент"
      className={`box-border min-h-screen ${V.isMobile ? 'pt-24 px-[18px] pb-8' : 'pt-[110px] px-12 pb-10'}`}
    >
      <div className={`relative cursor-pointer overflow-hidden rounded-[18px] mb-[30px] ${V.isMobile ? 'h-[260px]' : 'h-[420px]'}`}>
        <BgMedia bg={V.fevBg} className="absolute inset-0" imgClassName="bg-cover bg-center" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.2)_0%,_rgba(0,0,0,.85)_100%)]"></div>
        <span className="absolute left-[22px] top-[20px] rounded-full bg-[var(--accent,#E8B84B)] px-[14px] py-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#132a1f]">{V.L.featured}</span>
        <div className="absolute left-[22px] right-[22px] bottom-[22px]">
          <div className="font-mono text-[12px] text-[var(--accent,#E8B84B)]">{V.fevDate}</div>
          <div className="mt-1 text-[30px] font-extrabold tracking-[-0.02em] text-cream">{V.fevName}</div>
          <div className="mt-1 text-[13.5px] text-[rgba(242,237,227,.65)]">{V.fevMeta}</div>
        </div>
      </div>
      <div className={`grid gap-[18px] ${V.isMobile ? 'grid-cols-1' : V.isTablet ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {V.events.map((ev: any, i: number) => (
          <div
            key={i}
            onClick={ev.onClick}
            className="relative aspect-[677/525] cursor-pointer overflow-hidden rounded-2xl border border-[rgba(0,0,0,.6)] transition-[transform_.35s_cubic-bezier(.22,.8,.3,1),_box-shadow_.35s_ease] animate-[bbFadeUp_.5s_cubic-bezier(.22,.8,.3,1)_both] hover:-translate-y-[5px] hover:shadow-[0_22px_48px_rgba(0,0,0,.5)]"
          >
            <BgMedia bg={ev.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center transition-transform duration-[600ms] ease-[cubic-bezier(.22,.8,.3,1)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.2)_0%,_rgba(0,0,0,0)_32%,_rgba(0,0,0,.5)_55%,_rgba(0,0,0,.96)_100%)]"></div>
            <div className="absolute left-[12px] top-[12px] flex min-w-[52px] h-[52px] flex-col items-center justify-center rounded-[11px] border border-[rgba(232,184,75,.45)] bg-[rgba(0,0,0,.62)] backdrop-blur-[8px]">
              <span className="text-[18px] font-extrabold leading-none text-[var(--accent,#E8B84B)]">{ev.day}</span>
              <span className="mt-[2px] text-[9px] font-semibold text-[rgba(242,237,227,.7)]">{ev.mon}</span>
            </div>
            <span className="absolute right-[12px] top-[12px] rounded-full border border-[rgba(255,255,255,.2)] bg-[rgba(0,0,0,.55)] px-[11px] py-1 text-[10px] font-bold tracking-[.04em] text-[rgba(242,237,227,.9)] backdrop-blur-[8px]">{ev.tag}</span>
            <div className="absolute left-0 right-0 bottom-0 px-4 pt-4 pb-[18px]">
              <div className="pointer-events-none text-[16px] font-extrabold leading-[1.25] tracking-[-0.01em] text-cream-2">{ev.name}</div>
              <div className="pointer-events-none mt-[5px] text-[12px] text-[rgba(242,237,227,.6)]">{ev.meta}</div>
              <button
                onClick={ev.toggleJoin}
                className="mt-3 inline-flex cursor-pointer items-center gap-[6px] rounded-full px-4 py-2 font-[inherit] text-[12px] font-bold transition-all duration-[250ms] ease-in-out"
                style={{ border: `1px solid ${ev.joinBorder}`, background: ev.joinBg, color: ev.joinColor }}
              >
                <Users size={13} />{ev.joinLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
