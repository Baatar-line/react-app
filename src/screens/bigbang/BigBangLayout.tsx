/* eslint-disable @typescript-eslint/no-explicit-any */
// Big Bang — shared layout: nav bar, global add-content modals, and the state/logic that's
// genuinely cross-page (language, aimag filter, favorites/saved/joined, accessibility
// settings, background-photo overrides, the globe engine, the add-place/scenic/event forms).
// Each actual "page" (Home, Category, Place, Maps, Globe, Event, Suggest, About, Profile) is
// its own routed component under ./pages, rendered into <Outlet/> below and reading this
// layout's computed values via useOutletContext(). Dynamic per-element styling is kept as
// inline style strings via css() — see ./ui.
import React from 'react';
import { Link, Outlet, useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import { Target, Users, Zap, Globe } from 'lucide-react';
import { css, Hover } from './ui';
import {
  U, ratingOf, STR, CATS, PINS, TEAM, EVENTS, SUGGESTS, TRAVEL_APPS, sitesFor, FEATURED_EVENT, AIMAGS, AIMAG_MN_SCRIPT,
  GEO_MN, LABEL_OFF, AIMAG_BG, PIN_OFFS, FCRIT, ACCESS_NAMES,
  catBgOf, thumbOf, aimagName, isAccessible, imgUrl, isVideoUrl, lonLatToXY, embedUrlFor, mapsUrlFor,
} from './data';
import { apiGet } from '../../lib/api';

type Props = { accent?: string; motion?: boolean; navigate: NavigateFunction; pathname: string };

const e = React.createElement;

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
  _bg: any = null;
  _bgOk: any = {};
  _bgLd: any = {};
  _lastPinBg: any = null;
  _lastAimagBg: any = null;
  _pickMap: any = null;
  _pickMarker: any = null;
  globeEngine: any = null;
  _globeEl: any = null;
  _globeTimer: any = null;
  _globeResize: any = null;
  _pickerWrapEl: any = null;
  _mnVertResize: any = null;
  _vwResize: any = null;

  state: any = {
    active: -1, aimag: 'Бүгд', lang: 'mn', locOpen: false,
    pin: -1, saved: {}, favs: {}, joined: {}, mapAimag: null, hoverAimag: null,
    spNeeds: false, bigText: false, globeCountry: null, globeHover: null, globeFilter: null,
    globeQuery: '', globeReady: false, myScenic: [], myEvents: [],
    showScenicForm: false, sName: '', sDesc: '', sAimag: 'Улаанбаатар', sImg: '',
    showEventForm: false, eName: '', eDate: '', eTime: '', eDesc: '', eTag: '', eImg: '',
    userPins: [], showAddForm: false,
    fRole: 'host', fName: '', fCat: '', fSub: '', fAimag: 'Дорнод', fOpen: '', fClose: '',
    fDesc: '', fMapUrl: '', fImg: '', fLat: null, fLng: null, fPhone: '',
    fAccess: false, fCrit: [false, false, false, false, false], fMsg: '', fErr: false,
    pinMode: 'scenic', mapView: false, heroHover: null,
    // Seeded from the last successful /settings fetch (see fetchSettings below) so a
    // refresh shows the real saved photo immediately instead of flashing the built-in
    // placeholder while the network round-trip to fetch it is still in flight.
    aboutBgOverride: cachedBg('bb_about_bg'), homeBgOverride: cachedBg('bb_home_bg'),
    mongoliaFlagOverride: cachedBg('bb_mn_flag'),
    // Per-category (keyed by slug) and per-aimag (keyed by name) background photos
    // saved via Admin Panel → Фон зураг, so the live site shows them too.
    catBgOverride: cachedMap('bb_cat_bg'), aimagBgOverride: cachedMap('bb_aimag_bg'),
    // Per-"Санал болгох" card background photo, keyed by SUGGESTS slug.
    suggestBgOverride: cachedMap('bb_suggest_bg'),
    heroVertPos: null,
    // Tracked via a resize listener (see componentDidMount) since this whole
    // file styles elements with inline style objects — inline styles can't
    // contain @media queries, so "responsive" here means branching JS values
    // on viewport width instead, the same way `bigText`/`mini` already branch
    // style strings elsewhere in this file.
    vw: typeof window !== 'undefined' ? window.innerWidth : 1280,
    mobileMenuOpen: false,
  };

  componentDidMount() {
    fetch('/assets/mn-aimags.json').then((r) => r.json()).then((g) => { this.geo = g; this.forceUpdate(); }).catch(() => {});
    this.fetchSettings();
    this.fetchContentBgs();
    // Admin Panel runs in a separate tab, so a tab already sitting open on this page
    // would otherwise never see a background change until manually reloaded — refetch
    // whenever this tab regains focus so it picks up the latest saved image.
    window.addEventListener('focus', this.fetchSettings);
    window.addEventListener('focus', this.fetchContentBgs);
    try {
      this.setState({ spNeeds: localStorage.getItem('bb_sp') === '1', bigText: localStorage.getItem('bb_big') === '1' });
    } catch (err) { /* ignore */ }
    this._mnVertResize = () => { this.updateHeroVertPos(); };
    window.addEventListener('resize', this._mnVertResize);
    this._vwResize = () => { if (this.state.vw !== window.innerWidth) this.setState({ vw: window.innerWidth }); };
    window.addEventListener('resize', this._vwResize);
  }

  componentDidUpdate(_prevProps: Props, prevState: any) {
    if (prevState.aimag !== this.state.aimag) this.updateHeroVertPos();
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
    this.unmountGlobe();
    window.removeEventListener('focus', this.fetchSettings);
    window.removeEventListener('focus', this.fetchContentBgs);
    if (this._mnVertResize) window.removeEventListener('resize', this._mnVertResize);
    if (this._vwResize) window.removeEventListener('resize', this._vwResize);
  }

  // Admin Panel can update these via the "Фон зураг" tab — if the backend isn't
  // running or hasn't been set up yet, this silently keeps the built-in placeholder.
  fetchSettings = () => {
    apiGet<{ aboutBackgroundImage: string | null; homeBackgroundImage: string | null; mongoliaFlagImage: string | null; suggestBackgroundImages: Record<string, string> | null }>('/settings')
      .then((s) => {
        if (s.aboutBackgroundImage) this.setState({ aboutBgOverride: s.aboutBackgroundImage });
        if (s.homeBackgroundImage) this.setState({ homeBgOverride: s.homeBackgroundImage });
        if (s.mongoliaFlagImage) {
          this.setState({ mongoliaFlagOverride: s.mongoliaFlagImage });
          if (this.globeEngine) this.globeEngine.setMongoliaFlag(s.mongoliaFlagImage);
        }
        if (s.suggestBackgroundImages) this.setState({ suggestBgOverride: s.suggestBackgroundImages });
        try {
          if (s.aboutBackgroundImage) localStorage.setItem('bb_about_bg', s.aboutBackgroundImage);
          if (s.homeBackgroundImage) localStorage.setItem('bb_home_bg', s.homeBackgroundImage);
          if (s.mongoliaFlagImage) localStorage.setItem('bb_mn_flag', s.mongoliaFlagImage);
          if (s.suggestBackgroundImages) localStorage.setItem('bb_suggest_bg', JSON.stringify(s.suggestBackgroundImages));
        } catch (err) { /* ignore */ }
      })
      .catch(() => {});
  };

  // Category/aimag background photos, same "Фон зураг" admin flow as fetchSettings.
  fetchContentBgs = () => {
    Promise.all([
      apiGet<{ slug: string; image: string | null }[]>('/categories'),
      apiGet<{ name: string; backgroundImage: string | null }[]>('/aimags'),
    ]).then(([cats, aimags]) => {
      const catBgOverride: Record<string, string> = {};
      cats.forEach((c) => { if (c.image) catBgOverride[c.slug] = c.image; });
      const aimagBgOverride: Record<string, string> = {};
      aimags.forEach((a) => { if (a.backgroundImage) aimagBgOverride[a.name] = a.backgroundImage; });
      this.setState({ catBgOverride, aimagBgOverride });
      try {
        localStorage.setItem('bb_cat_bg', JSON.stringify(catBgOverride));
        localStorage.setItem('bb_aimag_bg', JSON.stringify(aimagBgOverride));
      } catch (err) { /* ignore */ }
    }).catch(() => {});
  };

  // ── geometry ──
  xyToAimag(x: number, y: number) {
    const geo = this.geo; if (!geo) return null;
    for (const sh of geo.shapes) {
      if (x < sh.bx || x > sh.bx + sh.bw || y < sh.by || y > sh.by + sh.bh) continue;
      if (!sh._polys) sh._polys = sh.d.split('M').filter((s: string) => s.trim()).map((seg: string) =>
        seg.replace(/Z/g, '').split('L').map((pt) => pt.trim().split(/[ ,]+/).map(Number)).filter((p) => p.length === 2 && !isNaN(p[0])));
      let inside = false;
      for (const poly of sh._polys) {
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
          if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
        }
      }
      if (inside) return GEO_MN[sh.name] || sh.name;
    }
    return null;
  }

  pickMapRef = (node: any) => {
    if (!node) {
      if (this._pickMap) { this._pickMap.remove(); this._pickMap = null; this._pickMarker = null; }
      return;
    }
    if (this._pickMap) return;
    const init = () => {
      if (!node.isConnected) return;
      if (!window.L) { setTimeout(init, 150); return; }
      const m = window.L.map(node, { attributionControl: false });
      m.setView([46.9, 103.8], 5);
      window.L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { subdomains: ['0', '1', '2', '3'], maxZoom: 19 }).addTo(m);
      m.on('click', (ev: any) => this.pickLocation(ev.latlng.lat, ev.latlng.lng));
      this._pickMap = m;
      if (this.state.fLat != null) this.placePickMarker(this.state.fLat, this.state.fLng);
      setTimeout(() => m.invalidateSize(), 120);
    };
    init();
  };

  placePickMarker(lat: number, lng: number) {
    if (!this._pickMap || !window.L) return;
    if (this._pickMarker) this._pickMarker.remove();
    this._pickMarker = window.L.marker([lat, lng], {
      icon: window.L.divIcon({
        className: '',
        html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#E8B84B;border:2px solid #132a1f;box-shadow:0 3px 6px rgba(0,0,0,.5)"></div>',
        iconSize: [22, 22], iconAnchor: [4, 21],
      }),
    }).addTo(this._pickMap);
  }

  pickLocation(lat: number, lng: number) {
    this.placePickMarker(lat, lng);
    const xy = lonLatToXY(lng, lat);
    const aimag = this.xyToAimag(xy[0], xy[1]);
    this.setState((s: any) => ({
      fLat: lat, fLng: lng, fAimag: aimag || s.fAimag,
      fMapUrl: 'https://www.google.com/maps/search/?api=1&query=' + lat.toFixed(5) + '%2C' + lng.toFixed(5),
    }));
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
      onSelect: (name: string) => this.setState({ globeCountry: name ? window.resolveCountry(name) : null }),
    });
    this.globeEngine = eng;
    this._globeResize = () => eng.resize();
    window.addEventListener('resize', this._globeResize);
    eng.init().catch((err: any) => console.warn('globe init failed', err));
  }

  unmountGlobe() {
    if (this._globeTimer) { clearTimeout(this._globeTimer); this._globeTimer = null; }
    if (this._globeResize) { window.removeEventListener('resize', this._globeResize); this._globeResize = null; }
    if (this.globeEngine) { try { this.globeEngine.dispose(); } catch (err) { /* ignore */ } this.globeEngine = null; }
  }

  allPins() { return PINS.concat(this.state.userPins || []); }

  mapPins(): any[] {
    const mode = this.state.pinMode || 'scenic';
    if (mode === 'places') {
      const out: any[] = [];
      CATS.forEach((c) => c.items.forEach((it, i) => out.push({
        name: it.name, type: it.sub || c.name, aimag: it.aimag || 'Улаанбаатар',
        img: c.pool[i % c.pool.length], desc: it.meta, cat: c.slug,
      })));
      return out;
    }
    if (mode === 'events') {
      return [{ name: FEATURED_EVENT.name, type: 'Наадам', aimag: 'Төв', img: FEATURED_EVENT.img, desc: FEATURED_EVENT.date + ' · ' + FEATURED_EVENT.meta }]
        .concat(EVENTS.map((ev) => ({
          name: ev.name, type: ev.tag, aimag: (ev as any).aimag || 'Улаанбаатар',
          img: ev.img || FEATURED_EVENT.img, desc: ev.day + ', ' + ev.mon + ' · ' + ev.meta,
        })) as any);
    }
    return this.allPins();
  }

  bgReady(imgId: string, size: number) {
    if (this._bgOk[imgId]) return true;
    // A video URL can never fire an <img> load event, so the usual preload-then-
    // crossfade below would wait forever — treat it as ready immediately instead.
    if (isVideoUrl(imgId)) { this._bgOk[imgId] = true; return true; }
    if (!this._bgLd[imgId]) {
      this._bgLd[imgId] = true;
      const im = new Image();
      im.onload = () => { this._bgOk[imgId] = true; this.forceUpdate(); };
      im.src = imgUrl(imgId, size);
    }
    return false;
  }

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
        onClick: () => this.setState((s: any) => ({ aimag: s.aimag === id ? 'Бүгд' : id, locOpen: false })),
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
    return e('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', style: { width: '100%', height: '100%', display: 'block', overflow: 'visible' } }, kids);
  }

  buildMapSvg(accent: string, lang: any, sel: any, hover: any, pin: any, bigText?: any) {
    const geo = this.geo;
    const W = geo.W, H = geo.H;
    const labelFs = bigText ? 15 : 10.5;
    const countFs = bigText ? 12.5 : 9;
    const pinLabelFs = bigText ? 14 : 10;
    const mnOf = (n: string) => GEO_MN[n] || n;
    // mapPins() rebuilds its list from CATS/EVENTS each call — compute it once
    // per render instead of once per aimag shape (21x) as this used to.
    const pins = this.mapPins();
    const countByAimag: Record<string, number> = {};
    pins.forEach((p) => { countByAimag[p.aimag] = (countByAimag[p.aimag] || 0) + 1; });
    const selShape = sel ? geo.shapes.find((sh: any) => mnOf(sh.name) === sel) : null;
    let s = 1, tx = 0, ty = 0;
    if (selShape) {
      s = Math.max(1, Math.min(0.8 * W / selShape.bw, 0.8 * H / selShape.bh, 9));
      tx = W * 0.38 - s * selShape.cx;
      ty = H / 2 - s * selShape.cy;
    }
    const kids: any[] = [];
    kids.push(e('defs', { key: 'defs' }, e('clipPath', { id: 'mnClipAll' }, geo.shapes.map((sh: any, i: number) => e('path', { key: i, d: sh.d })))));
    kids.push(e('rect', { key: 'tint', x: -100, y: -100, width: W + 200, height: H + 200, fill: 'rgba(255,255,255,.08)', clipPath: 'url(#mnClipAll)' }));
    geo.shapes.forEach((sh: any) => {
      const id = mnOf(sh.name);
      const isSel = sel === id, isHov = hover === id;
      kids.push(e('path', {
        key: 'p-' + sh.name, d: sh.d, 'data-aimag': id,
        fill: isSel ? 'rgba(232, 184, 75,.16)' : (isHov ? 'rgba(255,255,255,.13)' : 'rgba(255,255,255,0.001)'),
        stroke: isSel ? accent : 'rgba(255,255,255,.55)',
        strokeWidth: isSel ? 2 : 1.1, vectorEffect: 'non-scaling-stroke',
        style: { cursor: 'pointer', transition: 'fill .25s' },
        onMouseEnter: () => this.setState({ hoverAimag: id }),
        onMouseLeave: () => this.setState({ hoverAimag: null }),
        onClick: () => this.setState({ mapAimag: id, pin: -1 }),
      }));
    });
    geo.shapes.forEach((sh: any) => {
      const id = mnOf(sh.name);
      const isSel = sel === id;
      const count = countByAimag[id] || 0;
      const off = LABEL_OFF[sh.name] || [0, 0];
      const op = selShape ? (isSel ? 1 : 0) : 1;
      const nameStr = aimagName(id, lang);
      const hasCount = count > 0 && !selShape;
      kids.push(e('g', {
        key: 'l-' + sh.name,
        style: {
          transform: 'translate(' + ((sh.lx || sh.cx) + off[0]) + 'px,' + ((sh.ly || sh.cy) + off[1]) + 'px) scale(' + (1 / s) + ')',
          transition: 'transform .9s cubic-bezier(.22,.8,.3,1), opacity .5s', opacity: op, pointerEvents: 'none',
        },
      },
        e('text', { textAnchor: 'middle', fontSize: labelFs, fontWeight: 700, fill: 'rgba(255,255,255,.94)', stroke: 'rgba(6,9,14,.65)', strokeWidth: 2.5, style: { paintOrder: 'stroke' }, fontFamily: "'Manrope',sans-serif" }, nameStr),
        hasCount ? e('text', { y: 13, textAnchor: 'middle', fontSize: countFs, fontWeight: 800, fill: accent, stroke: 'rgba(6,9,14,.7)', strokeWidth: 2, style: { paintOrder: 'stroke' }, fontFamily: "'Manrope',sans-serif" }, count + ' пин') : null,
      ));
    });
    if (selShape) {
      const aimagPins = pins.map((p, i) => ({ p, i })).filter((o) => o.p.aimag === sel);
      aimagPins.forEach((o, j) => {
        const off = PIN_OFFS[j % PIN_OFFS.length];
        const exact = o.p.px != null;
        const px = exact ? o.p.px : selShape.cx + off[0] * selShape.bw * 0.8;
        const py = exact ? o.p.py : selShape.cy + off[1] * selShape.bh * 0.8;
        const on = pin === o.i;
        kids.push(e('g', {
          key: 'pin-' + o.i,
          style: { transform: 'translate(' + px + 'px,' + py + 'px) scale(' + (1 / s) + ')', transition: 'transform .9s cubic-bezier(.22,.8,.3,1)', cursor: 'pointer' },
          onClick: () => this.setState({ pin: on ? -1 : o.i }),
        },
          e('circle', { r: 10, fill: accent, opacity: on ? 0.3 : 0.16 }),
          e('circle', { r: 4.5, fill: on ? accent : '#f0ebe1', stroke: 'rgba(8,10,14,.85)', strokeWidth: 1.4 }),
          e('text', { y: 20, textAnchor: 'middle', fontSize: pinLabelFs, fontWeight: 700, fill: on ? accent : 'rgba(240,243,248,.92)', stroke: 'rgba(6,9,14,.75)', strokeWidth: 2.5, style: { paintOrder: 'stroke', pointerEvents: 'none' }, fontFamily: "'Manrope',sans-serif" }, o.p.name),
        ));
      });
    }
    if (hover && !selShape) {
      const hv = geo.shapes.find((sh: any) => mnOf(sh.name) === hover);
      if (hv) {
        const hc = countByAimag[hover] || 0;
        const ttStr = aimagName(hover, lang) + ' · ' + hc + ' пин';
        kids.push(e('g', { key: 'tt', style: { transform: 'translate(' + hv.cx + 'px,' + (hv.by - 8) + 'px) scale(' + (1 / s) + ')', pointerEvents: 'none' } },
          e('text', { textAnchor: 'middle', fontSize: 13, fontWeight: 800, fill: '#ffffff', stroke: 'rgba(6,9,14,.8)', strokeWidth: 3, style: { paintOrder: 'stroke' }, fontFamily: "'Manrope',sans-serif" }, ttStr),
        ));
      }
    }
    return e('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', style: { width: '100%', height: '100%', display: 'block', overflow: 'visible' } },
      e('g', { style: { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(' + s + ')', transformOrigin: '0 0', transition: 'transform .9s cubic-bezier(.22,.8,.3,1)' } }, kids));
  }

  // Navigates to a category grid or a place detail page — routes now carry the
  // slug/index in the URL itself (PlaceDetail rebuilds its data from CATS + the
  // index, so nothing needs to travel via setState anymore).
  openCat = (slug: string) => {
    this.props.navigate('/category/' + slug);
    this.setState({ locOpen: false });
    try { window.scrollTo(0, 0); } catch (err) { /* ignore */ }
  };

  openPlace = (cat: any, i: number) => {
    this.props.navigate('/category/' + cat.slug + '/place/' + i);
    this.setState({ locOpen: false });
    try { window.scrollTo(0, 0); } catch (err) { /* ignore */ }
  };

  renderVals(): any {
    const { active, aimag, lang, locOpen, pin, saved, mapAimag, vw } = this.state;
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
    const navCats = CATS.map((c, i) => {
      const isA = active === i;
      const catCount = aimag === 'Бүгд'
        ? c.items.length + allPinsOnce.filter((p) => p.cat === c.slug).length
        : c.items.filter((it) => (it.aimag || 'Улаанбаатар') === aimag).length + allPinsOnce.filter((p) => p.cat === c.slug && p.aimag === aimag).length;
      return {
        num: c.num, count: catCount, name: lang === 'en' ? c.nameEn : c.name,
        color: isA ? '#f6f1e7' : (active === -1 ? 'rgba(242,237,227,.72)' : 'rgba(242,237,227,.48)'),
        shift: isA ? 'translateX(12px)' : 'translateX(0)', barOpacity: isA ? 1 : 0,
        activate: () => this.setState({ active: i }), open: () => this.openCat(c.slug),
      };
    });

    const bgLayers = CATS.map((c, i) => {
      const override = this.state.catBgOverride[c.slug] || '';
      return { bg: catBgOf(c, override), opacity: active === i ? 1 : 0, isVideo: isVideoUrl(override), rawUrl: override };
    });

    const activeCat = active >= 0 ? CATS[active] : null;
    const topItems = activeCat
      ? activeCat.items.map((it, idx) => ({ it, idx, rating: ratingOf(it.name) })).sort((a, b) => +b.rating - +a.rating).slice(0, 3)
      : [];
    const previewCards = activeCat ? topItems.map((o, i) =>
      e('button', {
        key: activeCat.slug + '-' + o.idx, onClick: () => this.openPlace(activeCat, o.idx), 'aria-label': o.it.name,
        style: { all: 'unset', cursor: 'pointer', width: '160px', height: '200px', boxSizing: 'border-box', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)', borderRadius: '18px', animation: 'bbCardIn .55s cubic-bezier(.22,.8,.3,1) both', animationDelay: (i * 80) + 'ms' } as any,
      },
        e('div', { style: { position: 'absolute', inset: 0, backgroundImage: thumbOf(activeCat, o.idx).replace('rgba(0,0,0,.12)', 'rgba(0,0,0,.05)').replace('rgba(0,0,0,.42)', 'rgba(0,0,0,.15)'), backgroundSize: 'cover', backgroundPosition: 'center' } }),
        e('div', { style: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.18) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,.32) 62%, rgba(0,0,0,.92) 100%)', pointerEvents: 'none' } }),
        e('div', { style: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: '13px 15px', pointerEvents: 'none' } },
          e('div', { style: { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '7px' } },
            e('span', { style: { fontSize: '11px', lineHeight: 1, color: 'var(--accent,#E8B84B)' } }, '★'),
            e('span', { style: { fontSize: '11.5px', fontWeight: 800, lineHeight: 1, color: '#f6f1e7' } }, o.rating)),
          e('div', { style: { fontSize: '14px', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2, color: '#f6f1e7' } }, o.it.name),
          e('div', { style: { fontSize: '11.5px', color: 'rgba(242,237,227,.62)', marginTop: '4px' } }, o.it.meta))) as any) : null;

    const placeCountFor = (a: string) => CATS.reduce((n, c) => n + c.items.filter((it) => (it.aimag || 'Улаанбаатар') === a).length, 0);
    const totalPlaces = CATS.reduce((n, c) => n + c.items.length, 0);
    const aimagOpts = ([['Бүгд', 'All']] as [string, string][]).concat(AIMAGS).map((a) => {
      const on = aimag === a[0];
      return {
        label: lang === 'en' ? a[1] : (a[0] === 'Бүгд' ? L.all : a[0]),
        count: a[0] === 'Бүгд' ? totalPlaces : placeCountFor(a[0]),
        countColor: on ? 'rgba(0,0,0,.65)' : 'var(--accent,#E8B84B)',
        bg: on ? accent : 'rgba(255,255,255,.1)', color: on ? '#132a1f' : 'rgba(255,255,255,.92)',
        border: on ? accent : 'rgba(255,255,255,.55)', pick: () => this.setState({ aimag: a[0], locOpen: false }),
      };
    });

    const favs = this.state.favs || {};
    const toggleFav = (key: string) => (ev: any) => { if (ev && ev.stopPropagation) ev.stopPropagation(); this.setState((s: any) => ({ favs: { ...s.favs, [key]: !s.favs[key] } })); };
    const heartOf = (on: boolean) => ({ favOn: on, heartColor: on ? accent : 'rgba(242,237,227,.9)' });

    const joined = this.state.joined || {};
    const toggleJoin = (key: string) => (ev: any) => { if (ev && ev.stopPropagation) ev.stopPropagation(); this.setState((s: any) => ({ joined: { ...s.joined, [key]: !s.joined[key] } })); };
    const joinOf = (on: boolean) => ({
      joinedOn: on, joinLabel: on ? L.evJoined : L.evJoin,
      joinBg: on ? accent : 'rgba(0,0,0,.55)', joinColor: on ? '#132a1f' : '#f6f1e7',
      joinBorder: on ? accent : 'rgba(255,255,255,.28)',
    });

    const favPlaces: any[] = [];
    CATS.forEach((c) => c.items.forEach((it, i) => {
      const key = 'p:' + c.slug + ':' + it.name;
      if (!favs[key]) return;
      favPlaces.push({
        name: it.name, sub: it.sub, rating: ratingOf(it.name), accShow: isAccessible(it.name) ? 'flex' : 'none',
        thumb: thumbOf(c, i).replace('rgba(0,0,0,.12)', 'rgba(0,0,0,.05)').replace('rgba(0,0,0,.42)', 'rgba(0,0,0,.15)'),
        displayMeta: it.meta + ' · ' + aimagName(it.aimag || 'Улаанбаатар', lang), toggleFav: toggleFav(key), ...heartOf(true),
      });
    }));
    favPlaces.sort((a, b) => +b.rating - +a.rating);
    const favScenic = this.allPins()
      .map((p) => ({ p, key: 's:' + p.name })).filter((o) => favs[o.key])
      .map((o) => ({
        name: o.p.name, sub: o.p.type, rating: ratingOf(o.p.name),
        accShow: (o.p.access || isAccessible(o.p.name)) ? 'flex' : 'none',
        thumb: 'linear-gradient(rgba(0,0,0,.05), rgba(0,0,0,.15)), url("' + imgUrl(o.p.img, 640) + '")',
        displayMeta: aimagName(o.p.aimag, lang), toggleFav: toggleFav(o.key), ...heartOf(true),
      })).sort((a, b) => +b.rating - +a.rating);
    const favCount = Object.values(favs).filter(Boolean).length;

    const go = (r: string) => { navigate(ROUTE_PATH[r] || '/'); this.setState({ locOpen: false, active: -1 }); try { window.scrollTo(0, 0); } catch (err) { /* ignore */ } };

    const hoverAimag = this.state.hoverAimag;
    const mapSvg = this.geo ? this.buildMapSvg(accent, lang, mapAimag, hoverAimag, pin, this.state.bigText) : null;
    const pinBgImg = mapAimag ? (this.state.aimagBgOverride[mapAimag] || AIMAG_BG[mapAimag] || '1470071459604-3b5ec3a7fe05') : null;
    if (pinBgImg && this.bgReady(pinBgImg, 1800)) this._lastPinBg = pinBgImg;
    this._bg = this._bg || { a: null, b: null, slot: 'a', shown: null };
    const newReady = (pinBgImg && this._lastPinBg && this.bgReady(this._lastPinBg, 1800)) ? this._lastPinBg : null;
    if (newReady && newReady !== this._bg.shown) {
      const next = this._bg.slot === 'a' ? 'b' : 'a';
      this._bg[next] = newReady; this._bg.slot = next; this._bg.shown = newReady;
    }
    const pinBgUrl = (id: any) => id ? ('linear-gradient(rgba(0,0,0,.82), rgba(0,0,0,.9)), url("' + imgUrl(id, 1800) + '")') : 'none';
    const pinBgA = pinBgUrl(this._bg.a);
    const pinBgB = pinBgUrl(this._bg.b);
    const showPhoto = !!mapAimag;
    const pinBgAOpacity = (showPhoto && this._bg.slot === 'a') ? 1 : 0;
    const pinBgBOpacity = (showPhoto && this._bg.slot === 'b') ? 1 : 0;
    const selP = pin >= 0 ? this.mapPins()[pin] : null;
    const pinSel = selP ? {
      ...selP, rating: ratingOf(selP.name),
      accShow: (selP.access || isAccessible(selP.name)) ? 'inline-flex' : 'none',
      toggleFav: toggleFav('s:' + selP.name), ...heartOf(!!favs['s:' + selP.name]),
      aimag: aimagName(selP.aimag, lang), hours: selP.hours || '', mapUrl: mapsUrlFor(selP),
      thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.35)), url("' + imgUrl(selP.img, 640) + '")',
    } : false;

    const st = this.state;
    const roleOpts = ([['host', L.roleHost], ['user', L.roleUser], ['admin', L.roleAdmin]] as [string, string][]).map((r) => {
      const on = st.fRole === r[0];
      return { label: r[1], pick: () => this.setState({ fRole: r[0] }), bg: on ? accent : 'rgba(255,255,255,.04)', color: on ? '#132a1f' : 'rgba(242,237,227,.8)', border: on ? accent : 'rgba(242,237,227,.18)' };
    });
    const catOpts = CATS.map((c) => ({ value: c.slug, label: lang === 'en' ? c.nameEn : c.name }));
    const curCat = CATS.find((c) => c.slug === st.fCat) || CATS[0];
    const subOpts = curCat.subs.map((s) => ({ value: s, label: s }));
    const aimagFormOpts = AIMAGS.map((a) => ({ value: a[0], label: lang === 'en' ? a[1] : a[0] }));
    const setF = (k: string) => (ev: any) => this.setState({ [k]: ev.target.value });
    const onImg = (ev: any) => {
      const f = ev.target.files && ev.target.files[0]; if (!f) return;
      const rd = new FileReader(); rd.onload = () => this.setState({ fImg: rd.result }); rd.readAsDataURL(f);
    };
    const openAddForm = () => this.setState({ showAddForm: true, fMsg: '', fErr: false, fCat: st.fCat || CATS[0].slug, fSub: st.fSub || CATS[0].subs[0], fAimag: mapAimag || 'Дорнод' });
    const submitPlace = () => {
      if (!st.fName.trim()) { this.setState({ fMsg: L.errName, fErr: true }); return; }
      const c = CATS.find((x) => x.slug === (st.fCat || CATS[0].slug)) || CATS[0];
      const hrs = (st.fOpen && st.fClose) ? (st.fOpen + '–' + st.fClose) : '';
      const pool = ['1470071459604-3b5ec3a7fe05', '1441974231531-c6227db76b6e', '1504280390367-361c6d9f38f4'];
      const accessible = st.fAccess && st.fCrit.every(Boolean);
      const newPin: any = {
        name: st.fName.trim(), type: st.fSub || c.subs[0], aimag: st.fAimag,
        img: st.fImg || pool[Math.floor(Math.random() * pool.length)],
        desc: st.fDesc.trim() || '—', hours: hrs, mapUrl: st.fMapUrl.trim() || '',
        phone: st.fPhone.trim() || '', access: accessible, cat: c.slug, addedBy: st.fRole,
      };
      if (accessible) ACCESS_NAMES[st.fName.trim()] = 1;
      if (st.fLat != null) { newPin.lat = st.fLat; newPin.lng = st.fLng; const xy = lonLatToXY(st.fLng, st.fLat); newPin.px = xy[0]; newPin.py = xy[1]; }
      this.setState((s: any) => ({
        userPins: s.userPins.concat([newPin]), showAddForm: false, mapAimag: st.fAimag, pin: -1,
        fName: '', fSub: '', fOpen: '', fClose: '', fDesc: '', fMapUrl: '', fImg: '', fLat: null, fLng: null,
        fPhone: '', fAccess: false, fCrit: [false, false, false, false, false], fMsg: '', fErr: false,
      }));
    };

    const openScenicForm = () => this.setState({ showScenicForm: true, sName: '', sDesc: '', sAimag: 'Улаанбаатар', sImg: '', sErr: false });
    const submitScenic = () => this.setState((s: any) => { if (!s.sName.trim()) return { sErr: true }; return { myScenic: [{ name: s.sName.trim(), aimag: s.sAimag, desc: s.sDesc.trim() || '—', img: s.sImg }].concat(s.myScenic), showScenicForm: false, sErr: false }; });
    const openEventForm = () => this.setState({ showEventForm: true, eName: '', eDate: '', eTime: '', eDesc: '', eTag: '', eImg: '', eErr: false });
    const submitEvent = () => this.setState((s: any) => {
      if (!s.eName.trim()) return { eErr: true };
      let day = '01', mon = L.eMonFallback;
      if (s.eDate) { const d = new Date(s.eDate); if (!isNaN(+d)) { day = String(d.getDate()).padStart(2, '0'); mon = (d.getMonth() + 1) + (lang === 'en' ? '' : '-р сар'); } }
      const meta = [s.eTime, s.eDesc.trim()].filter(Boolean).join(' · ') || '—';
      return { myEvents: [{ day, mon, name: s.eName.trim(), meta, tag: s.eTag.trim() || L.eTagFallback, img: s.eImg }].concat(s.myEvents), showEventForm: false, eErr: false };
    });
    const readImg = (key: string) => (ev: any) => { const f = ev.target.files && ev.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => this.setState({ [key]: r.result }); r.readAsDataURL(f); };
    const evThumb = (img: any) => img ? 'url("' + img + '")' : 'linear-gradient(135deg, rgba(232, 184, 75,.25), rgba(120,200,170,.15))';
    const fe = FEATURED_EVENT;

    const topScenic = this.allPins().map((p) => ({ p, rating: ratingOf(p.name) })).sort((a, b) => +b.rating - +a.rating).slice(0, 3)
      .map((o) => ({ name: o.p.name, sub: o.p.type, rating: o.rating, kind: L.favScenic, thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + imgUrl(o.p.img, 500) + '")', onClick: () => { this.setState({ pinMode: 'scenic' }); go('pin'); } }));
    const flatPlaces: any[] = [];
    CATS.forEach((c) => c.items.forEach((it, i) => flatPlaces.push({ it, cat: c, idx: i })));
    const topPlaces = flatPlaces.map((o) => ({ ...o, rating: ratingOf(o.it.name) })).sort((a, b) => +b.rating - +a.rating).slice(0, 3)
      .map((o) => ({ name: o.it.name, sub: o.it.sub, rating: o.rating, kind: L.favPlaces, thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + U(o.cat.pool[o.idx % o.cat.pool.length], 500) + '")', onClick: () => this.openPlace(o.cat, o.idx) }));
    const topEvents = EVENTS.map((ev) => ({ ev, rating: ratingOf(ev.name) })).sort((a, b) => +b.rating - +a.rating).slice(0, 3)
      .map((o) => ({ name: o.ev.name, sub: o.ev.tag, rating: o.rating, kind: L.eventTitle, thumb: 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + U(o.ev.img || fe.img, 500) + '")', onClick: () => go('event') }));
    const topItems2: any[] = [];
    for (let i = 0; i < 3; i++) { topItems2.push(topScenic[i], topPlaces[i], topEvents[i]); }

    const suggests = SUGGESTS.map((s, i) => {
      const on = !!saved[i]; const leftText = i % 2 === 0;
      const suggestOverride = this.state.suggestBgOverride[s.slug];
      return {
        ...s, textLeft: leftText ? '0' : 'auto', textRight: leftText ? 'auto' : '0',
        scrim: leftText ? 'linear-gradient(90deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.45) 42%, rgba(0,0,0,.08) 75%)' : 'linear-gradient(270deg, rgba(0,0,0,.78) 0%, rgba(0,0,0,.45) 42%, rgba(0,0,0,.08) 75%)',
        cover: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.25)), url("' + imgUrl(suggestOverride || s.img, 1600) + '")',
        coverIsVideo: isVideoUrl(suggestOverride || ''), coverRawUrl: suggestOverride || '',
        open: () => navigate('/suggest/' + s.slug),
        toggle: (ev: any) => { ev.stopPropagation(); this.setState((stt: any) => ({ saved: { ...stt.saved, [i]: !stt.saved[i] } })); },
        saveLabel: on ? L.savedLabel : L.save, saveBg: on ? accent : 'transparent', saveColor: on ? '#132a1f' : 'rgba(242,237,227,.8)', saveBorder: on ? accent : 'rgba(242,237,227,.28)',
      };
    });

    // globe / country card / results
    const gq = (this.state.globeQuery || '').trim().toLowerCase();
    const allC = window.GLOBE_COUNTRIES || [];
    const res = gq ? allC.filter((c) => c.name.toLowerCase().includes(gq)).slice(0, 6) : [];
    const gc = this.state.globeCountry;
    const aimagImg = aimag !== 'Бүгд' ? (this.state.aimagBgOverride[aimag] || AIMAG_BG[aimag] || null) : null;
    if (aimagImg && this.bgReady(aimagImg, 1800)) this._lastAimagBg = aimagImg;

    return {
      accent, driftAnim, L, lang, aimag, favs, toggleFav, spNeeds: st.spNeeds,
      catBgOverride: st.catBgOverride, suggestBgOverride: st.suggestBgOverride,
      isHome: route === 'home',
      openPin: () => go('pin'), openEvent: () => go('event'), openSuggest: () => go('suggest'),
      openGlobe: () => go('globe'), globeMountRef: this.handleGlobeRef,
      travelMapRef: (el: any) => { if (el && window.renderTravelMap) window.renderTravelMap(el); },
      travelEyebrow: lang === 'en' ? 'TOURIST FLOW' : 'ЖУУЛЧНЫ УРСГАЛ',
      travelTitle: lang === 'en' ? 'The World → Mongolia' : 'Дэлхийгээс Монгол руу',
      travelSub: lang === 'en' ? 'Top 20 source countries of tourists to Mongolia, by annual arrivals.' : 'Монгол руу хамгийн олон жуулчин илгээдэг 20 улс — жилийн ирэлтээр.',
      travelNote: lang === 'en' ? 'Ranks 1–7: official 2024 figures. 8–20: representative estimates.' : 'Эрэмбэ 1–7: 2024 оны албан ёсны тоо. 8–20: төлөөллийн тооцоо.',
      travelRows: (window.TRAVEL_ORIGINS || []).map((o) => ({ rank: o.rank, country: o.country, v: o.v.toLocaleString('en-US'), est: !!o.est })),
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
      gcSites: gc ? sitesFor(gc, lang) : [],
      globeCloseCard: () => { this.setState({ globeCountry: null }); if (this.globeEngine) this.globeEngine.clearSelection(); },
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
      openScenicForm, closeScenicForm: () => this.setState({ showScenicForm: false }),
      openEventForm, closeEventForm: () => this.setState({ showEventForm: false }),
      showScenicForm: st.showScenicForm, showEventForm: st.showEventForm, submitScenic, submitEvent,
      sName: st.sName, onSName: setF('sName'), sDesc: st.sDesc, onSDesc: setF('sDesc'),
      sAimag: st.sAimag, onSAimag: setF('sAimag'), onSImg: readImg('sImg'),
      sImgPreview: st.sImg ? 'url("' + st.sImg + '")' : 'rgba(255,255,255,.04)', sNoImg: !st.sImg, sErr: !!st.sErr,
      eName: st.eName, onEName: setF('eName'), eDate: st.eDate, onEDate: setF('eDate'),
      eTime: st.eTime, onETime: setF('eTime'), eDesc: st.eDesc, onEDesc: setF('eDesc'),
      eTag: st.eTag, onETag: setF('eTag'), onEImg: readImg('eImg'),
      eImgPreview: st.eImg ? 'url("' + st.eImg + '")' : 'rgba(255,255,255,.04)', eNoImg: !st.eImg, eErr: !!st.eErr,
      hasMyScenic: st.myScenic.length > 0, myScenicItems: st.myScenic.map((s: any) => ({ ...s, thumb: evThumb(s.img) })),
      hasMyEvents: st.myEvents.length > 0, myEventItems: st.myEvents,
      aboutNavColor: route === 'about' ? accent : 'rgba(242,237,227,.75)',
      team: TEAM.map((t, i) => ({ name: t[0], role: lang === 'en' ? t[2] : t[1], initial: t[0].charAt(0), avatarBg: 'oklch(78% 0.1 ' + (30 + i * 34) + ')' })),
      abHeroFullBg: 'url("' + imgUrl(this.state.aboutBgOverride || '1470071459604-3b5ec3a7fe05', 1800) + '")',
      abHeroIsVideo: isVideoUrl(this.state.aboutBgOverride || ''), abHeroRawUrl: this.state.aboutBgOverride || '',
      homeHeroBg: 'linear-gradient(rgba(0,0,0,.5), rgba(0,0,0,.72)), url(\'' + imgUrl(this.state.homeBgOverride || '1470071459604-3b5ec3a7fe05', 1800) + '\')',
      homeBgIsVideo: isVideoUrl(this.state.homeBgOverride || ''), homeBgRawUrl: this.state.homeBgOverride || '',
      abHashtag: lang === 'en' ? 'BigBangDateSpace' : 'BigBangБолзоо',
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
      aimagBg: 'linear-gradient(rgba(0,0,0,.58), rgba(0,0,0,.78)), url("' + imgUrl(this._lastAimagBg || '1470071459604-3b5ec3a7fe05', 1800) + '")',
      aimagBgIsVideo: isVideoUrl(this._lastAimagBg || ''), aimagBgRawUrl: this._lastAimagBg || '',
      aimagBgOpacity: (aimagImg && this._lastAimagBg === aimagImg) ? 1 : 0,
      pickerSvg: this.buildPickerSvg(accent, lang, aimag === 'Бүгд' ? null : aimag, this.state.heroHover, false, this.state.bigText),
      pickerWrapRef: this.handlePickerWrapRef,
      heroAimagLabel: aimag === 'Бүгд' ? '' : aimagName(aimag, lang),
      // Traditional (vertical) Mongolian script for the selected aimag — see
      // AIMAG_MN_SCRIPT in data.ts for the accuracy caveat on this transliteration.
      heroAimagVert: aimag !== 'Бүгд' && lang === 'mn' ? AIMAG_MN_SCRIPT[aimag] || '' : '',
      pinBgA, pinBgB, pinBgAOpacity, pinBgBOpacity,
      pinModeOpts: ([['scenic', lang === 'en' ? 'Scenic' : 'Үзэсгэлэнт'], ['places', lang === 'en' ? 'Places' : 'Газрууд'], ['events', lang === 'en' ? 'Events' : 'Эвент']] as [string, string][]).map((m) => {
        const on = (this.state.pinMode || 'scenic') === m[0];
        return { label: m[1], color: on ? '#132a1f' : 'rgba(255,255,255,.85)', pick: () => this.setState({ pinMode: m[0], pin: -1 }) };
      }),
      pinPillShift: 'calc(' + Math.max(0, ['scenic', 'places', 'events'].indexOf(this.state.pinMode || 'scenic')) + ' * 100%)',
      mapSvg, pinSel, closePin: () => this.setState({ pin: -1 }),
      isMobile, isTablet,
      mobileMenuOpen: this.state.mobileMenuOpen,
      toggleMobileMenu: () => this.setState((s: any) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
      closeMobileMenu: () => this.setState({ mobileMenuOpen: false }),
      heroVertLabel: aimag !== 'Бүгд' && lang === 'mn' ? AIMAG_MN_SCRIPT[aimag] || '' : '',
      heroVertPos: this.state.heroVertPos,
      mapViewUrl: (this.state.mapView && selP) ? embedUrlFor(selP) : false,
      mapViewName: selP ? selP.name : '',
      openMapView: () => this.setState({ mapView: true }), closeMapView: () => this.setState({ mapView: false }),
      mapZoomed: !!mapAimag, resetMap: () => this.setState({ mapAimag: null, pin: -1, hoverAimag: null }),
      aimagPanelShow: !!(mapAimag && !selP && !this.state.showAddForm),
      panelName: mapAimag ? aimagName(mapAimag, lang) : '',
      panelCount: mapAimag ? this.allPins().filter((p) => p.aimag === mapAimag).length : 0,
      showAddForm: st.showAddForm, openAddForm, closeAddForm: () => this.setState({ showAddForm: false }),
      stop: (ev: any) => ev.stopPropagation(),
      roleOpts, catOpts, subOpts, aimagFormOpts,
      formName: st.fName, formCat: st.fCat || CATS[0].slug, formSub: st.fSub || CATS[0].subs[0],
      formAimag: st.fAimag, formOpen: st.fOpen, formClose: st.fClose, formDesc: st.fDesc, formMapUrl: st.fMapUrl,
      onName: setF('fName'), onCat: (ev: any) => { const v = ev.target.value; const c = CATS.find((x) => x.slug === v) || CATS[0]; this.setState({ fCat: v, fSub: c.subs[0] }); },
      onSub: setF('fSub'), onAimag: setF('fAimag'), onOpen: setF('fOpen'), onClose: setF('fClose'),
      onDesc: setF('fDesc'), onMapUrl: setF('fMapUrl'), onImg, submitPlace,
      formPhone: st.fPhone, onPhone: setF('fPhone'), formAccess: st.fAccess,
      toggleFAccess: () => this.setState((s: any) => ({ fAccess: !s.fAccess })),
      fAccBg: st.fAccess ? 'rgba(120,200,170,.1)' : 'rgba(255,255,255,.04)', fAccBorder: st.fAccess ? 'rgba(120,200,170,.5)' : 'rgba(242,237,227,.18)',
      fAccSwBg: st.fAccess ? 'rgba(120,200,170,.9)' : 'rgba(255,255,255,.2)', fAccKnob: st.fAccess ? '20px' : '3px',
      accCriteria: FCRIT.map((label, i) => {
        const on = st.fCrit[i];
        return { label, toggle: () => this.setState((s: any) => { const c = s.fCrit.slice(); c[i] = !c[i]; return { fCrit: c }; }), mark: on ? '✓' : '', boxBg: on ? 'rgba(120,200,170,.9)' : 'transparent', boxBorder: on ? 'rgba(120,200,170,.9)' : 'rgba(255,255,255,.3)', bg: on ? 'rgba(120,200,170,.08)' : 'transparent', border: on ? 'rgba(120,200,170,.4)' : 'rgba(255,255,255,.12)' };
      }),
      accAll: st.fAccess && st.fCrit.every(Boolean),
      pickMapRef: this.pickMapRef, mapPickHint: st.fLat != null ? L.mapPicked : L.mapPick,
      noImg: !st.fImg, imgPreviewBg: st.fImg ? 'linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.1)), url("' + st.fImg + '")' : 'rgba(255,255,255,.03)',
      formMsg: st.fMsg, errColor: st.fErr ? '#e88a8a' : 'rgba(140,214,150,.9)',
      fevBg: 'linear-gradient(rgba(0,0,0,.15), rgba(0,0,0,.4)), url("' + U(fe.img, 1600) + '")',
      fevDate: fe.date, fevName: fe.name, fevMeta: fe.meta,
      events: st.myEvents.concat(EVENTS.map((ev) => ({ ...ev, thumb: 'linear-gradient(rgba(0,0,0,.1),rgba(0,0,0,.35)), url("' + U(ev.img, 800) + '")' }))).map((ev: any) => ({ ...ev, thumb: ev.thumb || evThumb(ev.img) }))
        .map((ev: any) => {
          const key = 'e:' + ev.name;
          return { ...ev, toggleJoin: toggleJoin(key), ...joinOf(!!joined[key]) };
        }),
      suggests, navCats, bgLayers, previewCards, topItems: topItems2,
      travelApps: TRAVEL_APPS.map((a) => ({ ...a, purpose: lang === 'en' ? a.en : a.mn })),
      clearActive: () => this.setState({ active: -1 }),
      goHome: () => { navigate('/'); this.setState({ active: -1, locOpen: false }); },
      locOpen, toggleLoc: () => this.setState({ locOpen: !locOpen }), closeLoc: () => this.setState({ locOpen: false }),
      aimagLabel: aimagName(aimag, lang), aimagOpts,
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
      ...css("min-height:100vh;background:#0b0a08;color:#f2ede3;font-family:'Manrope',system-ui,sans-serif"),
      ['--accent' as any]: V.accent, ['--drift' as any]: V.driftAnim,
    };
    return (
      <div className={V.a11yClass} style={rootStyle}>
        {/* ══════════ NAV ══════════ */}
        <nav style={css(`position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;justify-content:space-between;padding:${V.isMobile ? '14px 16px' : '18px 48px'};background:linear-gradient(180deg, rgba(8,7,6,.8) 0%, rgba(8,7,6,0) 100%)`)}>
          <div className="bb-logo-group" style={{ flex: 'none', position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
            <button onClick={V.goHome} style={css('all:unset;cursor:pointer;display:flex;align-items:center;position:relative;z-index:2')}>
              <span style={{ ...css("font-family:'Playfair Display',serif;font-style:italic;font-weight:700;letter-spacing:-0.01em;color:#f2ede3"), fontSize: V.isMobile ? 19 : 23 }}>Big Bang</span>
            </button>
          </div>

          {V.isMobile ? (
            <>
              <Hover as="button" onClick={V.toggleMobileMenu} s="cursor:pointer;font-family:inherit;width:38px;height:38px;flex:none;border-radius:10px;border:1px solid rgba(242,237,227,.25);background:rgba(255,255,255,.06);color:#f2ede3;display:flex;align-items:center;justify-content:center;font-size:17px" h="border-color:var(--accent,#E8B84B)">{V.mobileMenuOpen ? '×' : '☰'}</Hover>
              {V.mobileMenuOpen && (
                <>
                  <div onClick={V.closeMobileMenu} style={css('position:fixed;inset:0;z-index:40;cursor:default;background:rgba(0,0,0,.4)')}></div>
                  <div style={css('position:fixed;left:12px;right:12px;top:66px;z-index:41;background:rgba(13,20,15,.97);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:14px;box-shadow:0 24px 60px rgba(0,0,0,.55);display:flex;flex-direction:column;gap:4px;max-height:80vh;overflow:auto')}>
                    <Hover as="button" onClick={V.toggleLoc} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:rgba(242,237,227,.9);background:rgba(255,255,255,.05);border:1px solid rgba(242,237,227,.16);border-radius:11px;padding:11px 13px;text-align:left" h="border-color:var(--accent,#E8B84B)">
                      <span style={css('width:6px;height:6px;border-radius:50%;background:var(--accent,#E8B84B)')}></span>
                      <span style={css('flex:1')}>{V.aimagLabel}</span>
                      <span style={css('font-size:10.5px;font-weight:800;color:var(--accent,#E8B84B)')}>{V.aimagCount}</span>
                    </Hover>
                    {V.locOpen && (
                      <div style={css('display:flex;flex-wrap:wrap;gap:6px;padding:10px 2px')}>
                        {V.aimagOpts.map((a: any, i: number) => (
                          <Hover as="button" key={i} onClick={a.pick} s={`cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:5px 11px;border-radius:999px;border:1px solid ${a.border};background:${a.bg};color:${a.color}`} h="border-color:rgba(242,237,227,.6)">
                            <span>{a.label}</span>
                            <span style={{ fontSize: '9.5px', fontWeight: 800, color: a.countColor }}>{a.count}</span>
                          </Hover>
                        ))}
                      </div>
                    )}
                    {[
                      [V.L.home, V.goHome], [V.L.pin, V.openPin], [V.L.event, V.openEvent],
                      [V.L.suggest, V.openSuggest], [V.L.about, V.openAbout],
                    ].map(([label, fn]: any, i: number) => (
                      <Hover key={i} as="button" onClick={() => { fn(); V.closeMobileMenu(); }} s="all:unset;cursor:pointer;font-size:14px;font-weight:600;color:rgba(242,237,227,.85);padding:11px 13px;border-radius:11px" h="background:rgba(255,255,255,.06);color:#f2ede3">{label}</Hover>
                    ))}
                    <div style={css('display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 13px 4px;border-top:1px solid rgba(255,255,255,.1);margin-top:6px')}>
                      <div style={css('display:flex;border:1px solid rgba(242,237,227,.25);border-radius:999px;overflow:hidden')}>
                        <button onClick={V.setMn} style={{ ...css('cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;padding:6px 11px;border:none'), background: V.mnBg, color: V.mnColor }}>MN</button>
                        <button onClick={V.setEn} style={{ ...css('cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;padding:6px 11px;border:none'), background: V.enBg, color: V.enColor }}>EN</button>
                      </div>
                      <Link to="/login" onClick={V.closeMobileMenu} style={css('cursor:pointer;text-decoration:none;font-family:inherit;font-size:12.5px;font-weight:600;color:#f2ede3;background:transparent;border:1px solid rgba(242,237,227,.28);border-radius:999px;padding:7px 15px')}>{V.L.signin}</Link>
                      <Hover as="button" onClick={() => { V.openProfile(); V.closeMobileMenu(); }} title={V.L.profile} s={`cursor:pointer;font-family:inherit;width:34px;height:34px;flex:none;border-radius:50%;border:1px solid ${V.profileBorder};background:${V.profileBg};color:${V.profileColor};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center`} h="border-color:var(--accent,#E8B84B)">Б</Hover>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={css('display:flex;align-items:center;gap:16px;min-width:0')}>
              <div style={css('position:relative')}>
                <Hover as="button" onClick={V.toggleLoc} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:rgba(242,237,227,.85);background:rgba(255,255,255,.06);border:1px solid rgba(242,237,227,.18);border-radius:999px;padding:6px 12px;transition:all .25s" h="border-color:var(--accent,#E8B84B)">
                  <span style={css('width:6px;height:6px;border-radius:50%;background:var(--accent,#E8B84B)')}></span>
                  <span>{V.aimagLabel}</span>
                  <span style={css('font-size:10.5px;font-weight:800;color:var(--accent,#E8B84B)')}>{V.aimagCount}</span>
                  <span style={css('font-size:9px;opacity:.6')}>▾</span>
                </Hover>
                {V.locOpen && (
                  <>
                    <div onClick={V.closeLoc} style={css('position:fixed;inset:0;z-index:40;cursor:default')}></div>
                    <div style={css('position:fixed;left:50%;transform:translateX(-50%);top:76px;width:560px;max-height:70vh;overflow:auto;background:rgba(255,255,255,.09);backdrop-filter:blur(22px) saturate(1.2);-webkit-backdrop-filter:blur(22px) saturate(1.2);border:1px solid rgba(255,255,255,.35);border-radius:14px;padding:14px 16px 16px;box-shadow:0 24px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.25);z-index:41')}>
                      <div style={css('display:flex;flex-wrap:wrap;gap:6px')}>
                        {V.aimagOpts.map((a: any, i: number) => (
                          <Hover as="button" key={i} onClick={a.pick} s={`cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:5px 11px;border-radius:999px;border:1px solid ${a.border};background:${a.bg};color:${a.color};transition:all .2s`} h="border-color:rgba(242,237,227,.6)">
                            <span>{a.label}</span>
                            <span style={{ fontSize: '9.5px', fontWeight: 800, color: a.countColor }}>{a.count}</span>
                          </Hover>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {!V.isTablet && (
                <>
                  <Hover as="button" onClick={V.goHome} s="all:unset;cursor:pointer;font-size:13px;font-weight:600;color:rgba(242,237,227,.75)" h="color:#f2ede3">{V.L.home}</Hover>
                  <Hover as="button" onClick={V.openPin} s={`all:unset;cursor:pointer;font-size:13px;font-weight:600;color:${V.pinNavColor}`} h="color:#f2ede3">{V.L.pin}</Hover>
                  <Hover as="button" onClick={V.openEvent} s={`all:unset;cursor:pointer;font-size:13px;font-weight:600;color:${V.eventNavColor}`} h="color:#f2ede3">{V.L.event}</Hover>
                  <Hover as="button" onClick={V.openSuggest} s={`all:unset;cursor:pointer;font-size:13px;font-weight:600;color:${V.suggestNavColor}`} h="color:#f2ede3">{V.L.suggest}</Hover>
                  <Hover as="button" onClick={V.openAbout} s={`all:unset;cursor:pointer;font-size:13px;font-weight:600;color:${V.aboutNavColor}`} h="color:#f2ede3">{V.L.about}</Hover>
                </>
              )}

              <div style={css('display:flex;border:1px solid rgba(242,237,227,.25);border-radius:999px;overflow:hidden')}>
                <button onClick={V.setMn} style={{ ...css('cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;padding:6px 11px;border:none;transition:all .25s'), background: V.mnBg, color: V.mnColor }}>MN</button>
                <button onClick={V.setEn} style={{ ...css('cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;padding:6px 11px;border:none;transition:all .25s'), background: V.enBg, color: V.enColor }}>EN</button>
              </div>

              {!V.isTablet && (
                <Link to="/login" style={css('cursor:pointer;text-decoration:none;font-family:inherit;font-size:13px;font-weight:600;color:#f2ede3;background:transparent;border:1px solid rgba(242,237,227,.28);border-radius:999px;padding:6px 16px;transition:all .25s')}>{V.L.signin}</Link>
              )}

              <Hover as="button" onClick={V.openProfile} title={V.L.profile} s={`cursor:pointer;font-family:inherit;width:34px;height:34px;border-radius:50%;border:1px solid ${V.profileBorder};background:${V.profileBg};color:${V.profileColor};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;transition:all .2s`} h="border-color:var(--accent,#E8B84B)">Б</Hover>
            </div>
          )}
        </nav>

        <Outlet context={V} />

        {/* ══ SCENIC FORM MODAL ══ */}
        {V.showScenicForm && (
          <div onClick={V.closeScenicForm} style={css('position:fixed;inset:0;z-index:80;background:rgba(6,8,12,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:36px;box-sizing:border-box;animation:bbFadeUp .25s ease both')}>
            <div onClick={V.stop} style={css('width:480px;max-width:100%;max-height:88vh;overflow:auto;background:#171410;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:26px 28px 28px;box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.6)')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:20px')}>
                <div style={css('font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#f6f1e7')}>{V.L.scModalTitle}</div>
                <button onClick={V.closeScenicForm} style={css('cursor:pointer;font-family:inherit;font-size:18px;line-height:1;width:32px;height:32px;border-radius:50%;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.75)')}>×</button>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:15px')}>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.scName} <span style={css('color:#f08a8a')}>*</span></span>
                  <input value={V.sName} onChange={V.onSName} placeholder={V.L.scNamePh} style={css('font-family:inherit;font-size:13.5px;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')} />
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fAimag}</span>
                  <select value={V.sAimag} onChange={V.onSAimag} style={css('font-family:inherit;font-size:13px;padding:11px 10px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')}>
                    {V.aimagFormOpts.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#1a1712', color: '#f2ede3' }}>{o.label}</option>)}
                  </select>
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.scDesc}</span>
                  <textarea value={V.sDesc} onChange={V.onSDesc} rows={2} placeholder={V.L.scDescPh} style={css('font-family:inherit;font-size:13px;line-height:1.5;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;resize:vertical')}></textarea>
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fImg}</span>
                  <Hover as="label" s={`display:flex;align-items:center;justify-content:center;height:110px;border-radius:12px;border:1.5px dashed rgba(242,237,227,.25);background:${V.sImgPreview};background-size:cover;background-position:center;cursor:pointer`} h="border-color:var(--accent,#E8B84B)">
                    {V.sNoImg && <span style={css('font-size:12.5px;color:rgba(242,237,227,.5)')}>{V.L.fImgPh}</span>}
                    <input type="file" accept="image/*" onChange={V.onSImg} style={{ display: 'none' }} />
                  </Hover>
                </label>
                <div style={css('display:flex;align-items:center;gap:12px;margin-top:4px')}>
                  <button onClick={V.submitScenic} style={css('cursor:pointer;font-family:inherit;font-size:13px;font-weight:800;padding:11px 28px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f')}>{V.L.scSave}</button>
                  <button onClick={V.closeScenicForm} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:10px 20px;border-radius:999px;border:1px solid rgba(242,237,227,.25);background:transparent;color:rgba(242,237,227,.7)')}>{V.L.cancel}</button>
                  {V.sErr && <span style={css('font-size:11.5px;font-weight:700;color:#f08a8a')}>{V.L.errName}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ EVENT FORM MODAL ══ */}
        {V.showEventForm && (
          <div onClick={V.closeEventForm} style={css('position:fixed;inset:0;z-index:80;background:rgba(6,8,12,.72);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:36px;box-sizing:border-box;animation:bbFadeUp .25s ease both')}>
            <div onClick={V.stop} style={css('width:480px;max-width:100%;max-height:88vh;overflow:auto;background:#171410;border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:26px 28px 28px;box-sizing:border-box;box-shadow:0 30px 80px rgba(0,0,0,.6)')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;margin-bottom:20px')}>
                <div style={css('font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#f6f1e7')}>{V.L.evModalTitle}</div>
                <button onClick={V.closeEventForm} style={css('cursor:pointer;font-family:inherit;font-size:18px;line-height:1;width:32px;height:32px;border-radius:50%;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.75)')}>×</button>
              </div>
              <div style={css('display:flex;flex-direction:column;gap:15px')}>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.evName} <span style={css('color:#f08a8a')}>*</span></span>
                  <input value={V.eName} onChange={V.onEName} placeholder={V.L.evNamePh} style={css('font-family:inherit;font-size:13.5px;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')} />
                </label>
                <div style={css('display:grid;grid-template-columns:1.3fr 1fr;gap:10px')}>
                  <label style={css('display:flex;flex-direction:column;gap:6px')}>
                    <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.evDate}</span>
                    <input type="date" value={V.eDate} onChange={V.onEDate} style={css('font-family:inherit;font-size:13px;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;color-scheme:dark')} />
                  </label>
                  <label style={css('display:flex;flex-direction:column;gap:6px')}>
                    <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.evTime}</span>
                    <input type="time" value={V.eTime} onChange={V.onETime} style={css('font-family:inherit;font-size:13px;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;color-scheme:dark')} />
                  </label>
                </div>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.evTag}</span>
                  <input value={V.eTag} onChange={V.onETag} placeholder={V.L.evTagPh} style={css('font-family:inherit;font-size:13.5px;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')} />
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.scDesc}</span>
                  <textarea value={V.eDesc} onChange={V.onEDesc} rows={2} placeholder={V.L.evDescPh} style={css('font-family:inherit;font-size:13px;line-height:1.5;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;resize:vertical')}></textarea>
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fImg}</span>
                  <Hover as="label" s={`display:flex;align-items:center;justify-content:center;height:110px;border-radius:12px;border:1.5px dashed rgba(242,237,227,.25);background:${V.eImgPreview};background-size:cover;background-position:center;cursor:pointer`} h="border-color:var(--accent,#E8B84B)">
                    {V.eNoImg && <span style={css('font-size:12.5px;color:rgba(242,237,227,.5)')}>{V.L.fImgPh}</span>}
                    <input type="file" accept="image/*" onChange={V.onEImg} style={{ display: 'none' }} />
                  </Hover>
                </label>
                <div style={css('display:flex;align-items:center;gap:12px;margin-top:4px')}>
                  <button onClick={V.submitEvent} style={css('cursor:pointer;font-family:inherit;font-size:13px;font-weight:800;padding:11px 28px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f')}>{V.L.evSave}</button>
                  <button onClick={V.closeEventForm} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:10px 20px;border-radius:999px;border:1px solid rgba(242,237,227,.25);background:transparent;color:rgba(242,237,227,.7)')}>{V.L.cancel}</button>
                  {V.eErr && <span style={css('font-size:11.5px;font-weight:700;color:#f08a8a')}>{V.L.errName}</span>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

// Bridges react-router hooks (useNavigate/useLocation) into the class component above —
// class components can't call hooks directly.
export function BigBangLayoutRoute(props: { accent?: string; motion?: boolean }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return <BigBangLayout {...props} navigate={navigate} pathname={pathname} />;
}
