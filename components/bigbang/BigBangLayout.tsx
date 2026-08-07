'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Big Bang — shared layout: nav bar, global add-content modals, and the state/logic that's
// genuinely cross-page (language, aimag filter, favorites/saved/joined, accessibility
// settings, background-photo overrides, the globe engine, the add-place/scenic/event forms).
// Each actual "page" (Home, Category, Place, Maps, Globe, Event, Suggest, About, Profile) is
// its own routed component under app/(bigbang)/, rendered as `children` below and reading this
// layout's computed values via useContext(BigBangContext). Styling is Tailwind utility classes;
// genuinely per-instance/runtime values (computed colors, positions, backgrounds) stay inline.
import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Target, Users, Zap, Globe } from 'lucide-react';
import CreateForm, { CreateFormData } from '../CreateForm';
import UserAuthForm from '../UserAuthForm';
import CompleteProfileForm, { type ProfileInfo } from '../CompleteProfileForm';
import ConfirmSubmitOtp from '../ConfirmSubmitOtp';
import CreateSuccessCard from '../CreateSuccessCard';
import {
  ratingOf, STR, CATS, FAQ, TEAM, SUGGESTS, TRAVEL_APPS, sitesFor, AIMAGS, AIMAG_MN_SCRIPT,
  GEO_MN, LABEL_OFF, AIMAG_BG,
  catBgOf, itemThumbOf, aimagName, isAccessible, imgUrl, isVideoUrl, xyToLonLat, mapsUrlFor,
  type Pin, type CatItem, type Cat, type CountrySiteRow,
} from './data';
import { apiGet, apiGetAuthed } from '../../lib/api';
import { getSession, saveSession, clearSession } from '../../lib/session';
import { createPlace, createScenicPin, createEvent } from '../../lib/userContent';
import { getFavoriteKeys, addFavorite, removeFavorite } from '../../lib/favorites';
import { getAttendingEventIds, attendEvent, unattendEvent } from '../../lib/eventAttend';

// Replaces react-router's <Outlet context={V}/> + useOutletContext() pair —
// Next.js layouts render `children`, not an Outlet, so the computed `V`
// object is threaded down via plain context instead.
export const BigBangContext = React.createContext<any>(null);

type Props = { accent?: string; motion?: boolean; navigate: (path: string) => void; pathname: string; children: React.ReactNode };

const e = React.createElement;

// Sunflower/phyllotaxis scatter angle — see syncMainMap's pin placement.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const EVENT_MONTHS_MN = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];

// A real Event's `startDate` (an ISO timestamp) shaped into the old
// day/month display pair (EVENTS used to carry these as separate literal
// fields) — used wherever an event's date needs to render as text.
function eventDayMon(iso: string): { day: string; mon: string } {
  const d = new Date(iso);
  if (isNaN(+d)) return { day: '01', mon: EVENT_MONTHS_MN[0] };
  return { day: String(d.getDate()).padStart(2, '0'), mon: EVENT_MONTHS_MN[d.getMonth()] };
}

function fmtEventDate(iso: string): string {
  const { day, mon } = eventDayMon(iso);
  return day + ', ' + mon;
}

// Small typo-tolerant country search (e.g. "russa" → "Russia"). Capped
// queries are tiny, so the straightforward dynamic-programming version keeps
// this dependency-free and predictable.
function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return prev[b.length];
}

// Last background settings fetched from the backend, read synchronously so the very
// first render already shows the real photo instead of the placeholder for a beat.
function cachedBg(key: string): string | null {
  try { return localStorage.getItem(key); } catch (err) { return null; }
}

function cachedMap(key: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (err) { return {}; }
}

