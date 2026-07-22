'use client';

// Big Bang — Home (/): category nav list + aimag hero picker + preview cards.
import React, { useContext } from 'react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { css } from '@/components/bigbang/ui';

export default function Home() {
  const V: any = useContext(BigBangContext);
  return (
    <section data-screen-label="Нүүр — ангилал хайлт" style={css(`position:relative;${V.isMobile ? 'min-height:100vh' : 'height:100vh;overflow:hidden'};background:#0b0a08`)}>
      {V.homeBgIsVideo ? (
        <>
          <video src={V.homeBgRawUrl} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.72))' }}></div>
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: V.homeHeroBg, backgroundSize: 'cover', backgroundPosition: 'center', animation: 'var(--drift, none)' }}></div>
      )}
      {V.aimagBgIsVideo ? (
        <>
          <video src={V.aimagBgRawUrl} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: V.aimagBgOpacity, transition: 'opacity .55s ease' } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,.58), rgba(0,0,0,.78))', opacity: V.aimagBgOpacity, transition: 'opacity .55s ease' }}></div>
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: V.aimagBg, backgroundSize: 'cover', backgroundPosition: 'center', opacity: V.aimagBgOpacity, transition: 'opacity .55s ease', animation: 'var(--drift, none)' }}></div>
      )}
      {V.bgLayers.map((layer: any, i: number) => (
        layer.isVideo ? (
          // Only mounted while this category is actually the hovered one —
          // rendering (and autoplaying) all 7 videos at once regardless of
          // opacity was decoding every category's clip simultaneously in
          // the background, which is what was causing the stutter.
          layer.opacity === 1 ? (
            <React.Fragment key={i}>
              <video src={layer.rawUrl} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,.58), rgba(0,0,0,.78))' }}></div>
            </React.Fragment>
          ) : null
        ) : (
          <div key={i} style={{ position: 'absolute', inset: 0, backgroundImage: layer.bg, backgroundSize: 'cover', backgroundPosition: 'center', opacity: layer.opacity, transition: 'opacity .55s ease', animation: 'var(--drift, none)' }}></div>
        )
      ))}
      <div style={css('position:absolute;inset:0;background:radial-gradient(120% 100% at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%), linear-gradient(90deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.35) 45%, rgba(0,0,0,0) 72%);pointer-events:none')}></div>

      <div onMouseLeave={V.clearActive} style={V.isMobile
        ? css('position:relative;z-index:10;display:flex;flex-direction:column;gap:2px;padding:96px 20px 40px')
        : css('position:absolute;left:48px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:2px;z-index:10')}>
        <div style={css('font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:rgba(242,237,227,.4);margin-bottom:12px')}>{V.L.catLabel}</div>
        {V.navCats.map((c: any, i: number) => (
          <button key={i} onClick={c.open} onMouseEnter={c.activate} onFocus={c.activate} style={{ ...css('all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;padding:8px 0'), color: c.color, transform: V.isMobile ? 'none' : c.shift, transition: 'transform .4s cubic-bezier(.22,.8,.3,1), color .3s ease' }}>
            <span style={css('font-family:ui-monospace,Menlo,monospace;font-size:10.5px;opacity:.5')}>{c.num}</span>
            <span style={css('font-size:clamp(14px,1.1vw,18px);font-weight:700;letter-spacing:-0.01em;line-height:1.3')}>{c.name}</span>
            <span style={css('font-size:11px;font-weight:800;color:var(--accent,#E8B84B)')}>{c.count}</span>
            {!V.isMobile && <span style={{ display: 'inline-block', width: '32px', height: '2px', background: 'var(--accent,#E8B84B)', opacity: c.barOpacity, transition: 'opacity .3s' }}></span>}
          </button>
        ))}
        <div style={css('margin-top:18px;font-size:12px;color:rgba(242,237,227,.38)')}>{V.L.hint}</div>
      </div>

      {/* map picker + preview cards — the absolute side-by-side hero
          layout doesn't fit a phone screen, so both stay desktop/tablet
          only for now; the category list above already covers browsing
          and picking a category on mobile without them. */}
      {!V.isMobile && (
        <>
          <div style={css('position:absolute;left:30%;right:30px;top:100px;bottom:150px;z-index:6;display:flex;flex-direction:column;gap:10px')}>
            <div ref={V.pickerWrapRef} style={css('position:relative;flex:1;min-height:0')}>
              {V.pickerSvg}
              {V.heroVertLabel && V.heroVertPos && (
                <div style={{
                  position: 'absolute', left: V.heroVertPos.left, top: V.heroVertPos.top - 10, zIndex: 6, pointerEvents: 'none',
                  writingMode: 'vertical-lr', fontFamily: "'Mongolian Baiti','Menksoft Tigst',sans-serif",
                  fontSize: 16, color: 'var(--accent,#E8B84B)', textShadow: '0 1px 4px rgba(6,9,14,.8), 0 0 2px rgba(6,9,14,.8)',
                } as any} title="Уламжлалт бичиг — AI орчуулга, шалгагдаагvй">{V.heroVertLabel}</div>
              )}
            </div>
          </div>

          <div style={css('position:absolute;right:48px;bottom:44px;display:flex;gap:14px;z-index:10;align-items:flex-end')}>{V.previewCards}</div>
        </>
      )}
    </section>
  );
}
