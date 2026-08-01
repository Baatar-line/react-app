'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared "add place / scenic spot / event" modal — used by both AdminPanel and
// BigBangLayout (Profile page's add-content flow) so the map-pin-picker +
// image-upload + accessibility-criteria logic isn't duplicated a second time.
// Reuses the same static data as BigBang (bigbang/data.ts). No "host" tier —
// place submissions from any signed-in account land pending admin approval.
import React, { useCallback, useRef, useState } from 'react';
import { Accessibility } from 'lucide-react';
import { useIsMobile } from './bigbang/ui';
import { AIMAGS, CATS, FCRIT } from './bigbang/data';

export type CreateKind = 'place' | 'scenic' | 'event';

export interface CreateFormData {
  kind: CreateKind;
  // Present only in edit mode — the row being updated instead of created.
  id?: number;
  name: string;
  desc: string;
  aimag: string;
  images: string[];
  // Raw File objects paired 1:1 with the *tail* of `images` (base64 previews
  // of newly-picked files) — the caller needs the real File to upload to
  // Cloudinary; CreateForm itself only renders previews and stays otherwise
  // dumb about where data ends up. In edit mode `images` may start with one
  // extra entry (the already-uploaded photo) that has no File counterpart.
  imageFiles: File[];
  // Raw, already-uploaded image value carried through from `initial` in edit
  // mode — kept for the caller to fall back to when no new file was picked.
  // Untouched by the form itself; cleared to undefined if the existing
  // preview was removed with no replacement.
  existingImage?: string;
  catName?: string;
  catSlug?: string;
  sub?: string;
  access?: boolean;
  phone?: string;
  instagram?: string;
  facebook?: string;
  contactEmail?: string;
  openTime?: string;
  closeTime?: string;
  icon?: string;
  scenicType?: string;
  date?: string;
  time?: string;
  max?: string;
  lat?: number | null;
  lng?: number | null;
}

interface Props {
  kind: CreateKind;
  mode?: 'create' | 'edit';
  // Pre-fills the form for editing an existing row — same shape as the data
  // submit() produces, plus `id`/`existingImage` for round-tripping the
  // unchanged photo. Ignored when mode is 'create' (or omitted).
  initial?: Partial<CreateFormData>;
  onClose: () => void;
  onSubmit: (data: CreateFormData) => void;
}

const TITLES: Record<CreateKind, string> = {
  place: 'Газар нэмэх',
  scenic: 'Үзэсгэлэнт газар нэмэх',
  event: 'Эвент нэмэх',
};
const EDIT_TITLES: Record<CreateKind, string> = {
  place: 'Газар засах',
  scenic: 'Үзэсгэлэнт газар засах',
  event: 'Эвент засах',
};

const SCENIC_ICONS = ['🏔️', '🏞️', '🌄', '⛺', '🌅', '🏝️', '🎭', '🌲', '⛰️', '🏛️', '🌌', '🎯'];

