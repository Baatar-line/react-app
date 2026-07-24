'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Admin Panel — full app screen. Ported from Admin Panel.dc.html.
// Reuses the same brand data/helpers as BigBang (categories, aimags, accessibility
// criteria, image URL builder) instead of redefining them, and shares the
// place/scenic/event creation modal with HostProfile via shared/CreateForm.
import React, { useEffect, useRef, useState } from 'react';
import { Accessibility, Play, LayoutDashboard, MapPin, Mountain, CalendarDays, Star, Image as ImageIcon, Megaphone, Film, Search, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/components/bigbang/ui';
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

  const [bgSub, setBgSub] = useState<'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader' | 'travelApps'>('cat');
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
  // Background photo/video behind the "Аяллын апп" card on the Suggest page.
  const [travelAppsBg, setTravelAppsBg] = useState<BgItem[]>(() => [{ name: 'Аяллын апп хэсгийн фон', type: 'image', src: U('1470071459604-3b5ec3a7fe05', 1800) }]);
  const [bgSyncError, setBgSyncError] = useState('');
  const [bgUploading, setBgUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, aimags, settings] = await Promise.all([
          apiGet<{ id: number; name: string; image: string | null }[]>('/categories'),
          apiGet<{ id: number; name: string; backgroundImage: string | null }[]>('/aimags'),
          apiGet<{ aboutBackgroundImage: string | null; homeBackgroundImage: string | null; mongoliaFlagImage: string | null; suggestBackgroundImages: Record<string, string> | null; loaderBackgroundImage: string | null; travelAppsBackgroundImage: string | null }>('/settings'),
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
        if (settings.travelAppsBackgroundImage) {
          setTravelAppsBg((prev) => [{ ...prev[0], src: settings.travelAppsBackgroundImage as string, type: isVideoUrl(settings.travelAppsBackgroundImage as string) ? 'video' : 'image' }]);
        }
      } catch {
        if (!cancelled) setBgSyncError('Backend-тэй холбогдож чадсангүй — локал жишээ өгөгдөл харагдаж байна.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [bgEditOpen, setBgEditOpen] = useState(false);
  const [bgEditKind, setBgEditKind] = useState<'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader' | 'travelApps'>('cat');
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

  const bgArrFor = (kind: 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader' | 'travelApps') => (kind === 'aimag' ? aimagBg : kind === 'about' ? aboutBg : kind === 'home' ? homeBg : kind === 'flag' ? flagBg : kind === 'suggest' ? suggestBg : kind === 'loader' ? loaderBg : kind === 'travelApps' ? travelAppsBg : catBg);
  const bgSetterFor = (kind: 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader' | 'travelApps') => (kind === 'aimag' ? setAimagBg : kind === 'about' ? setAboutBg : kind === 'home' ? setHomeBg : kind === 'flag' ? setFlagBg : kind === 'suggest' ? setSuggestBg : kind === 'loader' ? setLoaderBg : kind === 'travelApps' ? setTravelAppsBg : setCatBg);
  const bgLabelFor = (kind: 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader' | 'travelApps') => (kind === 'aimag' ? 'Аймгийн фон' : kind === 'about' ? 'Тухай хуудасны фон' : kind === 'home' ? 'Нүүр хуудасны фон' : kind === 'flag' ? 'Монгол улсын дэлбээ' : kind === 'suggest' ? 'Санал болгохын фон' : kind === 'loader' ? 'Ачаалж буй дэлгэцийн фон' : kind === 'travelApps' ? 'Аяллын апп хэсгийн фон' : 'Ангиллын фон');

  const openBgEdit = (kind: 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader' | 'travelApps', idx: number) => {
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
      else if (bgEditKind === 'travelApps') await apiPut('/settings', { travelAppsBackgroundImage: bgDraftSrc });
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

  const rowLabel = 'text-[11px] font-extrabold tracking-[.08em] uppercase text-[rgba(242,237,227,.5)] mb-3';
  const catBadge = 'text-[10px] font-bold tracking-[.06em] uppercase px-[9px] py-[3px] rounded-full bg-[rgba(255,255,255,.08)] border border-[rgba(255,255,255,.2)] text-[rgba(242,237,227,.8)]';
  const inputClass = 'font-[inherit] text-cream bg-[rgba(0,0,0,.35)] border border-[rgba(255,255,255,.2)] rounded-[11px] px-[13px] py-2.5 outline-none';
  const inputStyle = { fontSize: isMobile ? '16px' : '13px' };

  return (
    <div className={isMobile ? 'flex flex-col min-h-screen text-cream' : 'flex h-screen overflow-hidden text-cream'} style={{ background: '#0b0a08', fontFamily: "'Manrope', sans-serif" }}>
      <aside
        className={isMobile
          ? 'w-full flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 box-border bg-[rgba(255,255,255,.03)] border-b border-[rgba(255,255,255,.08)] overflow-x-auto'
          : 'flex-shrink-0 flex flex-col box-border bg-[rgba(255,255,255,.03)] border-r border-[rgba(255,255,255,.08)] transition-[width] duration-200 ease-in-out'}
        style={isMobile ? undefined : { width: sbCollapsed ? 76 : 240, padding: sbCollapsed ? '26px 12px' : '26px 16px' }}
      >
        <div
          className="flex items-center gap-2 flex-shrink-0"
          style={{ padding: isMobile ? '0 10px 0 0' : sbCollapsed ? '0 0 22px' : '0 4px 22px', justifyContent: !isMobile && sbCollapsed ? 'center' : 'flex-start' }}
        >
          <div className="w-8 h-8 rounded-[9px] bg-[var(--accent,#E8B84B)] flex items-center justify-center font-extrabold text-[15px] text-[#132a1f] flex-shrink-0">b</div>
          {!isMobile && !sbCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-extrabold tracking-[-0.02em]">big bang</div>
              <div className="font-[ui-monospace,Menlo,monospace] text-[9.5px] tracking-[.18em] uppercase text-[rgba(242,237,227,.45)]">admin panel</div>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setSbCollapsed((v) => !v)}
              title={sbCollapsed ? 'Цэсийг дэлгэх' : 'Цэсийг хумих'}
              className="cursor-pointer font-[inherit] flex-shrink-0 w-[26px] h-[26px] rounded-lg border-none bg-transparent text-[rgba(242,237,227,.5)] flex items-center justify-center transition-all duration-200 hover:bg-[rgba(255,255,255,.08)] hover:text-[rgba(242,237,227,.9)]"
            >
              {sbCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          )}
        </div>

        {isMobile ? (
          NAV.map((n) => {
            const on = tab === n.key;
            const badge = n.key === 'places' ? pendingPlaces : n.key === 'events' ? pendingEvents : 0;
            return (
              <button
                key={n.key}
                onClick={() => setTab(n.key)}
                className={`cursor-pointer font-[inherit] flex items-center gap-[7px] text-xs font-bold text-left whitespace-nowrap flex-shrink-0 px-3 py-[9px] rounded-[11px] border-none transition-all duration-200 ${on ? '' : 'hover:bg-[rgba(255,255,255,.07)]'}`}
                style={{ background: on ? 'var(--accent,#E8B84B)' : 'transparent', color: on ? '#132a1f' : 'rgba(242,237,227,.8)' }}
              >
                <n.icon size={16} />
                <span>{n.label}</span>
                {badge > 0 && <span className="ml-auto text-[10.5px] font-extrabold min-w-5 h-5 flex items-center justify-center rounded-full" style={{ background: on ? 'rgba(0,0,0,.25)' : 'rgba(232, 184, 75,.2)', color: on ? '#132a1f' : 'var(--accent,#E8B84B)' }}>{badge}</span>}
              </button>
            );
          })
        ) : (
          NAV_GROUPS.map((g) => (
            <div key={g.label} className="flex flex-col gap-0.5 mb-2.5">
              {!sbCollapsed && <div className="text-[10px] font-extrabold tracking-[.09em] uppercase text-[rgba(242,237,227,.35)] pt-2 px-2.5 pb-1.5">{g.label}</div>}
              {g.keys.map((k) => {
                const n = NAV.find((x) => x.key === k)!;
                const on = tab === n.key;
                const badge = n.key === 'places' ? pendingPlaces : n.key === 'events' ? pendingEvents : 0;
                return (
                  <button
                    key={n.key}
                    onClick={() => setTab(n.key)}
                    title={sbCollapsed ? n.label : undefined}
                    className={`cursor-pointer font-[inherit] flex items-center gap-[11px] text-[13px] font-bold text-left whitespace-nowrap rounded-[11px] border-none transition-all duration-200 relative ${sbCollapsed ? 'justify-center p-[11px]' : 'justify-start py-[11px] px-3.5'} ${on ? '' : 'hover:bg-[rgba(255,255,255,.07)]'}`}
                    style={{ background: on ? 'var(--accent,#E8B84B)' : 'transparent', color: on ? '#132a1f' : 'rgba(242,237,227,.8)' }}
                  >
                    <n.icon size={16} />
                    {!sbCollapsed && <span>{n.label}</span>}
                    {badge > 0 && (sbCollapsed
                      ? <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full" style={{ background: on ? '#132a1f' : 'var(--accent,#E8B84B)' }} />
                      : <span className="ml-auto text-[10.5px] font-extrabold min-w-5 h-5 flex items-center justify-center rounded-full" style={{ background: on ? 'rgba(0,0,0,.25)' : 'rgba(232, 184, 75,.2)', color: on ? '#132a1f' : 'var(--accent,#E8B84B)' }}>{badge}</span>)}
                  </button>
                );
              })}
            </div>
          ))
        )}

        {!isMobile && (
          <div className={`mt-auto flex items-center gap-2.5 px-2.5 py-3 border-t border-[rgba(255,255,255,.08)] ${sbCollapsed ? 'justify-center' : 'justify-start'}`}>
            <div className="w-8 h-8 rounded-full bg-[linear-gradient(135deg,#E8B84B,#b57f42)] flex items-center justify-center text-xs font-extrabold text-[#132a1f] flex-shrink-0">А</div>
            {!sbCollapsed && (
              <div>
                <div className="text-xs font-bold">Админ</div>
                <div className="text-[10.5px] text-[rgba(242,237,227,.45)]">admin@bigbang.mn</div>
              </div>
            )}
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-auto box-border" style={{ padding: isMobile ? '16px 16px 40px' : '32px 36px 60px' }}>
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          {tab !== 'dash' ? (
            <div className="relative flex-1 min-w-[200px] max-w-[340px]">
              <Search size={14} className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[rgba(242,237,227,.4)] pointer-events-none" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={SEARCH_PLACEHOLDER[tab] || 'Хайх...'}
                className="w-full box-border font-[inherit] text-cream bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.14)] rounded-full pt-[9px] pr-[13px] pb-[9px] pl-9 outline-none"
                style={{ fontSize: isMobile ? '16px' : '12.5px' }}
              />
              {!isMobile && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-[ui-monospace,Menlo,monospace] text-[10px] font-bold text-[rgba(242,237,227,.35)] border border-[rgba(255,255,255,.16)] rounded-[5px] px-1.5 py-0.5 pointer-events-none">⌘K</span>
              )}
            </div>
          ) : <div />}
          {tab === 'ads' && <button onClick={openAdForm} className="cursor-pointer font-[inherit] flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5"><span className="text-[15px] leading-none">+</span>Зар нэмэх</button>}
          {tab === 'places' && <button onClick={() => openSharedForm('place')} className="cursor-pointer font-[inherit] flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5"><span className="text-[15px] leading-none">+</span>Газар нэмэх</button>}
          {tab === 'scenic' && <button onClick={() => openSharedForm('scenic')} className="cursor-pointer font-[inherit] flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5"><span className="text-[15px] leading-none">+</span>Үзэсгэлэнт газар үүсгэх</button>}
          {tab === 'suggests' && <button onClick={openSuggestForm} className="cursor-pointer font-[inherit] flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5"><span className="text-[15px] leading-none">+</span>Дэд карт нэмэх</button>}
          {tab === 'events' && <button onClick={() => openSharedForm('event')} className="cursor-pointer font-[inherit] flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5"><span className="text-[15px] leading-none">+</span>Эвент үүсгэх</button>}
        </div>

        {tab === 'dash' && (
          <>
            <div className="grid gap-4" style={{ gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
              {stats.map((s, i) => (
                <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-[13px] py-[13px] px-[15px] bg-[rgba(255,255,255,.03)]">
                  <div className="text-[10px] font-bold tracking-[.07em] uppercase text-[rgba(242,237,227,.5)]">{s.label}</div>
                  <div className="text-[22px] font-extrabold tracking-[-0.03em] mt-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10.5px] text-[rgba(242,237,227,.45)] mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 mt-4" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <div className="border border-[rgba(255,255,255,.1)] rounded-2xl bg-[rgba(255,255,255,.03)] overflow-hidden">
                <div className="py-3.5 px-[18px] border-b border-[rgba(255,255,255,.08)] text-[13.5px] font-extrabold">Сүүлд ирсэн хүсэлтүүд</div>
                {recentReqs.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 py-[11px] px-[18px] border-b border-[rgba(255,255,255,.05)] text-[12.5px] hover:bg-[rgba(255,255,255,.04)]">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: r.dot }}></span>
                    <span className="font-bold">{r.name}</span>
                    <span className="text-[rgba(242,237,227,.45)]">{r.kind}</span>
                    <span className="ml-auto text-[rgba(242,237,227,.4)] text-[11.5px]">{r.when}</span>
                  </div>
                ))}
              </div>
              <div className="border border-[rgba(255,255,255,.1)] rounded-2xl bg-[rgba(255,255,255,.03)] overflow-hidden">
                <div className="py-3.5 px-[18px] border-b border-[rgba(255,255,255,.08)] text-[13.5px] font-extrabold">Идэвхтэй зарууд</div>
                {activeAds.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 py-[11px] px-[18px] border-b border-[rgba(255,255,255,.05)] text-[12.5px] hover:bg-[rgba(255,255,255,.04)]">
                    <div className="w-11 h-[30px] rounded-md bg-cover bg-center flex-shrink-0" style={{ backgroundImage: thumb(a.img) }}></div>
                    <span className="font-bold">{a.title}</span>
                    <span className="ml-auto text-[var(--accent,#E8B84B)] font-extrabold text-[11.5px]">{a.views.toLocaleString()} үзэлт</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'places' && (
          <>
            {createdPlaces.length > 0 && (
              <div className="mb-[22px]">
                <div className={rowLabel}>Админаас нэмсэн газрууд</div>
                <div className="flex flex-col gap-3">
                  {createdPlaces.filter((p) => matches(p.name)).map((p, i) => (
                    <div key={i} className="flex gap-4 items-center border border-[rgba(232,184,75,.28)] rounded-2xl p-3.5 bg-[rgba(232,184,75,.05)]">
                      <div className="w-[120px] h-[74px] rounded-[11px] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: thumb(p.img) }}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[15px] font-extrabold">{p.name}</span>
                          <span className={catBadge}>{p.cat}</span>
                          {p.access && <span title="Тусгай хэрэгцээт хүнд ээлтэй" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[rgba(0,0,0,.5)] text-[#8fd6c6] border border-[rgba(255,255,255,.26)]"><Accessibility size={13} /></span>}
                        </div>
                        <div className="text-xs text-[rgba(242,237,227,.55)] mt-1">{p.aimag} · {p.desc}</div>
                      </div>
                      <span className="flex-shrink-0 text-[11.5px] font-extrabold py-1.5 px-[15px] rounded-full bg-[rgba(168,213,162,.15)] text-[#a8d5a2]">Нийтлэгдсэн ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={rowLabel}>Host-уудын илгээсэн хүсэлт</div>
            <div className="flex flex-col gap-3.5">
              {PLACE_REQS.map((p, i) => ({ p, i })).filter(({ p }) => matches(p.name)).map(({ p, i }) => {
                const dec = placeDecisions[i];
                return (
                  <div key={i} className="flex gap-4 items-center border border-[rgba(255,255,255,.1)] rounded-2xl p-3.5 bg-[rgba(255,255,255,.03)] transition-colors duration-200 hover:border-[rgba(242,237,227,.28)]">
                    <div className="w-[120px] h-[84px] rounded-[11px] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: thumb(p.img) }}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-extrabold">{p.name}</span>
                        <span className={catBadge}>{p.cat}</span>
                      </div>
                      <div className="text-xs text-[rgba(242,237,227,.55)] mt-1">{p.aimag} · {p.host} · {p.when}</div>
                      <div className="text-xs text-[rgba(242,237,227,.45)] mt-[3px] whitespace-nowrap overflow-hidden text-ellipsis">{p.desc}</div>
                    </div>
                    {!dec && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => decidePlace(i, 'ok')} className="cursor-pointer font-[inherit] text-xs font-bold py-2 px-[18px] rounded-full border-none bg-[#a8d5a2] text-[#132a1f]">Батлах</button>
                        <button onClick={() => decidePlace(i, 'no')} className="cursor-pointer font-[inherit] text-xs font-bold py-2 px-[18px] rounded-full border border-[rgba(240,138,138,.5)] bg-transparent text-[#f08a8a]">Татгалзах</button>
                      </div>
                    )}
                    {dec && <span className="flex-shrink-0 text-xs font-extrabold py-[7px] px-4 rounded-full" style={{ background: dec === 'ok' ? 'rgba(168,213,162,.15)' : 'rgba(240,138,138,.14)', color: dec === 'ok' ? '#a8d5a2' : '#f08a8a' }}>{dec === 'ok' ? 'Батлагдсан ✓' : 'Татгалзсан'}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'scenic' && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {scenicList.filter((s) => matches(s.name)).map((s, i) => (
              <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                <div className="relative aspect-[16/9] bg-cover bg-center" style={{ backgroundImage: thumb(s.img) }}>
                  <span className="absolute left-2.5 top-2.5 text-[18px] w-[34px] h-[34px] flex items-center justify-center rounded-[10px] bg-[rgba(0,0,0,.55)] backdrop-blur-[8px] border border-[rgba(255,255,255,.24)]">{s.icon}</span>
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-extrabold tracking-[.05em] py-[3px] px-2.5 rounded-full bg-[rgba(168,213,162,.85)] text-[#132a1f]">Нийтлэгдсэн</span>
                </div>
                <div className="pt-[13px] px-[15px] pb-[15px]">
                  <div className="text-sm font-extrabold">{s.name}</div>
                  <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{s.aimag} · {s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'events' && (
          <>
            {adminEvents.length > 0 && (
              <div className="mb-[22px]">
                <div className={rowLabel}>Админаас үүсгэсэн эвентүүд</div>
                <div className="flex flex-col gap-3">
                  {adminEvents.filter((ev) => matches(ev.name)).map((ev, i) => (
                    <div key={i} className="flex gap-4 items-center border border-[rgba(232,184,75,.28)] rounded-2xl p-3.5 bg-[rgba(232,184,75,.05)]">
                      <div className="w-24 h-16 rounded-[11px] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: thumb(ev.img) }}></div>
                      <div className="w-14 flex-shrink-0 text-center py-2 px-0 rounded-[11px] bg-[rgba(232,184,75,.14)] border border-[rgba(232,184,75,.35)]">
                        <div className="text-xl font-extrabold text-[var(--accent,#E8B84B)] leading-none">{ev.day}</div>
                        <div className="text-[10px] font-bold tracking-[.1em] uppercase text-[rgba(242,237,227,.6)] mt-[3px]">{ev.mon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[15px] font-extrabold">{ev.name}</span>
                          <span className={catBadge}>{ev.tag}</span>
                        </div>
                        <div className="text-xs text-[rgba(242,237,227,.55)] mt-1">{ev.aimag} · {ev.meta}</div>
                      </div>
                      <span className="flex-shrink-0 text-[11.5px] font-extrabold py-1.5 px-[15px] rounded-full bg-[rgba(168,213,162,.15)] text-[#a8d5a2]">Нийтлэгдсэн ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={rowLabel}>Host-уудын илгээсэн хүсэлт</div>
            <div className="flex flex-col gap-3.5">
              {EVENT_REQS.map((ev, i) => ({ ev, i })).filter(({ ev }) => matches(ev.name)).map(({ ev, i }) => {
                const dec = eventDecisions[i];
                return (
                  <div key={i} className="flex gap-4 items-center border border-[rgba(255,255,255,.1)] rounded-2xl p-3.5 bg-[rgba(255,255,255,.03)] transition-colors duration-200 hover:border-[rgba(242,237,227,.28)]">
                    <div className="w-14 flex-shrink-0 text-center py-2 px-0 rounded-[11px] bg-[rgba(232,184,75,.12)] border border-[rgba(232,184,75,.3)]">
                      <div className="text-xl font-extrabold text-[var(--accent,#E8B84B)] leading-none">{ev.day}</div>
                      <div className="text-[10px] font-bold tracking-[.1em] uppercase text-[rgba(242,237,227,.6)] mt-[3px]">{ev.mon}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-extrabold">{ev.name}</span>
                        <span className={catBadge}>{ev.tag}</span>
                      </div>
                      <div className="text-xs text-[rgba(242,237,227,.55)] mt-1">{ev.aimag} · {ev.host} · {ev.meta}</div>
                    </div>
                    {!dec && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => decideEvent(i, 'ok')} className="cursor-pointer font-[inherit] text-xs font-bold py-2 px-[18px] rounded-full border-none bg-[#a8d5a2] text-[#132a1f]">Зөвшөөрөх</button>
                        <button onClick={() => decideEvent(i, 'no')} className="cursor-pointer font-[inherit] text-xs font-bold py-2 px-[18px] rounded-full border border-[rgba(240,138,138,.5)] bg-transparent text-[#f08a8a]">Татгалзах</button>
                      </div>
                    )}
                    {dec && <span className="flex-shrink-0 text-xs font-extrabold py-[7px] px-4 rounded-full" style={{ background: dec === 'ok' ? 'rgba(168,213,162,.15)' : 'rgba(240,138,138,.14)', color: dec === 'ok' ? '#a8d5a2' : '#f08a8a' }}>{dec === 'ok' ? 'Зөвшөөрсөн ✓' : 'Татгалзсан'}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'suggests' && (
          <>
            <div className="text-xs text-[rgba(242,237,227,.5)] mb-4 max-w-[640px] leading-[1.5]">
              Гол апп дээрх "Санал болгох" карт бүрийг дарахад доор харагдах дэд картуудыг ангилал тус бүрээр удирдана.
            </div>
            <div className="flex gap-2 mb-5 flex-wrap">
              {SUGGESTS.map((s) => {
                const on = suggestActiveSlug === s.slug;
                return (
                  <button key={s.slug} onClick={() => setSuggestActiveSlug(s.slug)} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-[18px] rounded-full transition-all duration-200" style={{ border: `1px solid ${on ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: on ? 'var(--accent,#E8B84B)' : 'transparent', color: on ? '#132a1f' : 'rgba(242,237,227,.8)' }}>{s.title} · {(suggestCollections[s.slug] || []).length}</button>
                );
              })}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {(suggestCollections[suggestActiveSlug] || []).filter((it) => matches(it.name)).map((it, i) => (
                <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                  <div className="relative aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: thumb(it.img) }}></div>
                  <div className="pt-[13px] px-[15px] pb-[15px]">
                    <div className="text-sm font-extrabold">{it.name}</div>
                    <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{it.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'bg' && (
          <>
            <div className="flex gap-2.5 mb-[22px] flex-wrap">
              <button onClick={() => setBgSub('cat')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'cat' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'cat' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'cat' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Ангиллын фон · {catBg.length}</button>
              <button onClick={() => setBgSub('aimag')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'aimag' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'aimag' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'aimag' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Аймгийн фон · {aimagBg.length}</button>
              <button onClick={() => setBgSub('about')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'about' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'about' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'about' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Тухай хуудасны фон · {aboutBg.length}</button>
              <button onClick={() => setBgSub('home')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'home' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'home' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'home' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Нүүр хуудасны фон · {homeBg.length}</button>
              <button onClick={() => setBgSub('flag')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'flag' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'flag' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'flag' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Монголын дэлбээ (Глобус) · {flagBg.length}</button>
              <button onClick={() => setBgSub('suggest')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'suggest' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'suggest' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'suggest' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Санал болгохын фон · {suggestBg.length}</button>
              <button onClick={() => setBgSub('loader')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'loader' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'loader' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'loader' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Ачаалж буй дэлгэцийн фон · {loaderBg.length}</button>
              <button onClick={() => setBgSub('travelApps')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'travelApps' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'travelApps' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'travelApps' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Аяллын апп хэсгийн фон · {travelAppsBg.length}</button>
            </div>
            <div className="text-xs text-[rgba(242,237,227,.5)] mb-4 max-w-[640px] leading-[1.5]">
              {bgSub === 'cat' ? 'Хэрэглэгч ангилал сонгоход арын фонд харагдах зураг. Видео оруулбал автоматаар дугуйгаар тоглоно.' : bgSub === 'aimag' ? '21 аймаг + Нийслэлийн арын фон. Видео оруулбал автоматаар дугуйгаар тоглоно.' : bgSub === 'home' ? 'Ямар ч ангилал, аймаг сонгоогүй үед нүүр хуудсанд анхнаас нь харагдах фон зураг.' : bgSub === 'flag' ? '"Дэлхийн архив" 3D глобус дээр Монголыг сонгоход харагдах жинхэнэ дэлбээний зураг (зөвхөн зураг, видео биш) — оруулаагүй бол автоматаар зурсан Соёмбо харагдана.' : bgSub === 'suggest' ? 'Нүүр хуудасны "Санал болгох" том картуудын арын дэвсгэр зураг/бичлэг.' : bgSub === 'loader' ? 'Апп анх ачаалж байх үеийн Marauder\'s Map дэлгэцийн арын дэвсгэр зураг — оруулаагүй бол өнөөгийн бараан градиент харагдана.' : bgSub === 'travelApps' ? '"Санал болгох" хуудасны доод хэсэгт байрлах Аяллын апп (Organic Maps, OsmAnd г.м) картын арын дэвсгэр зураг/бичлэг — оруулаагүй бол өнөөгийн бараан градиент харагдана.' : '"Бидний тухай" хуудасны үндсэн дэвсгэр зураг.'}
            </div>
            {bgSyncError && (
              <div className="text-[11.5px] text-[#f08a8a] mb-4 py-2.5 px-3.5 rounded-[10px] border border-dashed border-[rgba(240,138,138,.4)] bg-[rgba(240,138,138,.06)] max-w-[640px]">{bgSyncError}</div>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {bgArrFor(bgSub).map((it, i) => ({ it, i })).filter(({ it }) => matches(it.name)).map(({ it, i }) => (
                <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                  <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                    {it.type === 'video' ? (
                      <video src={it.src} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(it.src, 700)}")` }}></div>
                    )}
                    <span className="absolute left-[9px] top-[9px] text-[9.5px] font-extrabold tracking-[.05em] uppercase py-[3px] px-[9px] rounded-full bg-[rgba(0,0,0,.62)] backdrop-blur-[6px] border border-[rgba(255,255,255,.2)] text-cream inline-flex items-center gap-[5px]">{it.type === 'video' ? <><Film size={11} /> Бичлэг</> : <><ImageIcon size={11} /> Зураг</>}</span>
                  </div>
                  <div className="flex items-center gap-2.5 py-[11px] px-[13px]">
                    <span className="flex-1 min-w-0 text-[13px] font-extrabold whitespace-nowrap overflow-hidden text-ellipsis">{it.name}</span>
                    <button onClick={() => openBgEdit(bgSub, i)} className="cursor-pointer font-[inherit] flex-shrink-0 text-[11.5px] font-bold py-1.5 px-3.5 rounded-full border border-[rgba(242,237,227,.28)] bg-transparent text-[rgba(242,237,227,.85)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">Засах</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'ads' && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">
            {ads.map((a, i) => ({ a, i })).filter(({ a }) => matches(a.title)).map(({ a, i }) => (
              <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                <div className="relative aspect-[16/8] bg-cover bg-center" style={{ backgroundImage: thumb(a.img) }}>
                  <span className="absolute left-2.5 top-2.5 text-[10px] font-extrabold tracking-[.06em] uppercase py-[3px] px-2.5 rounded-full" style={{ background: a.active ? 'rgba(168,213,162,.85)' : 'rgba(120,120,120,.8)', color: a.active ? '#132a1f' : '#fff' }}>{a.active ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
                </div>
                <div className="pt-3.5 px-4 pb-4">
                  <div className="text-[14.5px] font-extrabold">{a.title}</div>
                  <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{fmtD(a.from)} – {fmtD(a.to)} · {a.views.toLocaleString()} үзэлт</div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => editAd(i)} className="cursor-pointer font-[inherit] text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(242,237,227,.3)] bg-transparent text-[rgba(242,237,227,.85)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">Засах</button>
                    <button onClick={() => toggleAd(i)} className="cursor-pointer font-[inherit] text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border-none bg-[rgba(255,255,255,.08)] text-[rgba(242,237,227,.85)] transition-all duration-200 hover:bg-[rgba(255,255,255,.14)]">{a.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {sharedFormOpen && <CreateForm kind={sharedFormKind} onClose={() => setSharedFormOpen(false)} onSubmit={onSharedSubmit} />}

      {suggestFormOpen && (
        <div onClick={() => setSuggestFormOpen(false)} className="fixed inset-0 z-[60] bg-[rgba(6,8,12,.7)] backdrop-blur-[6px] flex items-center justify-center box-border animate-[bbFadeUp_0.25s_ease_both]" style={{ padding: isMobile ? '14px' : '40px' }}>
          <div onClick={(e) => e.stopPropagation()} className="w-[480px] max-w-full max-h-[86vh] overflow-auto bg-[#171410] border border-[rgba(255,255,255,.12)] rounded-[18px] box-border shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '24px 26px 26px' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[17px] font-extrabold">Дэд карт нэмэх</div>
              <button onClick={() => setSuggestFormOpen(false)} className="cursor-pointer font-[inherit] text-[17px] leading-none w-[30px] h-[30px] rounded-full border border-[rgba(242,237,227,.2)] bg-transparent text-[rgba(242,237,227,.75)]">×</button>
            </div>
            <div className="text-xs text-[rgba(242,237,227,.5)] mb-[18px]">{SUGGESTS.find((s) => s.slug === suggestActiveSlug)?.title}</div>
            <div className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Нэр</span>
                <input value={sgName} onChange={(e) => setSgName(e.target.value)} placeholder="Ж: Хосоороо үзэх кино" className={inputClass} style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Тайлбар</span>
                <input value={sgDesc} onChange={(e) => setSgDesc(e.target.value)} placeholder="Энэ картын тайлбар" className={inputClass} style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Зураг</span>
                <input type="file" accept="image/*" onChange={onSgImg} className="font-[inherit] text-[rgba(242,237,227,.7)]" style={{ fontSize: isMobile ? '14px' : '12px' }} />
              </label>
              {sgErr && <span className="text-[11.5px] font-bold text-[#f08a8a]">Нэр оруулна уу</span>}
              <button onClick={saveSuggestCard} className="cursor-pointer font-[inherit] text-[13px] font-extrabold p-3 rounded-xl border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] mt-1">Нийтлэх</button>
            </div>
          </div>
        </div>
      )}

      {adFormOpen && (
        <div onClick={() => setAdFormOpen(false)} className="fixed inset-0 z-[60] bg-[rgba(6,8,12,.7)] backdrop-blur-[6px] flex items-center justify-center box-border animate-[bbFadeUp_0.25s_ease_both]" style={{ padding: isMobile ? '14px' : '40px' }}>
          <div onClick={(e) => e.stopPropagation()} className="w-[480px] max-w-full max-h-[86vh] overflow-auto bg-[#171410] border border-[rgba(255,255,255,.12)] rounded-[18px] box-border shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '24px 26px 26px' }}>
            <div className="flex items-center justify-between mb-[18px]">
              <div className="text-[17px] font-extrabold">{adEditIdx >= 0 ? 'Зар засах' : 'Шинэ зар оруулах'}</div>
              <button onClick={() => setAdFormOpen(false)} className="cursor-pointer font-[inherit] text-[17px] leading-none w-[30px] h-[30px] rounded-full border border-[rgba(242,237,227,.2)] bg-transparent text-[rgba(242,237,227,.75)]">×</button>
            </div>
            <div className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Зарын гарчиг</span>
                <input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="Ж: Шинэ жилийн онцгой санал" className={inputClass} style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Тайлбар</span>
                <textarea value={adDesc} onChange={(e) => setAdDesc(e.target.value)} rows={3} placeholder="Зарын дэлгэрэнгүй..." className="font-[inherit] text-cream bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.14)] rounded-[10px] px-[13px] py-2.5 outline-none resize-y" style={{ fontSize: isMobile ? '16px' : '13px' }}></textarea>
              </label>
              <div className="grid gap-3" style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Эхлэх огноо</span>
                  <input type="date" value={adFrom} onChange={(e) => setAdFrom(e.target.value)} className="font-[inherit] text-cream bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.14)] rounded-[10px] py-[9px] px-[13px] outline-none [color-scheme:dark]" style={{ fontSize: isMobile ? '16px' : '13px' }} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Дуусах огноо</span>
                  <input type="date" value={adTo} onChange={(e) => setAdTo(e.target.value)} className="font-[inherit] text-cream bg-[rgba(255,255,255,.05)] border border-[rgba(255,255,255,.14)] rounded-[10px] py-[9px] px-[13px] outline-none [color-scheme:dark]" style={{ fontSize: isMobile ? '16px' : '13px' }} />
                </label>
              </div>
              <button onClick={saveAd} className="cursor-pointer font-[inherit] text-[13px] font-extrabold p-3 rounded-xl border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] mt-1">{adEditIdx >= 0 ? 'Хадгалах' : 'Зар нийтлэх'}</button>
            </div>
          </div>
        </div>
      )}

      {bgEditOpen && (
        <div onClick={() => setBgEditOpen(false)} className="fixed inset-0 z-[60] bg-[rgba(6,8,12,.72)] backdrop-blur-[8px] flex items-center justify-center box-border animate-[bbFadeUp_0.25s_ease_both]" style={{ padding: isMobile ? '14px' : '40px' }}>
          <div onClick={(e) => e.stopPropagation()} className="w-[560px] max-w-full max-h-[90vh] overflow-auto bg-[#171410] border border-[rgba(255,255,255,.14)] rounded-[20px] box-border shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '26px 28px 28px' }}>
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <div className="text-[18px] font-extrabold tracking-[-0.02em]">Фон солих</div>
                <div className="text-[12.5px] text-[rgba(242,237,227,.55)] mt-1">{bgArrFor(bgEditKind)[bgEditIdx]?.name} · {bgLabelFor(bgEditKind)}</div>
              </div>
              <button onClick={() => setBgEditOpen(false)} className="cursor-pointer font-[inherit] text-xl leading-none w-[34px] h-[34px] rounded-full border border-[rgba(242,237,227,.2)] bg-transparent text-[rgba(242,237,227,.7)] flex-shrink-0">×</button>
            </div>

            <div className="relative aspect-[16/9] rounded-[14px] overflow-hidden border border-[rgba(255,255,255,.12)] bg-ink mt-[18px] mb-4">
              {bgDraftType === 'video' ? (
                <video src={bgDraftSrc} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(bgDraftSrc || '1470071459604-3b5ec3a7fe05', 1200)}")` }}></div>
              )}
              {bgUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,.6)] backdrop-blur-[3px] text-[12.5px] font-bold text-cream">Cloudinary руу оруулж байна…</div>
              )}
            </div>

            <div className="grid gap-3 mb-3.5" style={{ gridTemplateColumns: (bgEditKind === 'flag' || isMobile) ? '1fr' : '1fr 1fr' }}>
              <label className="flex items-center justify-center gap-2 h-[52px] rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.28)] bg-[rgba(255,255,255,.03)] cursor-pointer text-[12.5px] font-bold text-[rgba(242,237,227,.85)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                <ImageIcon size={15} /> Зураг оруулах
                <input type="file" accept="image/*" onChange={onBgFile(false)} style={{ display: 'none' }} />
              </label>
              {bgEditKind !== 'flag' && (
                <label className="flex items-center justify-center gap-2 h-[52px] rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.28)] bg-[rgba(255,255,255,.03)] cursor-pointer text-[12.5px] font-bold text-[rgba(242,237,227,.85)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                  <Film size={15} /> Бичлэг оруулах
                  <input type="file" accept="video/*" onChange={onBgFile(true)} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div className="flex items-start gap-[9px] text-[11.5px] leading-[1.5] text-[rgba(242,237,227,.6)] py-[11px] px-[13px] rounded-[11px] bg-[rgba(232,184,75,.06)] border border-[rgba(232,184,75,.22)] mb-5">
              <Play size={13} style={{ flex: 'none', marginTop: 2, color: 'var(--accent,#E8B84B)' }} fill="currentColor" />
              <span>Бичлэг оруулбал апп дээр <b>автоматаар, дуугүй, давталттай</b> тоглоно.</span>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setBgEditOpen(false)} className="cursor-pointer font-[inherit] text-[13px] font-bold py-[11px] px-[22px] rounded-full border border-[rgba(242,237,227,.25)] bg-transparent text-[rgba(242,237,227,.75)]">Болих</button>
              <button
                onClick={saveBg}
                disabled={bgUploading}
                className={`cursor-pointer font-[inherit] text-[13px] font-extrabold py-[11px] px-[26px] rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 ${bgUploading ? '' : 'hover:-translate-y-0.5'}`}
                style={{ opacity: bgUploading ? 0.6 : 1 }}
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
