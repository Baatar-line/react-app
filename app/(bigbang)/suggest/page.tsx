'use client';

// Big Bang — Suggest (/suggest): top-rated carousel, curated collections, quick
// picks, and the travel-apps kit.
import { useContext } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia, Isometric3DIcon } from '@/components/bigbang/ui';

// Bento-style spans (desktop only — collapses to a plain single column on
// mobile) for the 6 travel-app cards, matched by index to V.travelApps'
// order (Organic Maps, OsmAnd, Windy, Ventusky, Avis Mongolia, Drive
// Mongolia — see TRAVEL_APPS in data.ts). A 4-column grid: one big square
// card, one tall card beside it, two small stacked squares, then two wide
// cards underneath — mixing big/small like a real bento layout instead of
// a flat uniform grid.
const TRAVEL_SPANS = [
  { gridColumn: '1 / 3', gridRow: '1 / 3' },
  { gridColumn: '3 / 4', gridRow: '1 / 3' },
  { gridColumn: '4 / 5', gridRow: '1 / 2' },
  { gridColumn: '4 / 5', gridRow: '2 / 3' },
  // Avis Mongolia / Drive Mongolia — only they sit in this grid row, so their
  // own min-height drives the row height.
  { gridColumn: '1 / 3', gridRow: '3 / 4', minHeight: 250 },
  { gridColumn: '3 / 5', gridRow: '3 / 4', minHeight: 250 },
];