export default function CreateForm({ kind, mode = 'create', initial, onClose, onSubmit }: Props) {
  const isMobile = useIsMobile();
  // Inputs below 16px make iOS Safari zoom the whole page in on focus — bump
  // to 16px only on small screens so the desktop layout stays as designed.
  const inputFontClass = isMobile ? 'text-base' : 'text-[13.5px]';
  const smallInputFontClass = isMobile ? 'text-base' : 'text-[13px]';
  const [name, setName] = useState(initial?.name || '');
  const [desc, setDesc] = useState(initial?.desc || '');
  const [aimag, setAimag] = useState(initial?.aimag || 'Улаанбаатар');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [instagram, setInstagram] = useState(initial?.instagram || '');
  const [facebook, setFacebook] = useState(initial?.facebook || '');
  const [contactEmail, setContactEmail] = useState(initial?.contactEmail || '');
  const [catSlug, setCatSlug] = useState(initial?.catSlug || CATS[0].slug);
  const [sub, setSub] = useState(initial?.sub || (CATS.find((c) => c.slug === initial?.catSlug) || CATS[0]).subs[0]);
  const [openTime, setOpenTime] = useState(initial?.openTime || '');
  const [closeTime, setCloseTime] = useState(initial?.closeTime || '');
  const [access, setAccess] = useState(!!initial?.access);
  const [crit, setCrit] = useState<boolean[]>(() => FCRIT.map(() => !!initial?.access));
  const [icon, setIcon] = useState(initial?.icon || SCENIC_ICONS[0]);
  const [scenicType, setScenicType] = useState(initial?.scenicType || '');
  const [date, setDate] = useState(initial?.date || '');
  const [time, setTime] = useState(initial?.time || '');
  const [max, setMax] = useState(initial?.max || '');
  const [images, setImages] = useState<string[]>(initial?.images || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  // Tracks whether the pre-existing photo (initial.existingImage, if any) is
  // still meant to be kept — set false if its preview gets removed with no
  // replacement picked, so submit() knows to actually clear the image.
  const [keepExistingImage, setKeepExistingImage] = useState(!!initial?.existingImage);
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [err, setErr] = useState(false);
  const [w3w, setW3w] = useState('');
  const [w3wLoading, setW3wLoading] = useState(false);
  const [w3wErr, setW3wErr] = useState('');

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

  // Alternative to clicking the map: paste a what3words address (or full
  // what3words.com URL) and resolve it to coordinates via the backend proxy
  // (keeps the API key server-side — see app/api/what3words/route.ts).
  const lookupW3w = useCallback(async () => {
    if (!w3w.trim()) return;
    setW3wLoading(true);
    setW3wErr('');
    try {
      // Plain fetch (not apiGet) so a non-2xx response's { error: "..." } body
      // — e.g. the "add W3W_API_KEY to .env.local" message — reaches the user
      // instead of collapsing into a generic "failed: 500".
      const res = await fetch(`/api/what3words?words=${encodeURIComponent(w3w.trim())}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Хайлт амжилтгүй боллоо');
      setLat(body.lat); setLng(body.lng);
      placeMarker(body.lat, body.lng);
      if (mapRef.current) mapRef.current.setView([body.lat, body.lng], 17);
    } catch (e) {
      setW3wErr(e instanceof Error ? e.message : 'Хайлт амжилтгүй боллоо');
    } finally {
      setW3wLoading(false);
    }
  }, [w3w, placeMarker]);

  // The other direction: clicking the map (like on Google Maps) also fills in
  // the what3words address for that exact spot, so the two stay in sync
  // whichever way a location gets picked.
  const reverseW3w = useCallback(async (lt: number, lg: number) => {
    setW3wErr('');
    try {
      const res = await fetch(`/api/what3words?lat=${lt}&lng=${lg}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Хайлт амжилтгүй боллоо');
      setW3w(body.words);
    } catch {
      // Silent — the pin + lat/lng are already set from the click itself;
      // only the convenience what3words label failed to fill in.
    }
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
      // lyrs=y — Google's "hybrid" tiles (satellite photo + roads/place labels),
      // same look as the satellite mode toggle on maps.google.com. Was lyrs=m
      // (flat roadmap).
      window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { subdomains: ['0', '1', '2', '3'], maxZoom: 19 }).addTo(m);
      m.on('click', (ev: any) => {
        setLat(ev.latlng.lat); setLng(ev.latlng.lng);
        placeMarker(ev.latlng.lat, ev.latlng.lng);
        reverseW3w(ev.latlng.lat, ev.latlng.lng);
      });
      mapRef.current = m;
      // Edit mode: drop the existing pin instead of leaving the map on its
      // default Mongolia-wide view. `lat`/`lng` here are the values captured
      // at this callback's one-time creation (from `initial`), since attachMap
      // only ever runs its init() once per mount.
      if (lat != null && lng != null) { placeMarker(lat, lng); m.setView([lat, lng], 15); }
      setTimeout(() => m.invalidateSize(), 150);
    };
    init();
  }, [placeMarker, reverseW3w]);

  const onImgFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    setImageFiles((s) => [...s, f]);
    const r = new FileReader();
    r.onload = () => setImages((s) => [...s, String(r.result)]);
    r.readAsDataURL(f);
    ev.target.value = '';
  };
  const removeImg = (i: number) => {
    // `images` may lead with one entry that has no `imageFiles` counterpart
    // (the pre-existing photo in edit mode) — only the entries after that
    // offset correspond 1:1 with imageFiles.
    const fileOffset = images.length - imageFiles.length;
    if (i < fileOffset) setKeepExistingImage(false);
    else setImageFiles((s) => s.filter((_, k) => k !== i - fileOffset));
    setImages((s) => s.filter((_, k) => k !== i));
  };

  const curCat = CATS.find((c) => c.slug === catSlug) || CATS[0];

  // Place is the one kind with mandatory contact info — admin has no other
  // way to reach whoever's asking to be listed before approving them (see
  // app/api/places/route.ts, which requires + format-checks these too).
  const PHONE_RE = /^\d{8}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const placeContactMissing = kind === 'place' && (!phone.trim() || !instagram.trim() || !facebook.trim() || !contactEmail.trim());
  const placePhoneInvalid = kind === 'place' && !!phone.trim() && !PHONE_RE.test(phone.trim());
  const placeEmailInvalid = kind === 'place' && !!contactEmail.trim() && !EMAIL_RE.test(contactEmail.trim());
  const placeContactInvalid = placeContactMissing || placePhoneInvalid || placeEmailInvalid;

  const submit = () => {
    if (!name.trim()) { setErr(true); return; }
    if (kind === 'scenic' && !scenicType.trim()) { setErr(true); return; }
    if (placeContactInvalid) { setErr(true); return; }
    const data: CreateFormData = {
      kind, name: name.trim(), desc: desc.trim(), aimag, images, imageFiles, lat, lng,
      id: initial?.id,
      existingImage: keepExistingImage ? initial?.existingImage : undefined,
    };
    if (kind === 'place') {
      data.catName = curCat.name; data.catSlug = curCat.slug; data.sub = sub; data.access = access && crit.every(Boolean);
      data.phone = phone.trim(); data.instagram = instagram.trim(); data.facebook = facebook.trim(); data.contactEmail = contactEmail.trim();
      data.openTime = openTime; data.closeTime = closeTime;
    } else if (kind === 'scenic') {
      data.icon = icon; data.scenicType = scenicType.trim();
    } else {
      data.date = date; data.time = time; data.max = max.trim() || '20';
    }
    onSubmit(data);
  };

  const stop = (ev: React.MouseEvent) => ev.stopPropagation();

  const inputClass = `w-full font-[inherit] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] text-cream outline-none`;
  const smallInputClass = `w-full font-[inherit] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-2.5 py-[11px] text-cream outline-none`;
  const labelSpanClass = 'text-xs font-semibold text-[rgba(242,237,227,.7)]';

  return (
    <div onClick={onClose} className="fixed inset-0 z-[60] box-border flex items-center justify-center bg-[rgba(6,8,12,.72)] backdrop-blur-[8px] [animation:bbFadeUp_.25s_ease_both]" style={{ padding: isMobile ? '14px' : '36px' }}>
      <div onClick={stop} className="box-border w-[640px] max-w-full max-h-[90vh] overflow-auto rounded-2xl border border-[rgba(255,255,255,.14)] bg-[#171410] shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '26px 28px 28px' }}>
        <div className="mb-5 flex items-center justify-between">
          <div className="text-lg font-extrabold tracking-[-0.02em] text-cream-2">{mode === 'edit' ? EDIT_TITLES[kind] : TITLES[kind]}</div>
          <button onClick={onClose} className="h-8 w-8 cursor-pointer rounded-full border border-[rgba(242,237,227,.2)] bg-transparent font-[inherit] text-lg leading-none text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">×</button>
        </div>

        <div className="flex flex-col gap-[15px]">
          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Нэр / Гарчиг <span className="text-[#f08a8a]">*</span></span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ж: Sky Lounge 21" className={`${inputClass} ${inputFontClass}`} />
          </label>

          {kind === 'place' && (
            <>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Утасны дугаар <span className="text-[#f08a8a]">*</span></span>
                  <input
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="99112233" inputMode="numeric" maxLength={8}
                    className={`${inputClass} ${inputFontClass}`}
                    style={{ borderColor: err && placePhoneInvalid ? '#f08a8a' : undefined }}
                  />
                  {err && placePhoneInvalid && <span className="text-[11px] font-bold text-[#f08a8a]">8 оронтой тоо байх ёстой — жишээ: 99112233</span>}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Имэйл хаяг <span className="text-[#f08a8a]">*</span></span>
                  <input
                    value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="tanii@email.mn" inputMode="email"
                    className={`${inputClass} ${inputFontClass}`}
                    style={{ borderColor: err && placeEmailInvalid ? '#f08a8a' : undefined }}
                  />
                  {err && placeEmailInvalid && <span className="text-[11px] font-bold text-[#f08a8a]">Имэйл хаяг буруу байна — жишээ: tanii@email.mn</span>}
                </label>
              </div>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Instagram <span className="text-[#f08a8a]">*</span></span>
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="instagram.com/skylounge21" className={`${inputClass} ${inputFontClass}`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Facebook <span className="text-[#f08a8a]">*</span></span>
                  <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="facebook.com/skylounge21" className={`${inputClass} ${inputFontClass}`} />
                </label>
              </div>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Ангилал</span>
                  <select value={catSlug} onChange={(e) => { const v = e.target.value; const c = CATS.find((x) => x.slug === v) || CATS[0]; setCatSlug(v); setSub(c.subs[0]); }} className={`${smallInputClass} ${smallInputFontClass}`}>
                    {CATS.map((c) => <option key={c.slug} value={c.slug} style={{ background: '#1a1712', color: '#f2ede3' }}>{c.name}</option>)}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Дэд ангилал</span>
                  <select value={sub} onChange={(e) => setSub(e.target.value)} className={`${smallInputClass} ${smallInputFontClass}`}>
                    {curCat.subs.map((s) => <option key={s} value={s} style={{ background: '#1a1712', color: '#f2ede3' }}>{s}</option>)}
                  </select>
                </label>
              </div>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Нээх цаг</span>
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={`${smallInputClass} ${smallInputFontClass} [color-scheme:dark]`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Хаах цаг</span>
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={`${smallInputClass} ${smallInputFontClass} [color-scheme:dark]`} />
                </label>
              </div>
            </>
          )}

          {kind === 'scenic' && (
            <>
              <label className="flex flex-col gap-1.5">
                <span className={labelSpanClass}>Төрөл <span className="text-[#f08a8a]">*</span></span>
                <input value={scenicType} onChange={(e) => setScenicType(e.target.value)} placeholder="Ж: Нар жаргах цэг, Уулын харагдац" className={`${inputClass} ${inputFontClass}`} />
              </label>
              <label className="flex flex-col gap-2">
                <span className={labelSpanClass}>Тэмдэг</span>
                <div className="flex flex-wrap gap-2">
                  {SCENIC_ICONS.map((g) => (
                    <button key={g} onClick={() => setIcon(g)} className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] text-lg transition-all duration-200" style={{ border: `1.5px solid ${icon === g ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.16)'}`, background: icon === g ? 'rgba(232, 184, 75,.2)' : 'rgba(255,255,255,.04)' }}>{g}</button>
                  ))}
                </div>
              </label>
            </>
          )}

          {kind === 'event' && (
            <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <label className="flex flex-col gap-1.5">
                <span className={labelSpanClass}>Огноо</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${smallInputClass} ${smallInputFontClass} [color-scheme:dark]`} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSpanClass}>Цаг</span>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${smallInputClass} ${smallInputFontClass} [color-scheme:dark]`} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelSpanClass}>Дээд тал (хүн)</span>
                <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="20" inputMode="numeric" className={`${smallInputClass} ${smallInputFontClass}`} />
              </label>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Аймаг / хот</span>
            <select value={aimag} onChange={(e) => setAimag(e.target.value)} className={`${smallInputClass} ${smallInputFontClass}`}>
              {AIMAGS.map((a) => <option key={a[0]} value={a[0]} style={{ background: '#1a1712', color: '#f2ede3' }}>{a[0]}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Тайлбар</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Энэ газрын онцлог, юугаараа гоё вэ..." className={`${smallInputClass} ${smallInputFontClass} resize-y leading-[1.5]`}></textarea>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Байршил (заавал биш)</span>
            <div className="flex gap-2">
              <input
                value={w3w}
                onChange={(e) => { setW3w(e.target.value); setW3wErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); lookupW3w(); } }}
                placeholder="what3words: ///hydration.pounces.loose"
                className={`min-w-0 flex-1 font-[inherit] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] text-cream outline-none ${inputFontClass}`}
              />
              <button onClick={lookupW3w} className={`flex-shrink-0 cursor-pointer rounded-[10px] border border-[rgba(242,237,227,.22)] bg-[rgba(255,255,255,.04)] px-[18px] font-[inherit] font-bold text-[rgba(242,237,227,.9)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)] ${inputFontClass}`}>
                {w3wLoading ? '...' : 'Олох'}
              </button>
            </div>
            {w3wErr && <div className="text-[11.5px] text-[#f08a8a]">{w3wErr}</div>}
            <div className="relative h-[200px] overflow-hidden rounded-xl border border-[rgba(242,237,227,.14)] bg-[#1a2534]">
              <div ref={attachMap} className="absolute inset-0 cursor-crosshair"></div>
              <div className="pointer-events-none absolute bottom-2 left-2.5 z-[500] rounded-full bg-[rgba(10,12,16,.72)] px-2.5 py-1 text-[10.5px] font-bold text-white">{lat != null ? `Байршил тэмдэглэгдлээ ✓${w3w ? ' · ///' + w3w : ''}` : 'Газрын зураг дээр дарж, эсвэл what3words хаягаар байршил тэмдэглэнэ үү'}</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Зураг</span>
            <div className="flex flex-wrap gap-2.5">
              {images.map((img, i) => (
                <div key={i} className="relative h-[84px] w-[84px] flex-shrink-0 rounded-[10px] bg-cover bg-center" style={{ backgroundImage: `url("${img}")` }}>
                  <button onClick={() => removeImg(i)} className="absolute -top-1.5 -right-1.5 h-5 w-5 cursor-pointer rounded-full border-none bg-[#f08a8a] text-[11px] font-extrabold text-[#132a1f]">×</button>
                </div>
              ))}
              <label className="flex h-[84px] w-[84px] flex-shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[rgba(242,237,227,.25)] bg-[rgba(255,255,255,.03)] text-center text-[11px] text-[rgba(242,237,227,.5)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                ＋ зураг
                <input type="file" accept="image/*" onChange={onImgFile} className="hidden" />
              </label>
            </div>
          </div>

          {kind === 'place' && (
            <div className="flex flex-col gap-1.5">
              <span className={labelSpanClass}>Хүртээмж</span>
              <button onClick={() => setAccess((v) => !v)} className="flex cursor-pointer items-center gap-[11px] rounded-[11px] px-[13px] py-3 text-left font-[inherit] transition-all duration-250" style={{ border: `1px solid ${access ? 'rgba(120,200,170,.5)' : 'rgba(242,237,227,.18)'}`, background: access ? 'rgba(120,200,170,.1)' : 'rgba(255,255,255,.04)' }}>
                <Accessibility size={18} />
                <span className="flex-1 text-[12.5px] font-bold leading-[1.35] text-cream">Тусгай хэрэгцээт хүмүүст тохиромжтой</span>
                <span className="relative h-[23px] w-10 flex-none rounded-full transition-colors duration-250" style={{ background: access ? 'rgba(120,200,170,.9)' : 'rgba(255,255,255,.2)' }}><span className="absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white transition-[left] duration-250" style={{ left: access ? '20px' : '3px' }}></span></span>
              </button>
              {access && (
                <div className="flex flex-col gap-[7px] rounded-[11px] border border-dashed border-[rgba(120,200,170,.5)] bg-[rgba(120,200,170,.06)] px-[13px] py-3">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[.06em] text-[rgba(120,200,170,.95)] uppercase"><Accessibility size={13} /> Бүх шалгуурыг хангасан байх</div>
                  {FCRIT.map((label, i) => {
                    const on = crit[i];
                    return (
                      <button key={i} onClick={() => setCrit((c) => c.map((v, k) => (k === i ? !v : v)))} className="flex cursor-pointer items-center gap-[9px] rounded-lg px-2 py-1.5 text-left font-[inherit] transition-all duration-200" style={{ border: `1px solid ${on ? 'rgba(120,200,170,.4)' : 'rgba(255,255,255,.12)'}`, background: on ? 'rgba(120,200,170,.08)' : 'transparent' }}>
                        <span className="flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[5px] text-[11px] font-extrabold text-[#0b1512]" style={{ border: `1.5px solid ${on ? 'rgba(120,200,170,.9)' : 'rgba(255,255,255,.3)'}`, background: on ? 'rgba(120,200,170,.9)' : 'transparent' }}>{on ? '✓' : ''}</span>
                        <span className="text-xs font-semibold leading-[1.35] text-[rgba(242,237,227,.85)]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-1 flex items-center gap-3">
            <button onClick={submit} className="cursor-pointer rounded-full border-none bg-[var(--accent,#E8B84B)] px-7 py-[11px] font-[inherit] text-[13px] font-extrabold text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5">{mode === 'edit' ? 'Хадгалах' : 'Үүсгэх →'}</button>
            <button onClick={onClose} className="cursor-pointer rounded-full border border-[rgba(242,237,227,.25)] bg-transparent px-5 py-2.5 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.7)]">Болих</button>
            {err && (
              <span className="text-[11.5px] font-bold text-[#f08a8a]">
                {!name.trim()
                  ? 'Нэр оруулна уу'
                  : placePhoneInvalid || placeEmailInvalid
                  ? 'Дээрх талбаруудыг зөв бөглөнө үү'
                  : placeContactMissing
                  ? 'Утас, имэйл, Instagram, Facebook-оо бөглөнө үү'
                  : 'Төрлөө оруулна уу'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
