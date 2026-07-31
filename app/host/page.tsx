/* eslint-disable @typescript-eslint/no-explicit-any */
// Host Profile — full app screen. Ported from Host Profile.dc.html, then reshaped
// onto the same sidebar + single scrolling pane shell as Admin Panel (see
// app/admin/page.tsx) — a fixed-viewport shell on desktop, one nav rail on the
// left, one content pane on the right, no page-level scroll.
// Shares the place/scenic/event creation modal with AdminPanel via shared/CreateForm
// instead of re-implementing the map/image/criteria form a third time. The original
// dc.html also had a "quick add" mini-form whose open state was hardcoded to false
// (dead code, never reachable) — dropped here in favour of the one real add flow.
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Hash, Phone, Mail, Clock, Search, User, MapPin, Mountain, CalendarDays, MessageSquare, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/components/bigbang/ui';
import { imgUrl, PLACEHOLDER_IMG } from '@/components/bigbang/data';
import CreateForm, { CreateFormData, CreateKind } from '@/components/CreateForm';
import { apiGet, apiGetAuthed } from '@/lib/api';
import { getSession, type Session } from '@/lib/session';
import { createPlace, createScenicPin, createEvent } from '@/lib/hostContent';

type ContentTab = 'places' | 'scenic' | 'events';
type View = 'profile' | ContentTab | 'feedback';
interface ContentItem { name: string; meta: string; img: string; status: string; stBg: string; stColor: string; }
interface HistoryEntry { topic: string; text: string; status: string; stColor: string; }

const thumb = (img: string) => 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + imgUrl(img, 400) + '")';

const OK = { status: 'Батлагдсан', stBg: 'rgba(168,213,162,.15)', stColor: '#a8d5a2' };
const PENDING = { status: 'Хүлээгдэж буй', stBg: 'rgba(232, 184, 75,.15)', stColor: 'var(--accent,#E8B84B)' };

const TOPICS = ['Санал', 'Асуудал', 'Гомдол', 'Хамтын ажиллагаа'];

// Same nav-rail shape as Admin Panel's NAV — icon + label, badge count for the
// three content types.
const NAV: { key: View; icon: LucideIcon; label: string }[] = [
  { key: 'profile', icon: User, label: 'Профайл' },
  { key: 'places', icon: MapPin, label: 'Газрууд' },
  { key: 'scenic', icon: Mountain, label: 'Үзэсгэлэнт газар' },
  { key: 'events', icon: CalendarDays, label: 'Эвент' },
  { key: 'feedback', icon: MessageSquare, label: 'Санал хүсэлт' },
];