// Every internal "page" now lives at its own real URL — this maps the old
// route-id vocabulary (still used below for nav-highlight comparisons) to real paths.
const ROUTE_PATH: Record<string, string> = {
  home: '/', pin: '/maps', event: '/event',
  suggest: '/suggest', globe: '/globe', about: '/about',
  profile: '/profile',
};
function routeFromPathname(pathname: string): string {
  const seg = pathname.replace(/^\//, '').split('/')[0] || '';
  if (seg === '') return 'home';
  if (seg === 'category') return 'cat';
  if (seg === 'maps') return 'pin';
  return seg; // event | suggest | globe | about | profile
}

export default class BigBangLayout extends React.Component<Props, any> {
  geo: any = null;
  _bgOk: any = {};
  _bgLd: any = {};
  // bgReady() below fires during render (not an effect), so the Image it
  // creates can finish loading and call back before this component has
  // actually mounted — forceUpdate()ing then is what React's "state update
  // on a component that hasn't mounted yet" warning is about. Guards that
  // callback; _bgOk itself is still set immediately either way; the next
  // render (mount finishing, or literally anything else re-rendering this)
  // picks up the now-ready image, so nothing is lost by skipping the update.
  _mounted = false;
  // Backstop for the aimag hero crossfade — see aimagBgLayers/aimagBgBackstop
  // in render(). Switching straight from aimag A to aimag B fades A:1→0 and
  // B:0→1 at the same time (a real two-photo dissolve, kept on purpose); at
  // the transition's midpoint neither is fully opaque, so without anything
  // else in between, the plain Home hero underneath both would bleed
  // through for a frame. Remembering A here for the duration of B's fade-in
  // lets render() paint a copy of A as a solid backstop layer under both,
  // so what shows through mid-dissolve is A's own photo, not the Home hero.
  _lastRenderedAimag: string = 'Бүгд';
  _aimagBgFrozen: string | null = null;
  _aimagBgFrozenTimer: ReturnType<typeof setTimeout> | null = null;
  // A place/scenic/event submission made while signed out — held here (not
  // React state, since it carries raw File objects from CreateForm) so it
  // can be replayed automatically once UserAuthForm produces a session.
  _pendingCreate: { kind: 'place' | 'scenic' | 'event'; data: CreateFormData } | null = null;
  // Which "Контент нэмэх" card was clicked while the sign-in / complete-profile
  // gate was still unmet — the create form it asked for is opened once that
  // gate clears (see openCreateForm / onUserAuthed / onProfileCompleted).
  // Distinct from _pendingCreate, which holds an already-filled submission.
  _pendingOpen: 'place' | 'scenic' | 'event' | null = null;
  globeEngine: any = null;
  _globeEl: any = null;
  _globeTimer: any = null;
  _globeResize: any = null;
  _mainMap: any = null;
  _aimagPolyLayer: any = null;
  _aimagLabelLayer: any = null;
  _pinLayer: any = null;
  _aimagLayers: any = {};
  _aimagBuilt = false;
  _fullBounds: any = null;
  _wasZoomed = false;
  _lastFlownAimag: any = null;
  _lastFlownNearKey: any = null;
  _enclaveHost: any = {};
  _pickerWrapEl: any = null;
  _mnVertResize: any = null;
  _vwResize: any = null;

  state: any = {
    active: -1, aimag: 'Бүгд', lang: 'mn', locOpen: false,
    // joined: eventId → is this session attending; attendCounts: eventId →
    // how many people in total are (see fetchLiveContent/fetchMyAttending).
    pin: -1, favs: {}, joined: {}, attendCounts: {}, mapAimag: null, hoverAimag: null,
    spNeeds: false, bigText: false, globeCountry: null, globeHover: null, globeFilter: null,
    globeQuery: '', globeReady: false, countrySites: [] as CountrySiteRow[], globeActiveSite: null as number | null,
    showScenicForm: false,
    showEventForm: false,
    showPlaceForm: false,
    // Prompted when a place/scenic pin/event is submitted without a session
    // — there's no "host" tier, any signed-in account can create all three.
    showUserAuthForm: false,
    // Prompted (once signed in) when that session's own profile is still
    // missing a name/phone/Instagram — see isProfileComplete/CompleteProfileForm.
    showCompleteProfileForm: false,
    // Final gate, every single submission (not just once) — an OTP re-verify
    // right before a place/scenic/event actually gets created, once session +
    // profile-complete both already passed. See ConfirmSubmitOtp /
    // onConfirmOtpVerified.
    showConfirmOtp: false,
    // Which kind just finished creating ('place' | 'scenic' | 'event'), which
    // is also what puts CreateSuccessCard on screen. null = nothing to confirm.
    createdKind: null as 'place' | 'scenic' | 'event' | null,
    // This session's own name/phoneNumber/socialMediaURL, fetched once signed
    // in — see fetchMyProfile. null until fetched (or if never completed).
    myProfile: null as ProfileInfo | null,
    // Real place/event/scenic-pin rows fetched from the backend (see
    // fetchLiveContent) — replaces the old static PINS/EVENTS/CATS[].items
    // mock arrays as the single source of truth for content everywhere below.
    livePlaces: [], liveEvents: [], liveScenicPins: [], liveBrands: [],
    // This session's own place submissions (pending/approved), fetched once
    // signed in — see fetchMyPlaces. Shown on the Profile page.
    myPlaces: [],
    pinMode: 'scenic', heroHover: null,
    // "Ойрхон газар олох" — browser geolocation + radius filter on the Maps
    // page. `nearMeActive` is a separate mode from the usual aimag-click
    // pin view (see syncMainMap) rather than a filter layered on top of it,
    // since it needs to show pins across every aimag at once instead of one
    // aimag's worth.
    myLocation: null as { lat: number; lng: number } | null,
    locating: false, locationError: '', nearRadiusKm: 5, nearMeActive: false,
    // Seeded from the last successful /settings fetch (see fetchSettings below) so a
    // refresh shows the real saved photo immediately instead of flashing the built-in
    // placeholder while the network round-trip to fetch it is still in flight.
    aboutBgOverride: cachedBg('bb_about_bg'), homeBgOverride: cachedBg('bb_home_bg'),
    mongoliaFlagOverride: cachedBg('bb_mn_flag'),
    // Per-app background photo/video for each "Аяллын апп" tile on the
    // Suggest page, keyed by TRAVEL_APPS slug.
    travelAppsBgOverride: cachedMap('bb_travelapps_bg'),
    // Per-category (keyed by slug) and per-aimag (keyed by name) background photos
    // saved via Admin Panel → Фон зураг, so the live site shows them too.
    catBgOverride: cachedMap('bb_cat_bg'), aimagBgOverride: cachedMap('bb_aimag_bg'),
    // Per-category background *video*, shown only once inside that category's own
    // page (/category/:slug) — the Home screen's hover/selection preview always
    // stays a still photo (catBgOverride above), even when a video is set here.
    catVideoOverride: cachedMap('bb_cat_video_bg'),
    // Per-"Санал болгох" card background photo, keyed by SUGGESTS slug.
    suggestBgOverride: cachedMap('bb_suggest_bg'),
    // Per-team-member photo shown inside their About-page badge, keyed by the
    // TEAM slug — uploaded in Admin Panel → Фон зураг → Багийн гишүүдийн зураг.
    teamImgOverride: cachedMap('bb_team_img'),
    heroVertPos: null,
    // Tracked via a resize listener (see componentDidMount) since this whole
    // file styles elements with inline style objects — inline styles can't
    // contain @media queries, so "responsive" here means branching JS values
    // on viewport width instead, the same way `bigText`/`mini` already branch
    // style strings elsewhere in this file.
    // Always starts at this fixed default — reading the real window.innerWidth
    // here would make the very first client render (hydration) branch on
    // whatever width the browser actually is, while the server (no window)
    // always rendered the desktop layout, producing a nav structure mismatch
    // on any mobile/tablet-width load. componentDidMount corrects it to the
    // real width immediately post-mount instead (see _vwResize below).
    vw: 1280,
    mobileMenuOpen: false,
  };

  componentDidMount() {
    this._mounted = true;
    // Picks up any background image whose preload (kicked off by bgReady()
    // during the very first render, before mount) already resolved in the
    // meantime — that callback saw _mounted still false and skipped its own
    // forceUpdate, so this is what actually shows the now-ready image.
    this.forceUpdate();
    fetch('/assets/mn-aimags.json').then((r) => r.json()).then((g) => { this.geo = g; this.forceUpdate(); this.syncMainMap(); }).catch(() => {});
    // Default aimag hero photos (AIMAG_BG) are a static import, not a fetch —
    // start warming their cache immediately instead of waiting on
    // fetchContentBgs' /aimags round-trip below, so a click right after
    // page load isn't still stuck behind a cold backend. That later call
    // re-runs this with any admin-set overrides once they're in.
    this.prefetchAimagBgs({});
    this.fetchSettings();
    this.fetchContentBgs();
    this.fetchLiveContent();
    this.fetchCountrySites();
    // Admin Panel runs in a separate tab, so a tab already sitting open on this page
    // would otherwise never see a background change until manually reloaded — refetch
    // whenever this tab regains focus so it picks up the latest saved image.
    window.addEventListener('focus', this.fetchSettings);
    window.addEventListener('focus', this.fetchContentBgs);
    window.addEventListener('focus', this.fetchLiveContent);
    try {
      this.setState({ spNeeds: localStorage.getItem('bb_sp') === '1', bigText: localStorage.getItem('bb_big') === '1' });
    } catch (err) { /* ignore */ }
    // Session is read straight from localStorage on each use (see
    // lib/session.ts), not kept in this component's own state — this just
    // loads this session's own place submissions once, on mount.
    const session = getSession();
    if (session) { this.fetchMyPlaces(session.token); this.fetchMyFavorites(session.token); this.fetchMyAttending(session.token); this.fetchMyProfile(session.token); }
    this._mnVertResize = () => { this.updateHeroVertPos(); };
    window.addEventListener('resize', this._mnVertResize);
    this._vwResize = () => { if (this.state.vw !== window.innerWidth) this.setState({ vw: window.innerWidth }); };
    window.addEventListener('resize', this._vwResize);
    // Corrects the fixed hydration-safe default (see `vw` in state above) to
    // the real width right after mount, instead of waiting for an actual
    // resize event that may never come.
    this._vwResize();
  }

  componentDidUpdate(_prevProps: Props, prevState: any) {
    if (prevState.aimag !== this.state.aimag) this.updateHeroVertPos();
    if (this._mainMap) {
      // hoverAimag alone only changes a border's fill wash — it fires on
      // every mouseover/mouseout while the cursor crosses an aimag's outline
      // (including incidentally while panning/zooming near one), so it must
      // NOT also tear down and rebuild every pin marker each time. Doing so
      // used to make the pins visibly flicker/jump during ordinary map use.
      const pinsChanged =
        prevState.pinMode !== this.state.pinMode || prevState.mapAimag !== this.state.mapAimag ||
        prevState.pin !== this.state.pin || prevState.lang !== this.state.lang ||
        prevState.bigText !== this.state.bigText || prevState.livePlaces !== this.state.livePlaces ||
        prevState.liveEvents !== this.state.liveEvents || prevState.liveScenicPins !== this.state.liveScenicPins ||
        prevState.nearMeActive !== this.state.nearMeActive || prevState.myLocation !== this.state.myLocation ||
        prevState.nearRadiusKm !== this.state.nearRadiusKm;
      const hoverChanged = prevState.hoverAimag !== this.state.hoverAimag;
      if (pinsChanged) this.syncMainMap();
      else if (hoverChanged) this.syncMainMap(false);
    }
  }

  // Measures the invisible marker circle both builders drop at the aimag's
  // hand-tuned lx/ly label anchor (see the data-aimag-label attribute) and
  // returns its screen position relative to `wrap`. An earlier version used
  // the selected <path>'s own bounding box instead, but for a concave/dumbbell
  // outline (e.g. Дорнод) the box's center can fall in the shape's narrow
  // waist or even outside it — the label anchor is hand-placed to always sit
  // inside, so anchoring to it (not the box) is what actually stays in-shape.
  measureAimagCenter(wrap: any, aimag: string): { left: number; top: number } | null {
    if (!wrap || !wrap.querySelector) return null;
    const markerEl = wrap.querySelector('[data-aimag-label="' + aimag + '"]');
    if (!markerEl) return null;
    const markerRect = markerEl.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    return {
      left: (markerRect.left - wrapRect.left) + markerRect.width / 2,
      top: (markerRect.top - wrapRect.top) + markerRect.height / 2,
    };
  }

  handlePickerWrapRef = (el: any) => { this._pickerWrapEl = el || null; this.updateHeroVertPos(); };
  updateHeroVertPos = () => {
    const aimag = this.state.aimag;
    if (!aimag || aimag === 'Бүгд') { if (this.state.heroVertPos) this.setState({ heroVertPos: null }); return; }
    const pos = this.measureAimagCenter(this._pickerWrapEl, aimag);
    if (pos) this.setState({ heroVertPos: pos });
    else if (this.state.heroVertPos) this.setState({ heroVertPos: null });
  };

  componentWillUnmount() {
    this._mounted = false;
    this.unmountGlobe();
    this.unmountMainMap();
    window.removeEventListener('focus', this.fetchSettings);
    window.removeEventListener('focus', this.fetchContentBgs);
    window.removeEventListener('focus', this.fetchLiveContent);
    if (this._mnVertResize) window.removeEventListener('resize', this._mnVertResize);
    if (this._vwResize) window.removeEventListener('resize', this._vwResize);
    if (this._aimagBgFrozenTimer) clearTimeout(this._aimagBgFrozenTimer);
  }

  // Admin Panel can update these via the "Фон зураг" tab — if the backend isn't
  // running or hasn't been set up yet, this silently keeps the built-in placeholder.
  fetchSettings = () => {
    apiGet<{ aboutBackgroundImage: string | null; homeBackgroundImage: string | null; mongoliaFlagImage: string | null; suggestBackgroundImages: Record<string, string> | null; travelAppsBackgroundImages: Record<string, string> | null; teamImages: Record<string, string> | null }>('/settings')
      .then((s) => {
        if (s.aboutBackgroundImage) this.setState({ aboutBgOverride: s.aboutBackgroundImage });
        if (s.homeBackgroundImage) this.setState({ homeBgOverride: s.homeBackgroundImage });
        if (s.mongoliaFlagImage) {
          this.setState({ mongoliaFlagOverride: s.mongoliaFlagImage });
          if (this.globeEngine) this.globeEngine.setMongoliaFlag(s.mongoliaFlagImage);
        }
        if (s.suggestBackgroundImages) this.setState({ suggestBgOverride: s.suggestBackgroundImages });
        if (s.travelAppsBackgroundImages) this.setState({ travelAppsBgOverride: s.travelAppsBackgroundImages });
        if (s.teamImages) this.setState({ teamImgOverride: s.teamImages });
        try {
          if (s.aboutBackgroundImage) localStorage.setItem('bb_about_bg', s.aboutBackgroundImage);
          if (s.homeBackgroundImage) localStorage.setItem('bb_home_bg', s.homeBackgroundImage);
          if (s.mongoliaFlagImage) localStorage.setItem('bb_mn_flag', s.mongoliaFlagImage);
          if (s.suggestBackgroundImages) localStorage.setItem('bb_suggest_bg', JSON.stringify(s.suggestBackgroundImages));
          if (s.travelAppsBackgroundImages) localStorage.setItem('bb_travelapps_bg', JSON.stringify(s.travelAppsBackgroundImages));
          if (s.teamImages) localStorage.setItem('bb_team_img', JSON.stringify(s.teamImages));
        } catch (err) { /* ignore */ }
      })
      .catch(() => {});
  };

  fetchCountrySites = () => {
    apiGet<CountrySiteRow[]>('/country-sites?v=6')
      .then((countrySites) => { this.setState({ countrySites }); if (this.globeEngine) this.globeEngine.setArchiveSites(countrySites); })
      .catch(() => {});
  };

  // Category/aimag background photos, same "Фон зураг" admin flow as fetchSettings.
  fetchContentBgs = () => {
    Promise.all([
      apiGet<{ slug: string; image: string | null; videoImage: string | null }[]>('/categories'),
      apiGet<{ name: string; backgroundImage: string | null }[]>('/aimags'),
    ]).then(([cats, aimags]) => {
      const catBgOverride: Record<string, string> = {};
      const catVideoOverride: Record<string, string> = {};
      cats.forEach((c) => {
        if (c.image) catBgOverride[c.slug] = c.image;
        if (c.videoImage) catVideoOverride[c.slug] = c.videoImage;
      });
      const aimagBgOverride: Record<string, string> = {};
      aimags.forEach((a) => { if (a.backgroundImage) aimagBgOverride[a.name] = a.backgroundImage; });
      this.setState({ catBgOverride, catVideoOverride, aimagBgOverride });
      this.prefetchAimagBgs(aimagBgOverride);
      try {
        localStorage.setItem('bb_cat_bg', JSON.stringify(catBgOverride));
        localStorage.setItem('bb_cat_video_bg', JSON.stringify(catVideoOverride));
        localStorage.setItem('bb_aimag_bg', JSON.stringify(aimagBgOverride));
      } catch (err) { /* ignore */ }
    }).catch(() => {});
  };

  // Real content — approved places, live events, scenic pins — replacing the
  // old static PINS/EVENTS/CATS[].items mock arrays. Re-run after any
  // successful create (see onScenicSubmit/onEventSubmit) so a new submission
  // shows up immediately instead of waiting for the next focus/refresh.
  fetchLiveContent = () => {
    Promise.all([
      apiGet<any[]>('/places'),
      apiGet<any[]>('/events'),
      apiGet<any[]>('/scenic-pins'),
      apiGet<any[]>('/brands/active'),
    ]).then(([livePlaces, liveEvents, liveScenicPins, liveBrands]) => {
      // GET /events carries _count.attendees — flattened into its own id→count
      // map so the "Очно" button's optimistic bump has one place to write to,
      // instead of having to patch rows inside liveEvents.
      const attendCounts: Record<number, number> = {};
      liveEvents.forEach((ev: any) => { attendCounts[ev.id] = ev._count?.attendees ?? 0; });
      this.setState({ livePlaces, liveEvents, liveScenicPins, liveBrands, attendCounts });
    }).catch(() => {});
  };

  // Which events this session has already pressed "Очно" on, so the button
  // comes back pressed after a refresh (the public /events payload carries
  // only the totals, never who is attending).
  fetchMyAttending = (token: string) => {
    getAttendingEventIds(token).then((ids) => {
      const joined: Record<number, boolean> = {};
      ids.forEach((id) => { joined[id] = true; });
      this.setState({ joined });
    }).catch(() => {});
  };

  // This session's own place submissions, pending or approved — shown on the
  // Profile page's "Миний нэмсэн газрууд" section (mirrors myScenic/myEvents,
  // which don't need their own fetch since they're just this user's rows
  // filtered out of the already-fetched public liveScenicPins/liveEvents —
  // Place is filtered server-side instead since only approved ones are public).
  fetchMyPlaces = (token: string) => {
    apiGetAuthed<any[]>('/places/mine', token).then((myPlaces) => this.setState({ myPlaces })).catch(() => {});
  };

  // This session's own name/phone/Instagram (see Profile model + User.phoneNumber),
  // gating whether they can add a place/scenic pin/event at all — see
  // isProfileComplete/onPlaceSubmit and CompleteProfileForm.tsx.
  fetchMyProfile = (token: string) => {
    return apiGetAuthed<any>('/auth/me', token).then((me) => {
      const myProfile: ProfileInfo = {
        name: me.profile?.name || '', phoneNumber: me.phoneNumber || '', socialMediaURL: me.profile?.socialMediaURL || '',
        email: me.email || '', avatarImage: me.profile?.avatarImage || '',
      };
      this.setState({ myProfile });
      return myProfile;
    }).catch(() => null);
  };

  isProfileComplete = (p: ProfileInfo | null = this.state.myProfile): boolean =>
    !!(p && p.name.trim() && p.phoneNumber.trim() && p.socialMediaURL.trim() && p.email.trim());

  // Shared by onPlaceSubmit/onScenicSubmit/onEventSubmit and the two replay
  // paths (onUserAuthed, onProfileCompleted) that resume a submission queued
  // in _pendingCreate once the sign-in/complete-profile gate clears.
  submitPending = async (kind: 'place' | 'scenic' | 'event', data: CreateFormData, token: string) => {
    if (kind === 'place') await createPlace(token, data);
    else if (kind === 'scenic') await createScenicPin(token, data);
    else await createEvent(token, data);
    this.fetchLiveContent();
    if (kind === 'place') this.fetchMyPlaces(token);
  };

  // This session's real, backend-persisted favorites (Favorite rows keyed by
  // the same 'p:slug:name'/'s:name' strings toggleFav already used for the
  // old local-only version) — shown as a boolean map so every `favs[key]`
  // read elsewhere in this file keeps working unchanged.
  fetchMyFavorites = (token: string) => {
    getFavoriteKeys(token).then((keys) => {
      const favs: Record<string, boolean> = {};
      keys.forEach((k) => { favs[k] = true; });
      this.setState({ favs });
    }).catch(() => {});
  };

  // CATS shell (slug/name/subs/hero/pool/...) with real Place rows grouped
  // into `.items`/`.previews` by category — every other place this file used
  // to read CATS directly for content now reads this instead.
  liveCats(): Cat[] {
    const places: any[] = this.state.livePlaces || [];
    return CATS.map((c) => {
      const items: CatItem[] = places
        .filter((p) => p.category && p.category.slug === c.slug)
        .map((p) => {
          const hours = p.openTime && p.closeTime ? `${p.openTime}–${p.closeTime}` : '';
          return {
            name: p.name,
            meta: [p.subCategory, hours].filter(Boolean).join(' · ') || p.description || '',
            sub: p.subCategory || c.subs[0],
            aimag: p.aimag ? p.aimag.name : 'Улаанбаатар',
            hours, phone: p.phone || '', desc: p.description || '',
            access: !!p.accessible, img: (p.images && p.images[0]) || '', images: p.images || [],
            lat: p.lat ?? undefined, lng: p.lng ?? undefined, mapUrl: p.googleMapUrl || undefined,
            id: p.id,
          } as CatItem;
        });
      return { ...c, items, previews: items.slice(0, 3).map((it) => ({ name: it.name, meta: it.meta })) };
    });
  }

  // ── geometry ──
  // Parses a shape's `d` (a series of `M x,y L x,y ... Z` subpaths, in the
  // mn-aimags.json projected coordinate space) into plain point-ring arrays,
  // caching the result on the shape object. Used both for the point-in-polygon
  // test below and to draw the real aimag borders on the Leaflet map (see
  // syncMainMap), so the two stay pixel-for-pixel consistent with each other.
  polysOf(sh: any): number[][][] {
    if (!sh._polys) sh._polys = sh.d.split('M').filter((s: string) => s.trim()).map((seg: string) =>
      seg.replace(/Z/g, '').split('L').map((pt: string) => pt.trim().split(/[ ,]+/).map(Number)).filter((p: number[]) => p.length === 2 && !isNaN(p[0])));
    return sh._polys;
  }

  pointInShape(sh: any, x: number, y: number): boolean {
    if (x < sh.bx || x > sh.bx + sh.bw || y < sh.by || y > sh.by + sh.bh) return false;
    let inside = false;
    for (const poly of this.polysOf(sh)) {
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
      }
    }
    return inside;
  }

  // Single-ring point test (no even-odd hole subtraction against a shape's
  // *other* rings, unlike pointInShape). Some aimags (see mn-aimags.json's
  // Töv/Selenge entries) are drawn as their outer boundary with a hole cut
  // out for a smaller aimag fully inside them — pointInShape correctly says
  // "outside" for a point in that hole, which is right for hit-testing but
  // wrong for figuring out which aimag geometrically *hosts* the small one
  // (see syncMainMap's enclave-host detection).
  pointInRing(ring: number[][], x: number, y: number): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  xyToAimag(x: number, y: number) {
    const geo = this.geo; if (!geo) return null;
    for (const sh of geo.shapes) {
      if (this.pointInShape(sh, x, y)) return GEO_MN[sh.name] || sh.name;
    }
    return null;
  }

  // Google's raw `mt{s}.google.com/vt` tile endpoint is undocumented/unofficial
  // (no API key or referrer check) — some ad blockers/privacy extensions and
  // networks block it outright (sometimes only for that one session/network,
  // which is why this shows up as "sometimes the map's just blank" rather
  // than consistently), which otherwise leaves the whole map blank with only
  // our own borders/labels drawn on top.
  //
  // Two independent signals trigger a fallback, since either alone misses a
  // failure mode the other catches:
  //   - a burst of `tileerror` events — the source is reachable but actively
  //     rejecting/erroring on tiles;
  //   - a "nothing ever loaded" timeout — some blocks (an extension silently
  //     dropping the request, a network blackholing the domain) never fire
  //     `tileerror` at all, they just hang forever, which pure error-counting
  //     would never catch and the map would stay blank indefinitely.
  // Esri's World Imagery is the first fallback (a free, no-key satellite
  // basemap that keeps the same look); on a network where that's *also*
  // unreachable, it falls through again to OSM's standard tiles, which are
  // about as widely reachable as a tile server gets.
  addBasemap(m: any, primaryUrl: string, subdomains: string[]) {
    const SOURCES = [
      { url: primaryUrl, subdomains },
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
      { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
    ];
    // noWrap stops Leaflet from tiling repeated copies of the whole world
    // side by side once the map is zoomed out (or panned) far enough that a
    // single world's rendered width is narrower than the container — without
    // it, zooming out shows several duplicate Earths instead of one.
    const layer = window.L.tileLayer(SOURCES[0].url, { subdomains, maxZoom: 19, noWrap: true }).addTo(m);
    let idx = 0, errors = 0, loaded = false, timer: any = null;
    const armTimeout = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { if (!loaded) tryNext(); }, 3000);
    };
    const tryNext = () => {
      if (idx >= SOURCES.length - 1) return;
      idx++; errors = 0; loaded = false;
      layer.setUrl(SOURCES[idx].url);
      armTimeout();
    };
    layer.on('tileload', () => { loaded = true; });
    layer.on('tileerror', () => { errors++; if (errors >= 4) tryNext(); });
    armTimeout();
    return layer;
  }

  // ── globe ──
  handleGlobeRef = (el: any) => {
    this._globeEl = el || null;
    if (el) this.maybeMountGlobe();
    else this.unmountGlobe();
  };

  maybeMountGlobe() {
    if (this.globeEngine) return;
    const el = this._globeEl;
    if (!el || !window.GlobeEngine || !window.THREE || !window.d3 || !window.topojson) {
      this._globeTimer = setTimeout(() => this.maybeMountGlobe(), 140);
      return;
    }
    const eng = new window.GlobeEngine(el, {
      onReady: () => {
        try { this.setState({ globeReady: true }); } catch (err) { /* ignore */ }
        if (this.state.mongoliaFlagOverride) eng.setMongoliaFlag(this.state.mongoliaFlagOverride);
      },
      onHover: (name: string) => { if (name !== this.state.globeHover) this.setState({ globeHover: name }); },
      onSelect: (name: string) => this.setState({ globeCountry: name ? window.resolveCountry(name) : null, globeActiveSite: null }),
      onSiteSelect: (position: number) => this.setState({ globeActiveSite: position }),
    });
    this.globeEngine = eng;
    eng.setArchiveSites(this.state.countrySites || []);
    this._globeResize = () => eng.resize();
    window.addEventListener('resize', this._globeResize);
    eng.init().catch((err: any) => console.warn('globe init failed', err));
  }

  unmountGlobe() {
    if (this._globeTimer) { clearTimeout(this._globeTimer); this._globeTimer = null; }
    if (this._globeResize) { window.removeEventListener('resize', this._globeResize); this._globeResize = null; }
    if (this.globeEngine) { try { this.globeEngine.dispose(); } catch (err) { /* ignore */ } this.globeEngine = null; }
  }

  // ── real map (/maps) ──
  // Replaces the old hand-drawn SVG outline with an actual Leaflet map on the
  // same Google raster tiles the location-picker mini-map already used
  // (pickMapRef, above) — so the "map" is a real, pannable/zoomable Google
  // map instead of static art. Aimag borders and pin positions are derived
  // from the exact same mn-aimags.json geometry the SVG used to draw, just
  // run through xyToLonLat (the inverse of lonLatToXY) so they land on real
  // coordinates instead of SVG pixels — nothing here is a second, separately
  // guessed set of coordinates.
  mainMapRef = (node: any) => {
    if (!node) { this.unmountMainMap(); return; }
    if (this._mainMap) return;
    const init = () => {
      if (!node.isConnected) return;
      if (!window.L) { setTimeout(init, 150); return; }
      const m = window.L.map(node, {
        attributionControl: false, zoomControl: !this.state.isMobile, minZoom: 3,
        maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 1,
      });
      m.setView([46.8, 103.8], 5);
      // Plain satellite tiles (no baked-in place-name labels) — `lyrs=y` (hybrid)
      // draws Google's own city/country labels straight into the raster image,
      // which collided with our own aimag-name/pin labels drawn on top.
      this.addBasemap(m, 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', ['0', '1', '2', '3']);
      this._aimagPolyLayer = window.L.layerGroup().addTo(m);
      this._aimagLabelLayer = window.L.layerGroup().addTo(m);
      this._pinLayer = window.L.layerGroup().addTo(m);
      this._aimagLayers = {};
      this._aimagBuilt = false;
      this._mainMap = m;
      setTimeout(() => m.invalidateSize(), 120);
      this.syncMainMap();
    };
    init();
  };

  unmountMainMap() {
    if (this._mainMap) { try { this._mainMap.remove(); } catch (err) { /* ignore */ } }
    this._mainMap = null; this._aimagPolyLayer = null; this._aimagLabelLayer = null; this._pinLayer = null;
    this._aimagLayers = {}; this._aimagBuilt = false; this._fullBounds = null; this._wasZoomed = false; this._lastFlownAimag = null; this._enclaveHost = {};
    this._lastFlownNearKey = null;
  }

  // "Ойрхон газар олох" — asks the browser for the visitor's own position,
  // then switches the map into near-me mode (see syncMainMap's nearMeActive
  // branch), clearing any aimag selection since that mode shows pins across
  // every aimag at once rather than one aimag's worth.
  requestMyLocation = () => {
    if (!navigator.geolocation) { this.setState({ locationError: 'Энэ төхөөрөмж/хөтөч байршил тодорхойлохыг дэмжихгүй байна' }); return; }
    this.setState({ locating: true, locationError: '' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.setState({
          myLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          locating: false, nearMeActive: true, mapAimag: null, pin: -1, hoverAimag: null,
        });
      },
      () => this.setState({ locating: false, locationError: 'Байршил тодорхойлж чадсангүй — байршил хуваалцах зөвшөөрлөө шалгана уу' }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };
  setNearRadius = (km: number) => this.setState({ nearRadiusKm: km });
  clearNearMe = () => this.setState({ nearMeActive: false, pin: -1 });

  // (Re)builds the aimag border layer once geo is available, then restyles
  // it + the pin markers to match current state. Called after mount, after
  // the mn-aimags.json fetch resolves, and from componentDidUpdate whenever
  // a field that affects what the map shows changes (see componentDidUpdate).
  syncMainMap(rebuildPins: boolean = true) {
    const m = this._mainMap;
    const geo = this.geo;
    if (!m || !geo || !window.L) return;
    const { lang, mapAimag, hoverAimag, pin, bigText, nearMeActive, myLocation } = this.state;
    const accent = this.props.accent ?? '#E8B84B';
    const mnOf = (n: string) => GEO_MN[n] || n;
    const pins = this.mapPins();
    const countByAimag: Record<string, number> = {};
    pins.forEach((p) => { countByAimag[p.aimag] = (countByAimag[p.aimag] || 0) + 1; });

    if (!this._aimagBuilt) {
      this._aimagBuilt = true;
      const allCorners: [number, number][] = [];
      geo.shapes.forEach((sh: any) => {
        const id = mnOf(sh.name);
        const rings = this.polysOf(sh).map((ring) => ring.map(([x, y]) => xyToLonLat(x, y) as [number, number]));
        const layers = rings.map((ring) => window.L.polygon(ring, {
          color: 'rgba(255,255,255,.55)', weight: 2.2, fillColor: 'rgba(255,255,255,0.02)', fillOpacity: 1,
        })
          .on('mouseover', () => this.setState({ hoverAimag: id }))
          .on('mouseout', () => this.setState({ hoverAimag: null }))
          .on('click', () => this.setState((s: any) => ({ mapAimag: s.mapAimag === id ? null : id, pin: -1, nearMeActive: false })))
          .addTo(this._aimagPolyLayer));
        const [clat, clng] = xyToLonLat(sh.lx ?? sh.cx, sh.ly ?? sh.cy);
        const label = window.L.marker([clat, clng], { icon: window.L.divIcon({ className: '', html: '', iconSize: [1, 1] }), interactive: false, opacity: 1 }).addTo(this._aimagLabelLayer);
        this._aimagLayers[id] = { layers, label, sh };
        allCorners.push(xyToLonLat(sh.bx, sh.by) as [number, number], xyToLonLat(sh.bx + sh.bw, sh.by + sh.bh) as [number, number]);
      });
      this._fullBounds = allCorners;

      // Улаанбаатар/Дархан-Уул/Орхон/Говьсүмбэр sit fully enclosed inside a
      // larger neighbor. SVG hit-testing goes by DOM order, not area, so
      // whichever polygon the source GeoJSON happened to list last was
      // swallowing clicks/hover meant for the small aimag underneath —
      // bring the enclosed ones to front so they always win.
      const ENCLAVE_AIMAGS = ['Orhon', 'Darhan-Uul', 'Gowisümber', 'Ulaanbaatar'];
      geo.shapes.forEach((sh: any) => {
        if (!ENCLAVE_AIMAGS.includes(sh.name)) return;
        const entry = this._aimagLayers[mnOf(sh.name)];
        if (entry) entry.layers.forEach((ly: any) => ly.bringToFront());
      });

      // Told/Сэлэнгэ's own `d` isn't just their outer boundary — it also has
      // a second subpath tracing Улаанбаатар/Дархан-Уул's own outline as a
      // literal hole (that's *why* their gold fill stopped exactly at the
      // small aimag's edge even before any of the above). Detect that here
      // (find each shape's *other* subpaths and check which neighbor's
      // centroid falls inside one) so the styling pass below can make the
      // enclave inherit its host's fill instead of standing out as a second,
      // separately-selected patch when only the host is selected/hovered.
      geo.shapes.forEach((hostSh: any) => {
        const rings = this.polysOf(hostSh);
        if (rings.length < 2) return;
        const outer = rings.reduce((best: number[][], r: number[][]) => (r.length > best.length ? r : best));
        rings.forEach((ring: number[][]) => {
          if (ring === outer) return;
          const enclaveSh = geo.shapes.find((o: any) => o !== hostSh && this.pointInRing(ring, o.cx, o.cy));
          if (enclaveSh) this._enclaveHost[mnOf(enclaveSh.name)] = mnOf(hostSh.name);
        });
      });
    }

    Object.keys(this._aimagLayers).forEach((id) => {
      const { layers, label } = this._aimagLayers[id];
      const isSel = mapAimag === id, isHov = hoverAimag === id;
      const hostId = this._enclaveHost[id];
      // A selected aimag is now shown as an outline only (no fill wash) so
      // the real satellite photo underneath stays fully visible — that also
      // means an enclave no longer needs to borrow its host's fill to avoid
      // looking separately selected (there's no fill left to clash with);
      // it keeps its own normal boundary line instead, same as any other
      // aimag. Hover still gets a light fill for discoverability, and an
      // enclave still inherits *that* from its host so the hoverable region
      // reads as one shape before you commit to a click — but only while
      // it/its host *isn't* already the selected aimag. Without that guard,
      // resting the cursor over an already-selected aimag (or the enclave
      // inside it) re-washed it with the hover tint on top of its own
      // outline, looking like it got re-selected.
      const selfOrHostSelected = isSel || (!!hostId && mapAimag === hostId);
      const hostHov = !isHov && !!hostId && hoverAimag === hostId;
      const fill = (!selfOrHostSelected && (isHov || hostHov)) ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,0.02)';
      layers.forEach((ly: any) => ly.setStyle({ fillColor: fill, fillOpacity: 1, color: isSel ? accent : 'rgba(255,255,255,.55)', weight: isSel ? 4.8 : 2.2 }));
      const count = countByAimag[id] || 0;
      const showCount = count > 0 && !mapAimag;
      const visible = mapAimag ? isSel : true;
      const html = !visible ? '' :
        '<div style="transform:translate(-50%,-50%);text-align:center;pointer-events:none;font-family:Manrope,sans-serif">' +
        '<div style="font-size:' + (bigText ? 15 : 12) + 'px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 3px rgba(0,0,0,.9)">' + aimagName(id, lang) + '</div>' +
        (showCount ? '<div style="font-size:' + (bigText ? 12.5 : 10) + 'px;font-weight:800;color:' + accent + ';text-shadow:0 1px 4px rgba(0,0,0,.9)">' + count + ' пин</div>' : '') +
        '</div>';
      label.setIcon(window.L.divIcon({ className: '', html, iconSize: [1, 1] }));
    });

    if (!rebuildPins) return;

    this._pinLayer.clearLayers();
    if (nearMeActive && myLocation) {
      // The selected radius (1/5/15/50/100km), drawn as a dashed yellow
      // (accent) ring around the visitor's own position — purely visual, so
      // it doesn't intercept clicks meant for the pins/basemap under it.
      // Kept as its own reference (not just added-and-forgotten) so the
      // fit-bounds below can size the view to the actual circle instead of
      // just whatever pins happened to fall inside it.
      const radiusCircle = window.L.circle([myLocation.lat, myLocation.lng], {
        radius: this.state.nearRadiusKm * 1000,
        color: accent, weight: 2, opacity: 0.85, dashArray: '6 6',
        fill: true, fillColor: accent, fillOpacity: 0.04,
        interactive: false,
      }).addTo(this._pinLayer);
      // My own position — a plain blue dot (the usual "you are here"
      // convention), not clickable, not part of the pin index space below.
      const meHtml = '<div style="width:16px;height:16px;border-radius:50%;background:#4285F4;border:3px solid #fff;box-shadow:0 0 0 6px rgba(66,133,244,.35)"></div>';
      window.L.marker([myLocation.lat, myLocation.lng], {
        icon: window.L.divIcon({ className: '', html: meHtml, iconSize: [16, 16], iconAnchor: [8, 8] }),
        interactive: false, zIndexOffset: 1000,
      }).addTo(this._pinLayer);

      const near = this.nearMePins();
      near.forEach((o) => {
        const on = pin === o.i;
        const dot = on ? 15 : 11;
        const distLabel = o.distKm < 1 ? Math.round(o.distKm * 1000) + ' м' : o.distKm.toFixed(1) + ' км';
        const html = '<div style="transform:translate(-50%,-100%);text-align:center;cursor:pointer;font-family:Manrope,sans-serif">' +
          '<div style="width:' + dot + 'px;height:' + dot + 'px;margin:0 auto;border-radius:50%;background:' + (on ? accent : '#f0ebe1') + ';border:1.4px solid rgba(8,10,14,.85);box-shadow:0 0 0 6px rgba(232,184,75,' + (on ? '.3' : '.16') + ')"></div>' +
          '<div style="margin-top:4px;font-size:' + (bigText ? 13 : 10.5) + 'px;font-weight:700;color:' + (on ? accent : '#fff') + ';text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 3px rgba(0,0,0,.9);white-space:nowrap">' + o.p.name + ' · ' + distLabel + '</div></div>';
        window.L.marker([o.p.lat, o.p.lng], { icon: window.L.divIcon({ className: '', html, iconSize: [1, 1] }) })
          .on('click', () => this.setState({ pin: on ? -1 : o.i }))
          .addTo(this._pinLayer);
      });

      // Re-fit only when the location/radius actually changed — this also
      // re-runs on every pin click (same reason as the aimag branch below),
      // and re-flying then would fight the user's own pan/zoom. Fits to the
      // full radius circle (not just however many pins landed inside it) so
      // picking e.g. 100km always shows the whole 100km, even with 0 results.
      const nearKey = this.state.nearRadiusKm + ':' + myLocation.lat.toFixed(4) + ':' + myLocation.lng.toFixed(4);
      if (this._lastFlownNearKey !== nearKey) {
        const bounds = radiusCircle.getBounds();
        m.flyToBounds(bounds, { paddingTopLeft: [50, 145], paddingBottomRight: [385, 80], maxZoom: 13, duration: 0.9 });
        this._lastFlownNearKey = nearKey;
      }
      this._wasZoomed = true;
    } else if (mapAimag) {
      const entry = this._aimagLayers[mapAimag];
      const sh = entry && entry.sh;
      const aimagPins = pins.map((p, i) => ({ p, i })).filter((o) => o.p.aimag === mapAimag);
      // Places with no real lat/lng (most CATS items) need a made-up spot
      // inside the aimag's shape — PIN_OFFS used to cycle through just 5
      // fixed positions, so any aimag with more than 5 of them (Улаанбаатар
      // alone can hold 30+) wrapped back over the same spots and stacked
      // pins exactly on top of each other, making a 37-pin aimag look like
      // only ~6 were there. A sunflower/phyllotaxis scatter instead gives
      // every pin its own distinct spot no matter the count.
      const autoTotal = aimagPins.reduce((n, o) => n + (o.p.lat == null ? 1 : 0), 0);
      let autoIdx = 0;
      aimagPins.forEach((o) => {
        let latlng: [number, number];
        if (o.p.lat != null) latlng = [o.p.lat, o.p.lng];
        else {
          const r = Math.sqrt((autoIdx + 0.5) / autoTotal) * 0.4;
          const theta = autoIdx * GOLDEN_ANGLE;
          autoIdx++;
          latlng = xyToLonLat(sh.cx + Math.cos(theta) * r * sh.bw, sh.cy + Math.sin(theta) * r * sh.bh);
        }
        const on = pin === o.i;
        const dot = on ? 15 : 11;
        const html = '<div style="transform:translate(-50%,-100%);text-align:center;cursor:pointer;font-family:Manrope,sans-serif">' +
          '<div style="width:' + dot + 'px;height:' + dot + 'px;margin:0 auto;border-radius:50%;background:' + (on ? accent : '#f0ebe1') + ';border:1.4px solid rgba(8,10,14,.85);box-shadow:0 0 0 6px rgba(232,184,75,' + (on ? '.3' : '.16') + ')"></div>' +
          '<div style="margin-top:4px;font-size:' + (bigText ? 13 : 10.5) + 'px;font-weight:700;color:' + (on ? accent : '#fff') + ';text-shadow:0 1px 4px rgba(0,0,0,.9),0 0 3px rgba(0,0,0,.9);white-space:nowrap">' + o.p.name + '</div></div>';
        window.L.marker(latlng, { icon: window.L.divIcon({ className: '', html, iconSize: [1, 1] }) })
          .on('click', () => this.setState({ pin: on ? -1 : o.i }))
          .addTo(this._pinLayer);
      });
      // Only fly the view when the *selection itself* changes — syncMainMap
      // also re-runs on every hover/pin-click while an aimag stays selected,
      // and re-flying then would snap the map back under the user's hands
      // every time they'd tried to pan/zoom freely after selecting.
      if (sh && this._lastFlownAimag !== mapAimag) {
        const bounds = this.polysOf(sh).flat().map(([x, y]: number[]) => xyToLonLat(x, y));
        // Asymmetric padding, not a plain [70,70] — a selected aimag also
        // brings up the info panel (bottom-right) and the globe/pin-mode
        // controls (top-right), so the fitted shape needs extra clearance
        // on those two edges to land inside the space that's actually free,
        // instead of ending up cropped/hidden under that chrome.
        m.flyToBounds(bounds, { paddingTopLeft: [50, 145], paddingBottomRight: [385, 80], maxZoom: 11, duration: 0.9 });
        this._lastFlownAimag = mapAimag;
      }
      this._wasZoomed = true;
    } else if (this._wasZoomed) {
      if (this._fullBounds) m.flyToBounds(this._fullBounds, { padding: [40, 40], duration: 0.9 });
      this._wasZoomed = false;
      this._lastFlownAimag = null;
      this._lastFlownNearKey = null;
    }
  }

  // Real ScenicPin rows shaped into Pin[] — replaces PINS.concat(userPins).
  allPins(): Pin[] {
    return (this.state.liveScenicPins || []).map((p: any): Pin => ({
      id: p.id, name: p.name, type: p.type, aimag: p.aimag ? p.aimag.name : 'Улаанбаатар',
      img: (p.images && p.images[0]) || '', images: p.images || [], desc: p.description || '',
      mapUrl: p.googleMapUrl || undefined,
      lat: p.lat ?? undefined, lng: p.lng ?? undefined,
    }));
  }

  mapPins(): any[] {
    const mode = this.state.pinMode || 'scenic';
    if (mode === 'places') {
      const out: any[] = [];
      // `idx` — this item's position within its own category's items array —
      // rides along so the sidebar's "Дэлгэрэнгүй" button can build the same
      // /category/:slug/place/:index URL openPlace()/the category grid use;
      // the flattened `out` array's own index doesn't match that per-category one.
      this.liveCats().forEach((c) => c.items.forEach((it, idx) => out.push({
        name: it.name, type: it.sub || c.name, aimag: it.aimag || 'Улаанбаатар',
        img: it.img || '', desc: it.meta, cat: c.slug, idx,
        lat: it.lat, lng: it.lng, mapUrl: it.mapUrl, hours: it.hours, access: it.access,
      })));
      return out;
    }
    if (mode === 'events') {
      return (this.state.liveEvents || []).map((ev: any) => ({
        id: ev.id, name: ev.name, type: ev.tag || 'Эвент', aimag: ev.aimag ? ev.aimag.name : 'Улаанбаатар',
        img: (ev.images && ev.images[0]) || '', desc: [fmtEventDate(ev.startDate), ev.meta].filter(Boolean).join(' · '),
        lat: ev.lat, lng: ev.lng,
      }));
    }
    return this.allPins();
  }

  // Great-circle distance in km — used only for the "ойрхон газар олох"
  // radius filter below, where a flat-earth approximation would drift too
  // much over Mongolia's east-west span.
  haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // Pins (in the current pinMode) within nearRadiusKm of myLocation, nearest
  // first. Only pins with a real lat/lng can be placed at all — synthetic
  // sunflower-scattered positions (see syncMainMap) aren't real coordinates,
  // so a pin without one can never match a real-world radius and is left out
  // rather than given a made-up distance.
  nearMePins(): { p: any; i: number; distKm: number }[] {
    const { myLocation, nearRadiusKm } = this.state;
    if (!myLocation) return [];
    return this.mapPins()
      .map((p, i) => ({ p, i, distKm: p.lat != null && p.lng != null ? this.haversineKm(myLocation.lat, myLocation.lng, p.lat, p.lng) : Infinity }))
      .filter((o) => o.distKm <= nearRadiusKm)
      .sort((a, b) => a.distKm - b.distKm);
  }

  bgReady(imgId: string, size: number) {
    if (this._bgOk[imgId]) return true;
    // renderVals also runs during Next.js server rendering. Image only exists
    // in the browser, where the client render will call this again and start
    // the real preload.
    if (typeof Image === 'undefined') return false;
    // A video URL can never fire an <img> load event, so the usual preload-then-
    // crossfade below would wait forever — treat it as ready immediately instead.
    if (isVideoUrl(imgId)) { this._bgOk[imgId] = true; return true; }
    if (!this._bgLd[imgId]) {
      this._bgLd[imgId] = true;
      const im = new Image();
      im.onload = () => { this._bgOk[imgId] = true; if (this._mounted) this.forceUpdate(); };
      im.src = imgUrl(imgId, size);
    }
    return false;
  }

  // Warms the browser's HTTP cache (via the same _bgOk/_bgLd bookkeeping
  // bgReady above uses) for every aimag's hero photo shortly after mount, so
  // by the time one actually gets selected on the map, aimagBgLayers below
  // finds it already cached instead of triggering a fresh fetch.
  prefetchAimagBgs = (overrides: Record<string, string>) => {
    Object.keys(AIMAG_BG).forEach((name) => {
      const imgId = overrides[name] || AIMAG_BG[name];
      if (imgId) this.bgReady(imgId, 1800);
    });
  };

  // ── SVG builders (verbatim, React.createElement) ──
  buildPickerSvg(accent: string, lang: any, sel: any, hover: any, mini: any, bigText?: any) {
    const geo = this.geo;
    if (!geo) return null;
    const W = geo.W, H = geo.H;
    const fs = mini ? 24 : (bigText ? 15 : 10.5);
    const clipId = mini ? 'mnClipPickM' : 'mnClipPick';
    const mnOf = (n: string) => GEO_MN[n] || n;
    const kids: any[] = [];
    kids.push(e('defs', { key: 'defs' }, e('clipPath', { id: clipId }, geo.shapes.map((sh: any, i: number) => e('path', { key: i, d: sh.d })))));
    kids.push(e('rect', { key: 'tint', x: -100, y: -100, width: W + 200, height: H + 200, fill: 'rgba(255,255,255,.09)', clipPath: 'url(#' + clipId + ')' }));
    geo.shapes.forEach((sh: any) => {
      const id = mnOf(sh.name);
      const isSel = sel === id, isHov = hover === id;
      kids.push(e('path', {
        key: 'p-' + sh.name, d: sh.d, 'data-aimag': id,
        fill: isSel ? 'rgba(232, 184, 75,.3)' : (isHov ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,0.001)'),
        stroke: isSel ? accent : 'rgba(255,255,255,.6)',
        strokeWidth: isSel ? 2 : 1.1, vectorEffect: 'non-scaling-stroke',
        style: { cursor: 'pointer', transition: 'fill .25s' },
        onMouseEnter: () => this.setState({ heroHover: id }),
        onMouseLeave: () => this.setState({ heroHover: null }),
        // Selecting an aimag no longer closes the map (locOpen) — only the
        // "Бүгд" button toggle does that now, so picking one aimag after
        // another stays on the map instead of needing to reopen it each time.
        onClick: () => this.setState((s: any) => ({ aimag: s.aimag === id ? 'Бүгд' : id })),
      }));
    });
    geo.shapes.forEach((sh: any) => {
      const id = mnOf(sh.name);
      if (mini && (sh.name === 'Orhon' || sh.name === 'Darhan-Uul' || sh.name === 'Gowisümber' || sh.name === 'Ulaanbaatar' || sh.name === 'Selenge')) return;
      // Cyrillic name hides in place of the vertical traditional-script HTML
      // overlay once selected (rendered at heroVertPos, same spot as this
      // text) — not shown alongside it. An invisible marker takes its place
      // at the exact same hand-tuned lx/ly anchor (not the shape's bounding
      // box, which for a concave outline can sit outside the shape entirely)
      // so the overlay can be measured against a point actually inside it.
      const off = LABEL_OFF[sh.name] || [0, 0];
      if (sel === id && lang === 'mn' && AIMAG_MN_SCRIPT[id]) {
        kids.push(e('circle', { key: 'lm-' + sh.name, 'data-aimag-label': id, cx: (sh.lx || sh.cx) + off[0], cy: (sh.ly || sh.cy) + off[1], r: 0.1, opacity: 0 }));
        return;
      }
      kids.push(e('text', {
        key: 'l-' + sh.name, x: (sh.lx || sh.cx) + off[0], y: (sh.ly || sh.cy) + off[1],
        textAnchor: 'middle', fontSize: fs, fontWeight: 700,
        fill: sel === id ? accent : 'rgba(240,243,248,.85)',
        stroke: 'rgba(6,9,14,.7)', strokeWidth: fs * 0.24,
        style: { paintOrder: 'stroke', pointerEvents: 'none' }, fontFamily: "'Manrope',sans-serif",
      }, aimagName(id, lang)));
    });
    // Selected aimag's pin total — just the count (matches the nav pill's
    // "N пин"), not individual dots: at country-map scale, plotting every
    // pin with its own name label made the shape too cluttered to read.
    // Counts CATS place items (газрын пин — same "Газрууд" pins /maps shows),
    // not the separate scenic-spot PINS array (vзэсгэлэнт газрын пин).
    const selSh = sel ? geo.shapes.find((s: any) => mnOf(s.name) === sel) : null;
    if (selSh) {
      const pinCount = this.liveCats().reduce((n: number, c: any) => n + c.items.filter((it: any) => (it.aimag || 'Улаанбаатар') === sel).length, 0);
      if (pinCount > 0) {
        const off = LABEL_OFF[selSh.name] || [0, 0];
        const countFs = mini ? 15 : (bigText ? 10.5 : 8);
        const anchorX = (selSh.lx || selSh.cx) + off[0], anchorY = (selSh.ly || selSh.cy) + off[1];
        // The vertical traditional-script overlay (rendered as HTML at
        // heroVertPos, same anchor — a top-anchored column, not centered on
        // it) sits to the right of/below this anchor point — so when it's
        // showing, the count reads better beside it (левэside, vertically
        // centered on the column) with a gap, instead of stacked underneath.
        const scriptShowing = lang === 'mn' && AIMAG_MN_SCRIPT[sel];
        const countX = scriptShowing ? anchorX - fs * 0.9 : anchorX;
        const countY = scriptShowing ? anchorY + fs * 1.3 : anchorY + fs * 0.95;
        kids.push(e('text', {
          key: 'pincount', x: countX, y: countY,
          textAnchor: scriptShowing ? 'end' : 'middle', dominantBaseline: scriptShowing ? 'middle' : 'auto',
          fontSize: countFs, fontWeight: 800,
          fill: accent, stroke: 'rgba(6,9,14,.8)', strokeWidth: countFs * 0.24,
          style: { paintOrder: 'stroke', pointerEvents: 'none' }, fontFamily: "'Manrope',sans-serif",
        }, pinCount + ' ' + STR[lang as 'mn' | 'en'].pinsLabel));
      }
    }
    return e('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', style: { width: '100%', height: '100%', display: 'block', overflow: 'visible' } }, kids);
  }

  // Navigates to a category grid or a place detail page — routes now carry the
  // slug/index in the URL itself (PlaceDetail rebuilds its data from CATS + the
  // index, so nothing needs to travel via setState anymore).
  openCat = (slug: string, sub?: string) => {
    this.props.navigate('/category/' + slug + (sub ? '?sub=' + encodeURIComponent(sub) : ''));
    this.setState({ locOpen: false });
    try { window.scrollTo(0, 0); } catch (err) { /* ignore */ }
  };

  openPlace = (cat: any, i: number) => {
    this.props.navigate('/category/' + cat.slug + '/place/' + i);
    this.setState({ locOpen: false });
    try { window.scrollTo(0, 0); } catch (err) { /* ignore */ }
  };

  // Same index-in-the-URL approach as openPlace, but EventDetail reads the
  // matching entry straight off V.events (via context) instead of rebuilding
  // from a static data.ts array — myEvents (user-submitted, this-session-only)
  // only exists on this layout's own state, not in any file EventDetail could
  // import and rebuild from.
  openEventDetail = (i: number) => {
    this.props.navigate('/event/' + i);
    try { window.scrollTo(0, 0); } catch (err) { /* ignore */ }
  };

  // Same index-in-the-URL approach — ScenicDetail reads the matching entry
  // off V.scenicPins (built from this.allPins(), same order/index).
  openScenicDetail = (i: number) => {
    this.props.navigate('/scenic/' + i);
    try { window.scrollTo(0, 0); } catch (err) { /* ignore */ }
  };

  renderVals(): any {
    const { active, aimag, lang, locOpen, pin, mapAimag, vw } = this.state;
    const { pathname, navigate } = this.props;
    const route = routeFromPathname(pathname);
    const accent = this.props.accent ?? '#E8B84B';
    const driftAnim = (this.props.motion ?? true) ? 'bbDrift 18s ease-in-out infinite alternate' : 'none';
    const L = STR[lang as 'mn' | 'en'];
    // No @media queries here (everything is inline style objects) — branch on
    // these instead, same pattern as the existing `bigText`/`mini` toggles.
    const isMobile = vw < 640;
    const isTablet = vw < 1024;

    // allPins() concatenates PINS + userPins fresh each call — compute it once
    // instead of up to twice per category (14x total) as this used to.
    const allPinsOnce = this.allPins();
    // Real Place rows grouped into CATS shape — computed once per render and
    // reused below instead of reading the (now-empty) CATS[].items directly.
    const cats = this.liveCats();
    const navCats = cats.map((c, i) => {
      const isA = active === i;
      const catCount = aimag === 'Бүгд'
        ? c.items.length + allPinsOnce.filter((p) => p.cat === c.slug).length
        : c.items.filter((it) => (it.aimag || 'Улаанбаатар') === aimag).length + allPinsOnce.filter((p) => p.cat === c.slug && p.aimag === aimag).length;
      return {
        num: c.num, count: catCount, name: lang === 'en' ? c.nameEn : c.name,
        color: isA ? '#f6f1e7' : (active === -1 ? 'rgba(242,237,227,.72)' : 'rgba(242,237,227,.48)'),
        shift: isA ? 'translateX(12px)' : 'translateX(0)', barOpacity: isA ? 1 : 0,
        activate: () => this.setState({ active: i }), open: () => this.openCat(c.slug),
        isActive: isA,
        // Sub-categories flown out under the nav item on hover — clicking one
        // jumps straight into the category page pre-filtered to that sub
        // (CategoryPage reads `?sub=` on mount), instead of always landing on
        // the unfiltered "Бүгд" view.
        subs: c.subs.map((s) => ({ label: s, open: () => this.openCat(c.slug, s) })),
      };
    });

    // Home's hover/selection preview always stays a still photo — even a
    // category with an uploaded background *video* (shown once you're inside
    // its own page) only shows its photo here.
    const bgLayers = cats.map((c, i) => {
      const override = this.state.catBgOverride[c.slug] || '';
      return { bg: catBgOf(c, override), opacity: active === i ? 1 : 0 };
    });

    const activeCat = active >= 0 ? cats[active] : null;
    const topItems = activeCat
      ? activeCat.items.map((it, idx) => ({ it, idx, rating: ratingOf(it.name) })).sort((a, b) => +b.rating - +a.rating).slice(0, 3)
      : [];
    // Top-3-by-rating within the hovered category, reshaped for
    // FloatingRocks' polaroid cards — replaces the old bottom-right mini
    // cluster, which showed this same list separately (see Home's
    // floatingCards).
    const catFloatingCards = activeCat ? topItems.map((o) => ({
      name: o.it.name, sub: o.it.sub, rating: o.rating,
      thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + imgUrl(o.it.img || '', 500) + '")',
      onClick: () => this.openPlace(activeCat, o.idx),
    })) : null;

    const placeCountFor = (a: string) => cats.reduce((n, c) => n + c.items.filter((it) => (it.aimag || 'Улаанбаатар') === a).length, 0);
    const totalPlaces = cats.reduce((n, c) => n + c.items.length, 0);

    const favs = this.state.favs || {};
    // Favoriting requires being signed in — same OTP gate as rating (see
    // rateThis in PlaceDetail/EventDetail) and place/scenic/event submission.
    // Updates optimistically, then reverts if the backend call fails, rather
    // than waiting on the round-trip before the heart icon flips (this fires
    // from many small card buttons at once, not one big form submit).
    const toggleFav = (key: string) => (ev: any) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      const session = getSession();
      if (!session) { this.setState({ showUserAuthForm: true }); return; }
      const nowOn = !favs[key];
      this.setState((s: any) => ({ favs: { ...s.favs, [key]: nowOn } }));
      (nowOn ? addFavorite(session.token, key) : removeFavorite(session.token, key)).catch(() => {
        this.setState((s: any) => ({ favs: { ...s.favs, [key]: !nowOn } }));
      });
    };
    const heartOf = (on: boolean) => ({ favOn: on, heartColor: on ? accent : 'rgba(242,237,227,.9)' });

    // "Очно" — a real EventAttendee row per (event, user) rather than the
    // local-only toggle this used to be, keyed by the event's own id. Same
    // shape as toggleFav above: sign-in required, optimistic flip, reverted
    // if the write fails. The headcount is nudged alongside it so the number
    // next to the button moves in the same frame as the button itself; the
    // backend's own fresh count then replaces the guess.
    const joined = this.state.joined || {};
    const attendCounts = this.state.attendCounts || {};
    const toggleJoin = (eventId: number) => async (ev: any) => {
      if (ev && ev.stopPropagation) ev.stopPropagation();
      const session = getSession();
      if (!session) { this.setState({ showUserAuthForm: true }); return; }
      const nowOn = !joined[eventId];
      const before = attendCounts[eventId] ?? 0;
      this.setState((s: any) => ({
        joined: { ...s.joined, [eventId]: nowOn },
        attendCounts: { ...s.attendCounts, [eventId]: Math.max(0, (s.attendCounts?.[eventId] ?? 0) + (nowOn ? 1 : -1)) },
      }));
      try {
        if (nowOn) {
          const count = await attendEvent(session.token, eventId);
          this.setState((s: any) => ({ attendCounts: { ...s.attendCounts, [eventId]: count } }));
        } else {
          await unattendEvent(session.token, eventId);
        }
      } catch (err) {
        this.setState((s: any) => ({
          joined: { ...s.joined, [eventId]: !nowOn },
          attendCounts: { ...s.attendCounts, [eventId]: before },
        }));
      }
    };
    const joinOf = (on: boolean, count: number) => ({
      joinedOn: on, joinLabel: on ? L.evJoined : L.evJoin,
      joinBg: on ? accent : 'rgba(0,0,0,.55)', joinColor: on ? '#132a1f' : '#f6f1e7',
      joinBorder: on ? accent : 'rgba(255,255,255,.28)',
      // Rendered next to the button; the "0 хүн очно" case is deliberately
      // still shown rather than hidden — a brand-new event reading "0 хүн
      // очно" is clearer than a number that silently appears later.
      attendCount: count, attendLabel: count + ' ' + L.evAttendSuffix,
    });

    const favPlaces: any[] = [];
    cats.forEach((c) => c.items.forEach((it, i) => {
      const key = 'p:' + c.slug + ':' + it.name;
      if (!favs[key]) return;
      favPlaces.push({
        name: it.name, sub: it.sub, rating: ratingOf(it.name), accShow: it.access ? 'flex' : 'none',
        thumb: itemThumbOf(it.img).replace('rgba(0,0,0,.12)', 'rgba(0,0,0,.05)').replace('rgba(0,0,0,.42)', 'rgba(0,0,0,.15)'),
        displayMeta: it.meta + ' · ' + aimagName(it.aimag || 'Улаанбаатар', lang), toggleFav: toggleFav(key), ...heartOf(true),
        onClick: () => this.openPlace(c, i),
      });
    }));
    favPlaces.sort((a, b) => +b.rating - +a.rating);
    const favScenic = this.allPins()
      .map((p, i) => ({ p, i, key: 's:' + p.name })).filter((o) => favs[o.key])
      .map((o) => ({
        name: o.p.name, sub: o.p.type, rating: ratingOf(o.p.name),
        accShow: (o.p.access || isAccessible(o.p.name)) ? 'flex' : 'none',
        thumb: 'linear-gradient(rgba(0,0,0,.05), rgba(0,0,0,.15)), url("' + imgUrl(o.p.img, 640) + '")',
        displayMeta: aimagName(o.p.aimag, lang), toggleFav: toggleFav(o.key), ...heartOf(true),
        onClick: () => this.openScenicDetail(o.i),
      })).sort((a, b) => +b.rating - +a.rating);
    const favCount = Object.values(favs).filter(Boolean).length;

    const go = (r: string) => { navigate(ROUTE_PATH[r] || '/'); this.setState({ locOpen: false, active: -1 }); try { window.scrollTo(0, 0); } catch (err) { /* ignore */ } };

    const selP = pin >= 0 ? this.mapPins()[pin] : null;
    // Which detail page (if any) the sidebar's "Дэлгэрэнгүй" button should
    // open — depends on which of the 3 pin modes selP came from. Events:
    // matched by id against the same list V.events itself is built from
    // (duplicated here, not shared — that list isn't computed until later
    // in this method), so the index lines up with what openEventDetail(i)
    // expects, featured event included.
    let pinDetailOpen: (() => void) | undefined;
    if (selP) {
      const mode = this.state.pinMode || 'scenic';
      if (mode === 'scenic' && selP.id != null) {
        pinDetailOpen = () => this.openScenicDetail(pin);
      } else if (mode === 'places' && selP.cat && selP.idx != null) {
        const catForPin = selP.cat; const idxForPin = selP.idx;
        pinDetailOpen = () => this.openPlace({ slug: catForPin }, idxForPin);
      } else if (mode === 'events' && selP.id != null) {
        const liveEventsForPin: any[] = this.state.liveEvents || [];
        const evIdx = liveEventsForPin.findIndex((ev: any) => ev.id === selP.id);
        if (evIdx >= 0) pinDetailOpen = () => this.openEventDetail(evIdx);
      }
    }
    const pinSel = selP ? {
      ...selP, rating: ratingOf(selP.name),
      accShow: (selP.access || isAccessible(selP.name)) ? 'inline-flex' : 'none',
      toggleFav: toggleFav('s:' + selP.name), ...heartOf(!!favs['s:' + selP.name]),
      aimag: aimagName(selP.aimag, lang), hours: selP.hours || '', mapUrl: mapsUrlFor(selP),
      thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.35)), url("' + imgUrl(selP.img, 640) + '")',
      openDetail: pinDetailOpen,
    } : false;

    const st = this.state;

    // Same shared "add place/scenic/event" modal Admin uses too (map picker +
    // what3words + satellite tiles included) — see CreateForm.tsx. No "host"
    // tier: any signed-in account can submit all three (a place just lands
    // `pending` until an admin approves it — see app/api/places/route.ts).
    //
    // Two gates stand in front of the form, and both are checked up-front on
    // the "Контент нэмэх" card click rather than at submit time, so nobody
    // fills in a whole place/event form only to be told at the end that they
    // can't post it: a signed-out visitor gets the lightweight OTP
    // UserAuthForm, and a signed-in one whose profile is still missing a
    // name/phone/Instagram/email gets CompleteProfileForm. Whichever card was
    // clicked is remembered in _pendingOpen and opened for real once the gate
    // it tripped clears.
    //
    // The submit handlers below re-check both anyway (a session can expire
    // while the form sits open), and past them ConfirmSubmitOtp gates the
    // actual create — an OTP re-verify required on every single submission,
    // not just once (see onConfirmOtpVerified). A submission held up by any
    // of this is replayed automatically once every gate clears.
    const showFormFor = (kind: 'place' | 'scenic' | 'event') =>
      this.setState(kind === 'place' ? { showPlaceForm: true } : kind === 'scenic' ? { showScenicForm: true } : { showEventForm: true });
    const openCreateForm = async (kind: 'place' | 'scenic' | 'event') => {
      const session = getSession();
      if (!session) { this._pendingOpen = kind; this.setState({ showUserAuthForm: true }); return; }
      // myProfile is fetched once on mount, so it can be null (clicked before
      // that landed) or stale (completed in another tab). Only re-fetch when
      // the cached copy looks incomplete — that keeps the common case instant
      // while making sure nobody gets a "complete your profile" prompt they've
      // already satisfied.
      let profile = this.state.myProfile;
      if (!this.isProfileComplete(profile)) profile = await this.fetchMyProfile(session.token);
      if (!this.isProfileComplete(profile)) { this._pendingOpen = kind; this.setState({ showCompleteProfileForm: true }); return; }
      this._pendingOpen = null;
      showFormFor(kind);
    };
    const openPlaceForm = () => openCreateForm('place');
    const onPlaceSubmit = async (data: CreateFormData) => {
      const session = getSession();
      if (!session) { this._pendingCreate = { kind: 'place', data }; this.setState({ showPlaceForm: false, showUserAuthForm: true }); return; }
      if (!this.isProfileComplete()) { this._pendingCreate = { kind: 'place', data }; this.setState({ showPlaceForm: false, showCompleteProfileForm: true }); return; }
      this._pendingCreate = { kind: 'place', data };
      this.setState({ showPlaceForm: false, showConfirmOtp: true });
    };
    const openScenicForm = () => openCreateForm('scenic');
    const onScenicSubmit = async (data: CreateFormData) => {
      const session = getSession();
      if (!session) { this._pendingCreate = { kind: 'scenic', data }; this.setState({ showScenicForm: false, showUserAuthForm: true }); return; }
      if (!this.isProfileComplete()) { this._pendingCreate = { kind: 'scenic', data }; this.setState({ showScenicForm: false, showCompleteProfileForm: true }); return; }
      this._pendingCreate = { kind: 'scenic', data };
      this.setState({ showScenicForm: false, showConfirmOtp: true });
    };
    const openEventForm = () => openCreateForm('event');
    const onEventSubmit = async (data: CreateFormData) => {
      const session = getSession();
      if (!session) { this._pendingCreate = { kind: 'event', data }; this.setState({ showEventForm: false, showUserAuthForm: true }); return; }
      if (!this.isProfileComplete()) { this._pendingCreate = { kind: 'event', data }; this.setState({ showEventForm: false, showCompleteProfileForm: true }); return; }
      this._pendingCreate = { kind: 'event', data };
      this.setState({ showEventForm: false, showConfirmOtp: true });
    };
    const closeUserAuthForm = () => { this._pendingCreate = null; this._pendingOpen = null; this.setState({ showUserAuthForm: false }); };
    // UserAuthForm already did the OTP verify (that's the sign-in check) —
    // this saves the resulting session, then checks the (freshly-fetched, not
    // possibly-stale state) profile before continuing whatever place/scenic/
    // event submission triggered the prompt: a brand-new account has no
    // profile yet, so this routes straight into CompleteProfileForm instead
    // of skipping that gate. Either way it still ends at ConfirmSubmitOtp,
    // same as the direct-submit path above — signing in a moment ago doesn't
    // skip the per-submission re-verify.
    const onUserAuthed = async (token: string, user: any) => {
      saveSession(token, user);
      this.setState({ showUserAuthForm: false });
      this.fetchMyPlaces(token);
      this.fetchMyFavorites(token);
      this.fetchMyAttending(token);
      const profile = await this.fetchMyProfile(token);
      const pending = this._pendingCreate;
      // Signed in from a "Контент нэмэх" card rather than mid-submission —
      // the profile gate still has to clear before that form can open.
      if (!pending && this._pendingOpen) {
        if (!this.isProfileComplete(profile)) { this.setState({ showCompleteProfileForm: true }); return; }
        const kind = this._pendingOpen;
        this._pendingOpen = null;
        showFormFor(kind);
        return;
      }
      if (!pending) return;
      if (!this.isProfileComplete(profile)) { this.setState({ showCompleteProfileForm: true }); return; }
      this.setState({ showConfirmOtp: true });
    };
    const closeCompleteProfileForm = () => { this._pendingCreate = null; this._pendingOpen = null; this.setState({ showCompleteProfileForm: false }); };
    const openCompleteProfileForm = () => { this._pendingCreate = null; this._pendingOpen = null; this.setState({ showCompleteProfileForm: true }); };
    // CompleteProfileForm's save hit a 401 because the account behind this
    // session no longer exists (a long-lived token outliving a removed
    // account) — the stale session can't be salvaged, so clear it and
    // re-prompt sign-in instead of leaving the user stuck on a save that
    // will never succeed. Whatever place/scenic/event submission was
    // pending gets dropped too, same as a fresh signed-out visitor.
    const onProfileFormSessionExpired = () => {
      clearSession();
      this._pendingCreate = null;
      this.setState({ showCompleteProfileForm: false, showUserAuthForm: true, myPlaces: [], myProfile: null });
    };
    // CompleteProfileForm already saved the profile — continues into
    // ConfirmSubmitOtp for whatever place/scenic/event submission triggered
    // the prompt, same as onUserAuthed above (or just closes if opened
    // manually from Profile, since _pendingCreate is null then).
    const onProfileCompleted = async (profile: ProfileInfo) => {
      this.setState({ showCompleteProfileForm: false, myProfile: profile });
      const pending = this._pendingCreate;
      // Came from a "Контент нэмэх" card that was blocked on this gate — now
      // that the profile is on file, open the form they actually asked for.
      if (!pending && this._pendingOpen) {
        const kind = this._pendingOpen;
        this._pendingOpen = null;
        showFormFor(kind);
        return;
      }
      if (!pending) return;
      this.setState({ showConfirmOtp: true });
    };
    const closeConfirmOtp = () => { this._pendingCreate = null; this.setState({ showConfirmOtp: false }); };
    // Final step — ConfirmSubmitOtp already checked the code against this
    // account's own phone/email (see /api/auth/confirm-otp), so this just
    // replays whichever place/scenic/event submission got it here.
    const onConfirmOtpVerified = async () => {
      this.setState({ showConfirmOtp: false });
      const session = getSession();
      const pending = this._pendingCreate;
      this._pendingCreate = null;
      if (!pending || !session) return;
      try {
        await this.submitPending(pending.kind, pending.data, session.token);
        // Only after the create actually lands — a failed submit falls into
        // the catch below and must not look like a success.
        this.setState({ createdKind: pending.kind });
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
      }
    };
    const closeCreated = () => this.setState({ createdKind: null });
    const createdGoProfile = () => { this.setState({ createdKind: null }); go('profile'); };
    // Clears the session (lib/session.ts) and this session's own fetched
    // place list — myScenic/myEvents don't need clearing since they're
    // re-derived from getSession() fresh on every render (see mySession
    // below), but myPlaces/favs are state fetched once via fetchMyPlaces/
    // fetchMyFavorites and would otherwise keep showing the logged-out
    // account's data until a refresh.
    const logout = () => {
      clearSession();
      // `joined` goes too — it's this session's own attendance, not public
      // data; attendCounts stays, since the totals are the same for everyone.
      this.setState({ myPlaces: [], favs: {}, joined: {} });
      // Otherwise "Гарах" leaves you sitting on /profile, which — now
      // logged out — has nothing of its own to show and falls back to a
      // "please sign in" placeholder instead of just taking you somewhere
      // useful.
      navigate('/');
    };
    const evThumb = (img: any) => img ? 'url("' + img + '")' : 'linear-gradient(135deg, rgba(232, 184, 75,.25), rgba(120,200,170,.15))';
    const liveEvents: any[] = this.state.liveEvents || [];
    const featuredEvent = liveEvents.find((ev) => ev.featured) || liveEvents[0] || null;
    const fe = featuredEvent
      ? { id: featuredEvent.id, name: featuredEvent.name, date: fmtEventDate(featuredEvent.startDate), meta: featuredEvent.meta || '', img: (featuredEvent.images && featuredEvent.images[0]) || '' }
      : { id: null, name: '', date: '', meta: '', img: '' };
    // Kept unfiltered (used to drop the featured event here so it wouldn't
    // render twice) — every event needs a real index into this array for
    // openEventDetail(i) to find it, including the featured one itself, so
    // the featured card can be clickable too. The event page hides the
    // matching small card from its own grid instead (see fevId below).
    const gridEvents = liveEvents;

    // idx captured before the sort/slice (same trick topPlaces already used
    // below) — the top-3-by-rating list's own position isn't the item's real
    // index, so onClick needs the index into the *stable* full array instead.
    const topScenic = this.allPins().map((p, idx) => ({ p, idx, rating: ratingOf(p.name) })).sort((a, b) => +b.rating - +a.rating).slice(0, 3)
      .map((o) => ({ name: o.p.name, sub: o.p.type, rating: o.rating, kind: L.favScenic, thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + imgUrl(o.p.img, 500) + '")', onClick: () => this.openScenicDetail(o.idx) }));
    const flatPlaces: any[] = [];
    cats.forEach((c) => c.items.forEach((it, i) => flatPlaces.push({ it, cat: c, idx: i })));
    const topPlaces = flatPlaces.map((o) => ({ ...o, rating: ratingOf(o.it.name) })).sort((a, b) => +b.rating - +a.rating).slice(0, 3)
      .map((o) => ({ name: o.it.name, sub: o.it.sub, rating: o.rating, kind: L.favPlaces, thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + imgUrl(o.it.img || '', 500) + '")', onClick: () => this.openPlace(o.cat, o.idx) }));
    // Sourced from gridEvents so a captured idx lines up exactly with
    // V.events' own indices, which openEventDetail(i) expects.
    const topEvents = gridEvents.map((ev: any, idx: number) => ({ ev, idx, rating: ratingOf(ev.name) })).sort((a, b) => +b.rating - +a.rating).slice(0, 3)
      .map((o) => ({ name: o.ev.name, sub: o.ev.tag || L.eTagFallback, rating: o.rating, kind: L.eventTitle, thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + imgUrl((o.ev.images && o.ev.images[0]) || '', 500) + '")', onClick: () => this.openEventDetail(o.idx) }));
    const topItems2: any[] = [];
    for (let i = 0; i < 3; i++) { topItems2.push(topScenic[i], topPlaces[i], topEvents[i]); }

    const suggests = SUGGESTS.map((s, i) => {
      const leftText = i % 2 === 0;
      const suggestOverride = this.state.suggestBgOverride[s.slug];
      return {
        ...s, textLeft: leftText ? '0' : 'auto', textRight: leftText ? 'auto' : '0',
        scrim: leftText ? 'linear-gradient(90deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.45) 42%, rgba(0,0,0,.08) 75%)' : 'linear-gradient(270deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.45) 42%, rgba(0,0,0,.08) 75%)',
        cover: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.25)), url("' + imgUrl(suggestOverride || s.img, 1600) + '")',
        coverIsVideo: isVideoUrl(suggestOverride || ''), coverRawUrl: suggestOverride || '',
        open: () => navigate('/suggest/' + s.slug),
      };
    });

    // globe / country card / results
    const gq = (this.state.globeQuery || '').trim().toLowerCase();
    const browserWindow = typeof window !== 'undefined' ? window : undefined;
    const curatedCountries = browserWindow?.GLOBE_COUNTRIES || [];
    const globeNames: string[] = this.globeEngine?.countryNames || [];
    const countryByName = new Map<string, any>();
    curatedCountries.forEach((c) => countryByName.set(c.name, c));
    globeNames.forEach((name) => {
      if (!countryByName.has(name) && browserWindow?.resolveCountry) countryByName.set(name, browserWindow.resolveCountry(name));
    });
    const allC = Array.from(countryByName.values());
    const res = gq ? allC.map((c) => {
      const name = String(c.name).toLowerCase();
      const words = name.split(/\s+/);
      const distance = Math.min(editDistance(gq, name), ...words.map((word) => editDistance(gq, word)));
      const score = name === gq ? 0 : name.startsWith(gq) ? 1 : name.includes(gq) ? 2 : distance <= (gq.length >= 7 ? 2 : 1) ? 3 + distance : 99;
      return { c, score, distance };
    }).filter((x) => x.score < 99).sort((a, b) => a.score - b.score || a.distance - b.distance || a.c.name.localeCompare(b.c.name)).slice(0, 6).map((x) => x.c) : [];
    const gc = this.state.globeCountry;
    // One persistent background layer per aimag, always mounted (mirrors
    // bgLayers' per-category crossfade above) — a brand-new DOM element's
    // very first style application never transitions, it just snaps, so a
    // layer that only gets created at the moment it's selected can never
    // actually fade in. Keeping all 22 mounted from the start means every
    // opacity change is a change on an *existing* element, so the CSS
    // transition always has two real states to animate between. `bg` itself
    // only gets populated once that aimag's photo is confirmed loaded —
    // until then it's an empty, contentless layer (BgMedia skips fetching
    // entirely for an empty `bg`, see ui.tsx), so mounting all 22 doesn't
    // trigger 22 eager photo fetches; the actual fetches are driven by
    // bgReady() below (also warmed early by prefetchAimagBgs in
    // componentDidMount/fetchContentBgs).
    // Direct switch between two different (non-Бүгд) aimags — remember the
    // one being left behind for the duration of the new one's fade-in
    // (cleared after the transition's had time to finish). It's rendered as
    // a separate, always-opaque backstop layer just below the two aimags
    // that are actually dissolving into each other (see aimagBgBackstop),
    // so mid-transition — when both are partway transparent — what shows
    // through is the *old* aimag's own photo (already correct for a
    // dissolve) instead of the plain Home hero underneath everything. A
    // plain deselect back to Бүгд is left alone — fading out to reveal the
    // Home hero is the intended reveal there, not a bug.
    if (aimag !== this._lastRenderedAimag) {
      const leaving = this._lastRenderedAimag;
      this._lastRenderedAimag = aimag;
      if (leaving !== 'Бүгд' && aimag !== 'Бүгд' && leaving !== aimag) {
        this._aimagBgFrozen = leaving;
        if (this._aimagBgFrozenTimer) clearTimeout(this._aimagBgFrozenTimer);
        this._aimagBgFrozenTimer = setTimeout(() => { this._aimagBgFrozen = null; this.forceUpdate(); }, 600);
      } else {
        this._aimagBgFrozen = null;
        if (this._aimagBgFrozenTimer) { clearTimeout(this._aimagBgFrozenTimer); this._aimagBgFrozenTimer = null; }
      }
    }
    const aimagBgLayers = Object.keys(AIMAG_BG).map((name) => {
      const imgId = this.state.aimagBgOverride[name] || AIMAG_BG[name];
      const ready = this.bgReady(imgId, 1800);
      return {
        key: name,
        bg: ready ? 'linear-gradient(rgba(0,0,0,.58), rgba(0,0,0,.78)), url("' + imgUrl(imgId, 1800) + '")' : '',
        isVideo: isVideoUrl(imgId), rawUrl: imgId,
        opacity: aimag === name ? 1 : 0,
      };
    });
    const frozenImgId = this._aimagBgFrozen ? (this.state.aimagBgOverride[this._aimagBgFrozen] || AIMAG_BG[this._aimagBgFrozen]) : null;
    const aimagBgBackstop = frozenImgId ? {
      bg: 'linear-gradient(rgba(0,0,0,.58), rgba(0,0,0,.78)), url("' + imgUrl(frozenImgId, 1800) + '")',
      isVideo: isVideoUrl(frozenImgId), rawUrl: frozenImgId,
    } : null;
    // The moment the picked aimag's photo hasn't loaded yet (its layer has
    // no bg yet), this shows a skeleton instead of the Home hero just
    // sitting there under a flat black scrim.
    const aimagBgLoading = aimag !== 'Бүгд' && !aimagBgLayers.some((l) => l.key === aimag && l.bg);

    // Admin-uploaded team portraits (slug → url), used by V.team below. Gated
    // on _mounted for the same reason mySession is — teamImgOverride is seeded
    // from localStorage, which the server can't read, so using it during the
    // hydration render would put photos where the server rendered initials.
    const teamImgs: Record<string, string> = this._mounted ? (this.state.teamImgOverride || {}) : {};

    // "Миний нэмсэн..." on the Profile page — this session's own submissions.
    // Places come pre-filtered from the server (GET /places/mine, see
    // fetchMyPlaces) since only approved ones are public in the first place;
    // scenic pins/events are filtered out of the same live-fetched lists
    // everyone else sees, since those have no separate "mine" endpoint.
    // Gated on _mounted (not just read unconditionally) so the very first
    // client render — during hydration — reports the same signed-out session
    // the server saw (no localStorage there), instead of immediately
    // reading the real session and mismatching the server HTML. componentDidMount
    // flips _mounted and forceUpdate()s, so the real session shows up a beat later.
    const mySession = this._mounted ? getSession() : null;
    // `open` navigates to the same detail page every other card of that type
    // uses — only possible once a place clears moderation (pending/rejected
    // places aren't in `cats` at all, since that's built from the public
    // live-fetched list, so they stay non-clickable rather than link to
    // nothing/the wrong item).
    const myPlaceItems = (st.myPlaces || []).map((p: any) => {
      const cat = p.status === 'approved' ? cats.find((c) => c.slug === (p.category && p.category.slug)) : null;
      const idx = cat ? cat.items.findIndex((it) => it.id === p.id) : -1;
      return {
        name: p.name, aimag: p.aimag ? p.aimag.name : '', desc: p.description || '—', thumb: evThumb(p.images && p.images[0]),
        pending: p.status === 'pending', rejected: p.status === 'rejected',
        statusLabel: p.status === 'approved' ? 'Батлагдсан ✓' : p.status === 'rejected' ? 'Татгалзсан' : 'Хүлээгдэж буй',
        open: cat && idx >= 0 ? () => this.openPlace(cat, idx) : undefined,
      };
    });
    const myScenicItems = mySession
      ? (this.state.liveScenicPins || []).map((p: any, idx: number) => ({ p, idx })).filter((o: any) => o.p.addedBy === mySession.user.id)
        .map((o: any) => ({
          name: o.p.name, aimag: o.p.aimag ? o.p.aimag.name : '', desc: o.p.description || '—', thumb: evThumb(o.p.images && o.p.images[0]),
          open: () => this.openScenicDetail(o.idx),
        }))
      : [];
    const myEventItems = mySession
      ? liveEvents.map((ev: any, idx: number) => ({ ev, idx })).filter((o) => o.ev.addedBy === mySession.user.id)
        .map((o) => {
          const { day, mon } = eventDayMon(o.ev.startDate);
          const count = attendCounts[o.ev.id] ?? 0;
          return {
            day, mon, name: o.ev.name, meta: o.ev.meta || '', tag: o.ev.tag || L.eTagFallback,
            // How many people pressed "Очно" — the organiser's own headcount,
            // shown right on their card so they don't have to open the event.
            attendCount: count, attendLabel: count + ' ' + L.evAttendSuffix,
            open: () => this.openEventDetail(o.idx),
          };
        })
      : [];

    return {
      accent, driftAnim, L, lang, aimag, favs, toggleFav, spNeeds: st.spNeeds,
      catBgOverride: st.catBgOverride, catVideoOverride: st.catVideoOverride, suggestBgOverride: st.suggestBgOverride,
      isHome: route === 'home', isMapsPage: route === 'pin',
      openPin: () => go('pin'), openEvent: () => go('event'), openSuggest: () => go('suggest'),
      openGlobe: () => go('globe'), globeMountRef: this.handleGlobeRef,
      travelMapRef: (el: any) => { if (el && window.renderTravelMap) window.renderTravelMap(el); },
      travelEyebrow: lang === 'en' ? 'TOURIST FLOW' : 'ЖУУЛЧНЫ УРСГАЛ',
      travelTitle: lang === 'en' ? 'The World → Mongolia' : 'Дэлхийгээс Монгол руу',
      travelSub: lang === 'en' ? 'Top 20 source countries of tourists to Mongolia, by annual arrivals.' : 'Монгол руу хамгийн олон жуулчин илгээдэг 20 улс — жилийн ирэлтээр.',
      travelNote: lang === 'en' ? 'Ranks 1–7: official 2024 figures. 8–20: representative estimates.' : 'Эрэмбэ 1–7: 2024 оны албан ёсны тоо. 8–20: төлөөллийн тооцоо.',
      travelRows: (browserWindow?.TRAVEL_ORIGINS || []).map((o) => ({ rank: o.rank, country: o.country, v: o.v.toLocaleString('en-US'), est: !!o.est })),
      globeTitle: lang === 'en' ? 'The World Archive' : 'Дэлхийн архив',
      globeHint: lang === 'en' ? 'Drag to spin, scroll to zoom. Click a country to open its archive.' : 'Чирж эргүүлээд, scroll-оор томруулна. Улс дээр дарж архивыг нээ.',
      globeSearchPh: lang === 'en' ? 'Search a country…' : 'Улс хайх…',
      globeHover: this.state.globeHover, globeShowHover: !!this.state.globeHover && !this.state.globeCountry,
      globeQuery: this.state.globeQuery || '', globeOnQuery: (ev: any) => this.setState({ globeQuery: ev.target.value }),
      globeFilters: ([['read', lang === 'en' ? 'Read' : 'Унших'], ['listen', lang === 'en' ? 'Listen' : 'Сонсох'], ['watch', lang === 'en' ? 'Watch' : 'Үзэх']] as [string, string][]).map((k) => {
        const on = this.state.globeFilter === k[0];
        return { id: k[0], label: k[1], border: on ? '#c9d400' : 'rgba(0,0,0,.12)', bg: on ? '#e2ee00' : '#ffffff', color: on ? '#1a1a18' : '#4a4a42', set: () => { const nf = on ? null : k[0]; this.setState({ globeFilter: nf }); if (this.globeEngine) this.globeEngine.setFilter(nf); } };
      }),
      globeHasResults: res.length > 0,
      globeResults: res.map((c) => ({ name: c.name, region: c.region, pick: () => { this.setState({ globeQuery: '' }); if (this.globeEngine) this.globeEngine.selectByName(c.name); } })),
      globeHasCard: !!gc, gcName: gc ? gc.name : '', gcRegion: gc ? gc.region : '', gcDesc: gc ? gc.description : '', gcCats: gc ? gc.categories : [],
      gcSitesLabel: lang === 'en' ? 'Most famous places' : 'Хамгийн алдартай газрууд',
      gcNatureLabel: lang === 'en' ? 'Natural wonders' : 'Байгалийн үзэсгэлэн',
      gcSites: gc ? sitesFor(gc, lang, this.state.countrySites) : [],
      globeActiveSite: this.state.globeActiveSite,
      globeSelectSite: (position: number) => { this.setState({ globeActiveSite: position }); if (this.globeEngine) this.globeEngine.setActiveSite(position); },
      globeCloseCard: () => { this.setState({ globeCountry: null, globeActiveSite: null }); if (this.globeEngine) this.globeEngine.clearSelection(); },
      a11yClass: this.state.bigText ? 'bb-hc' : '',
      toggleSp: () => { const v = !this.state.spNeeds; try { localStorage.setItem('bb_sp', v ? '1' : '0'); } catch (err) { /* */ } this.setState({ spNeeds: v }); },
      toggleBig: () => { const v = !this.state.bigText; try { localStorage.setItem('bb_big', v ? '1' : '0'); } catch (err) { /* */ } this.setState({ bigText: v }); },
      openAbout: () => go('about'),
      openProfile: () => go('profile'),
      profileBorder: route === 'profile' ? accent : 'rgba(242,237,227,.28)',
      profileBg: route === 'profile' ? accent : 'transparent', profileColor: route === 'profile' ? '#132a1f' : '#f2ede3',
      bigCardBg: st.bigText ? 'rgba(232, 184, 75,.1)' : 'rgba(255,255,255,.03)', bigCardBorder: st.bigText ? accent : 'rgba(255,255,255,.1)',
      bigSwBg: st.bigText ? accent : 'rgba(255,255,255,.2)', bigSwKnob: st.bigText ? '23px' : '3px',
      spCardBg: st.spNeeds ? 'rgba(120,200,170,.1)' : 'rgba(255,255,255,.03)', spCardBorder: st.spNeeds ? 'rgba(120,200,170,.6)' : 'rgba(255,255,255,.1)',
      spSwBg: st.spNeeds ? 'rgba(120,200,170,.9)' : 'rgba(255,255,255,.2)', spSwKnob: st.spNeeds ? '23px' : '3px',
      openPlaceForm, closePlaceForm: () => this.setState({ showPlaceForm: false }),
      openScenicForm, closeScenicForm: () => this.setState({ showScenicForm: false }),
      openEventForm, closeEventForm: () => this.setState({ showEventForm: false }),
      showPlaceForm: st.showPlaceForm, showScenicForm: st.showScenicForm, showEventForm: st.showEventForm,
      onPlaceSubmit, onScenicSubmit, onEventSubmit,
      showUserAuthForm: st.showUserAuthForm, closeUserAuthForm, onUserAuthed,
      showCompleteProfileForm: st.showCompleteProfileForm, closeCompleteProfileForm, openCompleteProfileForm, onProfileCompleted, onProfileFormSessionExpired,
      showConfirmOtp: st.showConfirmOtp, closeConfirmOtp, onConfirmOtpVerified,
      createdKind: st.createdKind, closeCreated, createdGoProfile,
      // The account's own OTP-verified contact pair, handed to CreateForm so
      // its phone/email fields come pre-filled and locked.
      lockedContact: { phone: st.myProfile?.phoneNumber || '', email: st.myProfile?.email || '' },
      myProfile: st.myProfile,
      // Lets a page-level "rate this" widget (PlaceDetail/EventDetail) prompt
      // sign-in on demand, same modal as place/scenic/event submission —
      // unlike those, there's no pending-action replay after login here, so
      // the visitor just taps their star rating again once signed in.
      openUserAuth: () => this.setState({ showUserAuthForm: true }),
      loggedIn: !!mySession, mySessionToken: mySession?.token, logout,
      hasMyPlaces: myPlaceItems.length > 0, myPlaceItems,
      hasMyScenic: myScenicItems.length > 0, myScenicItems,
      hasMyEvents: myEventItems.length > 0, myEventItems,
      aboutNavColor: route === 'about' ? accent : 'rgba(242,237,227,.75)',
      // `img` is the admin-uploaded portrait for that member (Admin Panel → Фон
      // зураг → Багийн гишүүдийн зураг), keyed by the TEAM slug — empty for
      // anyone without one, which keeps their coloured initial circle. Gated on
      // _mounted for the same reason mySession is: teamImgOverride is seeded
      // from localStorage, which the server can't see, so reading it during
      // hydration would render photos where the server rendered letters.
      // FAQ accordion at the bottom of the Profile page — question/answer in
      // whichever language is active (see FAQ in data.ts).
      faq: FAQ.map((f) => ({ q: lang === 'en' ? f[2] : f[0], a: lang === 'en' ? f[3] : f[1] })),
      team: TEAM.map((t, i) => ({
        name: t[0], role: lang === 'en' ? t[2] : t[1], initial: t[0].charAt(0),
        avatarBg: 'oklch(78% 0.1 ' + (30 + i * 34) + ')',
        img: teamImgs[t[3]] ? imgUrl(teamImgs[t[3]], 300) : '',
      })),
      abHeroFullBg: 'url("' + imgUrl(this.state.aboutBgOverride || '1470071459604-3b5ec3a7fe05', 1800) + '")',
      abHeroIsVideo: isVideoUrl(this.state.aboutBgOverride || ''), abHeroRawUrl: this.state.aboutBgOverride || '',
      homeHeroBg: this.state.homeBgOverride
        ? 'url(\'' + imgUrl(this.state.homeBgOverride, 1800) + '\')'
        : 'linear-gradient(rgba(0,0,0,.28), rgba(0,0,0,.42)), url(\'' + imgUrl('1470071459604-3b5ec3a7fe05', 1800) + '\')',
      homeBgIsVideo: isVideoUrl(this.state.homeBgOverride || ''), homeBgRawUrl: this.state.homeBgOverride || '',
      abHashtag: lang === 'en' ? 'AtlasDateSpace' : 'AtlasБолзоо',
      // Traditional (vertical) Mongolian script accent for each header/desc —
      // an AI best-effort transliteration, not verified by a native reader.
      // The desc column is hard-capped (fixed width + height + overflow:hidden)
      // so a long paragraph clips instead of blowing the layout out again like
      // the first attempt did — it reads as a decorative accent, not full text.
      abTimeline: [
        { icon: Target, label: L.abMissionT, desc: L.abMission, vert: lang === 'mn' ? 'ᠵᠣᠷᠢᠯᠭᠠ' : '', descVert: lang === 'mn' ? 'ᠮᠣᠩᠭᠣᠯ ᠣᠷᠣᠨ ᠢ ᠢᠯᠡᠭᠦᠦ ᠣᠶᠢᠯᠠᠭᠠᠮᠵᠢᠲᠠᠢ᠂ ᠬᠦᠷᠲᠡᠮᠵᠢᠲᠡᠢ᠂ ᠰᠣᠨᠢᠷᠬᠠᠯᠲᠠᠢ ᠪᠠᠶᠢᠳᠠᠯ ᠢᠶᠠᠷ ᠲᠠᠨᠢᠯᠴᠠᠭᠤᠯᠵᠤ᠂ ᠬᠠᠮᠲᠤᠳᠠ ᠥᠩᠭᠡᠷᠡᠭᠦᠯᠬᠦ ᠴᠠᠭ ᠮᠥᠴᠡ ᠪᠦᠷᠢ ᠶᠢ ᠮᠠᠷᠲᠠᠭᠳᠠᠰᠢ ᠦᠭᠡᠢ ᠪᠣᠯᠭᠠᠬᠤ᠃' : '' },
        { icon: Users, label: L.abWhoT, desc: L.abWho, vert: lang === 'mn' ? 'ᠬᠡᠨᠳ᠋\nᠵᠣᠷᠢᠭᠤᠯᠰᠠᠨ' : '', descVert: lang === 'mn' ? 'ᠪᠣᠯᠵᠣᠭᠠᠨ ᠳᠤ ᠶᠠᠪᠤᠬᠤ ᠬᠣᠰᠣᠭᠤᠳ᠂ ᠨᠠᠶᠢᠵᠠ ᠨᠠᠷ ᠲᠠᠢ ᠪᠠᠨ ᠰᠢᠨ᠎ᠡ ᠭᠠᠵᠠᠷ ᠬᠠᠶᠢᠵᠤ ᠪᠤᠢ ᠬᠦᠮᠦᠨ ᠦᠳ᠂ ᠠᠶᠠᠯᠠᠭᠴᠢᠳ᠂ ᠡᠵᠡᠳ᠂ ᠬᠣᠰᠲᠤᠳ᠃' : '' },
        { icon: Zap, label: L.abEdgeT, desc: L.abEdge, vert: lang === 'mn' ? 'ᠳᠠᠪᠤᠤ\nᠲᠠᠯ᠎ᠠ' : '', descVert: lang === 'mn' ? '᠒᠑ ᠠᠶᠢᠮᠠᠭ ᠢ ᠬᠠᠮᠠᠷᠤᠭᠰᠠᠨ ᠭᠠᠵᠠᠷ ᠤᠨ ᠵᠢᠷᠤᠭ᠂ ᠠᠩᠭᠢᠯᠠᠯ ᠲᠠᠢ ᠬᠠᠶᠢᠯᠲᠠ᠂ ᠦᠨᠡᠯᠡᠯᠲᠡ᠃' : '' },
        { icon: Globe, label: L.abVisionT, desc: L.abVision, vert: lang === 'mn' ? 'ᠠᠯᠤᠰ ᠤᠨ\nᠬᠠᠷᠠᠭ᠎ᠠ' : '', descVert: lang === 'mn' ? 'ᠮᠣᠩᠭᠣᠯ ᠤᠨ ᠥᠨᠴᠥᠭ ᠪᠤᠯᠤᠩ ᠪᠦᠷᠢ ᠶᠢᠨ ᠰᠠᠶᠢᠬᠠᠨ ᠭᠠᠵᠠᠷ ᠨᠤᠭᠤᠳ ᠬᠦᠮᠦᠨ ᠪᠦᠷᠢ ᠳᠦ ᠨᠡᠭᠡᠭᠡᠯᠲᠡᠲᠡᠢ᠃' : '' },
      ],
      favCount, favPlaces, favScenic, favPlaceCount: favPlaces.length, favScenicCount: favScenic.length,
      favPlacesEmpty: favPlaces.length === 0, favScenicEmpty: favScenic.length === 0,
      pinNavColor: route === 'pin' ? accent : 'rgba(242,237,227,.75)',
      eventNavColor: route === 'event' ? accent : 'rgba(242,237,227,.75)',
      suggestNavColor: route === 'suggest' ? accent : 'rgba(242,237,227,.75)',
      aimagBgLayers, aimagBgBackstop, aimagBgLoading,
      pickerSvg: this.buildPickerSvg(accent, lang, aimag === 'Бүгд' ? null : aimag, this.state.heroHover, false, this.state.bigText),
      pickerWrapRef: this.handlePickerWrapRef,
      heroAimagLabel: aimag === 'Бүгд' ? '' : aimagName(aimag, lang),
      // Traditional (vertical) Mongolian script for the selected aimag — see
      // AIMAG_MN_SCRIPT in data.ts for the accuracy caveat on this transliteration.
      heroAimagVert: aimag !== 'Бүгд' && lang === 'mn' ? AIMAG_MN_SCRIPT[aimag] || '' : '',
      pinModeOpts: ([['scenic', lang === 'en' ? 'Scenic' : 'Үзэсгэлэнт'], ['places', lang === 'en' ? 'Places' : 'Газрууд'], ['events', lang === 'en' ? 'Events' : 'Эвент']] as [string, string][]).map((m) => {
        const on = (this.state.pinMode || 'scenic') === m[0];
        return { label: m[1], color: on ? '#132a1f' : 'rgba(255,255,255,.85)', pick: () => this.setState({ pinMode: m[0], pin: -1 }) };
      }),
      pinPillShift: 'calc(' + Math.max(0, ['scenic', 'places', 'events'].indexOf(this.state.pinMode || 'scenic')) + ' * 100%)',
      mainMapRef: this.mainMapRef, pinSel, closePin: () => this.setState({ pin: -1 }),
      isMobile, isTablet,
      mobileMenuOpen: this.state.mobileMenuOpen,
      toggleMobileMenu: () => this.setState((s: any) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
      closeMobileMenu: () => this.setState({ mobileMenuOpen: false }),
      heroVertLabel: aimag !== 'Бүгд' && lang === 'mn' ? AIMAG_MN_SCRIPT[aimag] || '' : '',
      heroVertPos: this.state.heroVertPos,
      mapZoomed: !!mapAimag, resetMap: () => this.setState({ mapAimag: null, pin: -1, hoverAimag: null, nearMeActive: false }),
      aimagPanelShow: !!(mapAimag && !selP) && !this.state.nearMeActive,
      panelName: mapAimag ? aimagName(mapAimag, lang) : '',
      panelCount: mapAimag ? this.mapPins().filter((p) => p.aimag === mapAimag).length : 0,
      // "Ойрхон газар олох" — see requestMyLocation/syncMainMap.
      nearMeActive: this.state.nearMeActive, myLocation: this.state.myLocation,
      locating: this.state.locating, locationError: this.state.locationError,
      requestMyLocation: this.requestMyLocation, clearNearMe: this.clearNearMe,
      nearRadiusOpts: [1, 5, 15, 50, 100].map((km) => ({
        km, label: km < 1 ? km * 1000 + ' м' : km + ' км',
        active: this.state.nearRadiusKm === km, pick: () => this.setNearRadius(km),
      })),
      nearCount: this.state.nearMeActive ? this.nearMePins().length : 0,
      hasFeaturedEvent: !!featuredEvent,
      fevBg: 'linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.4)), url("' + imgUrl(fe.img, 1600) + '")',
      fevDate: fe.date, fevName: fe.name, fevMeta: fe.meta,
      // Lets the featured card's own click open its detail page, and the
      // grid below (built from V.events, which now includes every event —
      // see gridEvents above) skip re-rendering it as a small card too.
      fevId: fe.id,
      openFeaturedEvent: featuredEvent ? () => this.openEventDetail(liveEvents.indexOf(featuredEvent)) : undefined,
      openEventDetail: this.openEventDetail,
      events: gridEvents.map((ev: any) => {
        const { day, mon } = eventDayMon(ev.startDate);
        return {
          id: ev.id, day, mon, name: ev.name, meta: ev.meta || '', tag: ev.tag || L.eTagFallback,
          aimag: ev.aimag ? ev.aimag.name : undefined,
          images: ev.images || [],
          lat: ev.lat ?? undefined, lng: ev.lng ?? undefined,
          thumb: 'linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.35)), url("' + imgUrl((ev.images && ev.images[0]) || '', 800) + '")',
        };
      }).map((ev: any, i: number) => ({
        ...ev,
        toggleJoin: toggleJoin(ev.id),
        ...joinOf(!!joined[ev.id], attendCounts[ev.id] ?? 0),
        onClick: () => this.openEventDetail(i),
      })),
      // Backs ScenicDetail (/scenic/:index) — same index-into-this-array
      // convention as V.events, built straight off this.allPins() so the
      // index openScenicDetail(i) navigates with always matches.
      openScenicDetail: this.openScenicDetail,
      scenicPins: this.allPins().map((p) => ({
        ...p, rating: ratingOf(p.name),
        thumb: 'linear-gradient(rgba(0,0,0,.06),rgba(0,0,0,.2)), url("' + imgUrl(p.img, 1200) + '")',
      })),
      // "Алдартай брэндээс санал болгож байна" rail on the Suggest page —
      // admin-managed sponsor/product spotlights (see Admin Panel's
      // "Брэндийн сурталчилгаа" tab), not to be confused with the unrelated
      // Ad model (that one only powers the first-visit popup, see AdModal).
      brands: (this.state.liveBrands || []).map((b: any) => ({
        name: b.name, category: b.category, link: b.link || undefined,
        thumb: 'linear-gradient(rgba(0,0,0,.05),rgba(0,0,0,.15)), url("' + imgUrl(b.image || '', 500) + '")',
        logoUrl: b.logo ? imgUrl(b.logo, 80) : '',
      })),
      suggests, cats, navCats, bgLayers, catFloatingCards, topItems: topItems2,
      travelApps: TRAVEL_APPS.map((a) => {
        const raw = (this.state.travelAppsBgOverride || {})[a.slug] || '';
        return {
          ...a, purpose: lang === 'en' ? a.en : a.mn,
          hasBg: !!raw, bg: raw ? 'url("' + imgUrl(raw, 900) + '")' : 'none',
          bgIsVideo: isVideoUrl(raw), bgRawUrl: raw,
        };
      }),
      clearActive: () => this.setState({ active: -1 }),
      goHome: () => { navigate('/'); this.setState({ active: -1, locOpen: false }); },
      locOpen, toggleLoc: () => this.setState({ locOpen: !locOpen }),
      aimagLabel: aimagName(aimag, lang),
      aimagCount: aimag === 'Бүгд' ? totalPlaces : placeCountFor(aimag),
      resetAimag: () => this.setState({ aimag: 'Бүгд' }),
      setMn: () => this.setState({ lang: 'mn' }), setEn: () => this.setState({ lang: 'en' }),
      mnBg: lang === 'mn' ? accent : 'transparent', mnColor: lang === 'mn' ? '#132a1f' : 'rgba(242,237,227,.7)',
      enBg: lang === 'en' ? accent : 'transparent', enColor: lang === 'en' ? '#132a1f' : 'rgba(242,237,227,.7)',
    };
  }

  render() {
    const V: any = this.renderVals();
    const rootStyle: React.CSSProperties = {
      ['--accent' as any]: V.accent, ['--drift' as any]: V.driftAnim,
    };
    return (
      <div className={`min-h-screen bg-ink font-sans text-cream ${V.a11yClass}`} style={rootStyle}>
        {/* ══════════ NAV ══════════ */}
        <nav
          className="fixed inset-x-0 top-0 z-[60] flex items-center justify-between bg-[linear-gradient(180deg,rgba(8,7,6,.8)_0%,rgba(8,7,6,0)_100%)]"
          style={{ padding: V.isMobile ? '14px 16px' : '18px 48px' }}
        >
          <div className="bb-logo-group relative flex flex-none items-center gap-[18px]">
            <button onClick={V.goHome} className="relative z-[2] flex cursor-pointer items-center border-0 bg-transparent p-0 font-inherit text-inherit">
              <span className="tracking-[-0.01em] text-cream [font-family:'Marcellus_SC',serif]" style={{ fontSize: V.isMobile ? 19 : 23 }}>Atlas</span>
            </button>
          </div>

          {V.isMobile ? (
            <>
              <button onClick={V.toggleMobileMenu} className="flex h-[38px] w-[38px] flex-none cursor-pointer items-center justify-center rounded-[10px] border border-[rgba(242,237,227,.25)] bg-[rgba(255,255,255,.06)] font-[inherit] text-[17px] text-cream transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">{V.mobileMenuOpen ? '×' : '☰'}</button>
              {V.mobileMenuOpen && (
                <>
                  <div onClick={V.closeMobileMenu} className="fixed inset-0 z-40 cursor-default bg-[rgba(0,0,0,.4)]"></div>
                  <div className="fixed top-[66px] right-3 left-3 z-[41] flex max-h-[80vh] flex-col gap-1 overflow-auto rounded-2xl border border-[rgba(255,255,255,.14)] bg-[rgba(13,20,15,.97)] p-3.5 shadow-[0_24px_60px_rgba(0,0,0,.55)] backdrop-blur-[18px]">
                    {V.isHome && (
                      <>
                        <button onClick={V.toggleLoc} className="flex cursor-pointer items-center gap-2 rounded-[11px] border border-[rgba(242,237,227,.16)] bg-[rgba(255,255,255,.05)] px-[13px] py-[11px] text-left font-[inherit] text-[13px] font-semibold text-[rgba(242,237,227,.9)] transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent,#E8B84B)]"></span>
                          <span className="flex-1">{V.aimagLabel}</span>
                          <span className="text-[10.5px] font-extrabold text-[var(--accent,#E8B84B)]">{V.aimagCount}</span>
                        </button>
                      </>
                    )}
                    {V.isMapsPage && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 pr-0.5 pb-1 pl-0.5">
                        <button onClick={V.openGlobe} title={V.L.globe} className="flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full border-none text-[#132a1f] transition-transform duration-200 hover:-translate-y-0.5" style={{ background: V.accent }}><Globe size={15} /></button>
                        <div className="relative flex-1 inline-grid grid-cols-3 rounded-full border border-[rgba(255,255,255,.16)] bg-[rgba(255,255,255,.06)] p-[3px]">
                          <div className="absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-full transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]" style={{ background: V.accent, transform: `translateX(${V.pinPillShift})` }}></div>
                          {V.pinModeOpts.map((m: any, i: number) => (
                            <button key={i} onClick={m.pick} className="relative z-[2] cursor-pointer whitespace-nowrap border-none bg-transparent px-2 py-[5px] font-[inherit] text-[11px] font-bold transition-colors duration-250" style={{ color: m.color }}>{m.label}</button>
                          ))}
                        </div>
                        {V.mapZoomed && (
                          <button onClick={V.resetMap} className="cursor-pointer whitespace-nowrap rounded-full border border-[rgba(242,237,227,.3)] bg-[rgba(255,255,255,.05)] px-3.5 py-1.5 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.85)] hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">← {V.L.resetMap}</button>
                        )}
                      </div>
                    )}
                    {[
                      [V.L.home, V.goHome], [V.L.pin, V.openPin], [V.L.event, V.openEvent],
                      [V.L.suggest, V.openSuggest], [V.L.about, V.openAbout],
                    ].map(([label, fn]: any, i: number) => (
                      <button key={i} onClick={() => { fn(); V.closeMobileMenu(); }} className="cursor-pointer rounded-[11px] border-0 bg-transparent px-[13px] py-[11px] text-left font-[inherit] text-sm font-semibold text-[rgba(242,237,227,.85)] hover:bg-[rgba(255,255,255,.06)] hover:text-cream">{label}</button>
                    ))}
                    <div className="mt-1.5 flex items-center justify-between gap-2.5 border-t border-[rgba(255,255,255,.1)] pt-2.5 pr-[13px] pb-1 pl-[13px]">
                      <div className="flex overflow-hidden rounded-full border border-[rgba(242,237,227,.25)]">
                        <button onClick={V.setMn} className="cursor-pointer border-none px-[11px] py-1.5 font-[inherit] text-[11px] font-bold" style={{ background: V.mnBg, color: V.mnColor }}>MN</button>
                        <button onClick={V.setEn} className="cursor-pointer border-none px-[11px] py-1.5 font-[inherit] text-[11px] font-bold" style={{ background: V.enBg, color: V.enColor }}>EN</button>
                      </div>
                      {!V.loggedIn && (
                        <Link href="/login" onClick={V.closeMobileMenu} className="cursor-pointer rounded-full border border-[rgba(242,237,227,.28)] bg-transparent px-[15px] py-1.5 font-[inherit] text-[12.5px] font-semibold text-cream no-underline">{V.L.signin}</Link>
                      )}
                      {V.loggedIn && (
                        <button onClick={() => { V.openProfile(); V.closeMobileMenu(); }} title={V.L.profile} className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center overflow-hidden rounded-full font-[inherit] text-[13px] font-extrabold transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]" style={{ border: `1px solid ${V.profileBorder}`, background: V.profileBg, color: V.profileColor }}>
                          {V.myProfile?.avatarImage ? <img src={imgUrl(V.myProfile.avatarImage, 68)} alt="" className="h-full w-full object-cover" /> : (V.myProfile?.name || 'Б').charAt(0).toUpperCase()}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex min-w-0 items-center gap-4">
              {V.isHome && (
                <div className="relative">
                  <button onClick={V.toggleLoc} className="flex h-[28px] cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.06)] px-2.5 font-[inherit] text-xs font-semibold text-[rgba(242,237,227,.85)] transition-all duration-250 hover:border-[var(--accent,#E8B84B)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent,#E8B84B)]"></span>
                    <span>{V.aimagLabel}</span>
                    <span className="text-[10.5px] font-extrabold text-[var(--accent,#E8B84B)]">{V.aimagCount}</span>
                    <span className="text-[9px] opacity-60">▾</span>
                  </button>
                </div>
              )}

              {!V.isTablet && (
                <>
                  <button onClick={V.goHome} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold text-[rgba(242,237,227,.75)] hover:text-cream">{V.L.home}</button>
                  <button onClick={V.openPin} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold hover:text-cream" style={{ color: V.pinNavColor }}>{V.L.pin}</button>
                  <button onClick={V.openEvent} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold hover:text-cream" style={{ color: V.eventNavColor }}>{V.L.event}</button>
                  <button onClick={V.openSuggest} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold hover:text-cream" style={{ color: V.suggestNavColor }}>{V.L.suggest}</button>
                  <button onClick={V.openAbout} className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[13px] font-semibold hover:text-cream" style={{ color: V.aboutNavColor }}>{V.L.about}</button>
                </>
              )}

              <div className="flex h-[28px] overflow-hidden rounded-full border border-[rgba(242,237,227,.25)]">
                <button onClick={V.setMn} className="flex h-full cursor-pointer items-center border-none px-2 font-[inherit] text-[11px] font-bold transition-all duration-250" style={{ background: V.mnBg, color: V.mnColor }}>MN</button>
                <button onClick={V.setEn} className="flex h-full cursor-pointer items-center border-none px-2 font-[inherit] text-[11px] font-bold transition-all duration-250" style={{ background: V.enBg, color: V.enColor }}>EN</button>
              </div>

              {!V.isTablet && !V.loggedIn && (
                <Link href="/login" className="flex h-[28px] cursor-pointer items-center rounded-full border border-[rgba(242,237,227,.28)] bg-transparent px-3 font-[inherit] text-[13px] font-semibold text-cream no-underline transition-all duration-250">{V.L.signin}</Link>
              )}

              {V.loggedIn && (
                <button onClick={V.openProfile} title={V.L.profile} className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center overflow-hidden rounded-full font-[inherit] text-[13px] font-extrabold transition-all duration-200 hover:border-[var(--accent,#E8B84B)]" style={{ border: `1px solid ${V.profileBorder}`, background: V.profileBg, color: V.profileColor }}>
                  {V.myProfile?.avatarImage ? <img src={imgUrl(V.myProfile.avatarImage, 56)} alt="" className="h-full w-full object-cover" /> : (V.myProfile?.name || 'Б').charAt(0).toUpperCase()}
                </button>
              )}
            </div>
          )}
        </nav>

        <BigBangContext.Provider value={V}>{this.props.children}</BigBangContext.Provider>

        {/* Same shared modal Host/Admin use — map picker, what3words, satellite tiles included. */}
        {/* lockedContact pre-fills and freezes the phone/email fields with this
            account's own registered pair — both are already OTP-verified (at
            sign-in, and again per submission via ConfirmSubmitOtp), so the
            listing always carries a contact that's actually reachable. */}
        {V.showPlaceForm && <CreateForm kind="place" lockedContact={V.lockedContact} onClose={V.closePlaceForm} onSubmit={V.onPlaceSubmit} />}
        {V.showScenicForm && <CreateForm kind="scenic" lockedContact={V.lockedContact} onClose={V.closeScenicForm} onSubmit={V.onScenicSubmit} />}
        {V.showEventForm && <CreateForm kind="event" lockedContact={V.lockedContact} onClose={V.closeEventForm} onSubmit={V.onEventSubmit} />}
        {V.showUserAuthForm && <UserAuthForm onClose={V.closeUserAuthForm} onAuthed={V.onUserAuthed} />}
        {V.showCompleteProfileForm && <CompleteProfileForm initial={V.myProfile} token={V.mySessionToken} onClose={V.closeCompleteProfileForm} onSaved={V.onProfileCompleted} onSessionExpired={V.onProfileFormSessionExpired} />}
        {V.showConfirmOtp && <ConfirmSubmitOtp phone={V.myProfile?.phoneNumber || ''} email={V.myProfile?.email || ''} token={V.mySessionToken} onClose={V.closeConfirmOtp} onVerified={V.onConfirmOtpVerified} />}
        {V.createdKind && <CreateSuccessCard kind={V.createdKind} L={V.L} onClose={V.closeCreated} onGoProfile={V.createdGoProfile} />}
      </div>
    );
  }
}

// Bridges next/navigation hooks into the class component above — class
// components can't call hooks directly.
export function BigBangLayoutRoute({ children, ...props }: { children: React.ReactNode; accent?: string; motion?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  return <BigBangLayout {...props} navigate={(path: string) => router.push(path)} pathname={pathname}>{children}</BigBangLayout>;
}
