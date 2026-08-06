'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared "add place / scenic spot / event" modal — used by both AdminPanel and
// BigBangLayout (Profile page's add-content flow) so the map-pin-picker +
// image-upload + accessibility-criteria logic isn't duplicated a second time.
// Reuses the same static data as BigBang (bigbang/data.ts). No "host" tier —
// place submissions from any signed-in account land pending admin approval.
import React, { useCallback, useRef, useState } from 'react';
import { Accessibility, MapPin } from 'lucide-react';
import { useIsMobile } from './bigbang/ui';
import { AIMAGS, CATS, FCRIT } from './bigbang/data';

export type CreateKind = 'place' | 'scenic' | 'event';

// A full (un-shortened) Google Maps URL carries its coordinates right in the
// link — "@lat,lng,zoom" (the usual share-link/address-bar form) or a
// "q="/"ll="/"query=" param — so these resolve entirely client-side, no
// network round-trip needed. Shortened maps.app.goo.gl/goo.gl links don't
// embed coordinates at all (only the page they redirect to does), so those
// go through /api/resolve-maps-url instead — see GMAPS_SHORT_RE below.
const GMAPS_COORD_RE = /@(-?\d+\.\d+),(-?\d+\.\d+)|[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/;
const GMAPS_SHORT_RE = /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl)\//i;

