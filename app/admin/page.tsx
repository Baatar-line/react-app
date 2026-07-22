'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Admin Panel — full app screen. Ported from Admin Panel.dc.html.
// Reuses the same brand data/helpers as BigBang (categories, aimags, accessibility
// criteria, image URL builder) instead of redefining them, and shares the
// place/scenic/event creation modal with HostProfile via shared/CreateForm.
import React, { useEffect, useRef, useState } from 'react';
import { Accessibility, Play, LayoutDashboard, MapPin, Mountain, CalendarDays, Star, Image as ImageIcon, Megaphone, Film, Search, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import { css, Hover, useIsMobile } from '@/components/bigbang/ui';
import { AIMAGS, AIMAG_BG, CATS, SUGGESTS, SUGGEST_COLLECTIONS, SuggestCollectionItem, U, imgUrl, isVideoUrl } from '@/components/bigbang/data';
import CreateForm, { CreateFormData, CreateKind } from '@/components/CreateForm';
import { apiGet, apiPatch, apiPut, uploadImage } from '@/lib/api';

type Tab = 'dash' | 'places' | 'scenic' | 'events' | 'suggests' | 'bg' | 'ads';

interface Ad { title: string; desc: string; img: string; from: string; to: string; views: number; active: boolean; }
interface ScenicEntry { name: string; desc: string; icon: string; aimag: string; img: string; }
interface AdminEvent { name: string; day: string; mon: string; tag: string; aimag: string; meta: string; img: string; }
interface CreatedPlace { name: string; cat: string; aimag: string; access?: boolean; desc: string; img: string; }
// `id` is the backend row id (category/aimag) once fetched — needed to PATCH the right row.
// Absent for the 'about'/'home'/'flag'/'suggest' kinds, which PUT the singleton
// settings row instead; `slug` is the SUGGESTS card key used there since that
// list isn't a db table with its own row ids.
interface BgItem { id?: number; slug?: string; name: string; type: 'image' | 'video'; src: string; }

const PLACE_REQS = [
  { name: 'Sky Lounge 21', cat: 'Хоол & Кофе', aimag: 'Улаанбаатар', host: 'host: @boldoo', when: 'өнөөдөр 14:02', desc: 'Хотын дээвэр ресторан, нар жаргах гоё үзэмжтэй', img: '1517248135467-4c7edcad34c4' },
  { name: 'Говь кэмп', cat: 'Аялал & Байгаль', aimag: 'Өмнөговь', host: 'host: @nomin.travel', when: 'өчигдөр 19:44', desc: 'Хонгорын элсний дэргэдэх гэр кэмп', img: '1469854523086-cc02fe5d8800' },
  { name: 'Ice Rink UB', cat: 'Адреналин & Спорт', aimag: 'Улаанбаатар', host: 'host: @icepark', when: 'өчигдөр 11:20', desc: 'Задгай мөсөн гулгуур, түрээсийн тоноглолтой', img: '1476480862126-209bfaa8edc8' },
  { name: 'Art Wine Bar', cat: 'Соёл & Урлаг', aimag: 'Улаанбаатар', host: 'host: @artspace', when: '2 хоногийн өмнө', desc: 'Урлагийн галерей болон дарсны бар нэг дор', img: '1514933651103-005eec06c04b' },
];

const EVENT_REQS = [
  { name: 'Дуурийн шинэ тайлбар', tag: 'Соёл', day: '12', mon: '7-р сар', aimag: 'Улаанбаатар', host: 'host: @opera.mn', meta: 'Дуурийн театр · 19:00' },
  { name: 'Jazz Night', tag: 'Хөгжим', day: '18', mon: '7-р сар', aimag: 'Улаанбаатар', host: 'host: @bluenote', meta: 'Blue Note · 21:00' },
  { name: 'Хөвсгөл мөрний баяр', tag: 'Фестиваль', day: '02', mon: '8-р сар', aimag: 'Хөвсгөл', host: 'host: @travelmn', meta: 'Хатгал тосгон · 2 өдөр' },
  { name: 'Street Food Fest', tag: 'Хоол', day: '25', mon: '7-р сар', aimag: 'Дархан-Уул', host: 'host: @foodie', meta: 'Төв талбай · 12:00–22:00' },
];

const INITIAL_ADS: Ad[] = [
  { title: 'Шинэ жилийн онцгой санал', desc: '', img: '1477959858617-67f85cf4f1df', from: '2026-07-01', to: '2026-07-31', views: 1240, active: true },
  { title: 'Хосын багц — 2 хүн', desc: '', img: '1533105079780-92b9be482077', from: '2026-07-05', to: '2026-07-15', views: 862, active: true },
  { title: 'Түүхэнд амьдарсан түдэглэл', desc: '', img: '1519681393784-d120267933ba', from: '2026-06-20', to: '2026-07-10', views: 430, active: false },
];

const NAV: { key: Tab; icon: LucideIcon; label: string }[] = [
  { key: 'dash', icon: LayoutDashboard, label: 'Хяналтын самбар' },
  { key: 'places', icon: MapPin, label: 'Газрын хүсэлт' },
  { key: 'scenic', icon: Mountain, label: 'Үзэсгэлэнт газар' },
  { key: 'events', icon: CalendarDays, label: 'Эвент хүсэлт' },
  { key: 'suggests', icon: Star, label: 'Санал болгох' },
  { key: 'bg', icon: ImageIcon, label: 'Фон зураг' },
  { key: 'ads', icon: Megaphone, label: 'Зар сурталчилгаа' },
];
// Grouped + collapsible sidebar (was one flat list) — each group gets a small
// uppercase label, same "Navigate / More" pattern as the reference dashboard.
const NAV_GROUPS: { label: string; keys: Tab[] }[] = [
  { label: 'Удирдах самбар', keys: ['dash'] },
  { label: 'Агуулга', keys: ['places', 'scenic', 'events', 'suggests'] },
  { label: 'Тохиргоо', keys: ['bg', 'ads'] },
];
// What ⌘K search filters per tab — a name/title getter for that tab's list(s)
// plus the placeholder copy shown in the search box.
const SEARCH_PLACEHOLDER: Partial<Record<Tab, string>> = {
  places: 'Газар хайх...',
  scenic: 'Үзэсгэлэнт газар хайх...',
  events: 'Эвент хайх...',
  suggests: 'Дэд карт хайх...',
  bg: 'Фон хайх...',
  ads: 'Зар хайх...',
};

const CAT_BG_DEFS: [string, string][] = CATS.map((c) => [c.name, c.hero]);
const ALL_AIMAGS = AIMAGS.map((a) => a[0]);

const thumb = (img: string) => 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + imgUrl(img, 500) + '")';

export default function AdminPanel() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>('dash');
  const [sbCollapsed, setSbCollapsed] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const matches = (name: string) => !query.trim() || name.toLowerCase().includes(query.trim().toLowerCase());

  // ⌘K / Ctrl+K jumps to the search box, same shortcut as the reference dashboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // Search is per-tab (it's filtering that tab's own list, not a cross-app
  // index), so switching tabs clears whatever was typed for the last one.
  useEffect(() => { setQuery(''); }, [tab]);

  const [placeDecisions, setPlaceDecisions] = useState<Record<number, 'ok' | 'no'>>({});
  const [eventDecisions, setEventDecisions] = useState<Record<number, 'ok' | 'no'>>({});
  const [ads, setAds] = useState<Ad[]>(INITIAL_ADS);
  const [adFormOpen, setAdFormOpen] = useState(false);
  const [adEditIdx, setAdEditIdx] = useState(-1);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adFrom, setAdFrom] = useState('');
  const [adTo, setAdTo] = useState('');

  const [scenicList, setScenicList] = useState<ScenicEntry[]>([
    { name: 'Хайрхан толгой', desc: 'Нар жаргах гоё үзэмж', icon: '🏔️', aimag: 'Улаанбаатар', img: '1470071459604-3b5ec3a7fe05' },
  ]);
  const [adminEvents, setAdminEvents] = useState<AdminEvent[]>([
    { name: 'Playtime Festival 2026', day: '11', mon: '7-р сар', tag: 'Фестиваль', aimag: 'Төв', meta: 'Гачуурт · 2 өдөр', img: '1533105079780-92b9be482077' },
  ]);
  const [createdPlaces, setCreatedPlaces] = useState<CreatedPlace[]>([]);

  const [sharedFormOpen, setSharedFormOpen] = useState(false);
  const [sharedFormKind, setSharedFormKind] = useState<CreateKind>('place');

  // Suggest sub-collections (the cards shown when a "Санал болгох" card is opened
  // on the main app) — one list per SUGGESTS category, manageable here.
  const [suggestActiveSlug, setSuggestActiveSlug] = useState(SUGGESTS[0].slug);
  const [suggestCollections, setSuggestCollections] = useState<Record<string, SuggestCollectionItem[]>>(() => ({ ...SUGGEST_COLLECTIONS }));
  const [suggestFormOpen, setSuggestFormOpen] = useState(false);
  const [sgName, setSgName] = useState('');
  const [sgDesc, setSgDesc] = useState('');
  const [sgImg, setSgImg] = useState('');
  const [sgErr, setSgErr] = useState(false);

  const [bgSub, setBgSub] = useState<'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader'>('cat');
  // Seeded with the same local defaults as before so the tab isn't empty while the
  // backend fetch below is in flight; the effect then attaches real ids + latest
  // saved images so edits actually PATCH/PUT the right row and survive a refresh.
  const [catBg, setCatBg] = useState<BgItem[]>(() => CAT_BG_DEFS.map(([name, id]) => ({ name, type: 'image' as const, src: U(id, 900) })));
  const [aimagBg, setAimagBg] = useState<BgItem[]>(() => ALL_AIMAGS.map((a) => ({ name: a, type: 'image' as const, src: U(AIMAG_BG[a] || '1470071459604-3b5ec3a7fe05', 900) })));
  // Single-item "list" so it can reuse the same edit modal as cat/aimag backgrounds.
  const [aboutBg, setAboutBg] = useState<BgItem[]>(() => [{ name: 'Бидний тухай фон', type: 'image', src: U('1470071459604-3b5ec3a7fe05', 1200) }]);
  // The home screen's default background — what a visitor sees before hovering/selecting any category or aimag.
  const [homeBg, setHomeBg] = useState<BgItem[]>(() => [{ name: 'Нүүр хуудасны фон', type: 'image', src: U('1470071459604-3b5ec3a7fe05', 1800) }]);
  // Real flag photo for Mongolia's shape on the 3D globe (Дэлхийн архив) — falls
  // back to the procedural Soyombo drawing in globe-engine.js until one is uploaded.
  const [flagBg, setFlagBg] = useState<BgItem[]>(() => [{ name: 'Монгол улсын дэлбээ', type: 'image', src: U('1470071459604-3b5ec3a7fe05', 900) }]);
  // "Санал болгох" cards on the home screen (games/movies/boardgame/...) — one
  // background photo per static SUGGESTS slug, stored as a slug→url JSON map on
  // the settings row since that list isn't a db table of its own.
  const [suggestBg, setSuggestBg] = useState<BgItem[]>(() => SUGGESTS.map((s) => ({ slug: s.slug, name: s.title, type: 'image' as const, src: U(s.img, 900) })));
  // Full-bleed photo behind the Marauder's-map loading screen shown on first load.
  const [loaderBg, setLoaderBg] = useState<BgItem[]>(() => [{ name: 'Ачаалж буй дэлгэцийн фон', type: 'image', src: U('1470071459604-3b5ec3a7fe05', 1800) }]);
  const [bgSyncError, setBgSyncError] = useState('');
  const [bgUploading, setBgUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, aimags, settings] = await Promise.all([
          apiGet<{ id: number; name: string; image: string | null }[]>('/categories'),
          apiGet<{ id: number; name: string; backgroundImage: string | null }[]>('/aimags'),
          apiGet<{ aboutBackgroundImage: string | null; homeBackgroundImage: string | null; mongoliaFlagImage: string | null; suggestBackgroundImages: Record<string, string> | null; loaderBackgroundImage: string | null }>('/settings'),
        ]);
        if (cancelled) return;
        setCatBg((prev) => prev.map((it) => {
          const match = cats.find((c) => c.name === it.name);
          if (!match) return it;
          const src = match.image || it.src;
          return { ...it, id: match.id, src, type: match.image ? (isVideoUrl(src) ? 'video' : 'image') : it.type };
        }));
        setAimagBg((prev) => prev.map((it) => {
          const match = aimags.find((a) => a.name === it.name);
          if (!match) return it;
          const src = match.backgroundImage || it.src;
          return { ...it, id: match.id, src, type: match.backgroundImage ? (isVideoUrl(src) ? 'video' : 'image') : it.type };
        }));
        if (settings.aboutBackgroundImage) {
          setAboutBg((prev) => [{ ...prev[0], src: settings.aboutBackgroundImage as string, type: isVideoUrl(settings.aboutBackgroundImage as string) ? 'video' : 'image' }]);
        }
        if (settings.homeBackgroundImage) {
          setHomeBg((prev) => [{ ...prev[0], src: settings.homeBackgroundImage as string, type: isVideoUrl(settings.homeBackgroundImage as string) ? 'video' : 'image' }]);
        }
        if (settings.mongoliaFlagImage) {
          setFlagBg((prev) => [{ ...prev[0], src: settings.mongoliaFlagImage as string, type: 'image' }]);
        }
        if (settings.suggestBackgroundImages) {
          const map = settings.suggestBackgroundImages;
          setSuggestBg((prev) => prev.map((it) => {
            const saved = it.slug ? map[it.slug] : null;
            if (!saved) return it;
            return { ...it, src: saved, type: isVideoUrl(saved) ? 'video' : 'image' };
          }));
        }
        if (settings.loaderBackgroundImage) {
          setLoaderBg((prev) => [{ ...prev[0], src: settings.loaderBackgroundImage as string, type: isVideoUrl(settings.loaderBackgroundImage as string) ? 'video' : 'image' }]);
        }
      } catch {
        if (!cancelled) setBgSyncError('Backend-тэй холбогдож чадсангүй — локал жишээ өгөгдөл харагдаж байна.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [bgEditOpen, setBgEditOpen] = useState(false);
  const [bgEditKind, setBgEditKind] = useState<'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader'>('cat');
  const [bgEditIdx, setBgEditIdx] = useState(-1);
  const [bgDraftType, setBgDraftType] = useState<'image' | 'video'>('image');
  const [bgDraftSrc, setBgDraftSrc] = useState('');

  const pendingPlaces = PLACE_REQS.filter((_, i) => !placeDecisions[i]).length;
  const pendingEvents = EVENT_REQS.filter((_, i) => !eventDecisions[i]).length;

  const decidePlace = (i: number, val: 'ok' | 'no') => setPlaceDecisions((d) => ({ ...d, [i]: val }));
  const decideEvent = (i: number, val: 'ok' | 'no') => setEventDecisions((d) => ({ ...d, [i]: val }));

  const openSharedForm = (kind: CreateKind) => { setSharedFormKind(kind); setSharedFormOpen(true); };

  const onSharedSubmit = (data: CreateFormData) => {
    if (data.kind === 'place') {
      setCreatedPlaces((s) => [{ name: data.name, cat: data.catName || '', aimag: data.aimag, access: data.access, desc: data.desc || data.sub || data.catName || '', img: data.images[0] || '' }, ...s]);
    } else if (data.kind === 'scenic') {
      const loc = data.lat != null ? data.lat.toFixed(3) + ', ' + data.lng!.toFixed(3) : data.aimag;
      setScenicList((s) => [{ name: data.name, desc: data.desc, icon: data.icon || '🏔️', aimag: loc, img: data.images[0] || '1470071459604-3b5ec3a7fe05' }, ...s]);
    } else {
      let day = '01', mon = '7-р сар';
      if (data.date) { const d = new Date(data.date); if (!isNaN(+d)) { day = String(d.getDate()).padStart(2, '0'); mon = (d.getMonth() + 1) + '-р сар'; } }
      const meta = [data.time, data.desc, 'Хамгийн ихдээ ' + data.max + ' хүн'].filter(Boolean).join(' · ');
      setAdminEvents((s) => [{ name: data.name, day, mon, tag: 'Эвент', aimag: data.aimag, meta, img: data.images[0] || '1533105079780-92b9be482077' }, ...s]);
    }
    setSharedFormOpen(false);
  };

  const bgArrFor = (kind: 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader') => (kind === 'aimag' ? aimagBg : kind === 'about' ? aboutBg : kind === 'home' ? homeBg : kind === 'flag' ? flagBg : kind === 'suggest' ? suggestBg : kind === 'loader' ? loaderBg : catBg);
  const bgSetterFor = (kind: 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader') => (kind === 'aimag' ? setAimagBg : kind === 'about' ? setAboutBg : kind === 'home' ? setHomeBg : kind === 'flag' ? setFlagBg : kind === 'suggest' ? setSuggestBg : kind === 'loader' ? setLoaderBg : setCatBg);
  const bgLabelFor = (kind: 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader') => (kind === 'aimag' ? 'Аймгийн фон' : kind === 'about' ? 'Тухай хуудасны фон' : kind === 'home' ? 'Нүүр хуудасны фон' : kind === 'flag' ? 'Монгол улсын дэлбээ' : kind === 'suggest' ? 'Санал болгохын фон' : kind === 'loader' ? 'Ачаалж буй дэлгэцийн фон' : 'Ангиллын фон');

  const openBgEdit = (kind: 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader', idx: number) => {
    const cur = bgArrFor(kind)[idx];
    setBgEditKind(kind); setBgEditIdx(idx); setBgDraftType(cur.type); setBgDraftSrc(cur.src); setBgEditOpen(true);
  };
  const saveBg = async () => {
    if (bgEditIdx < 0) { setBgEditOpen(false); return; }
    const item = bgArrFor(bgEditKind)[bgEditIdx];
    try {
      if (bgEditKind === 'cat' && item.id) await apiPatch(`/categories/${item.id}`, { image: bgDraftSrc });
      else if (bgEditKind === 'aimag' && item.id) await apiPatch(`/aimags/${item.id}`, { backgroundImage: bgDraftSrc });
      else if (bgEditKind === 'about') await apiPut('/settings', { aboutBackgroundImage: bgDraftSrc });
      else if (bgEditKind === 'home') await apiPut('/settings', { homeBackgroundImage: bgDraftSrc });
      else if (bgEditKind === 'flag') await apiPut('/settings', { mongoliaFlagImage: bgDraftSrc });
      else if (bgEditKind === 'loader') await apiPut('/settings', { loaderBackgroundImage: bgDraftSrc });
      else if (bgEditKind === 'suggest' && item.slug) {
        const map: Record<string, string> = {};
        suggestBg.forEach((it) => { if (it.slug) map[it.slug] = it.src; });
        map[item.slug] = bgDraftSrc;
        await apiPut('/settings', { suggestBackgroundImages: map });
      }
      const setArr = bgSetterFor(bgEditKind);
      setArr((arr) => arr.map((it, i) => (i === bgEditIdx ? { ...it, type: bgDraftType, src: bgDraftSrc } : it)));
      setBgEditOpen(false);
    } catch (err) {
      alert('Хадгалахад алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  // Uploads straight to Cloudinary (via the backend) so the resulting URL is a
  // real, persistent link — not a local object/data URL that vanishes on refresh.
  const onBgFile = (asVideo: boolean) => async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    setBgUploading(true);
    try {
      const url = await uploadImage(f, 'backgrounds');
      setBgDraftType(asVideo ? 'video' : 'image');
      setBgDraftSrc(url);
    } catch (err) {
      alert('Оруулахад алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBgUploading(false);
    }
  };

  const openAdForm = () => { setAdEditIdx(-1); setAdTitle(''); setAdDesc(''); setAdFrom(''); setAdTo(''); setAdFormOpen(true); };
  const editAd = (i: number) => { const a = ads[i]; setAdEditIdx(i); setAdTitle(a.title); setAdDesc(a.desc); setAdFrom(a.from); setAdTo(a.to); setAdFormOpen(true); };
  const saveAd = () => {
    if (!adTitle.trim()) { setAdFormOpen(false); return; }
    if (adEditIdx >= 0) setAds((arr) => arr.map((a, i) => (i === adEditIdx ? { ...a, title: adTitle, desc: adDesc, from: adFrom, to: adTo } : a)));
    else setAds((arr) => [{ title: adTitle, desc: adDesc, img: '1441974231531-c6227db76b6e', from: adFrom, to: adTo, views: 0, active: true }, ...arr]);
    setAdFormOpen(false);
  };
  const toggleAd = (i: number) => setAds((arr) => arr.map((a, k) => (k === i ? { ...a, active: !a.active } : a)));

  const openSuggestForm = () => { setSgName(''); setSgDesc(''); setSgImg(''); setSgErr(false); setSuggestFormOpen(true); };
  const saveSuggestCard = () => {
    if (!sgName.trim()) { setSgErr(true); return; }
    setSuggestCollections((sc) => ({
      ...sc,
      [suggestActiveSlug]: [{ name: sgName.trim(), desc: sgDesc.trim() || '—', img: sgImg || '1489599849927-2ee91cede3ba' }, ...(sc[suggestActiveSlug] || [])],
    }));
    setSuggestFormOpen(false); setSgName(''); setSgDesc(''); setSgImg(''); setSgErr(false);
  };
  const onSgImg = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setSgImg(String(r.result)); r.readAsDataURL(f);
  };

  const fmtD = (d: string) => (d ? d.slice(5).replace('-', '/') : '—');

  const stats = [
    { label: 'Нийт газар', value: '128', sub: '+6 энэ долоо хоногт', color: '#f2ede3' },
    { label: 'Хүлээгдэж буй хүсэлт', value: String(pendingPlaces + pendingEvents), sub: 'газар + эвент', color: 'var(--accent,#E8B84B)' },
    { label: 'Идэвхтэй зар', value: String(ads.filter((a) => a.active).length), sub: 'нийт ' + ads.length + ' зар', color: '#a8d5a2' },
    { label: 'Хэрэглэгчид', value: '2,340', sub: '+112 энэ сард', color: '#8ab4f8' },
  ];

  const recentReqs = [
    { name: 'Sky Lounge 21', kind: 'газар · Хоол & Кофе', when: '14:02', dot: 'var(--accent,#E8B84B)' },
    { name: 'Jazz Night', kind: 'эвент · Хөгжим', when: '12:40', dot: '#8ab4f8' },
    { name: 'Говь кэмп', kind: 'газар · Аялал', when: 'өчигдөр', dot: 'var(--accent,#E8B84B)' },
    { name: 'Street Food Fest', kind: 'эвент · Хоол', when: 'өчигдөр', dot: '#8ab4f8' },
  ];

  const activeAds = ads.filter((a) => a.active);

  const rowLabel = css('font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,237,227,.5);margin-bottom:12px');
  const catBadge = css('font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:rgba(242,237,227,.8)');
  const inputStyle = { ...css('font-family:inherit;color:#f2ede3;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);border-radius:11px;padding:10px 13px;outline:none'), fontSize: isMobile ? '16px' : '13px' };

  return (
    <div style={{ ...css(isMobile ? 'display:flex;flex-direction:column;min-height:100vh;color:#f2ede3' : 'display:flex;height:100vh;overflow:hidden;color:#f2ede3'), background: '#0b0a08', fontFamily: "'Manrope', sans-serif" }}>
      <aside style={isMobile
        ? css('width:100%;flex-shrink:0;display:flex;align-items:center;gap:6px;padding:10px 12px;box-sizing:border-box;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.08);overflow-x:auto')
        : { ...css('flex-shrink:0;display:flex;flex-direction:column;box-sizing:border-box;background:rgba(255,255,255,.03);border-right:1px solid rgba(255,255,255,.08);transition:width .2s ease'), width: sbCollapsed ? 76 : 240, padding: sbCollapsed ? '26px 12px' : '26px 16px' }
      }>
        <div style={css(`display:flex;align-items:center;gap:8px;flex-shrink:0;padding:${isMobile ? '0 10px 0 0' : sbCollapsed ? '0 0 22px' : '0 4px 22px'};justify-content:${!isMobile && sbCollapsed ? 'center' : 'flex-start'}`)}>
          <div style={css('width:32px;height:32px;border-radius:9px;background:var(--accent,#E8B84B);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;color:#132a1f;flex-shrink:0')}>b</div>
          {!isMobile && !sbCollapsed && (
            <div style={css('flex:1;min-width:0')}>
              <div style={css('font-size:14.5px;font-weight:800;letter-spacing:-0.02em')}>big bang</div>
              <div style={css('font-family:ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(242,237,227,.45)')}>admin panel</div>
            </div>
          )}
          {!isMobile && (
            <Hover as="button" onClick={() => setSbCollapsed((v) => !v)} title={sbCollapsed ? 'Цэсийг дэлгэх' : 'Цэсийг хумих'} s="cursor:pointer;font-family:inherit;flex-shrink:0;width:26px;height:26px;border-radius:8px;border:none;background:transparent;color:rgba(242,237,227,.5);display:flex;align-items:center;justify-content:center;transition:all .2s" h="background:rgba(255,255,255,.08);color:rgba(242,237,227,.9)">
              {sbCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </Hover>
          )}
        </div>

        {isMobile ? (
          NAV.map((n) => {
            const on = tab === n.key;
            const badge = n.key === 'places' ? pendingPlaces : n.key === 'events' ? pendingEvents : 0;
            return (
              <Hover key={n.key} as="button" onClick={() => setTab(n.key)} s={`cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;text-align:left;white-space:nowrap;flex-shrink:0;padding:9px 12px;border-radius:11px;border:none;background:${on ? 'var(--accent,#E8B84B)' : 'transparent'};color:${on ? '#132a1f' : 'rgba(242,237,227,.8)'};transition:all .2s`} h={on ? undefined : 'background:rgba(255,255,255,.07)'}>
                <n.icon size={16} />
                <span>{n.label}</span>
                {badge > 0 && <span style={{ ...css('margin-left:auto;font-size:10.5px;font-weight:800;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:999px'), background: on ? 'rgba(0,0,0,.25)' : 'rgba(232, 184, 75,.2)', color: on ? '#132a1f' : 'var(--accent,#E8B84B)' }}>{badge}</span>}
              </Hover>
            );
          })
        ) : (
          NAV_GROUPS.map((g) => (
            <div key={g.label} style={css('display:flex;flex-direction:column;gap:2px;margin-bottom:10px')}>
              {!sbCollapsed && <div style={css('font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:rgba(242,237,227,.35);padding:8px 10px 6px')}>{g.label}</div>}
              {g.keys.map((k) => {
                const n = NAV.find((x) => x.key === k)!;
                const on = tab === n.key;
                const badge = n.key === 'places' ? pendingPlaces : n.key === 'events' ? pendingEvents : 0;
                return (
                  <Hover key={n.key} as="button" onClick={() => setTab(n.key)} title={sbCollapsed ? n.label : undefined}
                    s={`cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:11px;justify-content:${sbCollapsed ? 'center' : 'flex-start'};font-size:13px;font-weight:700;text-align:left;white-space:nowrap;padding:${sbCollapsed ? '11px' : '11px 14px'};border-radius:11px;border:none;background:${on ? 'var(--accent,#E8B84B)' : 'transparent'};color:${on ? '#132a1f' : 'rgba(242,237,227,.8)'};transition:all .2s;position:relative`}
                    h={on ? undefined : 'background:rgba(255,255,255,.07)'}>
                    <n.icon size={16} />
                    {!sbCollapsed && <span>{n.label}</span>}
                    {badge > 0 && (sbCollapsed
                      ? <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: on ? '#132a1f' : 'var(--accent,#E8B84B)' }} />
                      : <span style={{ ...css('margin-left:auto;font-size:10.5px;font-weight:800;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:999px'), background: on ? 'rgba(0,0,0,.25)' : 'rgba(232, 184, 75,.2)', color: on ? '#132a1f' : 'var(--accent,#E8B84B)' }}>{badge}</span>)}
                  </Hover>
                );
              })}
            </div>
          ))
        )}

        {!isMobile && (
          <div style={css(`margin-top:auto;display:flex;align-items:center;gap:10px;padding:12px 10px;border-top:1px solid rgba(255,255,255,.08);justify-content:${sbCollapsed ? 'center' : 'flex-start'}`)}>
            <div style={css('width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#E8B84B,#b57f42);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#132a1f;flex-shrink:0')}>А</div>
            {!sbCollapsed && (
              <div>
                <div style={css('font-size:12px;font-weight:700')}>Админ</div>
                <div style={css('font-size:10.5px;color:rgba(242,237,227,.45)')}>admin@bigbang.mn</div>
              </div>
            )}
          </div>
        )}
      </aside>

      <main style={css(`flex:1;overflow:auto;box-sizing:border-box;padding:${isMobile ? '16px 16px 40px' : '32px 36px 60px'}`)}>
        <div style={css('display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;flex-wrap:wrap')}>
          {tab !== 'dash' ? (
            <div style={{ ...css('position:relative;flex:1;min-width:200px;max-width:340px'), }}>
              <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(242,237,227,.4)', pointerEvents: 'none' }} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={SEARCH_PLACEHOLDER[tab] || 'Хайх...'}
                style={{ ...css('width:100%;box-sizing:border-box;font-family:inherit;color:#f2ede3;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:9px 13px 9px 36px;outline:none'), fontSize: isMobile ? '16px' : '12.5px' }}
              />
              {!isMobile && (
                <span style={css('position:absolute;right:10px;top:50%;transform:translateY(-50%);font-family:ui-monospace,Menlo,monospace;font-size:10px;font-weight:700;color:rgba(242,237,227,.35);border:1px solid rgba(255,255,255,.16);border-radius:5px;padding:2px 6px;pointer-events:none')}>⌘K</span>
              )}
            </div>
          ) : <div />}
          {tab === 'ads' && <Hover as="button" onClick={openAdForm} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-2px)"><span style={css('font-size:15px;line-height:1')}>+</span>Зар нэмэх</Hover>}
          {tab === 'places' && <Hover as="button" onClick={() => openSharedForm('place')} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-2px)"><span style={css('font-size:15px;line-height:1')}>+</span>Газар нэмэх</Hover>}
          {tab === 'scenic' && <Hover as="button" onClick={() => openSharedForm('scenic')} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-2px)"><span style={css('font-size:15px;line-height:1')}>+</span>Үзэсгэлэнт газар үүсгэх</Hover>}
          {tab === 'suggests' && <Hover as="button" onClick={openSuggestForm} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-2px)"><span style={css('font-size:15px;line-height:1')}>+</span>Дэд карт нэмэх</Hover>}
          {tab === 'events' && <Hover as="button" onClick={() => openSharedForm('event')} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;padding:8px 16px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-2px)"><span style={css('font-size:15px;line-height:1')}>+</span>Эвент үүсгэх</Hover>}
        </div>

        {tab === 'dash' && (
          <>
            <div style={{ ...css('display:grid;gap:16px'), gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
              {stats.map((s, i) => (
                <div key={i} style={css('border:1px solid rgba(255,255,255,.1);border-radius:13px;padding:13px 15px;background:rgba(255,255,255,.03)')}>
                  <div style={css('font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(242,237,227,.5)')}>{s.label}</div>
                  <div style={{ ...css('font-size:22px;font-weight:800;letter-spacing:-0.03em;margin-top:4px'), color: s.color }}>{s.value}</div>
                  <div style={css('font-size:10.5px;color:rgba(242,237,227,.45);margin-top:2px')}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ ...css('display:grid;gap:16px;margin-top:16px'), gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div style={css('border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.03);overflow:hidden')}>
                <div style={css('padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13.5px;font-weight:800')}>Сүүлд ирсэн хүсэлтүүд</div>
                {recentReqs.map((r, i) => (
                  <Hover key={i} as="div" s="display:flex;align-items:center;gap:12px;padding:11px 18px;border-bottom:1px solid rgba(255,255,255,.05);font-size:12.5px" h="background:rgba(255,255,255,.04)">
                    <span style={{ ...css('width:6px;height:6px;border-radius:50%;flex-shrink:0'), background: r.dot }}></span>
                    <span style={css('font-weight:700')}>{r.name}</span>
                    <span style={css('color:rgba(242,237,227,.45)')}>{r.kind}</span>
                    <span style={css('margin-left:auto;color:rgba(242,237,227,.4);font-size:11.5px')}>{r.when}</span>
                  </Hover>
                ))}
              </div>
              <div style={css('border:1px solid rgba(255,255,255,.1);border-radius:16px;background:rgba(255,255,255,.03);overflow:hidden')}>
                <div style={css('padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08);font-size:13.5px;font-weight:800')}>Идэвхтэй зарууд</div>
                {activeAds.map((a, i) => (
                  <Hover key={i} as="div" s="display:flex;align-items:center;gap:12px;padding:11px 18px;border-bottom:1px solid rgba(255,255,255,.05);font-size:12.5px" h="background:rgba(255,255,255,.04)">
                    <div style={{ ...css('width:44px;height:30px;border-radius:6px;background-size:cover;background-position:center;flex-shrink:0'), backgroundImage: thumb(a.img) }}></div>
                    <span style={css('font-weight:700')}>{a.title}</span>
                    <span style={css('margin-left:auto;color:var(--accent,#E8B84B);font-weight:800;font-size:11.5px')}>{a.views.toLocaleString()} үзэлт</span>
                  </Hover>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'places' && (
          <>
            {createdPlaces.length > 0 && (
              <div style={css('margin-bottom:22px')}>
                <div style={rowLabel}>Админаас нэмсэн газрууд</div>
                <div style={css('display:flex;flex-direction:column;gap:12px')}>
                  {createdPlaces.filter((p) => matches(p.name)).map((p, i) => (
                    <div key={i} style={css('display:flex;gap:16px;align-items:center;border:1px solid rgba(232, 184, 75,.28);border-radius:16px;padding:14px;background:rgba(232, 184, 75,.05)')}>
                      <div style={{ ...css('width:120px;height:74px;border-radius:11px;background-size:cover;background-position:center;flex-shrink:0'), backgroundImage: thumb(p.img) }}></div>
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css('display:flex;align-items:center;gap:10px')}>
                          <span style={css('font-size:15px;font-weight:800')}>{p.name}</span>
                          <span style={catBadge}>{p.cat}</span>
                          {p.access && <span title="Тусгай хэрэгцээт хүнд ээлтэй" style={css('display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:rgba(0,0,0,.5);color:#8fd6c6;border:1px solid rgba(255,255,255,.26)')}><Accessibility size={13} /></span>}
                        </div>
                        <div style={css('font-size:12px;color:rgba(242,237,227,.55);margin-top:4px')}>{p.aimag} · {p.desc}</div>
                      </div>
                      <span style={css('flex-shrink:0;font-size:11.5px;font-weight:800;padding:6px 15px;border-radius:999px;background:rgba(168,213,162,.15);color:#a8d5a2')}>Нийтлэгдсэн ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={rowLabel}>Host-уудын илгээсэн хүсэлт</div>
            <div style={css('display:flex;flex-direction:column;gap:14px')}>
              {PLACE_REQS.map((p, i) => ({ p, i })).filter(({ p }) => matches(p.name)).map(({ p, i }) => {
                const dec = placeDecisions[i];
                return (
                  <Hover key={i} as="div" s="display:flex;gap:16px;align-items:center;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:14px;background:rgba(255,255,255,.03);transition:border-color .2s" h="border-color:rgba(242,237,227,.28)">
                    <div style={{ ...css('width:120px;height:84px;border-radius:11px;background-size:cover;background-position:center;flex-shrink:0'), backgroundImage: thumb(p.img) }}></div>
                    <div style={css('flex:1;min-width:0')}>
                      <div style={css('display:flex;align-items:center;gap:10px')}>
                        <span style={css('font-size:15px;font-weight:800')}>{p.name}</span>
                        <span style={catBadge}>{p.cat}</span>
                      </div>
                      <div style={css('font-size:12px;color:rgba(242,237,227,.55);margin-top:4px')}>{p.aimag} · {p.host} · {p.when}</div>
                      <div style={css('font-size:12px;color:rgba(242,237,227,.45);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.desc}</div>
                    </div>
                    {!dec && (
                      <div style={css('display:flex;gap:8px;flex-shrink:0')}>
                        <button onClick={() => decidePlace(i, 'ok')} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:8px 18px;border-radius:999px;border:none;background:#a8d5a2;color:#132a1f')}>Батлах</button>
                        <button onClick={() => decidePlace(i, 'no')} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:8px 18px;border-radius:999px;border:1px solid rgba(240,138,138,.5);background:transparent;color:#f08a8a')}>Татгалзах</button>
                      </div>
                    )}
                    {dec && <span style={{ ...css('flex-shrink:0;font-size:12px;font-weight:800;padding:7px 16px;border-radius:999px'), background: dec === 'ok' ? 'rgba(168,213,162,.15)' : 'rgba(240,138,138,.14)', color: dec === 'ok' ? '#a8d5a2' : '#f08a8a' }}>{dec === 'ok' ? 'Батлагдсан ✓' : 'Татгалзсан'}</span>}
                  </Hover>
                );
              })}
            </div>
          </>
        )}

        {tab === 'scenic' && (
          <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px')}>
            {scenicList.filter((s) => matches(s.name)).map((s, i) => (
              <div key={i} style={css('border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.03)')}>
                <div style={{ ...css('position:relative;aspect-ratio:16/9;background-size:cover;background-position:center'), backgroundImage: thumb(s.img) }}>
                  <span style={css('position:absolute;left:10px;top:10px;font-size:18px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:10px;background:rgba(0,0,0,.55);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.24)')}>{s.icon}</span>
                  <span style={css('position:absolute;right:10px;top:10px;font-size:10px;font-weight:800;letter-spacing:.05em;padding:3px 10px;border-radius:999px;background:rgba(168,213,162,.85);color:#132a1f')}>Нийтлэгдсэн</span>
                </div>
                <div style={css('padding:13px 15px 15px')}>
                  <div style={css('font-size:14px;font-weight:800')}>{s.name}</div>
                  <div style={css('font-size:11.5px;color:rgba(242,237,227,.5);margin-top:3px')}>{s.aimag} · {s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'events' && (
          <>
            {adminEvents.length > 0 && (
              <div style={css('margin-bottom:22px')}>
                <div style={rowLabel}>Админаас үүсгэсэн эвентүүд</div>
                <div style={css('display:flex;flex-direction:column;gap:12px')}>
                  {adminEvents.filter((ev) => matches(ev.name)).map((ev, i) => (
                    <div key={i} style={css('display:flex;gap:16px;align-items:center;border:1px solid rgba(232, 184, 75,.28);border-radius:16px;padding:14px;background:rgba(232, 184, 75,.05)')}>
                      <div style={{ ...css('width:96px;height:64px;border-radius:11px;background-size:cover;background-position:center;flex-shrink:0'), backgroundImage: thumb(ev.img) }}></div>
                      <div style={css('width:56px;flex-shrink:0;text-align:center;padding:8px 0;border-radius:11px;background:rgba(232, 184, 75,.14);border:1px solid rgba(232, 184, 75,.35)')}>
                        <div style={css('font-size:20px;font-weight:800;color:var(--accent,#E8B84B);line-height:1')}>{ev.day}</div>
                        <div style={css('font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(242,237,227,.6);margin-top:3px')}>{ev.mon}</div>
                      </div>
                      <div style={css('flex:1;min-width:0')}>
                        <div style={css('display:flex;align-items:center;gap:10px')}>
                          <span style={css('font-size:15px;font-weight:800')}>{ev.name}</span>
                          <span style={catBadge}>{ev.tag}</span>
                        </div>
                        <div style={css('font-size:12px;color:rgba(242,237,227,.55);margin-top:4px')}>{ev.aimag} · {ev.meta}</div>
                      </div>
                      <span style={css('flex-shrink:0;font-size:11.5px;font-weight:800;padding:6px 15px;border-radius:999px;background:rgba(168,213,162,.15);color:#a8d5a2')}>Нийтлэгдсэн ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={rowLabel}>Host-уудын илгээсэн хүсэлт</div>
            <div style={css('display:flex;flex-direction:column;gap:14px')}>
              {EVENT_REQS.map((ev, i) => ({ ev, i })).filter(({ ev }) => matches(ev.name)).map(({ ev, i }) => {
                const dec = eventDecisions[i];
                return (
                  <Hover key={i} as="div" s="display:flex;gap:16px;align-items:center;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:14px;background:rgba(255,255,255,.03);transition:border-color .2s" h="border-color:rgba(242,237,227,.28)">
                    <div style={css('width:56px;flex-shrink:0;text-align:center;padding:8px 0;border-radius:11px;background:rgba(232, 184, 75,.12);border:1px solid rgba(232, 184, 75,.3)')}>
                      <div style={css('font-size:20px;font-weight:800;color:var(--accent,#E8B84B);line-height:1')}>{ev.day}</div>
                      <div style={css('font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(242,237,227,.6);margin-top:3px')}>{ev.mon}</div>
                    </div>
                    <div style={css('flex:1;min-width:0')}>
                      <div style={css('display:flex;align-items:center;gap:10px')}>
                        <span style={css('font-size:15px;font-weight:800')}>{ev.name}</span>
                        <span style={catBadge}>{ev.tag}</span>
                      </div>
                      <div style={css('font-size:12px;color:rgba(242,237,227,.55);margin-top:4px')}>{ev.aimag} · {ev.host} · {ev.meta}</div>
                    </div>
                    {!dec && (
                      <div style={css('display:flex;gap:8px;flex-shrink:0')}>
                        <button onClick={() => decideEvent(i, 'ok')} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:8px 18px;border-radius:999px;border:none;background:#a8d5a2;color:#132a1f')}>Зөвшөөрөх</button>
                        <button onClick={() => decideEvent(i, 'no')} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:8px 18px;border-radius:999px;border:1px solid rgba(240,138,138,.5);background:transparent;color:#f08a8a')}>Татгалзах</button>
                      </div>
                    )}
                    {dec && <span style={{ ...css('flex-shrink:0;font-size:12px;font-weight:800;padding:7px 16px;border-radius:999px'), background: dec === 'ok' ? 'rgba(168,213,162,.15)' : 'rgba(240,138,138,.14)', color: dec === 'ok' ? '#a8d5a2' : '#f08a8a' }}>{dec === 'ok' ? 'Зөвшөөрсөн ✓' : 'Татгалзсан'}</span>}
                  </Hover>
                );
              })}
            </div>
          </>
        )}

        {tab === 'suggests' && (
          <>
            <div style={css('font-size:12px;color:rgba(242,237,227,.5);margin-bottom:16px;max-width:640px;line-height:1.5')}>
              Гол апп дээрх "Санал болгох" карт бүрийг дарахад доор харагдах дэд картуудыг ангилал тус бүрээр удирдана.
            </div>
            <div style={css('display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap')}>
              {SUGGESTS.map((s) => {
                const on = suggestActiveSlug === s.slug;
                return (
                  <button key={s.slug} onClick={() => setSuggestActiveSlug(s.slug)} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 18px;border-radius:999px;transition:all .2s'), border: `1px solid ${on ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: on ? 'var(--accent,#E8B84B)' : 'transparent', color: on ? '#132a1f' : 'rgba(242,237,227,.8)' }}>{s.title} · {(suggestCollections[s.slug] || []).length}</button>
                );
              })}
            </div>
            <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px')}>
              {(suggestCollections[suggestActiveSlug] || []).filter((it) => matches(it.name)).map((it, i) => (
                <div key={i} style={css('border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.03)')}>
                  <div style={{ ...css('position:relative;aspect-ratio:16/10;background-size:cover;background-position:center'), backgroundImage: thumb(it.img) }}></div>
                  <div style={css('padding:13px 15px 15px')}>
                    <div style={css('font-size:14px;font-weight:800')}>{it.name}</div>
                    <div style={css('font-size:11.5px;color:rgba(242,237,227,.5);margin-top:3px')}>{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'bg' && (
          <>
            <div style={css('display:flex;gap:10px;margin-bottom:22px;flex-wrap:wrap')}>
              <button onClick={() => setBgSub('cat')} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;transition:all .2s'), border: `1px solid ${bgSub === 'cat' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'cat' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'cat' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Ангиллын фон · {catBg.length}</button>
              <button onClick={() => setBgSub('aimag')} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;transition:all .2s'), border: `1px solid ${bgSub === 'aimag' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'aimag' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'aimag' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Аймгийн фон · {aimagBg.length}</button>
              <button onClick={() => setBgSub('about')} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;transition:all .2s'), border: `1px solid ${bgSub === 'about' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'about' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'about' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Тухай хуудасны фон · {aboutBg.length}</button>
              <button onClick={() => setBgSub('home')} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;transition:all .2s'), border: `1px solid ${bgSub === 'home' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'home' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'home' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Нүүр хуудасны фон · {homeBg.length}</button>
              <button onClick={() => setBgSub('flag')} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;transition:all .2s'), border: `1px solid ${bgSub === 'flag' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'flag' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'flag' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Монголын дэлбээ (Глобус) · {flagBg.length}</button>
              <button onClick={() => setBgSub('suggest')} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;transition:all .2s'), border: `1px solid ${bgSub === 'suggest' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'suggest' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'suggest' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Санал болгохын фон · {suggestBg.length}</button>
              <button onClick={() => setBgSub('loader')} style={{ ...css('cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;transition:all .2s'), border: `1px solid ${bgSub === 'loader' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'loader' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'loader' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Ачаалж буй дэлгэцийн фон · {loaderBg.length}</button>
            </div>
            <div style={css('font-size:12px;color:rgba(242,237,227,.5);margin-bottom:16px;max-width:640px;line-height:1.5')}>
              {bgSub === 'cat' ? 'Хэрэглэгч ангилал сонгоход арын фонд харагдах зураг. Видео оруулбал автоматаар дугуйгаар тоглоно.' : bgSub === 'aimag' ? '21 аймаг + Нийслэлийн арын фон. Видео оруулбал автоматаар дугуйгаар тоглоно.' : bgSub === 'home' ? 'Ямар ч ангилал, аймаг сонгоогүй үед нүүр хуудсанд анхнаас нь харагдах фон зураг.' : bgSub === 'flag' ? '"Дэлхийн архив" 3D глобус дээр Монголыг сонгоход харагдах жинхэнэ дэлбээний зураг (зөвхөн зураг, видео биш) — оруулаагүй бол автоматаар зурсан Соёмбо харагдана.' : bgSub === 'suggest' ? 'Нүүр хуудасны "Санал болгох" том картуудын арын дэвсгэр зураг/бичлэг.' : bgSub === 'loader' ? 'Апп анх ачаалж байх үеийн Marauder\'s Map дэлгэцийн арын дэвсгэр зураг — оруулаагүй бол өнөөгийн бараан градиент харагдана.' : '"Бидний тухай" хуудасны үндсэн дэвсгэр зураг.'}
            </div>
            {bgSyncError && (
              <div style={css('font-size:11.5px;color:#f08a8a;margin-bottom:16px;padding:10px 14px;border-radius:10px;border:1px dashed rgba(240,138,138,.4);background:rgba(240,138,138,.06);max-width:640px')}>{bgSyncError}</div>
            )}
            <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px')}>
              {bgArrFor(bgSub).map((it, i) => ({ it, i })).filter(({ it }) => matches(it.name)).map(({ it, i }) => (
                <div key={i} style={css('border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.03)')}>
                  <div style={css('position:relative;aspect-ratio:16/10;overflow:hidden;background:#0b0a08')}>
                    {it.type === 'video' ? (
                      <video src={it.src} autoPlay loop muted playsInline style={css('position:absolute;inset:0;width:100%;height:100%;object-fit:cover') as any} />
                    ) : (
                      <div style={{ ...css('position:absolute;inset:0;background-size:cover;background-position:center'), backgroundImage: `url("${imgUrl(it.src, 700)}")` }}></div>
                    )}
                    <span style={css('position:absolute;left:9px;top:9px;font-size:9.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:rgba(0,0,0,.62);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.2);color:#f2ede3;display:inline-flex;align-items:center;gap:5px')}>{it.type === 'video' ? <><Film size={11} /> Бичлэг</> : <><ImageIcon size={11} /> Зураг</>}</span>
                  </div>
                  <div style={css('display:flex;align-items:center;gap:10px;padding:11px 13px')}>
                    <span style={css('flex:1;min-width:0;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{it.name}</span>
                    <Hover as="button" onClick={() => openBgEdit(bgSub, i)} s="cursor:pointer;font-family:inherit;flex-shrink:0;font-size:11.5px;font-weight:700;padding:6px 14px;border-radius:999px;border:1px solid rgba(242,237,227,.28);background:transparent;color:rgba(242,237,227,.85);transition:all .2s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">Засах</Hover>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'ads' && (
          <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px')}>
            {ads.map((a, i) => ({ a, i })).filter(({ a }) => matches(a.title)).map(({ a, i }) => (
              <div key={i} style={css('border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;background:rgba(255,255,255,.03)')}>
                <div style={{ ...css('position:relative;aspect-ratio:16/8;background-size:cover;background-position:center'), backgroundImage: thumb(a.img) }}>
                  <span style={{ ...css('position:absolute;left:10px;top:10px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:999px'), background: a.active ? 'rgba(168,213,162,.85)' : 'rgba(120,120,120,.8)', color: a.active ? '#132a1f' : '#fff' }}>{a.active ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
                </div>
                <div style={css('padding:14px 16px 16px')}>
                  <div style={css('font-size:14.5px;font-weight:800')}>{a.title}</div>
                  <div style={css('font-size:11.5px;color:rgba(242,237,227,.5);margin-top:3px')}>{fmtD(a.from)} – {fmtD(a.to)} · {a.views.toLocaleString()} үзэлт</div>
                  <div style={css('display:flex;gap:8px;margin-top:12px')}>
                    <Hover as="button" onClick={() => editAd(i)} s="cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:700;padding:7px 15px;border-radius:999px;border:1px solid rgba(242,237,227,.3);background:transparent;color:rgba(242,237,227,.85);transition:all .2s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">Засах</Hover>
                    <Hover as="button" onClick={() => toggleAd(i)} s="cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:700;padding:7px 15px;border-radius:999px;border:none;background:rgba(255,255,255,.08);color:rgba(242,237,227,.85);transition:all .2s" h="background:rgba(255,255,255,.14)">{a.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}</Hover>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {sharedFormOpen && <CreateForm kind={sharedFormKind} onClose={() => setSharedFormOpen(false)} onSubmit={onSharedSubmit} />}

      {suggestFormOpen && (
        <div onClick={() => setSuggestFormOpen(false)} style={css(`position:fixed;inset:0;z-index:60;background:rgba(6,8,12,.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:${isMobile ? '14px' : '40px'};box-sizing:border-box;animation:bbFadeUp .25s ease both`)}>
          <div onClick={(e) => e.stopPropagation()} style={css(`width:480px;max-width:100%;max-height:86vh;overflow:auto;background:#171410;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:${isMobile ? '18px 16px 20px' : '24px 26px 26px'};box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.6)`)}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:4px')}>
              <div style={css('font-size:17px;font-weight:800')}>Дэд карт нэмэх</div>
              <button onClick={() => setSuggestFormOpen(false)} style={css('cursor:pointer;font-family:inherit;font-size:17px;line-height:1;width:30px;height:30px;border-radius:50%;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.75)')}>×</button>
            </div>
            <div style={css('font-size:12px;color:rgba(242,237,227,.5);margin-bottom:18px')}>{SUGGESTS.find((s) => s.slug === suggestActiveSlug)?.title}</div>
            <div style={css('display:flex;flex-direction:column;gap:14px')}>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:11.5px;font-weight:700;color:rgba(242,237,227,.65)')}>Нэр</span>
                <input value={sgName} onChange={(e) => setSgName(e.target.value)} placeholder="Ж: Хосоороо үзэх кино" style={inputStyle} />
              </label>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:11.5px;font-weight:700;color:rgba(242,237,227,.65)')}>Тайлбар</span>
                <input value={sgDesc} onChange={(e) => setSgDesc(e.target.value)} placeholder="Энэ картын тайлбар" style={inputStyle} />
              </label>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:11.5px;font-weight:700;color:rgba(242,237,227,.65)')}>Зураг</span>
                <input type="file" accept="image/*" onChange={onSgImg} style={css(`font-family:inherit;font-size:${isMobile ? '14' : '12'}px;color:rgba(242,237,227,.7)`)} />
              </label>
              {sgErr && <span style={css('font-size:11.5px;font-weight:700;color:#f08a8a')}>Нэр оруулна уу</span>}
              <button onClick={saveSuggestCard} style={css('cursor:pointer;font-family:inherit;font-size:13px;font-weight:800;padding:12px;border-radius:12px;border:none;background:var(--accent,#E8B84B);color:#132a1f;margin-top:4px')}>Нийтлэх</button>
            </div>
          </div>
        </div>
      )}

      {adFormOpen && (
        <div onClick={() => setAdFormOpen(false)} style={css(`position:fixed;inset:0;z-index:60;background:rgba(6,8,12,.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:${isMobile ? '14px' : '40px'};box-sizing:border-box;animation:bbFadeUp .25s ease both`)}>
          <div onClick={(e) => e.stopPropagation()} style={css(`width:480px;max-width:100%;max-height:86vh;overflow:auto;background:#171410;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:${isMobile ? '18px 16px 20px' : '24px 26px 26px'};box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.6)`)}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:18px')}>
              <div style={css('font-size:17px;font-weight:800')}>{adEditIdx >= 0 ? 'Зар засах' : 'Шинэ зар оруулах'}</div>
              <button onClick={() => setAdFormOpen(false)} style={css('cursor:pointer;font-family:inherit;font-size:17px;line-height:1;width:30px;height:30px;border-radius:50%;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.75)')}>×</button>
            </div>
            <div style={css('display:flex;flex-direction:column;gap:14px')}>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:11.5px;font-weight:700;color:rgba(242,237,227,.65)')}>Зарын гарчиг</span>
                <input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="Ж: Шинэ жилийн онцгой санал" style={inputStyle} />
              </label>
              <label style={css('display:flex;flex-direction:column;gap:6px')}>
                <span style={css('font-size:11.5px;font-weight:700;color:rgba(242,237,227,.65)')}>Тайлбар</span>
                <textarea value={adDesc} onChange={(e) => setAdDesc(e.target.value)} rows={3} placeholder="Зарын дэлгэрэнгүй..." style={{ ...css('font-family:inherit;color:#f2ede3;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:10px 13px;outline:none;resize:vertical'), fontSize: isMobile ? '16px' : '13px' }}></textarea>
              </label>
              <div style={{ ...css('display:grid;gap:12px'), gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:11.5px;font-weight:700;color:rgba(242,237,227,.65)')}>Эхлэх огноо</span>
                  <input type="date" value={adFrom} onChange={(e) => setAdFrom(e.target.value)} style={{ ...css('font-family:inherit;color:#f2ede3;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:9px 13px;outline:none;color-scheme:dark'), fontSize: isMobile ? '16px' : '13px' }} />
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:11.5px;font-weight:700;color:rgba(242,237,227,.65)')}>Дуусах огноо</span>
                  <input type="date" value={adTo} onChange={(e) => setAdTo(e.target.value)} style={{ ...css('font-family:inherit;color:#f2ede3;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:9px 13px;outline:none;color-scheme:dark'), fontSize: isMobile ? '16px' : '13px' }} />
                </label>
              </div>
              <button onClick={saveAd} style={css('cursor:pointer;font-family:inherit;font-size:13px;font-weight:800;padding:12px;border-radius:12px;border:none;background:var(--accent,#E8B84B);color:#132a1f;margin-top:4px')}>{adEditIdx >= 0 ? 'Хадгалах' : 'Зар нийтлэх'}</button>
            </div>
          </div>
        </div>
      )}

      {bgEditOpen && (
        <div onClick={() => setBgEditOpen(false)} style={css(`position:fixed;inset:0;z-index:60;background:rgba(6,8,12,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:${isMobile ? '14px' : '40px'};box-sizing:border-box;animation:bbFadeUp .25s ease both`)}>
          <div onClick={(e) => e.stopPropagation()} style={css(`width:560px;max-width:100%;max-height:90vh;overflow:auto;background:#171410;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:${isMobile ? '18px 16px 20px' : '26px 28px 28px'};box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.6)`)}>
            <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:4px')}>
              <div>
                <div style={css('font-size:18px;font-weight:800;letter-spacing:-0.02em')}>Фон солих</div>
                <div style={css('font-size:12.5px;color:rgba(242,237,227,.55);margin-top:4px')}>{bgArrFor(bgEditKind)[bgEditIdx]?.name} · {bgLabelFor(bgEditKind)}</div>
              </div>
              <button onClick={() => setBgEditOpen(false)} style={css('cursor:pointer;font-family:inherit;font-size:20px;line-height:1;width:34px;height:34px;border-radius:50%;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.7);flex-shrink:0')}>×</button>
            </div>

            <div style={css('position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.12);background:#0b0a08;margin:18px 0 16px')}>
              {bgDraftType === 'video' ? (
                <video src={bgDraftSrc} autoPlay loop muted playsInline style={css('position:absolute;inset:0;width:100%;height:100%;object-fit:cover') as any} />
              ) : (
                <div style={{ ...css('position:absolute;inset:0;background-size:cover;background-position:center'), backgroundImage: `url("${imgUrl(bgDraftSrc || '1470071459604-3b5ec3a7fe05', 1200)}")` }}></div>
              )}
              {bgUploading && (
                <div style={css('position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);font-size:12.5px;font-weight:700;color:#f2ede3')}>Cloudinary руу оруулж байна…</div>
              )}
            </div>

            <div style={{ ...css('display:grid;gap:12px;margin-bottom:14px'), gridTemplateColumns: (bgEditKind === 'flag' || isMobile) ? '1fr' : '1fr 1fr' }}>
              <Hover as="label" s="display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:12px;border:1.5px dashed rgba(242,237,227,.28);background:rgba(255,255,255,.03);cursor:pointer;font-size:12.5px;font-weight:700;color:rgba(242,237,227,.85);transition:border-color .2s" h="border-color:var(--accent,#E8B84B)">
                <ImageIcon size={15} /> Зураг оруулах
                <input type="file" accept="image/*" onChange={onBgFile(false)} style={{ display: 'none' }} />
              </Hover>
              {bgEditKind !== 'flag' && (
                <Hover as="label" s="display:flex;align-items:center;justify-content:center;gap:8px;height:52px;border-radius:12px;border:1.5px dashed rgba(242,237,227,.28);background:rgba(255,255,255,.03);cursor:pointer;font-size:12.5px;font-weight:700;color:rgba(242,237,227,.85);transition:border-color .2s" h="border-color:var(--accent,#E8B84B)">
                  <Film size={15} /> Бичлэг оруулах
                  <input type="file" accept="video/*" onChange={onBgFile(true)} style={{ display: 'none' }} />
                </Hover>
              )}
            </div>

            <div style={css('display:flex;align-items:flex-start;gap:9px;font-size:11.5px;line-height:1.5;color:rgba(242,237,227,.6);padding:11px 13px;border-radius:11px;background:rgba(232, 184, 75,.06);border:1px solid rgba(232, 184, 75,.22);margin-bottom:20px')}>
              <Play size={13} style={{ flex: 'none', marginTop: 2, color: 'var(--accent,#E8B84B)' }} fill="currentColor" />
              <span>Бичлэг оруулбал апп дээр <b>автоматаар, дуугүй, давталттай</b> тоглоно.</span>
            </div>

            <div style={css('display:flex;justify-content:flex-end;gap:12px')}>
              <button onClick={() => setBgEditOpen(false)} style={css('cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;padding:11px 22px;border-radius:999px;border:1px solid rgba(242,237,227,.25);background:transparent;color:rgba(242,237,227,.75)')}>Болих</button>
              <Hover as="button" onClick={saveBg} disabled={bgUploading} s={`cursor:pointer;font-family:inherit;font-size:13px;font-weight:800;padding:11px 26px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s;opacity:${bgUploading ? .6 : 1}`} h={bgUploading ? '' : 'transform:translateY(-2px)'}>Хадгалах</Hover>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
