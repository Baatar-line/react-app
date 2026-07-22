/* eslint-disable @typescript-eslint/no-explicit-any */
// Big Bang — Suggest (/suggest): top-rated carousel, curated collections, quick
// picks, and the travel-apps kit.
import { useOutletContext } from 'react-router-dom';
import { Plane } from 'lucide-react';
import { css, Hover, Isometric3DIcon } from '../ui';

export default function SuggestPage() {
  const V: any = useOutletContext();
  return (
    <section data-screen-label="Санал болгох" style={{ ...css('min-height:100vh;box-sizing:border-box'), padding: V.isMobile ? '96px 18px 40px' : '110px 48px 60px' }}>
      <div style={css('margin-bottom:40px')}>
        <h2 style={css('margin:0 0 14px;font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#f2ede3')}>{V.L.topRowTitle}</h2>
        {/* overflow-x:auto here forces overflow-y to compute as 'auto' too (CSS
            spec — you can't leave one axis 'visible' once the other isn't),
            so a card's hover lift (translateY(-8px) below) got clipped by the
            row's own top edge with zero padding-top to absorb it. */}
        <div className="bb-hscroll" style={css('display:flex;gap:16px;overflow-x:auto;padding-top:12px;padding-bottom:6px')}>
          {V.topItems.filter(Boolean).map((it: any, i: number) => (
            <Hover key={i} onClick={it.onClick} s="flex:0 0 220px;position:relative;aspect-ratio:4/5;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:transform .3s cubic-bezier(.22,.8,.3,1)" h="transform:translateY(-8px)">
              <div style={{ position: 'absolute', inset: 0, backgroundImage: it.thumb, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
              <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,.92) 100%)')}></div>
              <span style={css('position:absolute;top:10px;left:10px;font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);color:var(--accent,#E8B84B)')}>{it.kind}</span>
              <span style={css('position:absolute;top:10px;right:10px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);color:#f6f1e7')}>★ {it.rating}</span>
              <div style={css('position:absolute;left:12px;right:12px;bottom:12px')}>
                <div style={css('font-size:14px;font-weight:800;color:#f6f1e7;line-height:1.25')}>{it.name}</div>
                <div style={css('font-size:11.5px;color:rgba(242,237,227,.65);margin-top:2px')}>{it.sub}</div>
              </div>
            </Hover>
          ))}
        </div>
      </div>

      <div style={css('display:flex;flex-direction:column;gap:28px;margin-bottom:28px')}>
        {V.suggests.map((s: any, i: number) => (
          <Hover key={i} onClick={s.open} s={`position:relative;height:${V.isMobile ? '360' : '420'}px;border-radius:22px;overflow:hidden;cursor:pointer;transition:transform .3s ease`} h="transform:translateY(-3px)">
            {s.coverIsVideo ? (
              <video src={s.coverRawUrl} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: s.cover, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: s.scrim }}></div>
            <div style={V.isMobile
              ? { position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px 24px', boxSizing: 'border-box' }
              : { ...css('position:absolute;top:0;bottom:0;width:min(440px,46%);display:flex;flex-direction:column;justify-content:center;gap:14px;padding:0 48px;box-sizing:content-box'), left: s.textLeft, right: s.textRight }}>
              <span style={css('align-self:flex-start;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 12px;border-radius:999px;background:rgba(255,255,255,.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.25);color:rgba(242,237,227,.9)')}>{s.tag}</span>
              <div style={css('font-size:clamp(24px,2.4vw,34px);font-weight:800;letter-spacing:-0.02em;line-height:1.12;color:#f6f1e7;text-transform:uppercase')}>{s.title}</div>
              <div style={css('display:flex;flex-direction:column;gap:7px')}>
                <div style={css('display:flex;align-items:center;gap:9px;font-size:13.5px;color:rgba(242,237,227,.85)')}><span style={css('width:4px;height:4px;border-radius:50%;background:var(--accent,#E8B84B)')}></span>{s.count}</div>
                <div style={css('display:flex;align-items:center;gap:9px;font-size:13.5px;color:rgba(242,237,227,.85)')}><span style={css('width:4px;height:4px;border-radius:50%;background:var(--accent,#E8B84B)')}></span>big bang багийн сонголт</div>
              </div>
              <button onClick={s.toggle} style={{ ...css('cursor:pointer;font-family:inherit;align-self:flex-start;margin-top:4px;font-size:12.5px;font-weight:700;padding:9px 22px;border-radius:999px;transition:all .25s'), border: `1px solid ${s.saveBorder}`, background: s.saveBg, color: s.saveColor }}>{s.saveLabel}</button>
            </div>
          </Hover>
        ))}
      </div>

      {/* ── TRAVEL APPS — big card ── */}
      <div style={css('position:relative;border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:radial-gradient(120% 140% at 100% 0%, rgba(232, 184, 75,.14) 0%, rgba(0,0,0,0) 55%), linear-gradient(180deg, #17130d 0%, #120f0a 100%)')}>
        <div style={{ padding: V.isMobile ? '22px 18px 24px' : '32px 40px 34px' }}>
          <div style={css('display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:26px')}>
            <div style={css('display:flex;align-items:center;gap:16px')}>
              <Isometric3DIcon kind="travel" size={56} />
              <div>
                <span style={css('display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:4px 12px;border-radius:999px;background:rgba(232, 184, 75,.14);border:1px solid rgba(232, 184, 75,.4);color:var(--accent,#E8B84B);margin-bottom:14px')}><Plane size={12} /> {V.L.appsBadge}</span>
                <h3 style={css('margin:0;font-size:clamp(22px,2.2vw,30px);font-weight:800;letter-spacing:-0.02em;color:#f6f1e7')}>{V.L.appsTitle}</h3>
                <p style={css('margin:8px 0 0;font-size:13.5px;color:rgba(242,237,227,.6);max-width:520px;line-height:1.5')}>{V.L.appsSub}</p>
              </div>
            </div>
          </div>
          <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px')}>
            {V.travelApps.map((a: any, i: number) => (
              <Hover key={i} as="a" href={a.url} target="_blank" rel="noopener noreferrer" s="position:relative;overflow:hidden;text-decoration:none;cursor:pointer;display:flex;align-items:center;gap:15px;padding:16px 18px;border-radius:16px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.09);box-shadow:0 10px 24px rgba(0,0,0,.18);transition:transform .3s cubic-bezier(.22,.8,.3,1),background .3s ease,box-shadow .3s ease" h="transform:translateY(-4px);background:rgba(255,255,255,.065);box-shadow:0 16px 32px rgba(0,0,0,.28)">
                <div style={{ ...css('flex:none;width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.14)'), background: a.tint, border: `1px solid ${a.ring}` }}>
                  {a.logo ? <img src={a.logo} alt={a.name} style={{ width: '60%', height: '60%', objectFit: 'contain' }} /> : <a.icon size={22} />}
                </div>
                <div style={css('min-width:0')}>
                  <div style={css('font-size:14.5px;font-weight:800;color:#f6f1e7;line-height:1.2')}>{a.name}</div>
                  <div style={css('font-size:12px;color:rgba(242,237,227,.6);margin-top:3px;line-height:1.35')}>{a.purpose}</div>
                </div>
                <span style={css('margin-left:auto;flex:none;opacity:.35;font-size:15px;color:#f6f1e7;transition:opacity .25s,transform .25s')}>↗</span>
              </Hover>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