export default function HostProfile() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = not checked yet
  const [view, setView] = useState<View>('profile');
  const [sbCollapsed, setSbCollapsed] = useState(false);
  const [content, setContent] = useState<Record<ContentTab, ContentItem[]>>({ places: [], scenic: [], events: [] });
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [copied, setCopied] = useState('');

  const [fbTopic, setFbTopic] = useState('Санал');
  const [fbText, setFbText] = useState('');
  const [fbSent, setFbSent] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // /host is a standalone route (not wrapped by BigBangLayout), so the only
  // way it knows who's signed in is the same localStorage session the
  // "Host болох" flow on /profile writes (see lib/session.ts). No session,
  // or a plain 'user' who never became a host — send them back there.
  useEffect(() => {
    const s = getSession();
    if (!s || (s.user.role !== 'host' && s.user.role !== 'admin')) {
      router.replace('/profile');
      return;
    }
    setSession(s);
    setPhone(s.user.phoneNumber || '');
    setEmail(s.user.email);
  }, [router]);

  const refetchMine = React.useCallback((token: string, userId: number) => {
    Promise.all([
      apiGetAuthed<any[]>('/places/mine', token),
      apiGet<any[]>('/scenic-pins'),
      apiGet<any[]>('/events'),
    ]).then(([myPlaces, pins, events]) => {
      const toItem = (name: string, meta: string, img: string, approved: boolean): ContentItem =>
        ({ name, meta, img: img || '', ...(approved ? OK : PENDING) });
      setContent({
        places: myPlaces.map((p) => toItem(p.name, [p.category?.name, p.aimag?.name].filter(Boolean).join(' · '), p.image, p.status === 'approved')),
        scenic: pins.filter((p) => p.addedBy === userId).map((p) => toItem(p.name, [p.type, p.aimag?.name].filter(Boolean).join(' · '), p.image, true)),
        events: events.filter((ev) => ev.addedBy === userId).map((ev) => toItem(ev.name, [ev.tag, ev.aimag?.name].filter(Boolean).join(' · '), ev.image, true)),
      });
    }).catch(() => {});
  }, []);

  useEffect(() => { if (session) refetchMine(session.token, session.user.id); }, [session, refetchMine]);

  const copy = (key: string, val: string) => () => {
    try { navigator.clipboard.writeText(val); } catch { /* clipboard unavailable */ }
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const infoRows = [
    { icon: Hash, label: 'Хэрэглэгчийн нэр', value: session?.user.username || '', mono: 'inherit', copyable: true, key: 'un', val: session?.user.username || '' },
    { icon: Phone, label: 'Утасны дугаар', value: phone || '—', mono: 'inherit', copyable: !!phone, key: 'ph', val: phone },
    { icon: Mail, label: 'Имэйл', value: email, mono: 'inherit', copyable: true, key: 'em', val: email },
    { icon: Clock, label: 'Эрх', value: session?.user.role === 'admin' ? 'Админ' : 'Host', mono: 'inherit', copyable: false, key: '', val: '' },
  ];

  const stats = [
    { value: String(content.places.length), label: 'Газар', color: '#f2ede3' },
    { value: String(content.scenic.length), label: 'Үзэсгэлэнт', color: 'var(--accent,#E8B84B)' },
    { value: String(content.events.length), label: 'Эвент', color: '#a8d5a2' },
  ];

  useEffect(() => { setQuery(''); }, [view]);

  const list = (t: ContentTab) => content[t];
  // Which content type the current view is showing — only meaningful while
  // view is 'places'/'scenic'/'events', but always defined so hooks below
  // (and the "+ нэмэх" button) have something to read regardless of view.
  const contentKey: ContentTab = view === 'scenic' ? 'scenic' : view === 'events' ? 'events' : 'places';
  const q = query.trim().toLowerCase();
  const places = list(contentKey)
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .map((p) => ({ ...p, thumbBg: thumb(p.img) }));

  const openAdd = () => setAddOpen(true);
  const closeAdd = () => setAddOpen(false);
  const onFormSubmit = async (data: CreateFormData) => {
    if (!session) return;
    try {
      if (data.kind === 'place') await createPlace(session.token, data);
      else if (data.kind === 'scenic') await createScenicPin(session.token, data);
      else await createEvent(session.token, data);
      setAddOpen(false);
      refetchMine(session.token, session.user.id);
    } catch (err) {
      alert('Үүсгэхэд алдаа гарлаа: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const addKind: CreateKind = contentKey === 'scenic' ? 'scenic' : contentKey === 'events' ? 'event' : 'place';
  const addLabel = contentKey === 'scenic' ? 'Үзэсгэлэнт газар нэмэх' : contentKey === 'events' ? 'Эвент нэмэх' : 'Газар нэмэх';

  if (session === undefined) return null;
  if (!session) return null;

  const sendFb = () => {
    if (!fbText.trim()) return;
    setHistory((h) => [{ topic: fbTopic, text: fbText.trim(), status: 'Хүлээгдэж буй', stColor: 'var(--accent,#E8B84B)' }, ...h]);
    setFbText('');
    setFbSent(true);
  };

  const badgeFor = (k: View) => (k === 'places' || k === 'scenic' || k === 'events') ? list(k).length : 0;

  return (
    // Desktop: fixed to the viewport, same shell as Admin Panel (sidebar + one
    // scrolling content pane, no page-level scroll). Mobile keeps the normal
    // scrolling page with a horizontal icon bar up top, same as Admin's mobile
    // treatment — a fixed-height flex shell fights the on-screen keyboard and
    // safe-area insets on small screens.
    <div className={`${isMobile ? 'flex flex-col min-h-screen' : 'flex h-screen overflow-hidden'} text-cream bg-ink font-sans`}>
      <aside className={isMobile
        ? 'w-full flex-shrink-0 flex items-center gap-1.5 py-[10px] px-3 box-border bg-[rgba(255,255,255,.03)] border-b border-[rgba(255,255,255,.08)] overflow-x-auto'
        : `flex-shrink-0 flex flex-col box-border bg-[rgba(255,255,255,.03)] border-r border-[rgba(255,255,255,.08)] transition-[width] duration-200 ease-in-out ${sbCollapsed ? 'w-[76px] py-[26px] px-3' : 'w-[240px] py-[26px] px-4'}`
      }>
        <div className={`flex items-center gap-2 flex-shrink-0 ${isMobile ? 'pr-[10px] justify-start' : sbCollapsed ? 'pb-[22px] justify-center' : 'px-1 pb-[22px] justify-start'}`}>
          <div className="w-[30px] h-[30px] rounded-[9px] bg-[var(--accent,#E8B84B)] flex items-center justify-center font-extrabold text-sm text-[#132a1f] flex-shrink-0">b</div>
          {!isMobile && !sbCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-extrabold tracking-[-0.02em]">big bang</div>
              <div className="font-mono text-[9.5px] tracking-[.18em] uppercase text-[rgba(242,237,227,.45)]">host</div>
            </div>
          )}
          {isMobile && <span className="font-mono text-[9.5px] tracking-[.18em] uppercase text-[rgba(242,237,227,.45)]">host</span>}
          {!isMobile && (
            <button
              onClick={() => setSbCollapsed((v) => !v)}
              title={sbCollapsed ? 'Цэсийг дэлгэх' : 'Цэсийг хумих'}
              className="cursor-pointer font-[inherit] flex-shrink-0 w-[26px] h-[26px] rounded-lg border-none bg-transparent text-[rgba(242,237,227,.5)] flex items-center justify-center transition-all duration-200 ease-in-out hover:bg-[rgba(255,255,255,.08)] hover:text-[rgba(242,237,227,.9)]"
            >
              {sbCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          )}
        </div>

        {NAV.map((n) => {
          const on = view === n.key;
          const badge = badgeFor(n.key);
          return (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              title={!isMobile && sbCollapsed ? n.label : undefined}
              className={`cursor-pointer font-[inherit] flex items-center font-bold text-left whitespace-nowrap flex-shrink-0 rounded-[11px] border-none transition-all duration-200 ease-in-out relative ${isMobile ? 'gap-[7px] text-xs py-[9px] px-3' : `gap-[11px] text-[13px] ${sbCollapsed ? 'p-[11px]' : 'py-[11px] px-[14px]'}`} ${!isMobile && sbCollapsed ? 'justify-center' : 'justify-start'} ${on ? 'bg-[var(--accent,#E8B84B)] text-[#132a1f]' : 'bg-transparent text-[rgba(242,237,227,.8)] hover:bg-[rgba(255,255,255,.07)]'}`}
            >
              <n.icon size={16} />
              {(isMobile || !sbCollapsed) && <span>{n.label}</span>}
              {badge > 0 && (!isMobile && sbCollapsed
                ? <span className={`absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full ${on ? 'bg-[#132a1f]' : 'bg-[var(--accent,#E8B84B)]'}`} />
                : <span className={`ml-auto text-[10.5px] font-extrabold min-w-[20px] h-5 flex items-center justify-center rounded-full ${on ? 'bg-[rgba(0,0,0,.25)] text-[#132a1f]' : 'bg-[rgba(232,184,75,.2)] text-[var(--accent,#E8B84B)]'}`}>{badge}</span>)}
            </button>
          );
        })}

        <Link
          href="/"
          title={!isMobile && sbCollapsed ? 'Гарах' : undefined}
          className={`no-underline cursor-pointer font-[inherit] flex items-center text-xs font-bold whitespace-nowrap flex-shrink-0 rounded-[11px] border border-[rgba(242,237,227,.2)] bg-transparent text-[rgba(242,237,227,.75)] transition-all duration-200 ease-in-out hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)] ${!isMobile && sbCollapsed ? 'justify-center' : 'justify-start'} ${isMobile ? 'gap-[7px] py-[9px] px-3' : 'gap-2.5 p-2.5 mt-auto'}`}
        >
          {!isMobile && sbCollapsed ? 'Г' : 'Гарах'}
        </Link>
      </aside>

      <main className={`flex-1 box-border ${isMobile ? 'pt-5 px-4 pb-10' : 'overflow-y-auto pt-8 px-10 pb-[60px]'}`}>
        <div className="max-w-[760px] mx-auto flex flex-col gap-[18px]">

          {view === 'profile' && (
            <>
              <div className="relative border border-[rgba(255,255,255,.12)] rounded-[20px] overflow-hidden bg-[rgba(255,255,255,.03)]">
                <div className="h-[110px] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.55)), url("${PLACEHOLDER_IMG}")` }}></div>
                <div className="px-[22px] pb-[22px]">
                  <div className="w-[76px] h-[76px] rounded-full bg-[linear-gradient(135deg,#E8B84B,#b57f42)] border-[3px] border-[#171410] flex items-center justify-center text-[26px] font-extrabold text-[#132a1f] -mt-[38px]">{(session.user.username || '?').charAt(0).toUpperCase()}</div>
                  <div className="flex items-center gap-[9px] mt-3">
                    <span className="text-[19px] font-extrabold tracking-[-0.02em]">{session.user.username}</span>
                    <span className="text-[9.5px] font-extrabold tracking-[.08em] uppercase py-[3px] px-[9px] rounded-full bg-[rgba(168,213,162,.15)] border border-[rgba(168,213,162,.45)] text-[#a8d5a2]">{session.user.role === 'admin' ? 'Админ' : 'Host'}</span>
                  </div>
                  <div className="text-xs text-[rgba(242,237,227,.55)] mt-[3px]">{session.user.email}</div>

                  <div className="flex flex-col gap-px mt-[18px] border border-[rgba(255,255,255,.09)] rounded-[13px] overflow-hidden">
                    {infoRows.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 py-[11px] px-[15px] bg-[rgba(255,255,255,.03)] border-b border-[rgba(255,255,255,.05)]">
                        <span className="flex items-center justify-center w-5"><r.icon size={14} /></span>
                        <span className="flex-1">
                          <span className="block text-[10px] font-bold tracking-[.07em] uppercase text-[rgba(242,237,227,.45)]">{r.label}</span>
                          <span className="block text-[13px] font-bold mt-0.5" style={{ fontFamily: r.mono }}>{r.value}</span>
                        </span>
                        {r.copyable && (
                          <button onClick={copy(r.key, r.val)} className="cursor-pointer font-[inherit] text-[10px] font-bold py-1 px-2.5 rounded-full border border-[rgba(242,237,227,.25)] bg-transparent text-[rgba(242,237,227,.65)] transition-all duration-200 ease-in-out hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">{copied === r.key ? '✓' : 'Хуулах'}</button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { setEditOpen((v) => !v); setEPhone(phone); setEEmail(email); }}
                    className="cursor-pointer font-[inherit] w-full box-border mt-[14px] text-xs font-bold p-2.5 rounded-[11px] border border-[rgba(242,237,227,.3)] bg-transparent text-[rgba(242,237,227,.85)] transition-all duration-200 ease-in-out hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]"
                  >Мэдээлэл засах</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {stats.map((s, i) => (
                  <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-[14px] p-[14px] bg-[rgba(255,255,255,.03)] text-center">
                    <div className="text-[21px] font-extrabold tracking-[-0.02em]" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] font-bold tracking-[.05em] uppercase text-[rgba(242,237,227,.5)] mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {editOpen && (
                <div className="border border-[rgba(232,184,75,.4)] rounded-[18px] py-5 px-[22px] bg-[rgba(232,184,75,.06)]">
                  <div className="text-sm font-extrabold mb-[14px]">Мэдээлэл засах</div>
                  <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[rgba(242,237,227,.65)]">Утасны дугаар</span>
                      <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} className={`font-[inherit] text-cream bg-[rgba(0,0,0,.35)] border border-[rgba(255,255,255,.2)] rounded-[10px] py-[9px] px-3 outline-none ${isMobile ? 'text-base' : 'text-[12.5px]'}`} />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[rgba(242,237,227,.65)]">Имэйл</span>
                      <input value={eEmail} onChange={(e) => setEEmail(e.target.value)} className={`font-[inherit] text-cream bg-[rgba(0,0,0,.35)] border border-[rgba(255,255,255,.2)] rounded-[10px] py-[9px] px-3 outline-none ${isMobile ? 'text-base' : 'text-[12.5px]'}`} />
                    </label>
                  </div>
                  <div className="flex gap-2 mt-[14px]">
                    <button onClick={() => { setPhone(ePhone || phone); setEmail(eEmail || email); setEditOpen(false); }} className="cursor-pointer font-[inherit] text-xs font-extrabold py-[9px] px-[22px] rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f]">Хадгалах</button>
                    <button onClick={() => setEditOpen(false)} className="cursor-pointer font-[inherit] text-xs font-bold py-[9px] px-[18px] rounded-full border border-[rgba(242,237,227,.25)] bg-transparent text-[rgba(242,237,227,.7)]">Болих</button>
                  </div>
                </div>
              )}
            </>
          )}

          {(view === 'places' || view === 'scenic' || view === 'events') && (
            <div className="border border-[rgba(255,255,255,.12)] rounded-[18px] bg-[rgba(255,255,255,.03)] overflow-hidden">
              <div className="flex items-center justify-between gap-3 py-[14px] px-5 border-b border-[rgba(255,255,255,.08)] flex-wrap">
                <div className="text-[15px] font-extrabold">{NAV.find((n) => n.key === view)?.label}</div>
                <button onClick={openAdd} className="cursor-pointer font-[inherit] flex items-center gap-1.5 text-[11px] font-bold py-[6px] px-[14px] rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 ease-in-out hover:-translate-y-px"><span className="text-[13px] leading-none">+</span>{addLabel}</button>
              </div>

              <div className="py-3 px-5 border-b border-[rgba(255,255,255,.06)]">
                <div className="relative max-w-[280px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(242,237,227,.4)] pointer-events-none" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Хайх..."
                    className={`w-full box-border font-[inherit] text-cream bg-[rgba(255,255,255,.04)] border border-[rgba(255,255,255,.14)] rounded-full py-[7px] pr-3 pl-8 outline-none ${isMobile ? 'text-base' : 'text-[12.5px]'}`}
                  />
                </div>
              </div>

              {places.length === 0 && (
                <div className="py-[22px] px-5 text-xs text-[rgba(242,237,227,.45)] text-center">Илэрц олдсонгүй</div>
              )}
              {places.map((p, i) => (
                <div key={i} className="flex items-center gap-[14px] py-3 px-5 border-b border-[rgba(255,255,255,.05)] hover:bg-[rgba(255,255,255,.04)]">
                  <div className="w-16 h-[46px] rounded-[9px] bg-cover bg-center flex-shrink-0" style={{ backgroundImage: p.thumbBg }}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold">{p.name}</div>
                    <div className="text-[11px] text-[rgba(242,237,227,.5)] mt-0.5">{p.meta}</div>
                  </div>
                  <span className="text-[10px] font-extrabold tracking-[.05em] uppercase py-1 px-[11px] rounded-full flex-shrink-0" style={{ background: p.stBg, color: p.stColor }}>{p.status}</span>
                </div>
              ))}
            </div>
          )}

          {view === 'feedback' && (
            <div className="border border-[rgba(255,255,255,.12)] rounded-[18px] py-5 px-[22px] bg-[rgba(255,255,255,.03)]">
              <div className="text-sm font-extrabold">Админд санал хүсэлт илгээх</div>
              <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-1 mb-[14px]">Асуудал, гомдол, шинэ санал — бид 24 цагийн дотор хариулна.</div>

              <div className="flex gap-1.5 mb-3 flex-wrap">
                {TOPICS.map((t) => {
                  const on = fbTopic === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setFbTopic(t)}
                      className={`cursor-pointer font-[inherit] text-[11px] font-bold py-1.5 px-[14px] rounded-full transition-all duration-200 ease-in-out border ${on ? 'border-[var(--accent,#E8B84B)] bg-[rgba(232,184,75,.18)] text-[var(--accent,#E8B84B)]' : 'border-[rgba(255,255,255,.25)] bg-transparent text-[rgba(242,237,227,.7)]'}`}
                    >{t}</button>
                  );
                })}
              </div>

              <textarea
                value={fbText}
                onChange={(e) => { setFbText(e.target.value); setFbSent(false); }}
                rows={4}
                placeholder="Санал хүсэлтээ энд бичнэ үү..."
                className={`w-full box-border font-[inherit] leading-[1.55] text-cream bg-[rgba(0,0,0,.35)] border border-[rgba(255,255,255,.2)] rounded-xl py-3 px-[14px] outline-none resize-y ${isMobile ? 'text-base' : 'text-[12.5px]'}`}
              ></textarea>

              <div className="flex items-center gap-3 mt-3">
                <button onClick={sendFb} className="cursor-pointer font-[inherit] text-xs font-extrabold py-2.5 px-[26px] rounded-full border-none bg-[var(--accent,#E8B84B)] text-[#132a1f] transition-transform duration-200 ease-in-out hover:-translate-y-0.5">Илгээх →</button>
                {fbSent && <span className="text-xs font-bold text-[#a8d5a2]">✓ Илгээгдлээ — админ удахгүй хариулна</span>}
              </div>

              {history.length > 0 && (
                <div className="mt-[18px] border-t border-[rgba(255,255,255,.08)] pt-[14px] flex flex-col gap-2">
                  <div className="text-[10.5px] font-bold tracking-[.08em] uppercase text-[rgba(242,237,227,.45)]">Илгээсэн хүсэлтүүд</div>
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs py-2 px-3 rounded-[10px] bg-[rgba(255,255,255,.04)]">
                      <span className="text-[10px] font-extrabold py-0.5 px-[9px] rounded-full bg-[rgba(232,184,75,.15)] text-[var(--accent,#E8B84B)] flex-shrink-0">{h.topic}</span>
                      <span className="flex-1 text-[rgba(242,237,227,.75)] whitespace-nowrap overflow-hidden text-ellipsis">{h.text}</span>
                      <span className="text-[10.5px] font-bold flex-shrink-0" style={{ color: h.stColor }}>{h.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {addOpen && <CreateForm kind={addKind} onClose={closeAdd} onSubmit={onFormSubmit} />}
    </div>
  );
}
