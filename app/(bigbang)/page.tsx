'use client';

// Big Bang — Home (/): category nav list + aimag hero picker + preview cards.
import React, { useContext } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia } from '@/components/bigbang/ui';

export default function Home() {
  const V: any = useContext(BigBangContext);
  return (
    <section
      data-screen-label="Нүүр — ангилал хайлт"
      className={`relative bg-ink ${V.isTablet ? 'min-h-screen' : 'h-screen overflow-hidden'}`}
    >
      <BgMedia
        bg={V.homeHeroBg} isVideo={V.homeBgIsVideo} videoSrc={V.homeBgRawUrl}
        className="absolute inset-0" imgClassName="bg-cover bg-center [animation:var(--drift,none)]"
      />
      {/* Aimag hero — the picked aimag's photo/video crossfades in over the
          Home hero above; while it's still loading, a skeleton shows through
          the same fade instead of the flat black scrim (see aimagBgLoading). */}
      {V.aimagBgLoading && <div className="absolute inset-0 bb-skeleton" />}
      <BgMedia
        bg={V.aimagBg} isVideo={V.aimagBgIsVideo} videoSrc={V.aimagBgRawUrl}
        className="absolute inset-0 transition-opacity duration-[550ms] ease-in-out" imgClassName="bg-cover bg-center [animation:var(--drift,none)]"
        style={{ opacity: V.aimagBgOpacity }}
      />
      {/* Category hover/selection preview — always a still photo, even for a
          category with an uploaded background video (that only plays once
          you're inside the category's own page). */}
      {V.bgLayers.map((layer: any, i: number) => (
        <BgMedia
          key={i} bg={layer.bg}
          className="absolute inset-0 transition-opacity duration-[550ms] ease-in-out" imgClassName="bg-cover bg-center [animation:var(--drift,none)]"
          style={{ opacity: layer.opacity }}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,_rgba(0,0,0,0)_45%,_rgba(0,0,0,.55)_100%),_linear-gradient(90deg,_rgba(0,0,0,.88)_0%,_rgba(0,0,0,.35)_45%,_rgba(0,0,0,0)_72%)]"></div>

      <div
        onMouseLeave={V.clearActive}
        className={V.isTablet
          ? 'relative z-10 flex flex-col items-center gap-3 pt-24 px-5 pb-10 text-center'
          : 'absolute left-12 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-[2px]'}
      >
        <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[.2em] text-[rgba(242,237,227,.4)]">{V.L.catLabel}</div>
        {/* Mobile: a centered, wrapping horizontal row instead of the
            desktop's left-pinned vertical stack — `contents` on desktop so
            this wrapper doesn't add an extra flex item to the outer column. */}
        <div className={V.isTablet ? 'flex flex-wrap items-center justify-center gap-x-5 gap-y-2' : 'contents'}>
          {V.navCats.map((c: any, i: number) => (
            <button
              key={i}
              onClick={c.open}
              onMouseEnter={c.activate}
              onFocus={c.activate}
              className="flex cursor-pointer items-center gap-[14px] border-0 bg-transparent px-0 py-2 text-left transition-[transform_.4s_cubic-bezier(.22,.8,.3,1),_color_.3s_ease]"
              style={{ color: c.color, transform: V.isTablet ? 'none' : c.shift }}
            >
              <span className="font-mono text-[10.5px] opacity-50">{c.num}</span>
              <span className="text-[clamp(14px,1.1vw,18px)] font-bold leading-[1.3] tracking-[-0.01em]">{c.name}</span>
              <span className="text-[11px] font-extrabold text-[var(--accent,#E8B84B)]">{c.count}</span>
              {!V.isTablet && (
                <span
                  className="inline-block h-[2px] w-8 bg-[var(--accent,#E8B84B)] transition-opacity duration-[300ms] ease-in-out"
                  style={{ opacity: c.barOpacity }}
                ></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* map picker + preview cards — the absolute side-by-side hero
          layout doesn't fit a phone screen, so both stay desktop/tablet
          only for now; the category list above already covers browsing
          and picking a category on mobile without them. */}
      {!V.isTablet && (
        <>
          {/* top/bottom shifted together (not just top) so nudging the map
              down the page doesn't also squash the picker's height. */}
          <div className="absolute left-[30%] right-[30px] top-[136px] bottom-[114px] z-[6]">
            <div ref={V.pickerWrapRef} className="relative h-full">
              {V.pickerSvg}
              {V.heroVertLabel && V.heroVertPos && (
                <div
                  className="absolute z-[6] pointer-events-none [writing-mode:vertical-lr] font-[Mongolian_Baiti,Menksoft_Tigst,sans-serif] text-[16px] text-[var(--accent,#E8B84B)] [text-shadow:0_1px_4px_rgba(6,9,14,.8),_0_0_2px_rgba(6,9,14,.8)]"
                  style={{ left: V.heroVertPos.left, top: V.heroVertPos.top - 10 }}
                  title="Уламжлалт бичиг — AI орчуулга, шалгагдаагvй"
                >{V.heroVertLabel}</div>
              )}
            </div>
          </div>

          {/* Sits in the otherwise-empty background above the map's
              right edge — the spot the map itself doesn't reach. */}
          <div className="absolute right-[80px] top-[110px] z-[7] max-w-[240px] text-right text-[12px] text-[rgba(242,237,227,.45)]">{V.L.mapHint}</div>

          <div className="absolute right-12 bottom-11 z-10 flex items-end gap-[14px]">{V.previewCards}</div>
        </>
      )}
    </section>
  );
}
