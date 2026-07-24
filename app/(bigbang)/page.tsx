'use client';

// Big Bang — Home (/): category nav list + aimag hero picker + preview cards.
import React, { useContext } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';

export default function Home() {
  const V: any = useContext(BigBangContext);
  return (
    <section
      data-screen-label="Нүүр — ангилал хайлт"
      className={`relative bg-ink ${V.isMobile ? 'min-h-screen' : 'h-screen overflow-hidden'}`}
    >
      {V.homeBgIsVideo ? (
        <>
          <video src={V.homeBgRawUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.5),_rgba(0,0,0,.72))]"></div>
        </>
      ) : (
        <div className="absolute inset-0 bg-cover bg-center [animation:var(--drift,none)]" style={{ backgroundImage: V.homeHeroBg }}></div>
      )}
      {V.aimagBgIsVideo ? (
        <>
          <video
            src={V.aimagBgRawUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[550ms] ease-in-out"
            style={{ opacity: V.aimagBgOpacity }}
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.58),_rgba(0,0,0,.78))] transition-opacity duration-[550ms] ease-in-out"
            style={{ opacity: V.aimagBgOpacity }}
          ></div>
        </>
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[550ms] ease-in-out [animation:var(--drift,none)]"
          style={{ backgroundImage: V.aimagBg, opacity: V.aimagBgOpacity }}
        ></div>
      )}
      {V.bgLayers.map((layer: any, i: number) => (
        layer.isVideo ? (
          // Only mounted while this category is actually the hovered one —
          // rendering (and autoplaying) all 7 videos at once regardless of
          // opacity was decoding every category's clip simultaneously in
          // the background, which is what was causing the stutter.
          layer.opacity === 1 ? (
            <React.Fragment key={i}>
              <video src={layer.rawUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.58),_rgba(0,0,0,.78))]"></div>
            </React.Fragment>
          ) : null
        ) : (
          <div
            key={i}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-[550ms] ease-in-out [animation:var(--drift,none)]"
            style={{ backgroundImage: layer.bg, opacity: layer.opacity }}
          ></div>
        )
      ))}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,_rgba(0,0,0,0)_45%,_rgba(0,0,0,.55)_100%),_linear-gradient(90deg,_rgba(0,0,0,.88)_0%,_rgba(0,0,0,.35)_45%,_rgba(0,0,0,0)_72%)]"></div>

      <div
        onMouseLeave={V.clearActive}
        className={V.isMobile
          ? 'relative z-10 flex flex-col gap-[2px] pt-24 px-5 pb-10'
          : 'absolute left-12 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-[2px]'}
      >
        <div className="mb-3 font-mono text-[10.5px] uppercase tracking-[.2em] text-[rgba(242,237,227,.4)]">{V.L.catLabel}</div>
        {V.navCats.map((c: any, i: number) => (
          <button
            key={i}
            onClick={c.open}
            onMouseEnter={c.activate}
            onFocus={c.activate}
            className="[all:unset] flex cursor-pointer items-center gap-[14px] px-0 py-2 transition-[transform_.4s_cubic-bezier(.22,.8,.3,1),_color_.3s_ease]"
            style={{ color: c.color, transform: V.isMobile ? 'none' : c.shift }}
          >
            <span className="font-mono text-[10.5px] opacity-50">{c.num}</span>
            <span className="text-[clamp(14px,1.1vw,18px)] font-bold leading-[1.3] tracking-[-0.01em]">{c.name}</span>
            <span className="text-[11px] font-extrabold text-[var(--accent,#E8B84B)]">{c.count}</span>
            {!V.isMobile && (
              <span
                className="inline-block h-[2px] w-8 bg-[var(--accent,#E8B84B)] transition-opacity duration-[300ms] ease-in-out"
                style={{ opacity: c.barOpacity }}
              ></span>
            )}
          </button>
        ))}
        <div className="mt-[18px] text-[12px] text-[rgba(242,237,227,.38)]">{V.L.hint}</div>
      </div>

      {/* map picker + preview cards — the absolute side-by-side hero
          layout doesn't fit a phone screen, so both stay desktop/tablet
          only for now; the category list above already covers browsing
          and picking a category on mobile without them. */}
      {!V.isMobile && (
        <>
          <div className="absolute left-[30%] right-[30px] top-25 bottom-[150px] z-[6] flex flex-col gap-[10px]">
            <div ref={V.pickerWrapRef} className="relative min-h-0 flex-1">
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

          <div className="absolute right-12 bottom-11 z-10 flex items-end gap-[14px]">{V.previewCards}</div>
        </>
      )}
    </section>
  );
}