function extractGoogleMapsCoords(text: string): { lat: number; lng: number } | null {
  const m = text.match(GMAPS_COORD_RE);
  if (!m) return null;
  const lat = Number(m[1] ?? m[3]);
  const lng = Number(m[2] ?? m[4]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

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
  // dumb about where data ends up. In edit mode `images` starts with however
  // many already-uploaded photos have no File counterpart.
  imageFiles: File[];
  // Raw, already-uploaded image URLs carried through from `initial` in edit
  // mode, minus any the user removed — kept for the caller to combine with
  // freshly-uploaded imageFiles into the final images list. Untouched by the
  // form itself beyond removal.
  existingImages: string[];
  catName?: string;
  catSlug?: string;
  sub?: string;
  access?: boolean;
  phone?: string;
  // Second, optional contact number — event-only (see the "event" fields
  // block below); places just have the one `phone`.
  phone2?: string;
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
  // submit() produces, plus `id`/`existingImages` for round-tripping the
  // unchanged photos. Ignored when mode is 'create' (or omitted).
  initial?: Partial<CreateFormData>;
  onClose: () => void;
  onSubmit: (data: CreateFormData) => void | Promise<void>;
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
const MAX_IMAGES = 4;

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
  const [phone2, setPhone2] = useState(initial?.phone2 || '');
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
  // The still-kept subset of initial.existingImages — trimmed in lockstep
  // with the "existing" prefix of `images` whenever one gets removed (see
  // removeImg), so it always lines up positionally with that prefix.
  const [existingImages, setExistingImages] = useState<string[]>(initial?.existingImages || []);
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);
  const [err, setErr] = useState(false);
  // Tracks whether the user has left each contact field at least once, so
  // format errors (bad phone/email) show live on blur instead of only after
  // a failed submit — typing garbage shouldn't require hitting "create"
  // first to find out it's wrong.
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phone2Touched, setPhone2Touched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  // Guards the create/save button against double-submits — a fast double
  // click before the (async, image-upload-bearing) onSubmit resolves used to
  // fire two separate creates, e.g. two identical scenic pins a couple
  // seconds apart, each with its own freshly-uploaded Cloudinary image.
  const [submitting, setSubmitting] = useState(false);
  // Purely derived/display now — never typed into directly. Filled in via
  // reverseW3w whenever a pin lands anywhere (map click, search result,
  // pasted URL/w3w address) and shown as a small label over the map, so the
  // convenience code is still visible without needing its own input+button.
  const [w3w, setW3w] = useState('');
  // Single search box below replaces what used to be two stacked ones (a
  // place-name search and a separate what3words/Google-Maps-URL box) — one
  // input, one button, auto-detects which of the three it got.
  const [locQuery, setLocQuery] = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [locErr, setLocErr] = useState('');
  const [placeResults, setPlaceResults] = useState<{ name: string; lat: number; lng: number }[]>([]);

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

  // The other direction: clicking the map (like on Google Maps) also fills in
  // the what3words address for that exact spot, so the display label under
  // the map (see the JSX below) stays in sync however a pin lands.
  const reverseW3w = useCallback(async (lt: number, lg: number) => {
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

  const applyLocation = useCallback((lt: number, lg: number, zoom = 16) => {
    setLat(lt); setLng(lg);
    placeMarker(lt, lg);
    if (mapRef.current) mapRef.current.setView([lt, lg], zoom);
    reverseW3w(lt, lg);
  }, [placeMarker, reverseW3w]);

  // Matches a bare what3words address ("hydration.pounces.loose", optionally
  // "///"-prefixed) or a what3words.com URL — anything else pasted/typed
  // falls through to the free-text place search below.
  const W3W_DETECT_RE = /^\/{0,3}[a-z]+\.[a-z]+\.[a-z]+$/i;
  const W3W_URL_RE = /what3words\.com/i;

  // One box now handles everything that used to be two separate search rows
  // (a place-name search and a what3words/Google-Maps-URL box), tried in
  // this order:
  // 1. A full Google Maps URL with coordinates already in it — parsed
  //    entirely client-side (see extractGoogleMapsCoords).
  // 2. A shortened Google Maps link (maps.app.goo.gl/goo.gl) — resolved via
  //    the backend proxy since only the redirect target carries coordinates.
  // 3. A what3words address or what3words.com URL — resolved via the
  //    backend proxy (keeps the API key server-side).
  // 4. Anything else — a free-text place/address search (Nominatim, via
  //    /api/geocode). Always shown as a pickable list (even a single match)
  //    instead of dropping the pin straight away — Mongolia's OSM/Nominatim
  //    coverage is thin enough that a plausible-looking single result can
  //    still be the wrong place entirely, so the name is worth a glance
  //    before committing to it.
  const searchLocation = useCallback(async () => {
    const val = locQuery.trim();
    if (!val) return;
    setLocLoading(true);
    setLocErr('');
    setPlaceResults([]);
    try {
      const direct = extractGoogleMapsCoords(val);
      if (direct) { applyLocation(direct.lat, direct.lng, 17); return; }

      if (GMAPS_SHORT_RE.test(val)) {
        const res = await fetch(`/api/resolve-maps-url?url=${encodeURIComponent(val)}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || 'Холбоос уншихад алдаа гарлаа');
        applyLocation(body.lat, body.lng, 17);
        return;
      }

      if (W3W_DETECT_RE.test(val) || W3W_URL_RE.test(val)) {
        // Plain fetch (not apiGet) so a non-2xx response's { error: "..." }
        // body — e.g. the "add W3W_API_KEY to .env.local" message — reaches
        // the user instead of collapsing into a generic "failed: 500".
        const res = await fetch(`/api/what3words?words=${encodeURIComponent(val)}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || 'Хайлт амжилтгүй боллоо');
        applyLocation(body.lat, body.lng, 17);
        return;
      }

      const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Хайлт амжилтгүй боллоо');
      if (!body.length) { setLocErr('Илэрц олдсонгүй — өөр нэрээр эсвэл газрын зураг дээр шууд дарж оролдоно уу'); return; }
      setPlaceResults(body);
    } catch (e) {
      setLocErr(e instanceof Error ? e.message : 'Хайлт амжилтгүй боллоо');
    } finally {
      setLocLoading(false);
    }
  }, [locQuery, applyLocation]);

  const pickPlaceResult = useCallback((r: { name: string; lat: number; lng: number }) => {
    applyLocation(r.lat, r.lng, 15);
    setPlaceResults([]);
    setLocQuery(r.name);
  }, [applyLocation]);

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
      // (flat roadmap). hl=mn pins the place-name labels to Mongolian —
      // without it Google's tile server was picking Chinese for this area.
      window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&hl=mn&x={x}&y={y}&z={z}', { subdomains: ['0', '1', '2', '3'], maxZoom: 19 }).addTo(m);
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
    if (images.length >= MAX_IMAGES) { ev.target.value = ''; return; }
    setImageFiles((s) => [...s, f]);
    const r = new FileReader();
    r.onload = () => setImages((s) => [...s, String(r.result)]);
    r.readAsDataURL(f);
    ev.target.value = '';
  };
  const removeImg = (i: number) => {
    // `images` leads with however many pre-existing photos have no
    // `imageFiles` counterpart (edit mode) — only entries after that offset
    // correspond 1:1 with imageFiles.
    const fileOffset = images.length - imageFiles.length;
    if (i < fileOffset) setExistingImages((s) => s.filter((_, k) => k !== i));
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
  const placeHoursMissing = kind === 'place' && (!openTime || !closeTime);
  const eventMissing = kind === 'event' && (!date || !time || !max.trim());
  // Event contact info mirrors place's (see PHONE_RE above) minus
  // facebook/email — attendees/admin reach the organizer by phone or
  // Instagram. `phone2` is a genuinely optional second number, never
  // required and never format-checked unless something's actually in it.
  const eventContactMissing = kind === 'event' && (!phone.trim() || !instagram.trim());
  const eventPhoneInvalid = kind === 'event' && !!phone.trim() && !PHONE_RE.test(phone.trim());
  const eventPhone2Invalid = kind === 'event' && !!phone2.trim() && !PHONE_RE.test(phone2.trim());
  const eventContactInvalid = eventContactMissing || eventPhoneInvalid || eventPhone2Invalid;
  const descMissing = !desc.trim();
  const imagesMissing = images.length < 1;
  const imagesMaxed = images.length >= MAX_IMAGES;
  // A real map pin is required for every kind — visitors need to know where
  // to actually show up, and "somewhere in this aimag" isn't good enough.
  // Create-only: an older row edited through Admin before this requirement
  // existed may still have no pin, and blocking an unrelated edit to that
  // row until someone back-fills a location it never needed before would be
  // a regression, not the ask here.
  const pinMissing = mode === 'create' && (lat == null || lng == null);
  const nameMissing = !name.trim();
  const scenicTypeMissing = kind === 'scenic' && !scenicType.trim();
  // Single source of truth for whether "Үүсгэх" should even be clickable —
  // same conditions submit() checks below, so the button disables itself
  // instead of only surfacing the problem after a click.
  const formValid = !(
    nameMissing || descMissing || imagesMissing || pinMissing || scenicTypeMissing ||
    (kind === 'place' && (placeContactInvalid || placeHoursMissing)) ||
    (kind === 'event' && (eventMissing || eventContactInvalid))
  );

  const submit = async () => {
    if (submitting) return;
    // Cleared at the start of every attempt — otherwise, once any earlier
    // attempt failed validation, this stays true forever: even after fixing
    // the actual problem and passing every check below, the error banner
    // below would keep showing (and since no specific condition matches
    // anymore, it'd fall through to the misleading generic "fill in
    // everything" message) despite the submit actually going through.
    setErr(false);
    if (nameMissing) { setErr(true); return; }
    if (descMissing) { setErr(true); return; }
    if (imagesMissing) { setErr(true); return; }
    if (pinMissing) { setErr(true); return; }
    if (scenicTypeMissing) { setErr(true); return; }
    if (kind === 'place' && (placeContactInvalid || placeHoursMissing)) { setErr(true); return; }
    if (kind === 'event' && (eventMissing || eventContactInvalid)) { setErr(true); return; }
    const data: CreateFormData = {
      kind, name: name.trim(), desc: desc.trim(), aimag, images, imageFiles, lat, lng,
      id: initial?.id,
      existingImages,
    };
    if (kind === 'place') {
      data.catName = curCat.name; data.catSlug = curCat.slug; data.sub = sub; data.access = access && crit.every(Boolean);
      data.phone = phone.trim(); data.instagram = instagram.trim(); data.facebook = facebook.trim(); data.contactEmail = contactEmail.trim();
      data.openTime = openTime; data.closeTime = closeTime;
    } else if (kind === 'scenic') {
      data.icon = icon; data.scenicType = scenicType.trim();
    } else {
      data.date = date; data.time = time; data.max = max.trim();
      data.phone = phone.trim(); data.phone2 = phone2.trim(); data.instagram = instagram.trim();
    }
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full font-[inherit] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] text-cream outline-none`;
  const smallInputClass = `w-full font-[inherit] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-2.5 py-[11px] text-cream outline-none`;
  const labelSpanClass = 'text-xs font-semibold text-[rgba(242,237,227,.7)]';

  return (
    <div className="fixed inset-0 z-[60] box-border flex items-center justify-center bg-[rgba(6,8,12,.72)] backdrop-blur-[8px] [animation:bbFadeUp_.25s_ease_both]" style={{ padding: isMobile ? '14px' : '36px' }}>
      <div className="box-border w-[640px] max-w-full max-h-[90vh] overflow-auto rounded-2xl border border-[rgba(255,255,255,.14)] bg-[#171410] shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '26px 28px 28px' }}>
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
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={() => setPhoneTouched(true)} placeholder="99112233" inputMode="numeric" maxLength={8}
                    className={`${inputClass} ${inputFontClass}`}
                    style={{ borderColor: (err || phoneTouched) && placePhoneInvalid ? '#f08a8a' : undefined }}
                  />
                  {(err || phoneTouched) && placePhoneInvalid && <span className="text-[11px] font-bold text-[#f08a8a]">8 оронтой тоо байх ёстой — жишээ: 99112233</span>}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Имэйл хаяг <span className="text-[#f08a8a]">*</span></span>
                  <input
                    value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} onBlur={() => setEmailTouched(true)} placeholder="tanii@email.mn" inputMode="email"
                    className={`${inputClass} ${inputFontClass}`}
                    style={{ borderColor: (err || emailTouched) && placeEmailInvalid ? '#f08a8a' : undefined }}
                  />
                  {(err || emailTouched) && placeEmailInvalid && <span className="text-[11px] font-bold text-[#f08a8a]">Имэйл хаяг буруу байна — жишээ: tanii@email.mn</span>}
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
                  <span className={labelSpanClass}>Нээх цаг <span className="text-[#f08a8a]">*</span></span>
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} className={`${smallInputClass} ${smallInputFontClass} [color-scheme:dark]`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Хаах цаг <span className="text-[#f08a8a]">*</span></span>
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} className={`${smallInputClass} ${smallInputFontClass} [color-scheme:dark]`} />
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
            <>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Огноо <span className="text-[#f08a8a]">*</span></span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} className={`${smallInputClass} ${smallInputFontClass} [color-scheme:dark]`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Цаг <span className="text-[#f08a8a]">*</span></span>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} onClick={(e) => e.currentTarget.showPicker?.()} className={`${smallInputClass} ${smallInputFontClass} [color-scheme:dark]`} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Дээд тал (хүн) <span className="text-[#f08a8a]">*</span></span>
                  <input value={max} onChange={(e) => setMax(e.target.value)} placeholder="20" inputMode="numeric" className={`${smallInputClass} ${smallInputFontClass}`} />
                </label>
              </div>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>Утасны дугаар <span className="text-[#f08a8a]">*</span></span>
                  <input
                    value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={() => setPhoneTouched(true)} placeholder="99112233" inputMode="numeric" maxLength={8}
                    className={`${inputClass} ${inputFontClass}`}
                    style={{ borderColor: (err || phoneTouched) && eventPhoneInvalid ? '#f08a8a' : undefined }}
                  />
                  {(err || phoneTouched) && eventPhoneInvalid && <span className="text-[11px] font-bold text-[#f08a8a]">8 оронтой тоо байх ёстой — жишээ: 99112233</span>}
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={labelSpanClass}>2-р утасны дугаар <span className="text-[rgba(242,237,227,.4)] font-normal">(заавал биш)</span></span>
                  <input
                    value={phone2} onChange={(e) => setPhone2(e.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={() => setPhone2Touched(true)} placeholder="99112233" inputMode="numeric" maxLength={8}
                    className={`${inputClass} ${inputFontClass}`}
                    style={{ borderColor: (err || phone2Touched) && eventPhone2Invalid ? '#f08a8a' : undefined }}
                  />
                  {(err || phone2Touched) && eventPhone2Invalid && <span className="text-[11px] font-bold text-[#f08a8a]">8 оронтой тоо байх ёстой — жишээ: 99112233</span>}
                </label>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className={labelSpanClass}>Instagram <span className="text-[#f08a8a]">*</span></span>
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="instagram.com/yourevent" className={`${inputClass} ${inputFontClass}`} />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Аймаг / хот</span>
            <select value={aimag} onChange={(e) => setAimag(e.target.value)} className={`${smallInputClass} ${smallInputFontClass}`}>
              {AIMAGS.map((a) => <option key={a[0]} value={a[0]} style={{ background: '#1a1712', color: '#f2ede3' }}>{a[0]}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Тайлбар <span className="text-[#f08a8a]">*</span></span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Энэ газрын онцлог, юугаараа гоё вэ..." className={`${smallInputClass} ${smallInputFontClass} resize-y leading-[1.5]`}></textarea>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Байршил <span className="text-[#f08a8a]">*</span></span>
            <div className="relative flex gap-2">
              <input
                value={locQuery}
                onChange={(e) => { setLocQuery(e.target.value); setLocErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchLocation(); } }}
                placeholder="Хаяг, газрын нэр, Google Maps холбоос эсвэл what3words хайх..."
                className={`min-w-0 flex-1 font-[inherit] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] text-cream outline-none ${inputFontClass}`}
              />
              <button onClick={searchLocation} disabled={locLoading} className={`flex-shrink-0 cursor-pointer rounded-[10px] border border-[rgba(242,237,227,.22)] bg-[rgba(255,255,255,.04)] px-[18px] font-[inherit] font-bold text-[rgba(242,237,227,.9)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)] disabled:cursor-not-allowed disabled:opacity-60 ${inputFontClass}`}>
                {locLoading ? '...' : 'Хайх'}
              </button>
              {placeResults.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[1100] max-h-[220px] overflow-auto rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[#1a1712] shadow-[0_12px_30px_rgba(0,0,0,.5)]">
                  <div className="sticky top-0 bg-[#1a1712] px-3 pt-2.5 pb-1.5 text-[10.5px] font-bold uppercase tracking-[.04em] text-[rgba(242,237,227,.45)]">Тохирох илэрцээ сонгоно уу</div>
                  {placeResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => pickPlaceResult(r)}
                      className="flex w-full cursor-pointer items-start gap-2 border-0 border-t border-[rgba(255,255,255,.06)] bg-transparent px-3 py-2.5 text-left font-[inherit] text-[12.5px] leading-[1.4] text-[rgba(242,237,227,.85)] hover:bg-[rgba(255,255,255,.06)]"
                    >
                      <MapPin size={13} className="mt-0.5 flex-shrink-0 text-[var(--accent,#E8B84B)]" />
                      <span>{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {locErr && <div className="text-[11.5px] text-[#f08a8a]">{locErr}</div>}
            <div className="relative h-[320px] overflow-hidden rounded-xl border border-[rgba(242,237,227,.14)] bg-[#1a2534]">
              <div ref={attachMap} className="absolute inset-0 cursor-crosshair"></div>
              <div className="pointer-events-none absolute bottom-2 left-2.5 z-[500] rounded-full bg-[rgba(10,12,16,.72)] px-2.5 py-1 text-[10.5px] font-bold text-white">{lat != null ? `Байршил тэмдэглэгдлээ ✓${w3w ? ' · ///' + w3w : ''}` : 'Дээрээс хайх, эсвэл газрын зураг дээр шууд дарж байршил тэмдэглэнэ үү'}</div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelSpanClass}>Зураг <span className="text-[#f08a8a]">*</span> <span className="text-[rgba(242,237,227,.4)] font-normal">(дор хаяж 1, хамгийн ихдээ {MAX_IMAGES} зураг) — {images.length}/{MAX_IMAGES}</span></span>
            <div className="flex flex-wrap gap-2.5">
              {images.map((img, i) => (
                <div key={i} className="relative h-[84px] w-[84px] flex-shrink-0 rounded-[10px] bg-cover bg-center" style={{ backgroundImage: `url("${img}")` }}>
                  <button onClick={() => removeImg(i)} className="absolute -top-1.5 -right-1.5 h-5 w-5 cursor-pointer rounded-full border-none bg-[#f08a8a] text-[11px] font-extrabold text-[#132a1f]">×</button>
                </div>
              ))}
              {!imagesMaxed && (
                <label className="flex h-[84px] w-[84px] flex-shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-[rgba(242,237,227,.25)] bg-[rgba(255,255,255,.03)] text-center text-[11px] text-[rgba(242,237,227,.5)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                  ＋ зураг
                  <input type="file" accept="image/*" onChange={onImgFile} className="hidden" />
                </label>
              )}
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
            <button onClick={submit} disabled={submitting || !formValid} title={!submitting && !formValid ? 'Бүх заавал талбарыг бөглөнө үү' : undefined} className="cursor-pointer rounded-full border-none bg-[var(--accent,#E8B84B)] px-7 py-[11px] font-[inherit] text-[13px] font-extrabold text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0">{submitting ? 'Хадгалж байна…' : mode === 'edit' ? 'Хадгалах' : 'Үүсгэх →'}</button>
            <button onClick={onClose} disabled={submitting} className="cursor-pointer rounded-full border border-[rgba(242,237,227,.25)] bg-transparent px-5 py-2.5 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.7)] disabled:cursor-not-allowed disabled:opacity-60">Болих</button>
            {err && (
              <span className="text-[11.5px] font-bold text-[#f08a8a]">
                {nameMissing
                  ? 'Нэр оруулна уу'
                  : descMissing
                  ? 'Тайлбар оруулна уу'
                  : imagesMissing
                  ? 'Дор хаяж 1 зураг оруулна уу'
                  : pinMissing
                  ? 'Газрын зураг дээр байршлаа заавал тэмдэглэнэ үү'
                  : scenicTypeMissing
                  ? 'Төрлөө оруулна уу'
                  : kind === 'place' && (placePhoneInvalid || placeEmailInvalid)
                  ? 'Дээрх талбаруудыг зөв бөглөнө үү'
                  : kind === 'place' && placeContactMissing
                  ? 'Утас, имэйл, Instagram, Facebook-оо бөглөнө үү'
                  : kind === 'place' && placeHoursMissing
                  ? 'Нээх, хаах цагаа сонгоно уу'
                  : kind === 'event' && eventMissing
                  ? 'Огноо, цаг, дээд тал хүний тоог бөглөнө үү'
                  : kind === 'event' && (eventPhoneInvalid || eventPhone2Invalid)
                  ? 'Дээрх утасны дугаарыг зөв бөглөнө үү'
                  : kind === 'event' && eventContactMissing
                  ? 'Утас, Instagram-аа бөглөнө үү'
                  : 'Талбаруудаа бүрэн бөглөнө үү'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
