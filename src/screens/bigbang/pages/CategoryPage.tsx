/* eslint-disable @typescript-eslint/no-explicit-any */
// Big Bang — Category grid (/category/:slug).
import React from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Accessibility, Heart } from 'lucide-react';
import { css, Hover } from '../ui';
import { CATS, ratingOf, isAccessible, thumbOf, catBgOf, aimagName, isVideoUrl, U } from '../data';

export default function CategoryPage() {
  const V: any = useOutletContext();
  const navigate = useNavigate();
  const { slug } = useParams();
  const [sub, setSub] = React.useState('Бүгд');

  React.useEffect(() => { setSub('Бүгд'); }, [slug]);

  const cat = CATS.find((c) => c.slug === slug) || CATS[0];
  const accent = V.accent;
  const L = V.L;

  const chips = (['Бүгд'] as string[]).concat(cat.subs).map((label) => {
    const on = sub === label;
    return { label: label === 'Бүгд' ? L.all : label, on: () => setSub(label), bg: on ? accent : 'transparent', color: on ? '#132a1f' : 'rgba(242,237,227,.75)', border: on ? accent : 'rgba(242,237,227,.22)' };
  });

  const gridItems = cat.items
    .filter((it) => (sub === 'Бүгд' || it.sub === sub) && (V.aimag === 'Бүгд' || (it.aimag || 'Улаанбаатар') === V.aimag))
    .map((it, i) => {
      const key = 'p:' + cat.slug + ':' + it.name;
      const acc = isAccessible(it.name);
      return {
        ...it, rating: ratingOf(it.name), access: acc, accShow: acc ? 'flex' : 'none',
        openPlace: () => { navigate('/category/' + cat.slug + '/place/' + i); try { window.scrollTo(0, 0); } catch (err) { /* ignore */ } },
        toggleFav: V.toggleFav(key), favOn: !!V.favs[key], heartColor: V.favs[key] ? accent : 'rgba(242,237,227,.9)',
        thumb: i === 0 ? ('linear-gradient(rgba(0,0,0,.06), rgba(0,0,0,.18)), url("' + U('1500534623283-312aade485b7', 640) + '")') : thumbOf(cat, i).replace('rgba(0,0,0,.12)', 'rgba(0,0,0,.05)').replace('rgba(0,0,0,.42)', 'rgba(0,0,0,.15)'),
        displayMeta: it.meta + ' · ' + aimagName(it.aimag || 'Улаанбаатар', V.lang),
      };
    })
    .sort((a, b) => { if (V.spNeeds && a.access !== b.access) return a.access ? -1 : 1; return +b.rating - +a.rating; });

  const catBgOverride = V.catBgOverride[cat.slug] || '';

  return (
    <section data-screen-label="Ангиллын дэлгэрэнгүй">
      <header style={css('position:relative;height:52vh;min-height:380px;overflow:hidden;display:flex;align-items:flex-end')}>
        {isVideoUrl(catBgOverride) ? (
          <>
            <video src={catBgOverride} autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,.58), rgba(0,0,0,.78))' }}></div>
          </>
        ) : (
          <div style={{ ...css('position:absolute;inset:0;background-size:cover;background-position:center'), background: catBgOf(cat, catBgOverride), animation: 'var(--drift, none)' }}></div>
        )}
        <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.4) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,.94) 100%)')}></div>
        <div style={{ ...css('position:relative;z-index:5;width:100%;box-sizing:border-box'), padding: V.isMobile ? '0 20px 28px' : '0 48px 40px' }}>
          <Hover as="button" onClick={V.goHome} s="all:unset;cursor:pointer;font-size:13px;font-weight:600;color:rgba(242,237,227,.6);transition:color .25s" h="color:var(--accent,#E8B84B)">{L.back}</Hover>
          <div style={css('display:flex;align-items:baseline;gap:20px;flex-wrap:wrap;margin-top:14px')}>
            <h1 style={css('margin:0;font-size:clamp(38px,9vw,92px);font-weight:800;letter-spacing:-0.04em;line-height:1;color:#f2ede3')}>{V.lang === 'en' ? cat.nameEn : cat.name}</h1>
            <span style={css('font-family:ui-monospace,Menlo,monospace;font-size:12px;color:rgba(242,237,227,.5)')}>{gridItems.length} {L.places}</span>
          </div>
          <p style={css('margin:12px 0 0;font-size:15px;color:rgba(242,237,227,.6);max-width:520px')}>{V.lang === 'en' ? cat.descEn : cat.desc}</p>
        </div>
      </header>
      <div style={{ ...css('display:flex;gap:10px;flex-wrap:wrap'), padding: V.isMobile ? '20px 20px 8px' : '28px 48px 8px' }}>
        {chips.map((ch: any, i: number) => (
          <button key={i} onClick={ch.on} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;padding:6px 13px;border-radius:999px;transition:all .25s'), border: `1px solid ${ch.border}`, background: ch.bg, color: ch.color }}>{ch.label}</button>
        ))}
      </div>
      <div style={{ ...css('display:grid;grid-template-columns:repeat(auto-fill, minmax(270px, 1fr));gap:22px'), padding: V.isMobile ? '20px 20px 32px' : '26px 48px 40px' }}>
        {gridItems.map((it: any, i: number) => (
          <Hover key={i} onClick={it.openPlace} s="position:relative;aspect-ratio:677/525;border-radius:18px;overflow:hidden;border:1px solid rgba(0,0,0,.6);animation:bbFadeUp .5s cubic-bezier(.22,.8,.3,1) both;cursor:pointer;transition:transform .35s cubic-bezier(.22,.8,.3,1), box-shadow .35s ease" h="transform:translateY(-5px);box-shadow:0 22px 48px rgba(0,0,0,.5)">
            <div style={{ position: 'absolute', inset: 0, backgroundImage: it.thumb, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'transform .6s cubic-bezier(.22,.8,.3,1)' }}></div>
            <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,.4) 50%, rgba(0,0,0,.99) 100%);pointer-events:none')}></div>
            <div style={css('position:absolute;inset:0;background:radial-gradient(120% 90% at 0% 0%, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 45%), radial-gradient(120% 90% at 100% 0%, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 45%);pointer-events:none')}></div>
            <div style={css('position:absolute;left:12px;top:12px;display:flex;gap:6px;pointer-events:none')}>
              <span style={css('font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:4px 11px;border-radius:999px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:rgba(246,241,231,.95)')}>{it.sub}</span>
              <span title="Тусгай хэрэгцээт хүнд ээлтэй" style={{ ...css('align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:rgba(0,0,0,.5);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:#8fd6c6;border:1px solid rgba(255,255,255,.26)'), display: it.accShow }}><Accessibility size={13} /></span>
            </div>
            <Hover as="button" onClick={it.toggleFav} s={`position:absolute;right:12px;top:12px;z-index:5;cursor:pointer;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.28);background:rgba(0,0,0,.45);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:${it.heartColor};display:flex;align-items:center;justify-content:center;transition:all .2s`} h="border-color:var(--accent,#E8B84B)"><Heart size={15} fill={it.favOn ? 'currentColor' : 'none'} /></Hover>
            <div style={css('position:absolute;left:0;right:0;bottom:0;padding:16px 18px;pointer-events:none')}>
              <div style={css('display:flex;align-items:center;gap:5px;margin-bottom:8px')}><span style={css('font-size:12px;line-height:1;color:var(--accent,#E8B84B)')}>★</span><span style={css('font-size:12px;font-weight:800;line-height:1;color:#f6f1e7')}>{it.rating}</span></div>
              <div style={css('font-size:16.5px;font-weight:800;letter-spacing:-0.01em;line-height:1.2;color:#f6f1e7')}>{it.name}</div>
              <div style={css('font-size:12px;color:rgba(242,237,227,.62);margin-top:5px;line-height:1.45')}>{it.displayMeta}</div>
            </div>
          </Hover>
        ))}
      </div>
      {gridItems.length === 0 && (
        <div style={{ ...css('display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center'), padding: V.isMobile ? '10px 20px 50px' : '10px 48px 70px' }}>
          <div style={css('font-size:15px;color:rgba(242,237,227,.55)')}>{L.empty}</div>
          <Hover as="button" onClick={V.resetAimag} s="cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;border:1px solid var(--accent,#E8B84B);background:transparent;color:var(--accent,#E8B84B);transition:all .25s" h="background:var(--accent,#E8B84B);color:#132a1f">{L.reset}</Hover>
        </div>
      )}
      <footer style={{ ...css('border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;font-size:12px;color:rgba(242,237,227,.4)'), padding: V.isMobile ? '20px 20px' : '26px 48px' }}>
        <span>© 2026 big bang</span>
        <span>{L.tag}</span>
      </footer>
    </section>
  );
}
