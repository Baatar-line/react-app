'use client';

// Big Bang — Profile (/profile): favorites, accessibility settings, add-content
// cards, and the user's own submitted scenic spots / events.
import { useContext } from 'react';
import { Accessibility, Heart, Eye } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { css, Hover, Isometric3DIcon } from '@/components/bigbang/ui';

// Reusable favorite / place card (Profile page places + scenic).
function FavCard({ d }: { d: any }) {
  return (
    <Hover s="position:relative;aspect-ratio:4/5;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.1);animation:bbFadeUp .5s cubic-bezier(.22,.8,.3,1) both;transition:transform .35s cubic-bezier(.22,.8,.3,1), box-shadow .35s ease" h="transform:translateY(-5px);box-shadow:0 22px 48px rgba(0,0,0,.5)">
      <div style={{ position: 'absolute', inset: 0, backgroundImage: d.thumb, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
      <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,.32) 62%, rgba(0,0,0,.92) 100%);pointer-events:none')}></div>
      <div style={css('position:absolute;left:12px;top:12px;display:flex;gap:6px;pointer-events:none')}>
        <span style={css('font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 11px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(10px);color:rgba(246,241,231,.95)')}>{d.sub}</span>
        <span title="Тусгай хэрэгцээт хүнд ээлтэй" style={{ ...css('align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#8fd6c6;border:1px solid rgba(255,255,255,.26)'), display: d.accShow }}><Accessibility size={13} /></span>
      </div>
      <Hover as="button" onClick={d.toggleFav} s={`position:absolute;right:12px;top:12px;z-index:5;cursor:pointer;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.45);backdrop-filter:blur(10px);color:${d.heartColor};display:flex;align-items:center;justify-content:center;transition:all .2s`} h="border-color:var(--accent,#E8B84B)"><Heart size={15} fill={d.favOn ? 'currentColor' : 'none'} /></Hover>
      <div style={css('position:absolute;left:0;right:0;bottom:0;padding:16px 18px;pointer-events:none')}>
        <div style={css('display:flex;align-items:center;gap:5px;margin-bottom:8px')}><span style={css('font-size:12px;line-height:1;color:var(--accent,#E8B84B)')}>★</span><span style={css('font-size:12px;font-weight:800;line-height:1;color:#f6f1e7')}>{d.rating}</span></div>
        <div style={css('font-size:16.5px;font-weight:800;letter-spacing:-0.01em;line-height:1.2;color:#f6f1e7')}>{d.name}</div>
        <div style={css('font-size:12px;color:rgba(242,237,227,.62);margin-top:5px;line-height:1.45')}>{d.displayMeta}</div>
      </div>
    </Hover>
  );
}