export default function SuggestPage() {
  const V: any = useContext(BigBangContext);
  return (
    <section
      data-screen-label="Санал болгох"
      className="box-border min-h-screen"
      style={{ padding: V.isMobile ? '96px 18px 14px' : '110px 48px 18px' }}
    >
      {V.brands.length > 0 && (
        <div className="mb-10">
          <h2 className="m-0 text-lg font-extrabold tracking-[-0.02em] text-cream">{V.L.brandsTitle}</h2>
          <p className="mt-1.5 mb-3.5 text-[13px] text-[rgba(242,237,227,.55)]">{V.L.brandsSub}</p>
          <div className="bb-hscroll flex gap-4 overflow-x-auto pt-3 pb-1.5">
            {V.brands.map((b: any, i: number) => {
              // The sizing/flex-item classes live on whichever element ends
              // up as the actual direct child of the scroll rail (<a> when
              // there's a link, <div> otherwise) — putting them one level
              // deeper instead left the wrapper with no size of its own.
              const cardClass = 'relative block grow-0 shrink-0 basis-[190px] aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl border border-[rgba(255,255,255,.1)] no-underline transition-transform duration-300 ease-[cubic-bezier(.22,.8,.3,1)] hover:-translate-y-2';
              const inner = (
                <>
                  <BgMedia bg={b.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.05)_0%,rgba(0,0,0,0)_45%,rgba(0,0,0,.85)_100%)]"></div>
                  <div className="absolute left-3 right-3 bottom-3 flex items-center gap-2.5">
                    <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full border border-[rgba(255,255,255,.25)] bg-[#f2ede3]">
                      {b.logoUrl ? <img src={b.logoUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-xs font-extrabold text-[#171410]">{b.name.charAt(0)}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-extrabold leading-[1.2] text-cream-2">{b.name}</div>
                      <div className="truncate text-[11px] text-[rgba(242,237,227,.6)]">{b.category}</div>
                    </div>
                  </div>
                </>
              );
              return b.link ? (
                <a key={i} href={b.link} target="_blank" rel="noopener noreferrer" className={cardClass}>{inner}</a>
              ) : (
                <div key={i} className={cardClass}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-10">
        <h2 className="m-0 mb-3.5 text-lg font-extrabold tracking-[-0.02em] text-cream">{V.L.topRowTitle}</h2>
        {/* overflow-x:auto here forces overflow-y to compute as 'auto' too (CSS
            spec — you can't leave one axis 'visible' once the other isn't),
            so a card's hover lift (translateY(-8px) below) got clipped by the
            row's own top edge with zero padding-top to absorb it. */}
        <div className="bb-hscroll flex gap-4 overflow-x-auto pt-3 pb-1.5">
          {V.topItems.filter(Boolean).map((it: any, i: number) => (
            <div
              key={i}
              onClick={it.onClick}
              className="relative grow-0 shrink-0 basis-[220px] aspect-[4/5] cursor-pointer overflow-hidden rounded-2xl border border-[rgba(255,255,255,.1)] transition-transform duration-300 ease-[cubic-bezier(.22,.8,.3,1)] hover:-translate-y-2"
            >
              <BgMedia bg={it.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.1)_0%,rgba(0,0,0,0)_40%,rgba(0,0,0,.92)_100%)]"></div>
              <span className="absolute top-[10px] left-[10px] rounded-full border border-[rgba(255,255,255,.2)] bg-[rgba(0,0,0,.55)] px-[10px] py-1 text-[10px] font-bold tracking-[.05em] text-[var(--accent,#E8B84B)] uppercase backdrop-blur-[8px]">{it.kind}</span>
              <span className="absolute top-[10px] right-[10px] rounded-full border border-[rgba(255,255,255,.2)] bg-[rgba(0,0,0,.55)] px-[9px] py-[3px] text-[11px] font-bold text-cream-2 backdrop-blur-[8px]">★ {it.rating}</span>
              <div className="absolute right-3 bottom-3 left-3">
                <div className="text-sm font-extrabold leading-[1.25] text-cream-2">{it.name}</div>
                <div className="mt-0.5 text-[11.5px] text-[rgba(242,237,227,.65)]">{it.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-7 flex flex-col gap-7">
        {V.suggests.map((s: any, i: number) => (
          <div
            key={i}
            onClick={s.open}
            className="relative cursor-pointer overflow-hidden rounded-[22px] transition-transform duration-300 ease-in-out hover:-translate-y-[3px]"
            style={{ height: V.isMobile ? '360px' : '420px' }}
          >
            <BgMedia bg={s.cover} isVideo={s.coverIsVideo} videoSrc={s.coverRawUrl} className="absolute inset-0" imgClassName="bg-cover bg-center" />
            <div style={{ position: 'absolute', inset: 0, background: s.scrim }}></div>
            <div style={V.isMobile
              ? { position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px 24px', boxSizing: 'border-box' }
              : { position: 'absolute', top: 0, bottom: 0, width: 'min(440px,46%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, padding: '0 48px', boxSizing: 'content-box', left: s.textLeft, right: s.textRight }}>
              <span className="self-start rounded-full border border-[rgba(255,255,255,.25)] bg-[rgba(255,255,255,.1)] px-3 py-1 text-[10.5px] font-bold tracking-[.08em] text-[rgba(242,237,227,.9)] uppercase backdrop-blur-[8px]">{s.tag}</span>
              <div className="text-[clamp(24px,2.4vw,34px)] font-extrabold tracking-[-0.02em] text-cream-2 uppercase leading-[1.12]">{s.title}</div>
              <div className="flex flex-col gap-[7px]">
                <div className="flex items-center gap-[9px] text-[13.5px] text-[rgba(242,237,227,.85)]"><span className="h-1 w-1 rounded-full bg-[var(--accent,#E8B84B)]"></span>{s.count}</div>
                <div className="flex items-center gap-[9px] text-[13.5px] text-[rgba(242,237,227,.85)]"><span className="h-1 w-1 rounded-full bg-[var(--accent,#E8B84B)]"></span>atlas багийн сонголт</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TRAVEL APPS ── */}
      <div className="relative">
        {/* Horizontal padding dropped — that was interior padding for the
            card border this section used to have; now that the border's
            gone, the grid should reach the same left/right edges as the
            carousel/banners above instead of sitting inset from them. */}
        <div className="relative" style={{ padding: V.isMobile ? '22px 0 6px' : '32px 0 8px' }}>
          <div className="mb-[26px] flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <Isometric3DIcon kind="travel" size={56} />
              <div>
                <h3 className="m-0 text-[clamp(22px,2.2vw,30px)] font-extrabold tracking-[-0.02em] text-cream-2">{V.L.appsTitle}</h3>
                <p className="mt-2 mb-0 max-w-[520px] text-[13.5px] leading-[1.5] text-[rgba(242,237,227,.6)]">{V.L.appsSub}</p>
              </div>
            </div>
          </div>
          <div className={V.isTablet ? 'flex flex-col gap-4' : 'grid grid-cols-4 auto-rows-[minmax(118px,auto)] gap-4'}>
            {V.travelApps.map((a: any, i: number) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex flex-col overflow-hidden rounded-[20px] px-[22px] pt-[22px] pb-6 no-underline shadow-[0_14px_34px_rgba(0,0,0,.28)] backdrop-blur-[14px] transition-transform duration-[350ms] ease-[cubic-bezier(.22,.8,.3,1)] hover:-translate-y-[6px] hover:shadow-[0_24px_48px_rgba(0,0,0,.4)]"
                style={{
                  background: a.hasBg ? undefined : 'rgba(255,255,255,.04)',
                  border: '1px solid rgba(255,255,255,.1)',
                  ...(V.isTablet ? {} : { gridColumn: TRAVEL_SPANS[i].gridColumn, gridRow: TRAVEL_SPANS[i].gridRow, minHeight: TRAVEL_SPANS[i].minHeight }),
                }}
              >
                {a.hasBg && (
                  <>
                    <BgMedia bg={a.bg} isVideo={a.bgIsVideo} videoSrc={a.bgRawUrl} className="absolute inset-0" imgClassName="bg-cover bg-center" />
                    <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(0,0,0,.1)_0%,rgba(0,0,0,.4)_40%,rgba(0,0,0,.82)_100%)]"></div>
                  </>
                )}
                <span className="absolute top-[18px] right-[18px] z-[1] flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border border-[rgba(255,255,255,.22)] bg-[rgba(0,0,0,.22)] text-[13px] text-cream-2 opacity-75 transition-[opacity,transform] duration-[250ms]">↗</span>
                <div className="relative flex items-center gap-3">
                  <div className="box-border flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl p-[3px]" style={{ border: `1px solid ${a.ring}` }}>
                    <div className="flex h-full w-full items-center justify-center rounded-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,.2)]" style={{ background: a.tint }}>
                      {a.logo ? <img src={a.logo} alt={a.name} style={{ width: '58%', height: '58%', objectFit: 'contain' }} /> : <a.icon size={16} />}
                    </div>
                  </div>
                  <div className="relative min-w-0">
                    <div className="text-[16.5px] font-extrabold tracking-[-0.01em] text-cream-2 leading-[1.2]">{a.name}</div>
                    <div className="mt-1.5 text-[12.5px] leading-[1.4] text-[rgba(242,237,227,.68)]">{a.purpose}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
