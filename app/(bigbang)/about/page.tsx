'use client';

// Big Bang — About (/about): mission timeline, team, and the tourist-flow chart.
import { useContext } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import LanyardBadge from '@/components/bigbang/LanyardBadge';
import { BgMedia } from '@/components/bigbang/ui';

// Groups a space-separated vertical-script string 2 words per column (line),
// joined with a real `\n` — paired with `whiteSpace: 'pre'` on the element so
// the browser breaks exactly where told instead of auto-wrapping (which
// doesn't reliably clip for vertical Mongolian script and used to run the
// text past its row). One word per column read as too many/too narrow
// columns strung across the screen — two keeps the column count down.
function mnVertLines(s: string, perLine = 2): string {
  const words = s.split(' ');
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += perLine) lines.push(words.slice(i, i + perLine).join(' '));
  return lines.join('\n');
}

export default function AboutPage() {
  const V: any = useContext(BigBangContext);
  return (
    <section
      data-screen-label="Бидний тухай"
      className="box-border min-h-screen"
      style={{ background: 'radial-gradient(120% 60% at 12% 0%, rgba(232, 184, 75,.12) 0%, rgba(0,0,0,0) 55%), radial-gradient(100% 55% at 100% 25%, rgba(120,170,255,.07) 0%, rgba(0,0,0,0) 60%), #0b0a08' }}
    >
      {/* full-bleed hero board — large background photo + vertical icon timeline,
          inspired by the "Eiger Trail" style infographic layout. Edge-to-edge like the
          Home hero, with the fixed site nav floating over it via its own fade-gradient. */}
      <div className="relative overflow-hidden">
        <BgMedia
          bg={V.abHeroFullBg} isVideo={V.abHeroIsVideo} videoSrc={V.abHeroRawUrl}
          className="absolute inset-0" imgClassName="bg-cover bg-top saturate-[1.05]" videoClassName="saturate-[1.05]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,_rgba(0,0,0,.88)_0%,_rgba(0,0,0,.6)_34%,_rgba(0,0,0,.16)_62%,_rgba(0,0,0,.4)_100%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.55)_0%,_rgba(0,0,0,.08)_14%,_rgba(0,0,0,.08)_44%,_rgba(0,0,0,.42)_60%,_rgba(0,0,0,.85)_100%)]"></div>

        <div className="relative z-[2] pt-[104px] px-5 pb-0 text-center">
          <h1 className="m-0 font-display text-[clamp(30px,4.4vw,54px)] font-extrabold leading-[1.14] text-cream-2 [text-shadow:0_4px_30px_rgba(0,0,0,.45)]">{V.L.abBig}<br />{V.L.abBang}</h1>
          <div className="mt-3 font-mono text-[11px] uppercase tracking-[.16em] text-[rgba(242,237,227,.65)]">#{V.abHashtag}</div>
        </div>

        <div className="relative z-[2] mx-auto max-w-[640px] pt-14 px-7 pb-16">
          <div>
            {/* icon and label both sit flush at the row's top, in the same 40px
                band, so their centers line up; the connector is one stub below
                each icon (not a line running behind it) reaching down to the next */}
            {V.abTimeline.map((row: any, i: number) => (
              <div key={i} className="flex gap-4">
                <div className="flex w-10 flex-none flex-col items-center">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[rgba(242,237,227,.32)] bg-transparent text-cream"><row.icon size={17} /></span>
                  <div className={`w-px flex-shrink-0 basis-0 bg-[rgba(242,237,227,.28)] ${i === V.abTimeline.length - 1 ? 'grow-0' : 'grow'}`}></div>
                </div>
                <div className="flex flex-1 items-start justify-between gap-3.5 pb-8">
                  <div className="flex-1">
                    <div className="flex min-h-10 items-center">
                      <div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[var(--accent,#E8B84B)]">{row.label}</div>
                    </div>
                    <div className="mt-1.5 max-w-[380px] text-sm leading-[1.65] text-cream">{row.desc}</div>
                  </div>
                  {/* One word per column (same manual-\n approach the short
                      `vert` title already used successfully) instead of letting
                      the browser auto-wrap a whole sentence inside a fixed-height
                      box — that auto-wrap doesn't reliably clip for vertical
                      Mongolian script here, which is what was running the text
                      past the row into the next one. Width grows with the column
                      count instead of being capped, height is auto (no overflow
                      clipping needed since nothing is forced to wrap blind).
                      Needs real horizontal room next to the 380px-wide paragraph,
                      so it's dropped on mobile. */}
                  {!V.isMobile && (row.vert || row.descVert) && (
                    <div
                      className="max-w-[300px] flex-none whitespace-pre text-[22px] leading-tight [writing-mode:vertical-lr] [font-family:'Mongolian_Baiti','Menksoft_Tigst',sans-serif]"
                      title="Уламжлалт бичиг — AI орчуулга, шалгагдаагvй"
                    >
                      {row.vert && <span className="font-bold text-[var(--accent,#E8B84B)]">{row.vert}</span>}
                      {row.descVert && <span className="text-[rgba(242,237,227,.5)]">{row.vert ? '\n' : ''}{mnVertLines(row.descVert)}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-[2] mx-auto max-w-[1100px] px-7 pb-12">
          <div className="mb-5 flex items-baseline gap-3">
            <h2 className="m-0 text-xl font-extrabold tracking-[-0.02em] text-cream-2">{V.L.abTeamT}</h2>
            <span className="font-mono text-[11px] text-[rgba(242,237,227,.5)]">06</span>
          </div>
          {/* Same hanging-cord badges as the nav logo — real name/role on a
              bigger card (LanyardBadge's `large` variant), swinging on the
              same verlet-rope physics, draggable/knockable the same way.
              The card itself is `position:fixed` (needed so the rope can
              swing freely without layout constraints) so it contributes
              no height here on its own — this row would otherwise collapse
              to ~1px and the next section would render right through the
              hanging cards. min-height reserves roughly ring + cord + card
              so the page below doesn't overlap them. */}
          <div className="flex min-h-[300px] flex-wrap items-start justify-center gap-8 pt-2">
            {V.team.map((tm: any, i: number) => (
              <LanyardBadge key={i} large letter={tm.initial} name={tm.name} role={tm.role} color={tm.avatarBg} />
            ))}
          </div>
        </div>

        <div className="relative z-[2] flex items-center justify-center gap-2.5 px-7 pb-[34px]">
          <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-[var(--accent,#E8B84B)] text-[11px] font-extrabold text-[#132a1f]">b</span>
          <span className="text-[11px] tracking-[.04em] text-[rgba(242,237,227,.6)]">big bang · {V.L.abContact}</span>
        </div>

      {/* Same column width as the sections above — the map SVG is width:100%
          of its container (see travel-map.js VB), so narrowing this column
          scales the whole globe down with it. */}
      <div className="relative z-[2] mx-auto max-w-[1280px]" style={{ padding: V.isMobile ? '20px 18px 40px' : '20px 32px 56px' }}>
        <div className="text-cream-2">
          <div className="mb-6">
            <div className="font-display italic text-[32px] leading-[1.05] text-cream-2">{V.travelTitle}</div>
            <div className="mt-2.5 max-w-[520px] text-[13px] leading-normal text-[rgba(242,237,227,.6)]">{V.travelSub}</div>
          </div>
          <div className={V.isTablet ? 'flex flex-col gap-6' : 'flex items-center gap-6'}>
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-[20px]">
              <div className="absolute inset-[-10%] bg-[radial-gradient(60%_60%_at_50%_50%,_rgba(0,0,0,.4)_0%,_rgba(0,0,0,0)_72%)]"></div>
              {/* The mounted SVG is width:100% over a ~1184×640 viewBox (see
                  travel-map.js VB), so it takes the column's full width and
                  sets its own height from that (~1.85:1). Only a
                  pre-mount reservation here, kept under that so it can't leave
                  a dead band below the map. */}
              <div ref={V.travelMapRef} className="relative w-full overflow-hidden rounded-[14px]" style={{ minHeight: V.isMobile ? 180 : 420 }}></div>
            </div>
            {/* Desktop puts the list in its own column beside the map rather
                than floating it over the map's corner, so the rows never
                cover the arcs/labels underneath. Fixed height (20 rows scroll
                inside) and centred against the taller map column. */}
            <div className={
              V.isTablet
                ? 'bb-hscroll box-border max-h-[460px] overflow-y-auto rounded-[20px] border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.05)] pt-[18px] px-4 pb-2 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.1)]'
                : 'bb-hscroll box-border w-[248px] flex-none h-[440px] overflow-y-auto rounded-[20px] border border-[rgba(255,255,255,.14)] bg-[rgba(255,255,255,.05)] pt-[18px] px-4 pb-2 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.1)]'
            }>
              <div className="mb-1.5 flex items-center gap-[9px] font-mono text-[10.5px] font-bold text-white">
                <span className="inline-block h-0.5 w-5 flex-none bg-white"></span>{V.L.abReachCaption}
              </div>
              <div className="mb-3.5 font-mono text-[10px] leading-normal text-[rgba(255,255,255,.6)]">{V.travelNote}</div>
              <div className="flex flex-col">
                {V.travelRows.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-[11px] border-b border-[rgba(255,255,255,.1)] py-[11px]">
                    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.08)] font-mono text-[11px] font-bold text-white">{r.rank}</span>
                    <span className="min-w-0 flex-1 text-[13px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,.4)]">{r.country}</span>
                    <span className="flex-none font-mono text-[11.5px] text-[rgba(255,255,255,.7)]">{r.v}</span>
                    {r.est && <span className="flex-none rounded-full border border-[rgba(255,255,255,.2)] py-[3px] px-[7px] text-[9px] font-extrabold uppercase tracking-[.04em] text-[rgba(255,255,255,.6)]">Тооцоо</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    </section>
  );
}