export default function ProfilePage() {
  const V: any = useContext(BigBangContext);
  return (
    <section data-screen-label="Профайл" style={{ ...css('min-height:100vh;box-sizing:border-box;max-width:1080px;margin:0 auto'), padding: V.isMobile ? '96px 18px 40px' : '110px 48px 60px' }}>
      <div style={css('display:flex;align-items:center;gap:20px;padding-bottom:28px;border-bottom:1px solid rgba(255,255,255,.1)')}>
        <div style={css('width:78px;height:78px;border-radius:50%;background:linear-gradient(135deg, var(--accent,#E8B84B), #b8895a);display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;color:#132a1f;flex:none')}>Б</div>
        <div>
          <div style={css('font-size:26px;font-weight:800;letter-spacing:-0.02em;color:#f6f1e7')}>{V.L.profileName}</div>
          <div style={css('font-size:13px;color:rgba(242,237,227,.55);margin-top:4px')}>{V.L.profileMeta}</div>
        </div>
      </div>

      <div style={css('margin-top:34px')}>
        <div style={css('display:flex;align-items:center;gap:10px;margin-bottom:16px')}>
          <Heart size={16} style={{ color: 'var(--accent,#E8B84B)' }} fill="currentColor" />
          <div style={css('font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,237,227,.5)')}>{V.L.favTitle}</div>
        </div>
        <div style={css('display:flex;align-items:baseline;gap:12px;margin-bottom:14px')}>
          <h2 style={css('margin:0;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#f2ede3')}>{V.L.favPlaces}</h2>
          <span style={css('font-family:ui-monospace,Menlo,monospace;font-size:11px;color:rgba(242,237,227,.45)')}>{V.favPlaceCount} {V.L.places}</span>
        </div>
        {V.favPlacesEmpty && <div style={css('padding:22px;border:1px dashed rgba(242,237,227,.22);border-radius:14px;font-size:13px;color:rgba(242,237,227,.45)')}>{V.L.favEmpty}</div>}
        <div style={css('display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:18px;margin-top:4px')}>
          {V.favPlaces.map((fp: any, i: number) => <FavCard key={i} d={fp} />)}
        </div>

        <div style={css('display:flex;align-items:baseline;gap:12px;margin:34px 0 14px')}>
          <h2 style={css('margin:0;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#f2ede3')}>{V.L.favScenic}</h2>
          <span style={css('font-family:ui-monospace,Menlo,monospace;font-size:11px;color:rgba(242,237,227,.45)')}>{V.favScenicCount} {V.L.places}</span>
        </div>
        {V.favScenicEmpty && <div style={css('padding:22px;border:1px dashed rgba(242,237,227,.22);border-radius:14px;font-size:13px;color:rgba(242,237,227,.45)')}>{V.L.favEmptyScenic}</div>}
        <div style={css('display:grid;grid-template-columns:repeat(auto-fill, minmax(240px, 1fr));gap:18px;margin-top:4px')}>
          {V.favScenic.map((fs: any, i: number) => <FavCard key={i} d={fs} />)}
        </div>
      </div>

      <div style={css('margin-top:34px')}>
        <div style={css('font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,237,227,.5);margin-bottom:14px')}>{V.L.settings}</div>
        <div style={css('display:flex;flex-direction:column;gap:12px;max-width:560px')}>
          <button onClick={V.toggleBig} style={{ ...css('cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:14px;text-align:left;padding:16px 18px;border-radius:14px;transition:all .25s'), border: `1px solid ${V.bigCardBorder}`, background: V.bigCardBg }}>
            <Eye size={22} style={{ color: '#f2ede3' }} />
            <span style={css('flex:1')}>
              <span style={css('display:block;font-size:14px;font-weight:700;color:#f2ede3')}>{V.L.a11yEyeTitle}</span>
              <span style={css('display:block;font-size:12px;color:rgba(242,237,227,.55);margin-top:3px')}>{V.L.a11yEyeSub}</span>
            </span>
            <span style={{ ...css('width:46px;height:26px;border-radius:999px;position:relative;flex:none;transition:background .25s'), background: V.bigSwBg }}><span style={{ ...css('position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s'), left: V.bigSwKnob }}></span></span>
          </button>
          <button onClick={V.toggleSp} style={{ ...css('cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:14px;text-align:left;padding:16px 18px;border-radius:14px;transition:all .25s'), border: `1px solid ${V.spCardBorder}`, background: V.spCardBg }}>
            <Accessibility size={22} style={{ color: '#8fd6c6' }} />
            <span style={css('flex:1')}>
              <span style={css('display:block;font-size:14px;font-weight:700;color:#f2ede3')}>{V.L.a11yWheelTitle}</span>
              <span style={css('display:block;font-size:12px;color:rgba(242,237,227,.55);margin-top:3px')}>{V.L.a11yWheelSub}</span>
            </span>
            <span style={{ ...css('width:46px;height:26px;border-radius:999px;position:relative;flex:none;transition:background .25s'), background: V.spSwBg }}><span style={{ ...css('position:absolute;top:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:left .25s'), left: V.spSwKnob }}></span></span>
          </button>
        </div>
      </div>

      <div style={css('margin-top:38px')}>
        <div style={css('font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,237,227,.5);margin-bottom:14px')}>{V.L.addContent}</div>
        {/* Adding a place is host/admin business content (see HostProfile / AdminPanel) —
            regular users here can only contribute scenic spots and events. */}
        <div style={css('display:grid;grid-template-columns:repeat(2, 1fr);gap:14px')}>
          {[
            { icon3d: 'scenic' as const, title: V.L.addScenicTitle, desc: V.L.addScenicDesc, onClick: V.openScenicForm },
            { icon3d: 'event' as const, title: V.L.addEventTitle, desc: V.L.addEventDesc, onClick: V.openEventForm },
          ].map((c, i) => (
            <Hover as="button" key={i} onClick={c.onClick} s="cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left;padding:20px;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.03);transition:all .25s" h="border-color:var(--accent,#E8B84B);transform:translateY(-3px)">
              <Isometric3DIcon kind={c.icon3d} />
              <span style={css('font-size:15px;font-weight:800;color:#f6f1e7')}>{c.title}</span>
              <span style={css('font-size:12px;color:rgba(242,237,227,.5);line-height:1.4')}>{c.desc}</span>
            </Hover>
          ))}
        </div>
      </div>

      {V.hasMyScenic && (
        <div style={css('margin-top:38px')}>
          <div style={css('font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,237,227,.5);margin-bottom:14px')}>{V.L.myScenicTitle}</div>
          <div style={css('display:grid;grid-template-columns:repeat(3, 1fr);gap:14px')}>
            {V.myScenicItems.map((s: any, i: number) => (
              <div key={i} style={css('border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.03)')}>
                <div style={{ ...css('aspect-ratio:16/10;background-size:cover;background-position:center'), background: s.thumb }}></div>
                <div style={css('padding:12px 14px 14px')}>
                  <div style={css('font-size:14px;font-weight:800;color:#f6f1e7')}>{s.name}</div>
                  <div style={css('font-size:11.5px;color:rgba(242,237,227,.5);margin-top:3px')}>{s.aimag} · {s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {V.hasMyEvents && (
        <div style={css('margin-top:38px')}>
          <div style={css('font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,237,227,.5);margin-bottom:14px')}>{V.L.myEventsTitle}</div>
          <div style={css('display:flex;flex-direction:column;gap:12px;max-width:640px')}>
            {V.myEventItems.map((ev: any, i: number) => (
              <div key={i} style={css('display:flex;align-items:center;gap:16px;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.03)')}>
                <div style={css('display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:54px;height:54px;border-radius:11px;border:1px solid rgba(232, 184, 75,.4);background:rgba(232, 184, 75,.08)')}>
                  <span style={css('font-size:17px;font-weight:800;color:var(--accent,#E8B84B);line-height:1')}>{ev.day}</span>
                  <span style={css('font-size:9px;font-weight:600;color:rgba(242,237,227,.55);margin-top:2px')}>{ev.mon}</span>
                </div>
                <div style={css('flex:1;min-width:0')}>
                  <div style={css('font-size:14px;font-weight:800;color:#f6f1e7')}>{ev.name}</div>
                  <div style={css('font-size:12px;color:rgba(242,237,227,.55);margin-top:3px')}>{ev.meta}</div>
                </div>
                <span style={css('font-size:10.5px;font-weight:700;padding:4px 11px;border-radius:999px;background:rgba(255,255,255,.07);color:rgba(242,237,227,.7);white-space:nowrap')}>{ev.tag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
