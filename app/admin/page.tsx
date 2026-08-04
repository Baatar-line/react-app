'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Admin Panel — full app screen. Ported from Admin Panel.dc.html.
// Reuses the same brand data/helpers as BigBang (categories, aimags, accessibility
// criteria, image URL builder) instead of redefining them, and shares the
// place/scenic/event creation modal with HostProfile via shared/CreateForm.
import React, { useEffect, useRef, useState } from 'react';
import { Accessibility, Play, LayoutDashboard, MapPin, Mountain, CalendarDays, Star, Image as ImageIcon, Megaphone, ShoppingBag, Film, Search, PanelLeftClose, PanelLeftOpen, Pencil, Trash2, type LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/components/bigbang/ui';
import { AIMAGS, AIMAG_BG, CATS, SUGGESTS, TRAVEL_APPS, U, imgUrl, isVideoUrl, itemThumbOf } from '@/components/bigbang/data';
import CreateForm, { CreateFormData, CreateKind } from '@/components/CreateForm';
import { apiGet, apiGetAuthed, apiPatch, apiPost, apiPut, apiDelete, uploadImage } from '@/lib/api';
import { createPlace, createScenicPin, createEvent, updatePlace, updateScenicPin, updateEvent, deletePlace, deleteScenicPin, deleteEvent } from '@/lib/userContent';

type Tab = 'dash' | 'places' | 'scenic' | 'events' | 'suggests' | 'brands' | 'bg' | 'ads';

// `id` is the backend row id (category/aimag) once fetched — needed to PATCH the right row.
// Absent for the 'about'/'home'/'flag'/'suggest' kinds, which PUT the singleton
// settings row instead; `slug` is the SUGGESTS card key used there since that
// list isn't a db table with its own row ids.
// `video` is only meaningful for category items — the background video shown
// inside that category's own page, uploaded separately from `src` (the still
// photo shown on Home's hover/selection preview). Every other BgKind still
// holds a single image-or-video asset via `type`/`src`, same as before.
interface BgItem { id?: number; slug?: string; name: string; type: 'image' | 'video'; src: string; video?: string; }
// Which background list the "Фон зураг" tab is showing / editing. Named rather
// than repeated inline at each of the state, lookup and handler sites, so
// adding a kind is one edit here plus its own branches.
type BgKind = 'cat' | 'aimag' | 'about' | 'home' | 'flag' | 'suggest' | 'loader' | 'travelApps' | 'login';

const NAV: { key: Tab; icon: LucideIcon; label: string }[] = [
  { key: 'dash', icon: LayoutDashboard, label: 'Хяналтын самбар' },
  { key: 'places', icon: MapPin, label: 'Газрын хүсэлт' },
  { key: 'scenic', icon: Mountain, label: 'Үзэсгэлэнт газар' },
  { key: 'events', icon: CalendarDays, label: 'Эвент хүсэлт' },
  { key: 'suggests', icon: Star, label: 'Санал болгох' },
  { key: 'brands', icon: ShoppingBag, label: 'Брэндийн сурталчилгаа' },
  { key: 'bg', icon: ImageIcon, label: 'Фон зураг' },
  { key: 'ads', icon: Megaphone, label: 'Зар сурталчилгаа' },
];
// Grouped + collapsible sidebar (was one flat list) — each group gets a small
// uppercase label, same "Navigate / More" pattern as the reference dashboard.
const NAV_GROUPS: { label: string; keys: Tab[] }[] = [
  { label: 'Удирдах самбар', keys: ['dash'] },
  { label: 'Агуулга', keys: ['places', 'scenic', 'events', 'suggests', 'brands'] },
  { label: 'Тохиргоо', keys: ['bg', 'ads'] },
];
// What ⌘K search filters per tab — a name/title getter for that tab's list(s)
// plus the placeholder copy shown in the search box.
const SEARCH_PLACEHOLDER: Partial<Record<Tab, string>> = {
  places: 'Газар хайх...',
  scenic: 'Үзэсгэлэнт газар хайх...',
  events: 'Эвент хайх...',
  suggests: 'Дэд карт хайх...',
  brands: 'Брэнд хайх...',
  bg: 'Фон хайх...',
  ads: 'Зар хайх...',
};

// slug (not name) is the stable key here — a category's display name can be
// renamed in data.ts at any time, and matching on it would silently break
// this row's link to its already-saved backend id/image/video.
const CAT_BG_DEFS: [string, string, string][] = CATS.map((c) => [c.name, c.hero, c.slug]);
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

  const [placeActionErr, setPlaceActionErr] = useState('');
  const [scenicActionErr, setScenicActionErr] = useState('');
  const [eventActionErr, setEventActionErr] = useState('');
  const [adActionErr, setAdActionErr] = useState('');
  // Real Ad rows from the backend (see refetchContent below).
  const [ads, setAds] = useState<any[]>([]);
  const [adFormOpen, setAdFormOpen] = useState(false);
  // null while adding a new ad; the row's db id while editing one.
  const [adEditId, setAdEditId] = useState<number | null>(null);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adFrom, setAdFrom] = useState('');
  const [adTo, setAdTo] = useState('');
  const [adImg, setAdImg] = useState('');
  const [adImgFile, setAdImgFile] = useState<File | null>(null);
  const [adSaving, setAdSaving] = useState(false);

  const [brandActionErr, setBrandActionErr] = useState('');
  // Real Brand rows from the backend (see refetchContent below).
  const [brands, setBrands] = useState<any[]>([]);
  const [brandFormOpen, setBrandFormOpen] = useState(false);
  // null while adding a new brand; the row's db id while editing one.
  const [brandEditId, setBrandEditId] = useState<number | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandCategory, setBrandCategory] = useState('');
  const [brandLink, setBrandLink] = useState('');
  // Product photo (the card's background) and the brand's small round logo —
  // two independent images, unlike every other admin form here which only
  // ever uploads one.
  const [brandImg, setBrandImg] = useState('');
  const [brandImgFile, setBrandImgFile] = useState<File | null>(null);
  const [brandLogoImg, setBrandLogoImg] = useState('');
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandSaving, setBrandSaving] = useState(false);

  // Real place/scenic/event rows — approvedPlaces + pendingPlaceRows both come
  // from Place (status 'approved' vs 'pending'); scenic pins and events have
  // no moderation queue, so they're just "everyone's, fetched fresh".
  const [approvedPlaces, setApprovedPlaces] = useState<any[]>([]);
  const [pendingPlaceRows, setPendingPlaceRows] = useState<any[]>([]);
  const [scenicList, setScenicList] = useState<any[]>([]);
  const [adminEvents, setAdminEvents] = useState<any[]>([]);
  const [suggestCards, setSuggestCards] = useState<any[]>([]);
  const [contentSyncError, setContentSyncError] = useState('');

  const refetchContent = React.useCallback(() => {
    Promise.all([
      apiGet<any[]>('/places'),
      apiGetAuthed<any[]>('/places/pending'),
      apiGet<any[]>('/scenic-pins'),
      apiGet<any[]>('/events'),
      apiGet<any[]>('/suggest-cards'),
      apiGetAuthed<any[]>('/ads'),
      apiGetAuthed<any[]>('/brands'),
    ]).then(([places, pending, pins, events, suggestCardRows, adRows, brandRows]) => {
      setApprovedPlaces(places);
      setPendingPlaceRows(pending);
      setScenicList(pins);
      setAdminEvents(events);
      setSuggestCards(suggestCardRows);
      setAds(adRows);
      setBrands(brandRows);
    }).catch(() => setContentSyncError('Газар/эвент/үзэсгэлэнт газрын мэдээлэл татахад алдаа гарлаа.'));
  }, []);
  useEffect(() => { refetchContent(); }, [refetchContent]);

  const [sharedFormOpen, setSharedFormOpen] = useState(false);
  const [sharedFormKind, setSharedFormKind] = useState<CreateKind>('place');
  const [sharedFormMode, setSharedFormMode] = useState<'create' | 'edit'>('create');
  const [sharedFormInitial, setSharedFormInitial] = useState<Partial<CreateFormData> | undefined>(undefined);

  // Suggest sub-cards (shown when a "Санал болгох" card is opened on the main
  // app) — real SuggestCard rows from the backend (see refetchContent above),
  // one collectionSlug per SUGGESTS category.
  const [suggestActiveSlug, setSuggestActiveSlug] = useState(SUGGESTS[0].slug);
  const [suggestActionErr, setSuggestActionErr] = useState('');
  const [suggestFormOpen, setSuggestFormOpen] = useState(false);
  // null while adding a new card; the row's db id while editing one.
  const [sgEditId, setSgEditId] = useState<number | null>(null);
  const [sgName, setSgName] = useState('');
  const [sgDesc, setSgDesc] = useState('');
  // Preview value (may be the existing raw image, or a fresh data: URI while
  // a newly-picked file hasn't finished uploading yet).
  const [sgImg, setSgImg] = useState('');
  // Set only when the admin picks a new file — saveSuggestCard uploads this
  // to Cloudinary and uses the resulting URL instead of `sgImg`. Left null
  // when editing without touching the photo, so the existing image survives.
  const [sgImgFile, setSgImgFile] = useState<File | null>(null);
  const [sgSaving, setSgSaving] = useState(false);
  const [sgErr, setSgErr] = useState(false);

  const [bgSub, setBgSub] = useState<BgKind>('cat');
  // Seeded with the same local defaults as before so the tab isn't empty while the
  // backend fetch below is in flight; the effect then attaches real ids + latest
  // saved images so edits actually PATCH/PUT the right row and survive a refresh.
  const [catBg, setCatBg] = useState<BgItem[]>(() => CAT_BG_DEFS.map(([name, id, slug]) => ({ name, type: 'image' as const, src: U(id, 900), video: '', slug })));
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
  // Full-bleed photo/video behind the /login (OTP sign-in) screen.
  const [loginBg, setLoginBg] = useState<BgItem[]>(() => [{ name: 'Нэвтрэх хуудасны фон', type: 'image', src: U('1470071459604-3b5ec3a7fe05', 1800) }]);
  // Background photo/video behind the "Аяллын апп" card on the Suggest page.
  const [travelAppsBg, setTravelAppsBg] = useState<BgItem[]>(() => TRAVEL_APPS.map((a) => ({ slug: a.slug, name: a.name, type: 'image' as const, src: U('1470071459604-3b5ec3a7fe05', 900) })));
  const [bgSyncError, setBgSyncError] = useState('');
  const [bgUploading, setBgUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, aimags, settings] = await Promise.all([
          apiGet<{ id: number; slug: string; name: string; image: string | null; videoImage: string | null }[]>('/categories'),
          apiGet<{ id: number; name: string; backgroundImage: string | null }[]>('/aimags'),
          apiGet<{ aboutBackgroundImage: string | null; homeBackgroundImage: string | null; mongoliaFlagImage: string | null; suggestBackgroundImages: Record<string, string> | null; loaderBackgroundImage: string | null; travelAppsBackgroundImages: Record<string, string> | null; loginBackgroundImage: string | null }>('/settings'),
        ]);
        if (cancelled) return;
        setCatBg((prev) => prev.map((it) => {
          const match = cats.find((c) => c.slug === it.slug);
          if (!match) return it;
          const src = match.image || it.src;
          return { ...it, id: match.id, src, type: 'image', video: match.videoImage || '' };
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
        if (settings.loginBackgroundImage) {
          setLoginBg((prev) => [{ ...prev[0], src: settings.loginBackgroundImage as string, type: isVideoUrl(settings.loginBackgroundImage as string) ? 'video' : 'image' }]);
        }
        if (settings.travelAppsBackgroundImages) {
          const map = settings.travelAppsBackgroundImages;
          setTravelAppsBg((prev) => prev.map((it) => {
            const saved = it.slug ? map[it.slug] : null;
            if (!saved) return it;
            return { ...it, src: saved, type: isVideoUrl(saved) ? 'video' : 'image' };
          }));
        }
      } catch {
        if (!cancelled) setBgSyncError('Backend-тэй холбогдож чадсангүй — локал жишээ өгөгдөл харагдаж байна.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [bgEditOpen, setBgEditOpen] = useState(false);
  const [bgEditKind, setBgEditKind] = useState<BgKind>('cat');
  const [bgEditIdx, setBgEditIdx] = useState(-1);
  const [bgDraftType, setBgDraftType] = useState<'image' | 'video'>('image');
  const [bgDraftSrc, setBgDraftSrc] = useState('');
  // Only used while editing a category ('cat') — its background video, held
  // alongside bgDraftSrc (the photo) instead of replacing it, since a
  // category now carries both at once.
  const [bgDraftVideoSrc, setBgDraftVideoSrc] = useState('');

  const pendingPlaces = pendingPlaceRows.length;

  const decidePlace = (id: number, status: 'approved' | 'rejected') => {
    setPlaceActionErr('');
    apiPatch(`/places/${id}/status`, { status })
      .then(() => refetchContent())
      .catch((err) => setPlaceActionErr(err instanceof Error ? err.message : String(err)));
  };

  // Only one event can be featured at a time (it's the single home-page
  // banner slot) — unfeature whichever one currently holds it before setting
  // the new one, so admins don't have to remember to do that themselves.
  const toggleFeaturedEvent = (id: number, featured: boolean) => {
    setEventActionErr('');
    const prevFeatured = featured ? adminEvents.find((ev) => ev.featured && ev.id !== id) : null;
    Promise.all([
      apiPatch(`/events/${id}`, { featured }),
      prevFeatured ? apiPatch(`/events/${prevFeatured.id}`, { featured: false }) : Promise.resolve(),
    ])
      .then(() => refetchContent())
      .catch((err) => setEventActionErr(err instanceof Error ? err.message : String(err)));
  };

  const openSharedForm = (kind: CreateKind) => { setSharedFormKind(kind); setSharedFormMode('create'); setSharedFormInitial(undefined); setSharedFormOpen(true); };
  const openEditForm = (kind: CreateKind, initial: Partial<CreateFormData>) => { setSharedFormKind(kind); setSharedFormMode('edit'); setSharedFormInitial(initial); setSharedFormOpen(true); };

  // Row → CreateFormData shape shared by the edit-open handlers below. Only
  // the fields CreateForm actually has inputs for get carried over — the rest
  // (contact info, times, accessibility) are handled per-kind at the call site.
  const editInitialFor = (kind: CreateKind, row: any): Partial<CreateFormData> => ({
    id: row.id,
    name: row.name,
    aimag: row.aimag?.name || 'Улаанбаатар',
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    images: (row.images || []).map((u: string) => imgUrl(u, 500)),
    existingImages: row.images || [],
    ...(kind === 'place' ? {
      desc: row.description || '',
      catSlug: row.category?.slug,
      sub: row.subCategory || undefined,
      phone: row.phone || '', instagram: row.instagramUrl || '', facebook: row.facebookUrl || '', contactEmail: row.contactEmail || '',
      openTime: row.openTime || '', closeTime: row.closeTime || '',
      access: !!row.accessible,
    } : kind === 'scenic' ? {
      desc: row.description || '',
      scenicType: row.type || '',
    } : {
      // Event — see updateEvent's note on why `desc` carries the raw meta text
      // instead of trying to re-split it into time/desc/max.
      desc: row.meta || '',
      date: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : '',
      time: row.startDate ? new Date(row.startDate).toISOString().slice(11, 16) : '',
      phone: row.phone || '', phone2: row.phone2 || '', instagram: row.instagram || '',
    }),
  });

  // No token passed — falls back to AdminPanel's own bootstrapped admin
  // token (see lib/api.ts), same as every other write this screen already does.
  const onSharedSubmit = async (data: CreateFormData) => {
    try {
      if (data.id) {
        if (data.kind === 'place') await updatePlace(undefined, data.id, data);
        else if (data.kind === 'scenic') await updateScenicPin(undefined, data.id, data);
        else await updateEvent(undefined, data.id, data);
      } else {
        if (data.kind === 'place') await createPlace(undefined, data);
        else if (data.kind === 'scenic') await createScenicPin(undefined, data);
        else await createEvent(undefined, data);
      }
      setSharedFormOpen(false);
      refetchContent();
    } catch (err) {
      alert((data.id ? 'Хадгалахад' : 'Үүсгэхэд') + ' алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const deleteContentRow = (kind: CreateKind, id: number, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setPlaceActionErr(''); setScenicActionErr(''); setEventActionErr('');
    const del = kind === 'place' ? deletePlace(undefined, id) : kind === 'scenic' ? deleteScenicPin(undefined, id) : deleteEvent(undefined, id);
    del.then(() => refetchContent()).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (kind === 'place') setPlaceActionErr(msg); else if (kind === 'scenic') setScenicActionErr(msg); else setEventActionErr(msg);
    });
  };

  const bgArrFor = (kind: BgKind) => (kind === 'aimag' ? aimagBg : kind === 'about' ? aboutBg : kind === 'home' ? homeBg : kind === 'flag' ? flagBg : kind === 'suggest' ? suggestBg : kind === 'loader' ? loaderBg : kind === 'travelApps' ? travelAppsBg : kind === 'login' ? loginBg : catBg);
  const bgSetterFor = (kind: BgKind) => (kind === 'aimag' ? setAimagBg : kind === 'about' ? setAboutBg : kind === 'home' ? setHomeBg : kind === 'flag' ? setFlagBg : kind === 'suggest' ? setSuggestBg : kind === 'loader' ? setLoaderBg : kind === 'travelApps' ? setTravelAppsBg : kind === 'login' ? setLoginBg : setCatBg);
  const bgLabelFor = (kind: BgKind) => (kind === 'aimag' ? 'Аймгийн фон' : kind === 'about' ? 'Тухай хуудасны фон' : kind === 'home' ? 'Нүүр хуудасны фон' : kind === 'flag' ? 'Монгол улсын дэлбээ' : kind === 'suggest' ? 'Санал болгохын фон' : kind === 'loader' ? 'Ачаалж буй дэлгэцийн фон' : kind === 'travelApps' ? 'Аяллын апп хэсгийн фон' : kind === 'login' ? 'Нэвтрэх хуудасны фон' : 'Ангиллын фон');

  const openBgEdit = (kind: BgKind, idx: number) => {
    const cur = bgArrFor(kind)[idx];
    setBgEditKind(kind); setBgEditIdx(idx); setBgDraftType(cur.type); setBgDraftSrc(cur.src); setBgDraftVideoSrc(cur.video || ''); setBgEditOpen(true);
  };
  const saveBg = async () => {
    if (bgEditIdx < 0) { setBgEditOpen(false); return; }
    const item = bgArrFor(bgEditKind)[bgEditIdx];
    try {
      if (bgEditKind === 'cat' && item.id) await apiPatch(`/categories/${item.id}`, { image: bgDraftSrc, videoImage: bgDraftVideoSrc });
      else if (bgEditKind === 'aimag' && item.id) await apiPatch(`/aimags/${item.id}`, { backgroundImage: bgDraftSrc });
      else if (bgEditKind === 'about') await apiPut('/settings', { aboutBackgroundImage: bgDraftSrc });
      else if (bgEditKind === 'home') await apiPut('/settings', { homeBackgroundImage: bgDraftSrc });
      else if (bgEditKind === 'flag') await apiPut('/settings', { mongoliaFlagImage: bgDraftSrc });
      else if (bgEditKind === 'loader') await apiPut('/settings', { loaderBackgroundImage: bgDraftSrc });
      else if (bgEditKind === 'login') await apiPut('/settings', { loginBackgroundImage: bgDraftSrc });
      else if (bgEditKind === 'suggest' && item.slug) {
        const map: Record<string, string> = {};
        suggestBg.forEach((it) => { if (it.slug) map[it.slug] = it.src; });
        map[item.slug] = bgDraftSrc;
        await apiPut('/settings', { suggestBackgroundImages: map });
      } else if (bgEditKind === 'travelApps' && item.slug) {
        const map: Record<string, string> = {};
        travelAppsBg.forEach((it) => { if (it.slug) map[it.slug] = it.src; });
        map[item.slug] = bgDraftSrc;
        await apiPut('/settings', { travelAppsBackgroundImages: map });
      }
      const setArr = bgSetterFor(bgEditKind);
      setArr((arr) => arr.map((it, i) => (i === bgEditIdx ? (bgEditKind === 'cat' ? { ...it, type: 'image' as const, src: bgDraftSrc, video: bgDraftVideoSrc } : { ...it, type: bgDraftType, src: bgDraftSrc }) : it)));
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
      const url = await uploadImage(f, 'bigbang/backgrounds');
      // A category keeps its photo and video as two independent slots — the
      // video button fills bgDraftVideoSrc instead of replacing bgDraftSrc.
      if (bgEditKind === 'cat' && asVideo) { setBgDraftVideoSrc(url); return; }
      setBgDraftType(asVideo ? 'video' : 'image');
      setBgDraftSrc(url);
    } catch (err) {
      alert('Оруулахад алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBgUploading(false);
    }
  };

  const openAdForm = () => { setAdEditId(null); setAdTitle(''); setAdDesc(''); setAdFrom(''); setAdTo(''); setAdImg(''); setAdImgFile(null); setAdFormOpen(true); };
  const editAd = (a: any) => {
    setAdEditId(a.id); setAdTitle(a.title); setAdDesc(a.description || ''); setAdFrom(a.startDate ? a.startDate.slice(0, 10) : ''); setAdTo(a.endDate ? a.endDate.slice(0, 10) : '');
    setAdImg(a.image || ''); setAdImgFile(null); setAdFormOpen(true);
  };
  // No token passed — falls back to AdminPanel's own bootstrapped admin
  // token (see lib/api.ts), same as every other write this screen does.
  const saveAd = async () => {
    if (!adTitle.trim()) { setAdFormOpen(false); return; }
    setAdSaving(true);
    setAdActionErr('');
    try {
      const image = adImgFile ? await uploadImage(adImgFile, 'bigbang/ads') : adImg || undefined;
      const payload = { title: adTitle.trim(), description: adDesc.trim() || undefined, image, startDate: adFrom || undefined, endDate: adTo || undefined };
      if (adEditId != null) await apiPatch(`/ads/${adEditId}`, payload);
      else await apiPost('/ads', payload);
      setAdFormOpen(false); setAdEditId(null); setAdTitle(''); setAdDesc(''); setAdFrom(''); setAdTo(''); setAdImg(''); setAdImgFile(null);
      refetchContent();
    } catch (err) {
      alert('Хадгалахад алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAdSaving(false);
    }
  };
  const toggleAd = (a: any) => {
    setAdActionErr('');
    apiPatch(`/ads/${a.id}`, { active: !a.active }).then(() => refetchContent()).catch((err) => setAdActionErr(err instanceof Error ? err.message : String(err)));
  };
  const deleteAd = (a: any) => {
    if (!confirm(`"${a.title}" зарыг устгах уу?`)) return;
    setAdActionErr('');
    apiDelete(`/ads/${a.id}`).then(() => refetchContent()).catch((err) => setAdActionErr(err instanceof Error ? err.message : String(err)));
  };
  const onAdImg = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    setAdImgFile(f);
    const r = new FileReader(); r.onload = () => setAdImg(String(r.result)); r.readAsDataURL(f);
  };

  const openBrandForm = () => {
    setBrandEditId(null); setBrandName(''); setBrandCategory(''); setBrandLink('');
    setBrandImg(''); setBrandImgFile(null); setBrandLogoImg(''); setBrandLogoFile(null);
    setBrandFormOpen(true);
  };
  const editBrand = (b: any) => {
    setBrandEditId(b.id); setBrandName(b.name); setBrandCategory(b.category); setBrandLink(b.link || '');
    setBrandImg(b.image || ''); setBrandImgFile(null); setBrandLogoImg(b.logo || ''); setBrandLogoFile(null);
    setBrandFormOpen(true);
  };
  // No token passed — falls back to AdminPanel's own bootstrapped admin
  // token (see lib/api.ts), same as every other write this screen does.
  const saveBrand = async () => {
    if (!brandName.trim() || !brandCategory.trim()) { setBrandFormOpen(false); return; }
    setBrandSaving(true);
    setBrandActionErr('');
    try {
      const [image, logo] = await Promise.all([
        brandImgFile ? uploadImage(brandImgFile, 'bigbang/brands') : brandImg || undefined,
        brandLogoFile ? uploadImage(brandLogoFile, 'bigbang/brands') : brandLogoImg || undefined,
      ]);
      const payload = { name: brandName.trim(), category: brandCategory.trim(), image, logo, link: brandLink.trim() || undefined };
      if (brandEditId != null) await apiPatch(`/brands/${brandEditId}`, payload);
      else await apiPost('/brands', payload);
      setBrandFormOpen(false); setBrandEditId(null); setBrandName(''); setBrandCategory(''); setBrandLink('');
      setBrandImg(''); setBrandImgFile(null); setBrandLogoImg(''); setBrandLogoFile(null);
      refetchContent();
    } catch (err) {
      alert('Хадгалахад алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBrandSaving(false);
    }
  };
  const toggleBrand = (b: any) => {
    setBrandActionErr('');
    apiPatch(`/brands/${b.id}`, { active: !b.active }).then(() => refetchContent()).catch((err) => setBrandActionErr(err instanceof Error ? err.message : String(err)));
  };
  const deleteBrand = (b: any) => {
    if (!confirm(`"${b.name}" брэндийг устгах уу?`)) return;
    setBrandActionErr('');
    apiDelete(`/brands/${b.id}`).then(() => refetchContent()).catch((err) => setBrandActionErr(err instanceof Error ? err.message : String(err)));
  };
  const onBrandImg = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    setBrandImgFile(f);
    const r = new FileReader(); r.onload = () => setBrandImg(String(r.result)); r.readAsDataURL(f);
  };
  const onBrandLogo = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    setBrandLogoFile(f);
    const r = new FileReader(); r.onload = () => setBrandLogoImg(String(r.result)); r.readAsDataURL(f);
  };

  const openSuggestForm = () => { setSgEditId(null); setSgName(''); setSgDesc(''); setSgImg(''); setSgImgFile(null); setSgErr(false); setSuggestFormOpen(true); };
  const openSuggestEditForm = (card: any) => {
    setSgEditId(card.id); setSgName(card.name); setSgDesc(card.description || ''); setSgImg(card.image || ''); setSgImgFile(null); setSgErr(false); setSuggestFormOpen(true);
  };
  // No token passed — falls back to AdminPanel's own bootstrapped admin
  // token (see lib/api.ts), same as every other write this screen does.
  const saveSuggestCard = async () => {
    if (!sgName.trim()) { setSgErr(true); return; }
    setSgSaving(true);
    setSuggestActionErr('');
    try {
      const image = sgImgFile ? await uploadImage(sgImgFile, 'bigbang/suggests') : sgImg || undefined;
      const payload = { collectionSlug: suggestActiveSlug, name: sgName.trim(), description: sgDesc.trim() || undefined, image };
      if (sgEditId != null) await apiPatch(`/suggest-cards/${sgEditId}`, payload);
      else await apiPost('/suggest-cards', payload);
      setSuggestFormOpen(false); setSgEditId(null); setSgName(''); setSgDesc(''); setSgImg(''); setSgImgFile(null); setSgErr(false);
      refetchContent();
    } catch (err) {
      alert('Хадгалахад алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSgSaving(false);
    }
  };
  const deleteSuggestCard = (card: any) => {
    if (!confirm(`"${card.name}" картыг устгах уу?`)) return;
    setSuggestActionErr('');
    apiDelete(`/suggest-cards/${card.id}`)
      .then(() => refetchContent())
      .catch((err) => setSuggestActionErr(err instanceof Error ? err.message : String(err)));
  };
  const onSgImg = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    setSgImgFile(f);
    const r = new FileReader(); r.onload = () => setSgImg(String(r.result)); r.readAsDataURL(f);
  };

  // `d` is either a plain 'YYYY-MM-DD' (the <input type="date"> drafts below)
  // or a full ISO datetime string (Ad rows straight from the API) — slicing a
  // fixed 5-char window instead of an open-ended one keeps both cases correct.
  const fmtD = (d: string) => (d ? d.slice(5, 10).replace('-', '/') : '—');

  const stats = [
    { label: 'Нийт газар', value: String(approvedPlaces.length), sub: 'батлагдсан', color: '#f2ede3' },
    { label: 'Хүлээгдэж буй хүсэлт', value: String(pendingPlaces), sub: 'газар', color: 'var(--accent,#E8B84B)' },
    { label: 'Идэвхтэй зар', value: String(ads.filter((a) => a.active).length), sub: 'нийт ' + ads.length + ' зар', color: '#a8d5a2' },
    { label: 'Эвент', value: String(adminEvents.length), sub: 'нийт эвент', color: '#8ab4f8' },
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
            const badge = n.key === 'places' ? pendingPlaces : 0;
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
                const badge = n.key === 'places' ? pendingPlaces : 0;
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
          {tab === 'brands' && <button onClick={openBrandForm} className="cursor-pointer font-[inherit] flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5"><span className="text-[15px] leading-none">+</span>Брэнд нэмэх</button>}
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
                {activeAds.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-[11px] px-[18px] border-b border-[rgba(255,255,255,.05)] text-[12.5px] hover:bg-[rgba(255,255,255,.04)]">
                    <div className="w-11 h-[30px] rounded-md bg-cover bg-center flex-shrink-0" style={{ backgroundImage: thumb(a.image || '') }}></div>
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
            {contentSyncError && <div className="mb-4 text-xs font-bold text-[#f08a8a]">{contentSyncError}</div>}
            {placeActionErr && <div className="mb-4 text-xs font-bold text-[#f08a8a]">{placeActionErr}</div>}
            {approvedPlaces.length > 0 && (
              <div className="mb-[22px]">
                <div className={rowLabel}>Батлагдсан газрууд</div>
                <div className="flex flex-col gap-3">
                  {approvedPlaces.filter((p) => matches(p.name)).map((p) => (
                    <div key={p.id} className="flex gap-4 items-center border border-[rgba(232,184,75,.28)] rounded-2xl p-3.5 bg-[rgba(232,184,75,.05)]">
                      <div className="w-[120px] h-[74px] rounded-[11px] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: thumb(p.images?.[0] || '') }}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[15px] font-extrabold">{p.name}</span>
                          <span className={catBadge}>{p.category?.name}</span>
                          {p.subCategory && <span className={catBadge}>{p.subCategory}</span>}
                          {p.accessible && <span title="Тусгай хэрэгцээт хүнд ээлтэй" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[rgba(0,0,0,.5)] text-[#8fd6c6] border border-[rgba(255,255,255,.26)]"><Accessibility size={13} /></span>}
                        </div>
                        <div className="text-xs text-[rgba(242,237,227,.55)] mt-1">{p.aimag?.name} · {p.description || '—'}</div>
                        <div className="text-[11px] text-[rgba(242,237,227,.45)] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          {p.phone && <span>☎ {p.phone}</span>}
                          {(p.openTime || p.closeTime) && <span>🕒 {p.openTime || '—'}–{p.closeTime || '—'}</span>}
                          {p.instagramUrl && <span>IG: {p.instagramUrl}</span>}
                          {p.facebookUrl && <span>FB: {p.facebookUrl}</span>}
                          {p.contactEmail && <span>✉ {p.contactEmail}</span>}
                          {p.lat != null && p.lng != null && <span>📍 {p.lat.toFixed(3)}, {p.lng.toFixed(3)}</span>}
                          {p.googleMapUrl && <span>🗺 {p.googleMapUrl}</span>}
                        </div>
                      </div>
                      <span className="flex-shrink-0 text-[11.5px] font-extrabold py-1.5 px-[15px] rounded-full bg-[rgba(168,213,162,.15)] text-[#a8d5a2]">Нийтлэгдсэн ✓</span>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openEditForm('place', editInitialFor('place', p))} title="Засах" className="cursor-pointer font-[inherit] flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(242,237,227,.22)] bg-transparent text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"><Pencil size={13} /></button>
                        <button onClick={() => deleteContentRow('place', p.id, `"${p.name}" газрыг устгах уу?`)} title="Устгах" className="cursor-pointer font-[inherit] flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(240,138,138,.35)] bg-transparent text-[#f08a8a] transition-all duration-200 hover:bg-[rgba(240,138,138,.1)]"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className={rowLabel}>Host-уудын илгээсэн хүсэлт</div>
            <div className="flex flex-col gap-3.5">
              {pendingPlaceRows.filter((p) => matches(p.name)).map((p) => (
                <div key={p.id} className="flex gap-4 items-center border border-[rgba(255,255,255,.1)] rounded-2xl p-3.5 bg-[rgba(255,255,255,.03)] transition-colors duration-200 hover:border-[rgba(242,237,227,.28)]">
                  <div className="w-[120px] h-[84px] rounded-[11px] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: thumb(p.images?.[0] || '') }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px] font-extrabold">{p.name}</span>
                      <span className={catBadge}>{p.category?.name}</span>
                      {p.subCategory && <span className={catBadge}>{p.subCategory}</span>}
                      {p.accessible && <span title="Тусгай хэрэгцээт хүнд ээлтэй" className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[rgba(0,0,0,.5)] text-[#8fd6c6] border border-[rgba(255,255,255,.26)]"><Accessibility size={13} /></span>}
                    </div>
                    <div className="text-xs text-[rgba(242,237,227,.55)] mt-1">{p.aimag?.name} · илгээсэн: @{p.addedByUser?.username} · {new Date(p.createdAt).toLocaleDateString('mn-MN')}</div>
                    <div className="text-xs text-[rgba(242,237,227,.45)] mt-[3px] whitespace-nowrap overflow-hidden text-ellipsis">{p.description || '—'}</div>
                    <div className="text-[11px] text-[rgba(242,237,227,.45)] mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {p.phone && <span>☎ {p.phone}</span>}
                      {(p.openTime || p.closeTime) && <span>🕒 {p.openTime || '—'}–{p.closeTime || '—'}</span>}
                      {p.instagramUrl && <span>IG: {p.instagramUrl}</span>}
                      {p.facebookUrl && <span>FB: {p.facebookUrl}</span>}
                      {p.contactEmail && <span>✉ {p.contactEmail}</span>}
                      {p.lat != null && p.lng != null && <span>📍 {p.lat.toFixed(3)}, {p.lng.toFixed(3)}</span>}
                      {p.googleMapUrl && <span>🗺 {p.googleMapUrl}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => decidePlace(p.id, 'approved')} className="cursor-pointer font-[inherit] text-xs font-bold py-2 px-[18px] rounded-full border-none bg-[#a8d5a2] text-[#132a1f]">Батлах</button>
                    <button onClick={() => decidePlace(p.id, 'rejected')} className="cursor-pointer font-[inherit] text-xs font-bold py-2 px-[18px] rounded-full border border-[rgba(240,138,138,.5)] bg-transparent text-[#f08a8a]">Татгалзах</button>
                    <button onClick={() => openEditForm('place', editInitialFor('place', p))} title="Засах" className="cursor-pointer font-[inherit] flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(242,237,227,.22)] bg-transparent text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"><Pencil size={13} /></button>
                    <button onClick={() => deleteContentRow('place', p.id, `"${p.name}" хүсэлтийг устгах уу?`)} title="Устгах" className="cursor-pointer font-[inherit] flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(240,138,138,.35)] bg-transparent text-[#f08a8a] transition-all duration-200 hover:bg-[rgba(240,138,138,.1)]"><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
              {pendingPlaceRows.length === 0 && <div className="text-[12.5px] text-[rgba(242,237,227,.45)]">Хүлээгдэж буй хүсэлт алга</div>}
            </div>
          </>
        )}

        {tab === 'scenic' && (
          <>
            {scenicActionErr && <div className="mb-4 text-xs font-bold text-[#f08a8a]">{scenicActionErr}</div>}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {scenicList.filter((s) => matches(s.name)).map((s) => (
                <div key={s.id} className="flex flex-col border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                  <div className="relative aspect-[16/9] bg-cover bg-center" style={{ backgroundImage: itemThumbOf(s.images?.[0] || '') }}></div>
                  <div className="flex flex-1 flex-col pt-[13px] px-[15px] pb-[15px]">
                    <div className="flex items-center gap-2">
                      <span className={catBadge}>{s.type}</span>
                    </div>
                    <div className="text-sm font-extrabold mt-1.5">{s.name}</div>
                    <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{s.aimag?.name} · {s.description || '—'}</div>
                    <div className="flex gap-2 mt-auto pt-3">
                      <button onClick={() => openEditForm('scenic', editInitialFor('scenic', s))} className="cursor-pointer font-[inherit] flex items-center gap-1.5 text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(242,237,227,.3)] bg-transparent text-[rgba(242,237,227,.85)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"><Pencil size={12} />Засах</button>
                      <button onClick={() => deleteContentRow('scenic', s.id, `"${s.name}" газрыг устгах уу?`)} className="cursor-pointer font-[inherit] flex items-center gap-1.5 text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(240,138,138,.35)] bg-transparent text-[#f08a8a] transition-all duration-200 hover:bg-[rgba(240,138,138,.1)]"><Trash2 size={12} />Устгах</button>
                    </div>
                  </div>
                </div>
              ))}
              {scenicList.length === 0 && <div className="text-[12.5px] text-[rgba(242,237,227,.45)]">Одоогоор үзэсгэлэнт газар алга</div>}
            </div>
          </>
        )}

        {tab === 'events' && (
          <div className="flex flex-col gap-3">
            {eventActionErr && <div className="mb-1 text-xs font-bold text-[#f08a8a]">{eventActionErr}</div>}
            {adminEvents.filter((ev) => matches(ev.name)).map((ev) => {
              const d = new Date(ev.startDate);
              const day = String(d.getDate()).padStart(2, '0');
              const mon = String(d.getMonth() + 1) + '-р сар';
              return (
                <div key={ev.id} className="flex gap-4 items-center border border-[rgba(255,255,255,.1)] rounded-2xl p-3.5 bg-[rgba(255,255,255,.03)]">
                  <div className="w-24 h-16 rounded-[11px] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: thumb(ev.images?.[0] || '') }}></div>
                  <div className="w-14 flex-shrink-0 text-center py-2 px-0 rounded-[11px] bg-[rgba(232,184,75,.14)] border border-[rgba(232,184,75,.35)]">
                    <div className="text-xl font-extrabold text-[var(--accent,#E8B84B)] leading-none">{day}</div>
                    <div className="text-[10px] font-bold tracking-[.1em] uppercase text-[rgba(242,237,227,.6)] mt-[3px]">{mon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[15px] font-extrabold">{ev.name}</span>
                      {ev.tag && <span className={catBadge}>{ev.tag}</span>}
                      {ev.featured && <span className="text-[10.5px] font-extrabold py-1 px-[11px] rounded-full bg-[rgba(232,184,75,.2)] text-[var(--accent,#E8B84B)]">Онцлох</span>}
                    </div>
                    <div className="text-xs text-[rgba(242,237,227,.55)] mt-1">{ev.aimag?.name} · {ev.meta || '—'}</div>
                  </div>
                  <button
                    onClick={() => toggleFeaturedEvent(ev.id, !ev.featured)}
                    className={`cursor-pointer font-[inherit] flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full border transition-transform duration-200 hover:-translate-y-0.5 ${
                      ev.featured
                        ? 'bg-[var(--accent,#E8B84B)] text-[#132a1f] border-transparent'
                        : 'bg-transparent text-[rgba(242,237,227,.7)] border-[rgba(255,255,255,.16)]'
                    }`}
                  >
                    <Star size={13} fill={ev.featured ? '#132a1f' : 'none'} />
                    {ev.featured ? 'Онцлохоос хасах' : 'Онцлох болгох'}
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEditForm('event', editInitialFor('event', ev))} title="Засах" className="cursor-pointer font-[inherit] flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(242,237,227,.22)] bg-transparent text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"><Pencil size={13} /></button>
                    <button onClick={() => deleteContentRow('event', ev.id, `"${ev.name}" эвентийг устгах уу?`)} title="Устгах" className="cursor-pointer font-[inherit] flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(240,138,138,.35)] bg-transparent text-[#f08a8a] transition-all duration-200 hover:bg-[rgba(240,138,138,.1)]"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
            {adminEvents.length === 0 && <div className="text-[12.5px] text-[rgba(242,237,227,.45)]">Одоогоор эвент алга</div>}
          </div>
        )}

        {tab === 'suggests' && (
          <>
            <div className="text-xs text-[rgba(242,237,227,.5)] mb-4 max-w-[640px] leading-[1.5]">
              Гол апп дээрх "Санал болгох" карт бүрийг дарахад доор харагдах дэд картуудыг ангилал тус бүрээр удирдана.
            </div>
            {suggestActionErr && <div className="mb-4 text-xs font-bold text-[#f08a8a]">{suggestActionErr}</div>}
            <div className="flex gap-2 mb-5 flex-wrap">
              {SUGGESTS.map((s) => {
                const on = suggestActiveSlug === s.slug;
                return (
                  <button key={s.slug} onClick={() => setSuggestActiveSlug(s.slug)} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-[18px] rounded-full transition-all duration-200" style={{ border: `1px solid ${on ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: on ? 'var(--accent,#E8B84B)' : 'transparent', color: on ? '#132a1f' : 'rgba(242,237,227,.8)' }}>{s.title} · {suggestCards.filter((c) => c.collectionSlug === s.slug).length}</button>
                );
              })}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {suggestCards.filter((c) => c.collectionSlug === suggestActiveSlug && matches(c.name)).map((c) => (
                <div key={c.id} className="flex flex-col border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                  <div className="relative aspect-[16/10] bg-cover bg-center" style={{ backgroundImage: thumb(c.image || '') }}></div>
                  <div className="flex flex-1 flex-col pt-[13px] px-[15px] pb-[15px]">
                    <div className="text-sm font-extrabold">{c.name}</div>
                    <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{c.description || '—'}</div>
                    <div className="flex gap-2 mt-auto pt-3">
                      <button onClick={() => openSuggestEditForm(c)} className="cursor-pointer font-[inherit] flex items-center gap-1.5 text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(242,237,227,.3)] bg-transparent text-[rgba(242,237,227,.85)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"><Pencil size={12} />Засах</button>
                      <button onClick={() => deleteSuggestCard(c)} className="cursor-pointer font-[inherit] flex items-center gap-1.5 text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(240,138,138,.35)] bg-transparent text-[#f08a8a] transition-all duration-200 hover:bg-[rgba(240,138,138,.1)]"><Trash2 size={12} />Устгах</button>
                    </div>
                  </div>
                </div>
              ))}
              {suggestCards.filter((c) => c.collectionSlug === suggestActiveSlug).length === 0 && <div className="text-[12.5px] text-[rgba(242,237,227,.45)]">Одоогоор дэд карт алга</div>}
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
              <button onClick={() => setBgSub('login')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'login' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'login' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'login' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Нэвтрэх хуудасны фон · {loginBg.length}</button>
              <button onClick={() => setBgSub('travelApps')} className="cursor-pointer font-[inherit] text-[12.5px] font-bold py-[9px] px-5 rounded-full transition-all duration-200" style={{ border: `1px solid ${bgSub === 'travelApps' ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`, background: bgSub === 'travelApps' ? 'var(--accent,#E8B84B)' : 'transparent', color: bgSub === 'travelApps' ? '#132a1f' : 'rgba(242,237,227,.8)' }}>Аяллын апп хэсгийн фон · {travelAppsBg.length}</button>
            </div>
            <div className="text-xs text-[rgba(242,237,227,.5)] mb-4 max-w-[640px] leading-[1.5]">
              {bgSub === 'cat' ? 'Ангилал бүрт 2 тусдаа фон байна: Зураг — нүүр хуудсанд ангиллаа сонгоход харагдана; Бичлэг — тухайн ангилал руу орсны дараа тоглоно.' : bgSub === 'aimag' ? '21 аймаг + Нийслэлийн арын фон. Видео оруулбал автоматаар дугуйгаар тоглоно.' : bgSub === 'home' ? 'Ямар ч ангилал, аймаг сонгоогүй үед нүүр хуудсанд анхнаас нь харагдах фон зураг.' : bgSub === 'flag' ? '"Дэлхийн архив" 3D глобус дээр Монголыг сонгоход харагдах жинхэнэ дэлбээний зураг (зөвхөн зураг, видео биш) — оруулаагүй бол автоматаар зурсан Соёмбо харагдана.' : bgSub === 'suggest' ? 'Нүүр хуудасны "Санал болгох" том картуудын арын дэвсгэр зураг/бичлэг.' : bgSub === 'loader' ? 'Апп анх ачаалж байх үеийн Marauder\'s Map дэлгэцийн арын дэвсгэр зураг — оруулаагүй бол өнөөгийн бараан градиент харагдана.' : bgSub === 'login' ? 'Нэвтрэх / бүртгүүлэх хуудасны (Хэрэглэгч ба Host хоёр урсгал нэг дэлгэц) арын дэвсгэр зураг/бичлэг — оруулаагүй бол ерөнхий жишээ зураг харагдана.' : bgSub === 'travelApps' ? '"Санал болгох" хуудасны доод хэсэгт байрлах Аяллын апп-уудын (Organic Maps, OsmAnd г.м) карт тус бүрийн арын дэвсгэр зураг/бичлэг — апп бүрт тусад нь оруулна, оруулаагүй бол тухайн картын өнгөт градиент харагдана.' : '"Бидний тухай" хуудасны үндсэн дэвсгэр зураг.'}
            </div>
            {bgSyncError && (
              <div className="text-[11.5px] text-[#f08a8a] mb-4 py-2.5 px-3.5 rounded-[10px] border border-dashed border-[rgba(240,138,138,.4)] bg-[rgba(240,138,138,.06)] max-w-[640px]">{bgSyncError}</div>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {bgArrFor(bgSub).map((it, i) => ({ it, i })).filter(({ it }) => matches(it.name)).map(({ it, i }) => (
                <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                  <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                    {bgSub === 'cat' ? (
                      // Category thumbnail always shows the photo (Home never plays
                      // its video) — a second badge just flags whether a video is
                      // also on file for when the visitor enters the category.
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(it.src, 700)}")` }}></div>
                    ) : it.type === 'video' ? (
                      <video src={it.src} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(it.src, 700)}")` }}></div>
                    )}
                    {bgSub === 'cat' ? (
                      <div className="absolute left-[9px] top-[9px] flex gap-1.5">
                        <span className="text-[9.5px] font-extrabold tracking-[.05em] uppercase py-[3px] px-[9px] rounded-full bg-[rgba(0,0,0,.62)] backdrop-blur-[6px] border border-[rgba(255,255,255,.2)] text-cream inline-flex items-center gap-[5px]"><ImageIcon size={11} /> Зураг</span>
                        {it.video && <span className="text-[9.5px] font-extrabold tracking-[.05em] uppercase py-[3px] px-[9px] rounded-full bg-[rgba(0,0,0,.62)] backdrop-blur-[6px] border border-[rgba(255,255,255,.2)] text-cream inline-flex items-center gap-[5px]"><Film size={11} /> Бичлэгтэй</span>}
                      </div>
                    ) : (
                      <span className="absolute left-[9px] top-[9px] text-[9.5px] font-extrabold tracking-[.05em] uppercase py-[3px] px-[9px] rounded-full bg-[rgba(0,0,0,.62)] backdrop-blur-[6px] border border-[rgba(255,255,255,.2)] text-cream inline-flex items-center gap-[5px]">{it.type === 'video' ? <><Film size={11} /> Бичлэг</> : <><ImageIcon size={11} /> Зураг</>}</span>
                    )}
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
          <>
            {adActionErr && <div className="mb-4 text-xs font-bold text-[#f08a8a]">{adActionErr}</div>}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[18px]">
              {ads.filter((a) => matches(a.title)).map((a) => (
                <div key={a.id} className="flex flex-col border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                  <div className="relative aspect-[16/8] bg-cover bg-center" style={{ backgroundImage: thumb(a.image || '') }}>
                    <span className="absolute left-2.5 top-2.5 text-[10px] font-extrabold tracking-[.06em] uppercase py-[3px] px-2.5 rounded-full" style={{ background: a.active ? 'rgba(168,213,162,.85)' : 'rgba(120,120,120,.8)', color: a.active ? '#132a1f' : '#fff' }}>{a.active ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
                  </div>
                  <div className="flex flex-1 flex-col pt-3.5 px-4 pb-4">
                    <div className="text-[14.5px] font-extrabold">{a.title}</div>
                    <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{fmtD(a.startDate)} – {fmtD(a.endDate)} · {a.views.toLocaleString()} үзэлт</div>
                    <div className="flex gap-2 mt-auto pt-3 flex-wrap">
                      <button onClick={() => editAd(a)} className="cursor-pointer font-[inherit] text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(242,237,227,.3)] bg-transparent text-[rgba(242,237,227,.85)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">Засах</button>
                      <button onClick={() => toggleAd(a)} className="cursor-pointer font-[inherit] text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border-none bg-[rgba(255,255,255,.08)] text-[rgba(242,237,227,.85)] transition-all duration-200 hover:bg-[rgba(255,255,255,.14)]">{a.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}</button>
                      <button onClick={() => deleteAd(a)} className="cursor-pointer font-[inherit] text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(240,138,138,.35)] bg-transparent text-[#f08a8a] transition-all duration-200 hover:bg-[rgba(240,138,138,.1)]">Устгах</button>
                    </div>
                  </div>
                </div>
              ))}
              {ads.length === 0 && <div className="text-[12.5px] text-[rgba(242,237,227,.45)]">Одоогоор зар алга</div>}
            </div>
          </>
        )}

        {tab === 'brands' && (
          <>
            {brandActionErr && <div className="mb-4 text-xs font-bold text-[#f08a8a]">{brandActionErr}</div>}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[18px]">
              {brands.filter((b) => matches(b.name)).map((b) => (
                <div key={b.id} className="flex flex-col border border-[rgba(255,255,255,.1)] rounded-2xl overflow-hidden bg-[rgba(255,255,255,.03)]">
                  <div className="relative aspect-[3/2] bg-cover bg-center" style={{ backgroundImage: thumb(b.image || '') }}>
                    <span className="absolute left-2.5 top-2.5 text-[10px] font-extrabold tracking-[.06em] uppercase py-[3px] px-2.5 rounded-full" style={{ background: b.active ? 'rgba(168,213,162,.85)' : 'rgba(120,120,120,.8)', color: b.active ? '#132a1f' : '#fff' }}>{b.active ? 'Идэвхтэй' : 'Идэвхгүй'}</span>
                    {b.logo && (
                      <div className="absolute right-2.5 bottom-2.5 h-8 w-8 rounded-full overflow-hidden border border-[rgba(255,255,255,.4)] bg-[#f2ede3] bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(b.logo, 80)}")` }} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col pt-3.5 px-4 pb-4">
                    <div className="text-[14.5px] font-extrabold">{b.name}</div>
                    <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{b.category}</div>
                    <div className="flex gap-2 mt-auto pt-3 flex-wrap">
                      <button onClick={() => editBrand(b)} className="cursor-pointer font-[inherit] text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(242,237,227,.3)] bg-transparent text-[rgba(242,237,227,.85)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">Засах</button>
                      <button onClick={() => toggleBrand(b)} className="cursor-pointer font-[inherit] text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border-none bg-[rgba(255,255,255,.08)] text-[rgba(242,237,227,.85)] transition-all duration-200 hover:bg-[rgba(255,255,255,.14)]">{b.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}</button>
                      <button onClick={() => deleteBrand(b)} className="cursor-pointer font-[inherit] text-[11.5px] font-bold py-[7px] px-[15px] rounded-full border border-[rgba(240,138,138,.35)] bg-transparent text-[#f08a8a] transition-all duration-200 hover:bg-[rgba(240,138,138,.1)]">Устгах</button>
                    </div>
                  </div>
                </div>
              ))}
              {brands.length === 0 && <div className="text-[12.5px] text-[rgba(242,237,227,.45)]">Одоогоор брэнд алга</div>}
            </div>
          </>
        )}
      </main>

      {sharedFormOpen && <CreateForm kind={sharedFormKind} mode={sharedFormMode} initial={sharedFormInitial} onClose={() => setSharedFormOpen(false)} onSubmit={onSharedSubmit} />}

      {suggestFormOpen && (
        <div onClick={() => setSuggestFormOpen(false)} className="fixed inset-0 z-[60] bg-[rgba(6,8,12,.7)] backdrop-blur-[6px] flex items-center justify-center box-border animate-[bbFadeUp_0.25s_ease_both]" style={{ padding: isMobile ? '14px' : '40px' }}>
          <div onClick={(e) => e.stopPropagation()} className="w-[480px] max-w-full max-h-[86vh] overflow-auto bg-[#171410] border border-[rgba(255,255,255,.12)] rounded-[18px] box-border shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '24px 26px 26px' }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[17px] font-extrabold">{sgEditId != null ? 'Дэд карт засах' : 'Дэд карт нэмэх'}</div>
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
              <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Зураг</span>
                <div className="relative aspect-[16/10] rounded-[14px] overflow-hidden border border-[rgba(255,255,255,.12)] bg-ink">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(sgImg || '1489599849927-2ee91cede3ba', 700)}")` }}></div>
                  {sgSaving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,.6)] backdrop-blur-[3px] text-[12.5px] font-bold text-cream">Cloudinary руу оруулж байна…</div>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 h-[46px] rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.28)] bg-[rgba(255,255,255,.03)] cursor-pointer text-[12.5px] font-bold text-[rgba(242,237,227,.85)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                  <ImageIcon size={15} /> {sgImg ? 'Зураг солих' : 'Зураг оруулах'}
                  <input type="file" accept="image/*" onChange={onSgImg} className="hidden" />
                </label>
              </div>
              {sgErr && <span className="text-[11.5px] font-bold text-[#f08a8a]">Нэр оруулна уу</span>}
              <button onClick={saveSuggestCard} disabled={sgSaving} className="cursor-pointer font-[inherit] text-[13px] font-extrabold p-3 rounded-xl border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] mt-1 disabled:opacity-60">{sgSaving ? '...' : sgEditId != null ? 'Хадгалах' : 'Нийтлэх'}</button>
            </div>
          </div>
        </div>
      )}

      {adFormOpen && (
        <div onClick={() => setAdFormOpen(false)} className="fixed inset-0 z-[60] bg-[rgba(6,8,12,.7)] backdrop-blur-[6px] flex items-center justify-center box-border animate-[bbFadeUp_0.25s_ease_both]" style={{ padding: isMobile ? '14px' : '40px' }}>
          <div onClick={(e) => e.stopPropagation()} className="w-[480px] max-w-full max-h-[86vh] overflow-auto bg-[#171410] border border-[rgba(255,255,255,.12)] rounded-[18px] box-border shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '24px 26px 26px' }}>
            <div className="flex items-center justify-between mb-[18px]">
              <div className="text-[17px] font-extrabold">{adEditId != null ? 'Зар засах' : 'Шинэ зар оруулах'}</div>
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
              <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Зураг</span>
                <div className="relative aspect-[16/8] rounded-[14px] overflow-hidden border border-[rgba(255,255,255,.12)] bg-ink">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(adImg || '1441974231531-c6227db76b6e', 700)}")` }}></div>
                  {adSaving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,.6)] backdrop-blur-[3px] text-[12.5px] font-bold text-cream">Cloudinary руу оруулж байна…</div>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 h-[46px] rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.28)] bg-[rgba(255,255,255,.03)] cursor-pointer text-[12.5px] font-bold text-[rgba(242,237,227,.85)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                  <ImageIcon size={15} /> {adImg ? 'Зураг солих' : 'Зураг оруулах'}
                  <input type="file" accept="image/*" onChange={onAdImg} className="hidden" />
                </label>
              </div>
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
              <button onClick={saveAd} disabled={adSaving} className="cursor-pointer font-[inherit] text-[13px] font-extrabold p-3 rounded-xl border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] mt-1 disabled:opacity-60">{adSaving ? '...' : adEditId != null ? 'Хадгалах' : 'Зар нийтлэх'}</button>
            </div>
          </div>
        </div>
      )}

      {brandFormOpen && (
        <div onClick={() => setBrandFormOpen(false)} className="fixed inset-0 z-[60] bg-[rgba(6,8,12,.7)] backdrop-blur-[6px] flex items-center justify-center box-border animate-[bbFadeUp_0.25s_ease_both]" style={{ padding: isMobile ? '14px' : '40px' }}>
          <div onClick={(e) => e.stopPropagation()} className="w-[480px] max-w-full max-h-[86vh] overflow-auto bg-[#171410] border border-[rgba(255,255,255,.12)] rounded-[18px] box-border shadow-[0_30px_80px_rgba(0,0,0,.6)]" style={{ padding: isMobile ? '18px 16px 20px' : '24px 26px 26px' }}>
            <div className="flex items-center justify-between mb-[18px]">
              <div className="text-[17px] font-extrabold">{brandEditId != null ? 'Брэнд засах' : 'Шинэ брэнд нэмэх'}</div>
              <button onClick={() => setBrandFormOpen(false)} className="cursor-pointer font-[inherit] text-[17px] leading-none w-[30px] h-[30px] rounded-full border border-[rgba(242,237,227,.2)] bg-transparent text-[rgba(242,237,227,.75)]">×</button>
            </div>
            <div className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Брэндийн нэр</span>
                <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ж: Marshall" className={inputClass} style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Ангилал</span>
                <input value={brandCategory} onChange={(e) => setBrandCategory(e.target.value)} placeholder="Ж: Технологи" className={inputClass} style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Холбоос (заавал биш)</span>
                <input value={brandLink} onChange={(e) => setBrandLink(e.target.value)} placeholder="https://..." className={inputClass} style={inputStyle} />
              </label>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Бүтээгдэхүүний зураг</span>
                <div className="relative aspect-[3/2] rounded-[14px] overflow-hidden border border-[rgba(255,255,255,.12)] bg-ink">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(brandImg || '1441974231531-c6227db76b6e', 700)}")` }}></div>
                  {brandSaving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,.6)] backdrop-blur-[3px] text-[12.5px] font-bold text-cream">Cloudinary руу оруулж байна…</div>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 h-[46px] rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.28)] bg-[rgba(255,255,255,.03)] cursor-pointer text-[12.5px] font-bold text-[rgba(242,237,227,.85)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                  <ImageIcon size={15} /> {brandImg ? 'Зураг солих' : 'Зураг оруулах'}
                  <input type="file" accept="image/*" onChange={onBrandImg} className="hidden" />
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-bold text-[rgba(242,237,227,.65)]">Брэндийн лого</span>
                <div className="flex items-center gap-3">
                  <div className="relative h-[58px] w-[58px] flex-none rounded-full overflow-hidden border border-[rgba(255,255,255,.12)] bg-ink">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(brandLogoImg || '1441974231531-c6227db76b6e', 200)}")` }}></div>
                    {brandSaving && <div className="absolute inset-0 bg-[rgba(0,0,0,.6)]"></div>}
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 h-[46px] rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.28)] bg-[rgba(255,255,255,.03)] cursor-pointer text-[12.5px] font-bold text-[rgba(242,237,227,.85)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                    <ImageIcon size={15} /> {brandLogoImg ? 'Лого солих' : 'Лого оруулах'}
                    <input type="file" accept="image/*" onChange={onBrandLogo} className="hidden" />
                  </label>
                </div>
              </div>
              <button onClick={saveBrand} disabled={brandSaving} className="cursor-pointer font-[inherit] text-[13px] font-extrabold p-3 rounded-xl border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] mt-1 disabled:opacity-60">{brandSaving ? '...' : brandEditId != null ? 'Хадгалах' : 'Нийтлэх'}</button>
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

            {bgEditKind === 'cat' ? (
              <>
                <div className="text-[10.5px] font-extrabold tracking-[.06em] uppercase text-[rgba(242,237,227,.5)] mt-[18px] mb-2">Зураг · нүүр хуудсанд харагдана</div>
                <div className="relative aspect-[16/9] rounded-[14px] overflow-hidden border border-[rgba(255,255,255,.12)] bg-ink mb-2.5">
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${imgUrl(bgDraftSrc || '1470071459604-3b5ec3a7fe05', 1200)}")` }}></div>
                  {bgUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,.6)] backdrop-blur-[3px] text-[12.5px] font-bold text-cream">Cloudinary руу оруулж байна…</div>
                  )}
                </div>
                <label className="flex items-center justify-center gap-2 h-[52px] rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.28)] bg-[rgba(255,255,255,.03)] cursor-pointer text-[12.5px] font-bold text-[rgba(242,237,227,.85)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)] mb-4">
                  <ImageIcon size={15} /> Зураг оруулах
                  <input type="file" accept="image/*" onChange={onBgFile(false)} style={{ display: 'none' }} />
                </label>

                <div className="text-[10.5px] font-extrabold tracking-[.06em] uppercase text-[rgba(242,237,227,.5)] mb-2">Бичлэг · ангилал руу орсны дараа тоглоно</div>
                <div className="relative aspect-[16/9] rounded-[14px] overflow-hidden border border-[rgba(255,255,255,.12)] bg-ink mb-2.5">
                  {bgDraftVideoSrc ? (
                    <video src={bgDraftVideoSrc} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-center px-4 text-[12px] text-[rgba(242,237,227,.4)]">Бичлэг оруулаагүй бол дээрх зураг харагдана</div>
                  )}
                  {bgUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,.6)] backdrop-blur-[3px] text-[12.5px] font-bold text-cream">Cloudinary руу оруулж байна…</div>
                  )}
                </div>
                <div className="grid gap-3 mb-3.5" style={{ gridTemplateColumns: (isMobile || !bgDraftVideoSrc) ? '1fr' : '1fr 1fr' }}>
                  <label className="flex items-center justify-center gap-2 h-[52px] rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.28)] bg-[rgba(255,255,255,.03)] cursor-pointer text-[12.5px] font-bold text-[rgba(242,237,227,.85)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                    <Film size={15} /> Бичлэг оруулах
                    <input type="file" accept="video/*" onChange={onBgFile(true)} style={{ display: 'none' }} />
                  </label>
                  {bgDraftVideoSrc && (
                    <button onClick={() => setBgDraftVideoSrc('')} className="cursor-pointer font-[inherit] h-[52px] rounded-xl border-[1.5px] border-dashed border-[rgba(240,138,138,.4)] bg-transparent text-[12.5px] font-bold text-[#f08a8a] transition-colors duration-200 hover:border-[#f08a8a]">Бичлэг хасах</button>
                  )}
                </div>

                <div className="flex items-start gap-[9px] text-[11.5px] leading-[1.5] text-[rgba(242,237,227,.6)] py-[11px] px-[13px] rounded-[11px] bg-[rgba(232,184,75,.06)] border border-[rgba(232,184,75,.22)] mb-5">
                  <Play size={13} style={{ flex: 'none', marginTop: 2, color: 'var(--accent,#E8B84B)' }} fill="currentColor" />
                  <span>Нүүр хуудсан дээр ангиллаа сонгоход <b>зөвхөн зураг</b> харагдана. Бичлэг зөвхөн тухайн ангилал руу орсны дараа, <b>автоматаар, дуугүй, давталттай</b> тоглоно.</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

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
