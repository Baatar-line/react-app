'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared "add place / scenic spot / event" modal — used by both AdminPanel and
// HostProfile so the map-pin-picker + image-upload + accessibility-criteria logic
// (already implemented once, inline, in BigBang's own add-place form) isn't duplicated
// a third and fourth time. Reuses the same static data as BigBang (bigbang/data.ts).
import React, { useCallback, useRef, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { css, Hover, useIsMobile } from './bigbang/ui';
import { AIMAGS, CATS, FCRIT } from './bigbang/data';

export type CreateKind = 'place' | 'scenic' | 'event';

export interface CreateFormData {
  kind: CreateKind;
  name: string;
  desc: string;
  aimag: string;
  images: string[];
  catName?: string;
  sub?: string;
  access?: boolean;
  phone?: string;
  openTime?: string;
  closeTime?: string;
  icon?: string;
  date?: string;
  time?: string;
  max?: string;
  lat?: number | null;
  lng?: number | null;
}

interface Props {
  kind: CreateKind;
  onClose: () => void;
  onSubmit: (data: CreateFormData) => void;
}

const TITLES: Record<CreateKind, string> = {
  place: 'Газар нэмэх',
  scenic: 'Үзэсгэлэнт газар нэмэх',
  event: 'Эвент нэмэх',
};

const SCENIC_ICONS = ['🏔️', '🏞️', '🌄', '⛺', '🌅', '🏝️', '🎭', '🌲', '⛰️', '🏛️', '🌌', '🎯'];

export default function CreateForm({ kind, onClose, onSubmit }: Props) {
  const isMobile = useIsMobile();
  // Inputs below 16px make iOS Safari zoom the whole page in on focus — bump
  // to 16px only on small screens so the desktop layout stays as designed.
  const inputFont = isMobile ? '16px' : '13.5px';
  const smallInputFont = isMobile ? '16px' : '13px';
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [aimag, setAimag] = useState('Улаанбаатар');
  const [phone, setPhone] = useState('');
  const [catSlug, setCatSlug] = useState(CATS[0].slug);
  const [sub, setSub] = useState(CATS[0].subs[0]);
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [access, setAccess] = useState(false);
  const [crit, setCrit] = useState<boolean[]>(() => FCRIT.map(() => false));
  const [icon, setIcon] = useState(SCENIC_ICONS[0]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [max, setMax] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [err, setErr] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const placeMarker = useCallback((lt: number, lg: number) => {
    if (!mapRef.current || !window.L) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = window.L.marker([lt, lg], {
      icon: window.L.divIcon({
        className: '',
        html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#E8B84B;border:2px solid #132a1f;box-shadow:0 3px 6px rgba(0,0,0,.5)"></div>',
        iconSize: [22, 22], iconAnchor: [4, 21],
      }),
    }).addTo(mapRef.current);
  }, []);

  const attachMap = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
      return;
    }
    if (mapRef.current) return;
    const init = () => {
      if (!node.isConnected) return;
      if (!window.L) { setTimeout(init, 150); return; }
      const m = window.L.map(node, { attributionControl: false });
      m.setView([47.918, 106.917], 6);
      window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { subdomains: ['0', '1', '2', '3'], maxZoom: 19 }).addTo(m);
      m.on('click', (ev: any) => { setLat(ev.latlng.lat); setLng(ev.latlng.lng); placeMarker(ev.latlng.lat, ev.latlng.lng); });
      mapRef.current = m;
      setTimeout(() => m.invalidateSize(), 150);
    };
    init();
  }, [placeMarker]);

  const onImgFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setImages((s) => [...s, String(r.result)]);
    r.readAsDataURL(f);
    ev.target.value = '';
  };
  const removeImg = (i: number) => setImages((s) => s.filter((_, k) => k !== i));

  const curCat = CATS.find((c) => c.slug === catSlug) || CATS[0];

  const submit = () => {
    if (!name.trim()) { setErr(true); return; }
    const data: CreateFormData = { kind, name: name.trim(), desc: desc.trim(), aimag, images, lat, lng };
    if (kind === 'place') {
      data.catName = curCat.name; data.sub = sub; data.access = access && crit.every(Boolean);
      data.phone = phone.trim(); data.openTime = openTime; data.closeTime = closeTime;
    } else if (kind === 'scenic') {
      data.icon = icon;
    } else {
      data.date = date; data.time = time; data.max = max.trim() || '20';
    }
    onSubmit(data);
  };

  const stop = (ev: React.MouseEvent) => ev.stopPropagation();

  return (
    <div onClick={onClose} style={{ ...css('position:fixed;inset:0;z-index:60;background:rgba(6,8,12,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;box-sizing:border-box;animation:bbFadeUp .25s ease both'), padding: isMobile ? '14px' : '36px' }}>
      <div onClick={stop} style={{ ...css('width:640px;max-width:100%;max-height:90vh;overflow:auto;background:#171410;border:1px solid rgba(255,255,255,.14);border-radius:20px;box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.6)'), padding: isMobile ? '18px 16px 20px' : '26px 28px 28px' }}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:20px')}>
          <div style={css('font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#f6f1e7')}>{TITLES[kind]}</div>
          <Hover as="button" onClick={onClose} s="cursor:pointer;font-family:inherit;font-size:18px;line-height:1;width:32px;height:32px;border-radius:50%;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.75);transition:all .2s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">×</Hover>
        </div>

        <div style={css('display:flex;flex-direction:column;gap:15px')}>
          <label style={css('display:flex;flex-direction:column;gap:6px')}>
            <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Нэр / Гарчиг <span style={css('color:#f08a8a')}>*</span></span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ж: Sky Lounge 21" style={{ ...css('font-family:inherit;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none'), fontSize: inputFont }} />
          </label>

          {kind === 'place' && (
            <>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Утасны дугаар</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="99112233" inputMode="numeric" style={{ ...css('font-family:inherit;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none'), fontSize: inputFont }} />
              </label>
              <div style={{ ...css('display:grid;gap:12px'), gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Ангилал</span>
                  <select value={catSlug} onChange={(e) => { const v = e.target.value; const c = CATS.find((x) => x.slug === v) || CATS[0]; setCatSlug(v); setSub(c.subs[0]); }} style={{ ...css('font-family:inherit;padding:11px 10px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none'), fontSize: smallInputFont }}>
                    {CATS.map((c) => <option key={c.slug} value={c.slug} style={{ background: '#1a1712', color: '#f2ede3' }}>{c.name}</option>)}
                  </select>
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Дэд ангилал</span>
                  <select value={sub} onChange={(e) => setSub(e.target.value)} style={{ ...css('font-family:inherit;padding:11px 10px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none'), fontSize: smallInputFont }}>
                    {curCat.subs.map((s) => <option key={s} value={s} style={{ background: '#1a1712', color: '#f2ede3' }}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div style={{ ...css('display:grid;gap:12px'), gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Нээх цаг</span>
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} style={{ ...css('font-family:inherit;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;color-scheme:dark'), fontSize: smallInputFont }} />
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Хаах цаг</span>
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} style={{ ...css('font-family:inherit;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;color-scheme:dark'), fontSize: smallInputFont }} />
                </label>
              </div>
            </>
          )}

          {kind === 'scenic' && (
            <label style={css('display:flex;flex-direction:column;gap:8px')}>
              <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Тэмдэг</span>
              <div style={css('display:flex;flex-wrap:wrap;gap:8px')}>
                {SCENIC_ICONS.map((g) => (
                  <button key={g} onClick={() => setIcon(g)} style={{ ...css('cursor:pointer;font-size:18px;width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;transition:all .2s'), border: `1.5px solid ${icon === g ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.16)'}`, background: icon === g ? 'rgba(232, 184, 75,.2)' : 'rgba(255,255,255,.04)' }}>{g}</button>
                ))}
              </div>
            </label>
          )}

          {kind === 'event' && (
            <div style={{ ...css('display:grid;gap:12px'), gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr' }}>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Огноо</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...css('font-family:inherit;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;color-scheme:dark'), fontSize: smallInputFont }} />
              </label>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Цаг</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...css('font-family:inherit;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;color-scheme:dark'), fontSize: smallInputFont }} />
              </label>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Дээд тал (хүн)</span>
                <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="20" inputMode="numeric" style={{ ...css('font-family:inherit;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none'), fontSize: smallInputFont }} />
              </label>
            </div>
          )}

          <label style={css('display:flex;flex-direction:column;gap:6px')}>
            <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Аймаг / хот</span>
            <select value={aimag} onChange={(e) => setAimag(e.target.value)} style={{ ...css('font-family:inherit;padding:11px 10px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none'), fontSize: smallInputFont }}>
              {AIMAGS.map((a) => <option key={a[0]} value={a[0]} style={{ background: '#1a1712', color: '#f2ede3' }}>{a[0]}</option>)}
            </select>
          </label>

          <label style={css('display:flex;flex-direction:column;gap:6px')}>
            <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Тайлбар</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Энэ газрын онцлог, юугаараа гоё вэ..." style={{ ...css('font-family:inherit;line-height:1.5;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;resize:vertical'), fontSize: smallInputFont }}></textarea>
          </label>

          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Байршил (заавал биш)</span>
            <div style={css('position:relative;height:200px;border-radius:12px;overflow:hidden;border:1px solid rgba(242,237,227,.14);background:#1a2534')}>
              <div ref={attachMap} style={css('position:absolute;inset:0;cursor:crosshair')}></div>
              <div style={css('position:absolute;left:10px;bottom:8px;z-index:500;font-size:10.5px;font-weight:700;color:#fff;background:rgba(10,12,16,.72);padding:4px 10px;border-radius:999px;pointer-events:none')}>{lat != null ? 'Байршил тэмдэглэгдлээ ✓' : 'Газрын зураг дээр дарж пин тэмдэглэнэ үү'}</div>
            </div>
          </div>

          <div style={css('display:flex;flex-direction:column;gap:6px')}>
            <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Зураг</span>
            <div style={css('display:flex;flex-wrap:wrap;gap:10px')}>
              {images.map((img, i) => (
                <div key={i} style={{ ...css('position:relative;width:84px;height:84px;border-radius:10px;background-size:cover;background-position:center;flex-shrink:0'), backgroundImage: `url("${img}")` }}>
                  <button onClick={() => removeImg(i)} style={css('position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:#f08a8a;color:#132a1f;font-size:11px;font-weight:800;cursor:pointer')}>×</button>
                </div>
              ))}
              <Hover as="label" s="display:flex;align-items:center;justify-content:center;width:84px;height:84px;border-radius:10px;border:1.5px dashed rgba(242,237,227,.25);background:rgba(255,255,255,.03);cursor:pointer;font-size:11px;color:rgba(242,237,227,.5);text-align:center;flex-shrink:0" h="border-color:var(--accent,#E8B84B)">
                ＋ зураг
                <input type="file" accept="image/*" onChange={onImgFile} style={{ display: 'none' }} />
              </Hover>
            </div>
          </div>

          {kind === 'place' && (
            <div style={css('display:flex;flex-direction:column;gap:6px')}>
              <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>Хүртээмж</span>
              <button onClick={() => setAccess((v) => !v)} style={{ ...css('cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:11px;text-align:left;padding:12px 13px;border-radius:11px;transition:all .25s'), border: `1px solid ${access ? 'rgba(120,200,170,.5)' : 'rgba(242,237,227,.18)'}`, background: access ? 'rgba(120,200,170,.1)' : 'rgba(255,255,255,.04)' }}>
                <Accessibility size={18} />
                <span style={css('flex:1;font-size:12.5px;font-weight:700;color:#f2ede3;line-height:1.35')}>Тусгай хэрэгцээт хүмүүст тохиромжтой</span>
                <span style={{ ...css('width:40px;height:23px;border-radius:999px;position:relative;flex:none;transition:background .25s'), background: access ? 'rgba(120,200,170,.9)' : 'rgba(255,255,255,.2)' }}><span style={{ ...css('position:absolute;top:3px;width:17px;height:17px;border-radius:50%;background:#fff;transition:left .25s'), left: access ? '20px' : '3px' }}></span></span>
              </button>
              {access && (
                <div style={css('display:flex;flex-direction:column;gap:7px;padding:12px 13px;border-radius:11px;border:1px dashed rgba(120,200,170,.5);background:rgba(120,200,170,.06)')}>
                  <div style={css('display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(120,200,170,.95)')}><Accessibility size={13} /> Бүх шалгуурыг хангасан байх</div>
                  {FCRIT.map((label, i) => {
                    const on = crit[i];
                    return (
                      <button key={i} onClick={() => setCrit((c) => c.map((v, k) => (k === i ? !v : v)))} style={{ ...css('cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:9px;text-align:left;padding:6px 8px;border-radius:8px;transition:all .2s'), border: `1px solid ${on ? 'rgba(120,200,170,.4)' : 'rgba(255,255,255,.12)'}`, background: on ? 'rgba(120,200,170,.08)' : 'transparent' }}>
                        <span style={{ ...css('width:17px;height:17px;border-radius:5px;color:#0b1512;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none'), border: `1.5px solid ${on ? 'rgba(120,200,170,.9)' : 'rgba(255,255,255,.3)'}`, background: on ? 'rgba(120,200,170,.9)' : 'transparent' }}>{on ? '✓' : ''}</span>
                        <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.85);line-height:1.35')}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div style={css('display:flex;align-items:center;gap:12px;margin-top:4px')}>
            <Hover as="button" onClick={submit} s="cursor:pointer;font-family:inherit;font-size:13px;font-weight:800;padding:11px 28px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-2px)">Үүсгэх →</Hover>
            <button onClick={onClose} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:10px 20px;border-radius:999px;border:1px solid rgba(242,237,227,.25);background:transparent;color:rgba(242,237,227,.7)')}>Болих</button>
            {err && <span style={css('font-size:11.5px;font-weight:700;color:#f08a8a')}>Нэр оруулна уу</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
