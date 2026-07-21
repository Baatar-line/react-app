/* eslint-disable @typescript-eslint/no-explicit-any */
// Big Bang — Globe (/globe): 3D country archive, mounted via the vanilla
// GlobeEngine script (see BigBangLayout.handleGlobeRef, wired via V.globeMountRef).
import { useOutletContext } from 'react-router-dom';
import { css, Hover } from '../ui';

export default function GlobePage() {
  const V: any = useOutletContext();
  return (
    <section data-screen-label="Дэлхий" style={css('position:relative;height:100vh;overflow:hidden;background:radial-gradient(120% 120% at 50% 22%, #16261c 0%, #101d15 68%, #0a1510 100%)')}>
      <div id="bb-globe-mount" ref={V.globeMountRef} style={css('position:absolute;inset:0')}></div>
      <div style={css('position:absolute;left:48px;top:104px;z-index:6;pointer-events:none')}>
        <div style={css("font-family:'Playfair Display',serif;font-style:italic;font-size:30px;color:#f6f1e7;line-height:1.05")}>{V.globeTitle}</div>
        <div style={css('font-size:12.5px;color:rgba(242,237,227,.55);margin-top:8px;max-width:250px;line-height:1.5')}>{V.globeHint}</div>
      </div>
      <div style={css('position:absolute;right:48px;top:104px;z-index:7;width:280px')}>
        <input value={V.globeQuery} onChange={V.globeOnQuery} placeholder={V.globeSearchPh} style={css('width:100%;box-sizing:border-box;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#f2ede3;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:11px 18px;outline:none;box-shadow:0 2px 10px rgba(0,0,0,.25)')} />
        {V.globeHasResults && (
          <div style={css('margin-top:8px;background:#16130e;border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.4)')}>
            {V.globeResults.map((r: any, i: number) => (
              <Hover as="button" key={i} onClick={r.pick} s="all:unset;box-sizing:border-box;cursor:pointer;display:block;width:100%;padding:10px 16px" h="background:rgba(232, 184, 75,.14)">
                <div style={css('font-size:13px;font-weight:700;color:#f2ede3')}>{r.name}</div>
                <div style={css('font-size:10.5px;color:rgba(242,237,227,.5);margin-top:2px')}>{r.region}</div>
              </Hover>
            ))}
          </div>
        )}
      </div>
      {V.globeShowHover && (
        <div style={css('position:absolute;left:50%;top:104px;transform:translateX(-50%);z-index:6;pointer-events:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;font-weight:600;color:#f2ede3;background:#16130e;padding:7px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.12);box-shadow:0 4px 14px rgba(0,0,0,.35)')}>{V.globeHover}</div>
      )}
      {V.globeHasCard && (
        <div style={css('position:absolute;right:48px;bottom:40px;z-index:8;width:250px;display:flex;flex-direction:column;gap:10px')}>
          <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:2px')}>
            <div>
              <div style={css('font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--accent,#E8B84B)')}>{V.gcSitesLabel}</div>
              <div style={css("font-family:'Playfair Display',serif;font-size:22px;color:#fbfbf8;margin-top:2px;line-height:1.1")}>{V.gcName}</div>
            </div>
            <Hover as="button" onClick={V.globeCloseCard} s="cursor:pointer;font-family:inherit;flex:none;font-size:18px;line-height:1;width:30px;height:30px;border-radius:50%;border:1px solid rgba(251,251,248,.25);background:rgba(0,0,0,.5);color:rgba(251,251,248,.75)" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">×</Hover>
          </div>
          {V.gcSites.map((s: any, i: number) => (
            <div key={i} style={css('position:relative;height:130px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);box-shadow:0 16px 40px rgba(0,0,0,.28)')}>
              <div style={{ ...css('position:absolute;inset:0;background-size:cover;background-position:center'), backgroundImage: s.cover }}></div>
              <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.12) 0%, rgba(0,0,0,0) 34%, rgba(0,0,0,.5) 72%, rgba(0,0,0,.85) 100%);pointer-events:none')}></div>
              <div style={css('position:absolute;left:11px;top:11px;display:flex;align-items:center;justify-content:center;min-width:30px;height:30px;padding:0 7px;border-radius:9px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;font-weight:700;color:#f6f1e7;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.16)')}>{s.n}</div>
              <div style={css('position:absolute;left:0;right:0;bottom:0;padding:12px 14px;pointer-events:none')}>
                <div style={css('display:flex;align-items:center;gap:5px;margin-bottom:5px')}><span style={css('font-size:11px;line-height:1;color:var(--accent,#E8B84B)')}>★</span><span style={css('font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(242,237,227,.7)')}>{s.tag}</span></div>
                <div style={css("font-family:'Playfair Display',serif;font-size:18px;font-weight:600;color:#f6f1e7;line-height:1.15;text-shadow:0 1px 8px rgba(0,0,0,.4)")}>{s.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
