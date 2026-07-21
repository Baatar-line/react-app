/* eslint-disable @typescript-eslint/no-explicit-any */
// Big Bang — Place detail (/category/:slug/place/:index). Rebuilds its data
// straight from CATS + the URL params, same as openPlace() used to build it via setState.
import React from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Accessibility, Heart, MapPin, Phone } from 'lucide-react';
import { css, Hover } from '../ui';
import { CATS, U, ratingOf, isAccessible, aimagName, mapsUrlFor, FCRIT } from '../data';

export default function PlaceDetail() {
  const V: any = useOutletContext();
  const navigate = useNavigate();
  const { slug, index } = useParams();
  const [pdImgIdx, setPdImgIdx] = React.useState(0);
  React.useEffect(() => { setPdImgIdx(0); }, [slug, index]);

  const accent = V.accent;
  const L = V.L;
  const lang = V.lang;

  const cat = CATS.find((c) => c.slug === slug) || CATS[0];
  const i = Math.max(0, Math.min(Number(index) || 0, cat.items.length - 1));
  const it = cat.items[i];

  if (!it) return null;

  const access = isAccessible(it.name) || !!(it as any).access;
  const pool = cat.pool;
  const gallery = [0, 1, 2, 3].map((k) => pool[(i + k) % pool.length]);
  const favKey = 'p:' + cat.slug + ':' + it.name;
  const favOn = !!V.favs[favKey];
  const sel = Math.min(pdImgIdx, Math.max(0, gallery.length - 1));
  const mainImg = 'linear-gradient(rgba(0,0,0,.06), rgba(0,0,0,.2)), url("' + U(gallery[sel], 1200) + '")';
  const aimag = it.aimag || 'Улаанбаатар';
  const rating = ratingOf(it.name);
  const hours = it.hours || '10:00–22:00';
  const phone = it.phone || '7000-0000';
  const desc = it.desc || it.meta;
  const catName = lang === 'en' ? cat.nameEn : cat.name;

  const info = [
    { label: L.pdCat, value: catName },
    { label: L.pdSub, value: it.sub },
    { label: L.pdLoc, value: aimagName(aimag, lang) },
    { label: L.pdHours, value: hours },
    { label: L.pdPhone, value: phone },
    { label: L.pdAccessRow, value: access ? L.pdYes : L.pdNo },
  ];

  return (
    <section data-screen-label="Газрын дэлгэрэнгүй" style={{ ...css('min-height:100vh;box-sizing:border-box'), padding: V.isMobile ? '88px 18px 40px' : '96px 48px 60px' }}>
      <Hover as="button" onClick={() => navigate('/category/' + cat.slug)} s="all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:rgba(242,237,227,.6);margin-bottom:26px;transition:color .25s" h="color:var(--accent,#E8B84B)">{L.back}</Hover>
      <div style={css(V.isTablet ? 'display:flex;flex-direction:column;gap:28px' : 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:48px;align-items:start')}>
        <div style={css(`${V.isTablet ? 'position:static' : 'position:sticky;top:96px'};display:flex;flex-direction:column;gap:10px`)}>
          <div style={css('position:relative;aspect-ratio:4/3;max-height:420px;border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,.1)')}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: mainImg, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image .3s ease' }}></div>
          </div>
          <div style={css('display:flex;gap:10px')}>
            {gallery.map((id: string, k: number) => (
              <Hover as="button" key={k} onClick={() => setPdImgIdx(k)} s={`cursor:pointer;flex:1;aspect-ratio:4/3;max-height:96px;padding:0;border-radius:12px;overflow:hidden;border:1.5px solid ${k === sel ? accent : 'rgba(255,255,255,.14)'};background:url("${U(id, 300)}");background-size:cover;background-position:center;opacity:${k === sel ? 1 : 0.6};transition:all .2s`} h="opacity:1"></Hover>
            ))}
          </div>
        </div>
        <div>
          <h1 style={css('margin:0;font-size:clamp(32px,3.4vw,50px);font-weight:800;letter-spacing:-0.03em;line-height:1.08;color:#f2ede3')}>{it.name}</h1>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-top:18px')}>
            <span style={css('font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;border:1px solid rgba(242,237,227,.2);color:rgba(242,237,227,.8)')}>{it.sub}</span>
            <span style={css('font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;border:1px solid rgba(242,237,227,.2);color:rgba(242,237,227,.8)')}>{catName}</span>
            <span style={css('font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;border:1px solid rgba(242,237,227,.2);color:rgba(242,237,227,.8)')}>{aimagName(aimag, lang)}</span>
            <span style={{ ...css('align-items:center;gap:6px;font-size:12px;font-weight:700;padding:6px 14px;border-radius:999px;background:rgba(120,200,170,.16);border:1px solid rgba(120,200,170,.5);color:#8fd6c6'), display: access ? 'inline-flex' : 'none' }}><Accessibility size={13} /> {L.pdAccess}</span>
          </div>
          <div style={css('display:flex;gap:26px;margin-top:24px;flex-wrap:wrap')}>
            <div style={css('display:flex;align-items:center;gap:11px')}>
              <span style={css('width:44px;height:44px;border-radius:50%;border:1px solid rgba(232, 184, 75,.4);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--accent,#E8B84B)')}>★</span>
              <span style={css('display:flex;flex-direction:column')}><span style={css('font-size:15px;font-weight:800;color:#f2ede3')}>{rating}</span><span style={css('font-size:11px;color:rgba(242,237,227,.5)')}>{L.pdRating}</span></span>
            </div>
            <div style={css('display:flex;align-items:center;gap:11px')}>
              <span style={css('width:44px;height:44px;border-radius:50%;border:1px solid rgba(232, 184, 75,.4);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--accent,#E8B84B)')}>◷</span>
              <span style={css('display:flex;flex-direction:column')}><span style={css('font-size:15px;font-weight:800;color:#f2ede3')}>{hours}</span><span style={css('font-size:11px;color:rgba(242,237,227,.5)')}>{L.pdHours}</span></span>
            </div>
            <div style={css('display:flex;align-items:center;gap:11px')}>
              <span style={css('width:44px;height:44px;border-radius:50%;border:1px solid rgba(232, 184, 75,.4);display:flex;align-items:center;justify-content:center;color:var(--accent,#E8B84B)')}><Phone size={17} /></span>
              <span style={css('display:flex;flex-direction:column')}><span style={css('font-size:15px;font-weight:800;color:#f2ede3')}>{phone}</span><span style={css('font-size:11px;color:rgba(242,237,227,.5)')}>{L.pdPhone}</span></span>
            </div>
          </div>
          <div style={css('height:1px;background:rgba(255,255,255,.1);margin:30px 0')}></div>
          <h2 style={css('margin:0 0 14px;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#f2ede3;display:inline-block;border-bottom:2px solid var(--accent,#E8B84B);padding-bottom:6px')}>{L.pdAbout}</h2>
          <p style={css('margin:8px 0 0;font-size:15px;line-height:1.7;color:rgba(242,237,227,.72);max-width:560px')}>{desc}</p>
          <h2 style={css('margin:34px 0 16px;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#f2ede3;display:inline-block;border-bottom:2px solid var(--accent,#E8B84B);padding-bottom:6px')}>{L.pdInfo}</h2>
          <div style={css('display:flex;flex-direction:column;gap:11px;max-width:560px')}>
            {info.map((row, i2) => (
              <div key={i2} style={css('display:flex;align-items:baseline;gap:12px')}>
                <span style={css('width:6px;height:6px;border-radius:50%;background:var(--accent,#E8B84B);flex:none;transform:translateY(-2px)')}></span>
                <span style={css('font-size:13.5px;color:rgba(242,237,227,.5);min-width:130px')}>{row.label}</span>
                <span style={css('font-size:14px;font-weight:600;color:#f2ede3')}>{row.value}</span>
              </div>
            ))}
          </div>
          {access && (
            <div style={css('margin-top:26px;padding:20px 22px;border-radius:16px;border:1px solid rgba(120,200,170,.35);background:rgba(120,200,170,.06);max-width:560px')}>
              <div style={css('display:flex;align-items:center;gap:9px;font-size:14px;font-weight:800;color:#8fd6c6;margin-bottom:12px')}><Accessibility size={16} /> {L.pdA11yTitle}</div>
              <div style={css('display:flex;flex-direction:column;gap:8px')}>
                {FCRIT.map((c, i3) => (
                  <div key={i3} style={css('display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(242,237,227,.8)')}><span style={css('color:#8fd6c6;font-weight:800')}>✓</span>{c}</div>
                ))}
              </div>
            </div>
          )}
          <div style={css('display:flex;gap:12px;margin-top:30px;flex-wrap:wrap')}>
            <Hover as="a" href={mapsUrlFor({ name: it.name, aimag })} target="_blank" rel="noopener" s="text-decoration:none;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:12px 22px;border-radius:999px;background:rgba(66,133,244,.14);border:1px solid rgba(66,133,244,.4);color:#8ab4f8;transition:all .2s" h="background:rgba(66,133,244,.22)"><MapPin size={14} />{L.openMaps}</Hover>
            <button onClick={V.toggleFav(favKey)} style={{ ...css('cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:700;padding:12px 22px;border-radius:999px;transition:all .25s'), border: `1px solid ${favOn ? accent : 'rgba(242,237,227,.28)'}`, background: favOn ? accent : 'transparent', color: favOn ? '#132a1f' : 'rgba(242,237,227,.8)' }}><Heart size={15} fill={favOn ? 'currentColor' : 'none'} /> {favOn ? L.savedLabel : L.save}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
