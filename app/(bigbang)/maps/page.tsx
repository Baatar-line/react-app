'use client';

// Big Bang — Maps (/maps): aimag pin map, add-place form, pin detail panel.
import { useContext } from 'react';
import { Accessibility, Globe, Heart, MapPin } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia } from '@/components/bigbang/ui';

export default function MapsPage() {
  const V: any = useContext(BigBangContext);
  return (
    <section data-screen-label="Пин — газрын зураг" className="relative h-screen overflow-hidden bg-ink">
      <div className={`absolute inset-0 box-border px-4 pb-4 ${V.isMobile ? 'pt-[66px]' : 'pt-[72px]'}`}>
        <div ref={V.mainMapRef} className={`absolute inset-x-4 bottom-4 isolate overflow-hidden rounded-[18px] bg-[#1a2534] ${V.isMobile ? 'top-[66px]' : 'top-[72px]'}`}></div>

        {!V.isMobile && (
          <div className="absolute right-8 top-[88px] z-20 flex items-center gap-2.5">
            {V.mapZoomed && (
              <button onClick={V.resetMap} className="cursor-pointer whitespace-nowrap rounded-full border border-[rgba(242,237,227,.3)] bg-[rgba(20,20,20,.72)] px-3.5 py-1.5 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.85)] shadow-[0_4px_14px_rgba(0,0,0,.35)] backdrop-blur-[8px] transition-all duration-250 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">← {V.L.resetMap}</button>
            )}
            <button onClick={V.openGlobe} title={V.L.globe} className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border-none text-[#132a1f] shadow-[0_4px_14px_rgba(0,0,0,.35)] transition-transform duration-200 hover:-translate-y-0.5" style={{ background: V.accent }}><Globe size={15} /></button>
            <div className="relative inline-grid grid-cols-3 rounded-full border border-[rgba(255,255,255,.16)] bg-[rgba(20,20,20,.72)] p-[3px] shadow-[0_4px_14px_rgba(0,0,0,.35)] backdrop-blur-[8px]">
              <div className="absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-full transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]" style={{ background: V.accent, transform: `translateX(${V.pinPillShift})` }}></div>
              {V.pinModeOpts.map((m: any, i: number) => (
                <button key={i} onClick={m.pick} className="relative z-[2] cursor-pointer whitespace-nowrap border-none bg-transparent px-3.5 py-[5px] font-[inherit] text-[11.5px] font-bold transition-colors duration-250" style={{ color: m.color }}>{m.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!V.isMobile && (
        <div className="absolute bottom-11 left-12 z-10">
          <p className="m-0 max-w-[340px] text-[13.5px] text-[rgba(242,237,227,.55)]">{V.L.panelHint}</p>
        </div>
      )}

      {V.aimagPanelShow && (
        <div className="animate-bbCardIn absolute right-12 bottom-11 z-[18] w-[270px] rounded-2xl border border-[rgba(255,255,255,.1)] bg-[rgba(18,16,13,.88)] p-[18px] backdrop-blur-[18px]">
          <div className="text-lg font-extrabold text-cream">{V.panelName}</div>
          <div className="mt-1 text-xs font-bold text-[var(--accent,#E8B84B)]">{V.panelCount} пин</div>
          <div className="mt-2 text-[12.5px] leading-[1.5] text-[rgba(242,237,227,.6)]">{V.L.panelHint}</div>
        </div>
      )}

      {V.pinSel && (
        <div className="absolute right-12 bottom-11 z-20 w-80 rounded-2xl border border-[rgba(255,255,255,.1)] bg-[rgba(18,16,13,.88)] p-3 backdrop-blur-[18px] [animation:bbCardIn_.45s_cubic-bezier(.22,.8,.3,1)_both]">
          <BgMedia bg={V.pinSel.thumb} className="relative h-[150px] rounded-[11px]" imgClassName="bg-cover bg-center" />
          <div className="flex flex-col gap-1.5 px-1 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[rgba(255,255,255,.08)] px-[9px] py-[3px] text-[10.5px] font-bold tracking-[.06em] text-[rgba(242,237,227,.8)]">{V.pinSel.type}</span>
              <span className="text-[11px] text-[rgba(242,237,227,.5)]">{V.pinSel.aimag}</span>
              <span title="Тусгай хэрэгцээт хүнд ээлтэй" className="h-[22px] w-[22px] items-center justify-center rounded-full border border-[rgba(255,255,255,.26)] bg-[rgba(0,0,0,.5)] text-[#8fd6c6]" style={{ display: V.pinSel.accShow }}><Accessibility size={12} /></span>
              <span className="ml-auto flex items-center gap-1"><span className="text-[11px] leading-none text-[var(--accent,#E8B84B)]">★</span><span className="text-xs font-extrabold leading-none text-cream-2">{V.pinSel.rating}</span></span>
              <button onClick={V.pinSel.toggleFav} className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-full border border-[rgba(255,255,255,.2)] bg-transparent transition-all duration-200 hover:border-[var(--accent,#E8B84B)]" style={{ color: V.pinSel.heartColor }}><Heart size={14} fill={V.pinSel.favOn ? 'currentColor' : 'none'} /></button>
            </div>
            <div className="text-base font-extrabold text-cream">{V.pinSel.name}</div>
            <div className="text-[12.5px] leading-[1.5] text-[rgba(242,237,227,.6)]">{V.pinSel.desc}</div>
            {V.pinSel.hours && <div className="flex items-center gap-1.5 text-[11.5px] text-[rgba(242,237,227,.5)]"><span className="text-[var(--accent,#E8B84B)]">◷</span>{V.pinSel.hours}</div>}
            <a href={V.pinSel.mapUrl} target="_blank" rel="noopener" className="mt-0.5 box-border flex w-full cursor-pointer items-center gap-2 rounded-[11px] border border-[rgba(66,133,244,.4)] bg-[rgba(66,133,244,.14)] px-3.5 py-2.5 font-[inherit] text-xs font-bold text-[#8ab4f8] no-underline transition-all duration-200 hover:bg-[rgba(66,133,244,.22)]">
              <MapPin size={14} /><span>{V.L.openMaps}</span><span className="ml-auto opacity-70">→</span>
            </a>
            <div className="mt-1 flex gap-2">
              <button className="cursor-pointer rounded-full border border-[var(--accent,#E8B84B)] bg-[var(--accent,#E8B84B)] px-[18px] py-1.5 font-[inherit] text-xs font-bold text-[#132a1f] transition-all duration-250 hover:opacity-85">{V.L.detail} →</button>
              <button onClick={V.closePin} className="cursor-pointer rounded-full border border-[rgba(242,237,227,.25)] bg-transparent px-4 py-1.5 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.75)] transition-all duration-250 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">{V.L.close}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
