'use client';

// Big Bang — Globe (/globe): 3D country archive, mounted via the vanilla
// GlobeEngine script (see BigBangLayout.handleGlobeRef, wired via V.globeMountRef).
import { useContext } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia } from '@/components/bigbang/ui';

export default function GlobePage() {
  const V: any = useContext(BigBangContext);
  return (
    <section
      data-screen-label="Дэлхий"
      className="relative h-screen overflow-hidden bg-[radial-gradient(120%_120%_at_50%_22%,_#16261c_0%,_#101d15_68%,_#0a1510_100%)]"
    >
      <div id="bb-globe-mount" ref={V.globeMountRef} className="absolute inset-0"></div>
      <div className="absolute left-12 top-[88px] z-[6]">
        <button onClick={V.openPin} className="mb-3 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold text-[rgba(242,237,227,.6)] transition-colors duration-[250ms] hover:text-[var(--accent,#E8B84B)]">{V.L.back}</button>
        <div className="pointer-events-none">
          <div className="font-display italic text-[30px] leading-[1.05] text-cream-2">{V.globeTitle}</div>
          <div className="mt-2 max-w-[250px] text-[12.5px] leading-[1.5] text-[rgba(242,237,227,.55)]">{V.globeHint}</div>
        </div>
      </div>
      <div className="absolute right-12 top-[88px] z-[7] w-[280px]">
        <input
          value={V.globeQuery}
          onChange={V.globeOnQuery}
          placeholder={V.globeSearchPh}
          className="w-full box-border rounded-full border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.06)] px-[18px] py-[11px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[13px] text-cream outline-none shadow-[0_2px_10px_rgba(0,0,0,.25)]"
        />
        {V.globeHasResults && (
          <div className="mt-2 overflow-hidden rounded-[14px] border border-[rgba(255,255,255,.1)] bg-[#16130e] shadow-[0_12px_30px_rgba(0,0,0,.4)]">
            {V.globeResults.map((r: any, i: number) => (
              <button
                key={i}
                onClick={r.pick}
                className="block w-full cursor-pointer box-border border-0 bg-transparent px-4 py-[10px] text-left hover:bg-[rgba(232,184,75,.14)]"
              >
                <div className="text-[13px] font-bold text-cream">{r.name}</div>
                <div className="mt-[2px] text-[10.5px] text-[rgba(242,237,227,.5)]">{r.region}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      {V.globeShowHover && (
        <div className="absolute left-1/2 top-[88px] z-[6] -translate-x-1/2 pointer-events-none rounded-full border border-[rgba(255,255,255,.12)] bg-[#16130e] px-4 py-[7px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12px] font-semibold text-cream shadow-[0_4px_14px_rgba(0,0,0,.35)]">{V.globeHover}</div>
      )}
      {V.globeHasCard && (
        <div className="absolute right-12 bottom-10 z-[8] flex w-[250px] flex-col gap-[10px]">
          <div className="mb-[2px] flex items-start justify-between gap-3">
            <div>
              <div className="text-[10.5px] font-bold uppercase tracking-[.08em] text-[var(--accent,#E8B84B)]">{V.gcSitesLabel}</div>
              <div className="font-display mt-[2px] text-[22px] leading-[1.1] text-[#fbfbf8]">{V.gcName}</div>
            </div>
            <button
              onClick={V.globeCloseCard}
              className="flex-none w-[30px] h-[30px] cursor-pointer rounded-full border border-[rgba(251,251,248,.25)] bg-[rgba(0,0,0,.5)] font-[inherit] text-[18px] leading-none text-[rgba(251,251,248,.75)] hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"
            >
              ×
            </button>
          </div>
          {V.gcSites.map((s: any, i: number) => (
            <div key={i} className="relative h-[130px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,.1)] shadow-[0_16px_40px_rgba(0,0,0,.28)]">
              <BgMedia bg={s.cover} className="absolute inset-0" imgClassName="bg-cover bg-center" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.12)_0%,_rgba(0,0,0,0)_34%,_rgba(0,0,0,.5)_72%,_rgba(0,0,0,.85)_100%)]"></div>
              <div className="absolute left-[11px] top-[11px] flex min-w-[30px] h-[30px] items-center justify-center rounded-[9px] border border-[rgba(255,255,255,.16)] bg-[rgba(0,0,0,.5)] px-[7px] font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12px] font-bold text-cream-2 backdrop-blur-[8px]">{s.n}</div>
              <div className="pointer-events-none absolute left-0 right-0 bottom-0 px-[14px] py-3">
                <div className="mb-[5px] flex items-center gap-[5px]"><span className="text-[11px] leading-none text-[var(--accent,#E8B84B)]">★</span><span className="font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[10px] font-semibold uppercase tracking-[.06em] text-[rgba(242,237,227,.7)]">{s.tag}</span></div>
                <div className="font-display text-[18px] font-semibold leading-[1.15] text-cream-2 [text-shadow:0_1px_8px_rgba(0,0,0,.4)]">{s.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
