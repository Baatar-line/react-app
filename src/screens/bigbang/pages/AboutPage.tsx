/* eslint-disable @typescript-eslint/no-explicit-any */
// Big Bang — About (/about): mission timeline, team, and the tourist-flow chart.
import { useOutletContext } from 'react-router-dom';
import { css } from '../ui';
import LanyardBadge from '../LanyardBadge';

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
  const V: any = useOutletContext();
  return (
    <section data-screen-label="Бидний тухай" style={css("min-height:100vh;box-sizing:border-box;background:radial-gradient(120% 60% at 12% 0%, rgba(232, 184, 75,.12) 0%, rgba(0,0,0,0) 55%), radial-gradient(100% 55% at 100% 25%, rgba(120,170,255,.07) 0%, rgba(0,0,0,0) 60%), #0b0a08")}>
      {/* full-bleed hero board — large background photo + vertical icon timeline,
          inspired by the "Eiger Trail" style infographic layout. Edge-to-edge like the
          Home hero, with the fixed site nav floating over it via its own fade-gradient. */}
      <div style={css('position:relative;overflow:hidden')}>
        {V.abHeroIsVideo ? (
          <video src={V.abHeroRawUrl} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.05)' } as any} />
        ) : (
          <div style={{ ...css('position:absolute;inset:0;background-size:cover;background-position:center top;filter:saturate(1.05)'), background: V.abHeroFullBg }}></div>
        )}
        <div style={css('position:absolute;inset:0;background:linear-gradient(100deg, rgba(0,0,0,.88) 0%, rgba(0,0,0,.6) 34%, rgba(0,0,0,.16) 62%, rgba(0,0,0,.4) 100%)')}></div>
        <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.08) 14%, rgba(0,0,0,.08) 44%, rgba(0,0,0,.42) 60%, rgba(0,0,0,.85) 100%)')}></div>

        <div style={css('position:relative;z-index:2;text-align:center;padding:104px 20px 0')}>
          <h1 style={css("margin:0;font-family:'Playfair Display',serif;font-weight:800;font-size:clamp(30px,4.4vw,54px);line-height:1.14;color:#f6f1e7;text-shadow:0 4px 30px rgba(0,0,0,.45)")}>{V.L.abBig}<br />{V.L.abBang}</h1>
        </div>

        <div style={css('position:relative;z-index:2;max-width:640px;margin:0 auto;padding:56px 28px 64px')}>
          <div>
            {/* icon and label both sit flush at the row's top, in the same 40px
                band, so their centers line up; the connector is one stub below
                each icon (not a line running behind it) reaching down to the next */}
            {V.abTimeline.map((row: any, i: number) => (
              <div key={i} style={css('display:flex;gap:16px')}>
                <div style={css('display:flex;flex-direction:column;align-items:center;width:40px;flex:none')}>
                  <span style={css('flex:none;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#f2ede3;background:transparent;border:1px solid rgba(242,237,227,.32)')}><row.icon size={17} /></span>
                  <div style={{ width: '1px', flexGrow: i === V.abTimeline.length - 1 ? 0 : 1, flexShrink: 0, flexBasis: 0, background: 'rgba(242,237,227,.28)' }}></div>
                </div>
                <div style={css('flex:1;padding-bottom:32px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px')}>
                  <div style={css('flex:1')}>
                    <div style={css('min-height:40px;display:flex;align-items:center')}>
                      <div style={css('font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--accent,#E8B84B)')}>{row.label}</div>
                    </div>
                    <div style={css('font-size:14px;line-height:1.65;color:#f2ede3;max-width:380px;margin-top:6px')}>{row.desc}</div>
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
                    <div style={{ writingMode: 'vertical-lr', whiteSpace: 'pre', fontFamily: "'Mongolian Baiti','Menksoft Tigst',sans-serif", fontSize: 16, lineHeight: 1.25, flex: 'none', maxWidth: 300 } as any} title="Уламжлалт бичиг — AI орчуулга, шалгагдаагvй">
                      {row.vert && <span style={{ color: 'var(--accent,#E8B84B)', fontWeight: 700 }}>{row.vert}</span>}
                      {row.descVert && <span style={{ color: 'rgba(242,237,227,.5)' }}>{row.vert ? '\n' : ''}{mnVertLines(row.descVert)}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={css('position:relative;z-index:2;max-width:1100px;margin:0 auto;padding:0 28px 48px')}>
          <div style={css('display:flex;align-items:baseline;gap:12px;margin-bottom:20px')}>
            <h2 style={css('margin:0;font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#f6f1e7')}>{V.L.abTeamT}</h2>
            <span style={css('font-family:ui-monospace,Menlo,monospace;font-size:11px;color:rgba(242,237,227,.5)')}>06</span>
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
          <div style={css('display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:32px;padding-top:8px;min-height:300px')}>
            {V.team.map((tm: any, i: number) => (
              <LanyardBadge key={i} large letter={tm.initial} name={tm.name} role={tm.role} color={tm.avatarBg} />
            ))}
          </div>
        </div>

      <div style={{ ...css('position:relative;z-index:2;max-width:1200px;margin:0 auto'), padding: V.isMobile ? '20px 18px 60px' : '20px 48px 96px' }}>
        <div style={css('color:#f6f1e7')}>
          <div style={css('display:flex;align-items:center;gap:8px;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:rgba(242,237,227,.4);margin-bottom:14px')}><span style={css('width:6px;height:6px;border-radius:50%;background:#e2685c;flex:none')}></span>[ {V.travelEyebrow} ]</div>
          <div style={css('margin-bottom:24px')}>
            <div style={css("font-family:'Playfair Display',serif;font-style:italic;font-size:32px;line-height:1.05;color:#f6f1e7")}>{V.travelTitle}</div>
            <div style={css('font-size:13px;color:rgba(242,237,227,.6);margin-top:10px;max-width:520px;line-height:1.5')}>{V.travelSub}</div>
          </div>
          <div style={css(V.isTablet ? 'display:flex;flex-direction:column;gap:24px' : 'display:grid;grid-template-columns:2.1fr 0.8fr;gap:24px;align-items:start')}>
            <div style={css('position:relative;border-radius:20px;overflow:hidden')}>
              <div style={css('position:absolute;inset:-10%;background:radial-gradient(60% 60% at 50% 50%, rgba(0,0,0,.4) 0%, rgba(0,0,0,0) 72%)')}></div>
              <div ref={V.travelMapRef} style={{ ...css('position:relative;width:100%;border-radius:14px;overflow:hidden'), minHeight: V.isMobile ? 280 : 440 }}></div>
            </div>
            <div className="bb-hscroll" style={css('border:1px solid rgba(255,255,255,.14);border-radius:20px;background:rgba(255,255,255,.05);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);box-shadow:0 12px 28px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.1);padding:18px 16px 8px;max-height:460px;overflow-y:auto;box-sizing:border-box')}>
              <div style={css('display:flex;align-items:center;gap:9px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10.5px;color:#fff;font-weight:700;margin-bottom:6px')}>
                <span style={css('width:20px;height:2px;background:#fff;display:inline-block;flex:none')}></span>{V.L.abReachCaption}
              </div>
              <div style={css('font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:rgba(255,255,255,.6);margin-bottom:14px;line-height:1.5')}>{V.travelNote}</div>
              <div style={css('display:flex;flex-direction:column')}>
                {V.travelRows.map((r: any, i: number) => (
                  <div key={i} style={css('display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.1)')}>
                    <span style={css('flex:none;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#fff;font-weight:700')}>{r.rank}</span>
                    <span style={css('font-size:13px;font-weight:700;color:#fff;flex:1;min-width:0;text-shadow:0 1px 3px rgba(0,0,0,.4)')}>{r.country}</span>
                    <span style={css('font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;color:rgba(255,255,255,.7);flex:none')}>{r.v}</span>
                    {r.est && <span style={css('flex:none;font-size:9px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;padding:3px 7px;border-radius:999px;border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.6)')}>Тооцоо</span>}
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
