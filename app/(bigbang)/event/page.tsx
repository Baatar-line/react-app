'use client';

// Big Bang — Event (/event).
import { useContext } from 'react';
import { Users } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { css, Hover } from '@/components/bigbang/ui';

export default function EventPage() {
  const V: any = useContext(BigBangContext);
  return (
    <section data-screen-label="Эвент" style={{ ...css('min-height:100vh;box-sizing:border-box'), padding: V.isMobile ? '96px 18px 32px' : '110px 48px 40px' }}>
      <div style={{ ...css('position:relative;border-radius:18px;overflow:hidden;margin-bottom:30px;cursor:pointer'), height: V.isMobile ? 260 : 420 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: V.fevBg, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.85) 100%)')}></div>
        <span style={css('position:absolute;left:22px;top:20px;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:6px 14px;border-radius:999px;background:var(--accent,#E8B84B);color:#132a1f')}>{V.L.featured}</span>
        <div style={css('position:absolute;left:22px;right:22px;bottom:22px')}>
          <div style={css('font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--accent,#E8B84B)')}>{V.fevDate}</div>
          <div style={css('font-size:30px;font-weight:800;letter-spacing:-0.02em;color:#f2ede3;margin-top:4px')}>{V.fevName}</div>
          <div style={css('font-size:13.5px;color:rgba(242,237,227,.65);margin-top:4px')}>{V.fevMeta}</div>
        </div>
      </div>
      <div style={{ ...css('display:grid;gap:18px'), gridTemplateColumns: V.isMobile ? '1fr' : 'repeat(4, 1fr)' }}>
        {V.events.map((ev: any, i: number) => (
          <Hover key={i} s="position:relative;aspect-ratio:677/525;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,.6);cursor:pointer;transition:transform .35s cubic-bezier(.22,.8,.3,1), box-shadow .35s ease;animation:bbFadeUp .5s cubic-bezier(.22,.8,.3,1) both" h="transform:translateY(-5px);box-shadow:0 22px 48px rgba(0,0,0,.5)">
            <div style={{ position: 'absolute', inset: 0, backgroundImage: ev.thumb, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'transform .6s cubic-bezier(.22,.8,.3,1)' }}></div>
            <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,.5) 55%, rgba(0,0,0,.96) 100%);pointer-events:none')}></div>
            <div style={css('position:absolute;left:12px;top:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:52px;height:52px;border-radius:11px;border:1px solid rgba(232, 184, 75,.45);background:rgba(0,0,0,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)')}>
              <span style={css('font-size:18px;font-weight:800;color:var(--accent,#E8B84B);line-height:1')}>{ev.day}</span>
              <span style={css('font-size:9px;font-weight:600;color:rgba(242,237,227,.7);margin-top:2px')}>{ev.mon}</span>
            </div>
            <span style={css('position:absolute;right:12px;top:12px;font-size:10px;font-weight:700;letter-spacing:.04em;padding:4px 11px;border-radius:999px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:rgba(242,237,227,.9);border:1px solid rgba(255,255,255,.2)')}>{ev.tag}</span>
            <div style={css('position:absolute;left:0;right:0;bottom:0;padding:16px 16px 18px')}>
              <div style={css('font-size:16px;font-weight:800;letter-spacing:-0.01em;color:#f6f1e7;line-height:1.25;pointer-events:none')}>{ev.name}</div>
              <div style={css('font-size:12px;color:rgba(242,237,227,.6);margin-top:5px;pointer-events:none')}>{ev.meta}</div>
              <button onClick={ev.toggleJoin} style={{ ...css('cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;margin-top:12px;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;transition:all .25s'), border: `1px solid ${ev.joinBorder}`, background: ev.joinBg, color: ev.joinColor }}><Users size={13} />{ev.joinLabel}</button>
            </div>
          </Hover>
        ))}
      </div>
    </section>
  );
}
