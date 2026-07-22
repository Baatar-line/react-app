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
import { Hash, Phone, Mail, Clock, Search, User, MapPin, Mountain, CalendarDays, MessageSquare, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';
import { css, Hover, useIsMobile } from '@/components/bigbang/ui';
import { imgUrl, PLACEHOLDER_IMG } from '@/components/bigbang/data';
import CreateForm, { CreateFormData, CreateKind } from '@/components/CreateForm';

type ContentTab = 'places' | 'scenic' | 'events';
type View = 'profile' | ContentTab | 'feedback';
interface ContentItem { name: string; meta: string; img: string; status: string; stBg: string; stColor: string; }
interface HistoryEntry { topic: string; text: string; status: string; stColor: string; }

const thumb = (img: string) => 'linear-gradient(rgba(0,0,0,.1), rgba(0,0,0,.2)), url("' + imgUrl(img, 400) + '")';

const OK = { status: 'Батлагдсан', stBg: 'rgba(168,213,162,.15)', stColor: '#a8d5a2' };
const PENDING = { status: 'Хүлээгдэж буй', stBg: 'rgba(232, 184, 75,.15)', stColor: 'var(--accent,#E8B84B)' };

const BASE: Record<ContentTab, ContentItem[]> = {
  places: [
    { name: 'Sky Lounge 21', meta: 'Хоол & Кофе · Улаанбаатар', img: '1517248135467-4c7edcad34c4', ...OK },
    { name: 'Terrace Garden', meta: 'Хоол & Кофе · Улаанбаатар', img: '1414235077428-338989a2e8c0', ...OK },
    { name: 'Night Sky Bar', meta: 'Шөнийн амьдрал · Улаанбаатар', img: '1514933651103-005eec06c04b', ...PENDING },
  ],
  scenic: [
    { name: 'Богд уулын шандас', meta: 'Үзэсгэлэнт газар · Улаанбаатар', img: '1519681393784-d120267933ba', ...OK },
  ],
  events: [
    { name: 'Rooftop Jazz Evening', meta: '7-р сарын 20 · Sky Lounge 21', img: '1514933651103-005eec06c04b', ...PENDING },
  ],
};

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
  const inputFont = isMobile ? '16px' : '12.5px';
  const [view, setView] = useState<View>('profile');
  const [sbCollapsed, setSbCollapsed] = useState(false);
  const [added, setAdded] = useState<Record<ContentTab, ContentItem[]>>({ places: [], scenic: [], events: [] });
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [phone, setPhone] = useState('9911 2233');
  const [email, setEmail] = useState('bold@skylounge.mn');
  const [ePhone, setEPhone] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [copied, setCopied] = useState('');

  const [fbTopic, setFbTopic] = useState('Санал');
  const [fbText, setFbText] = useState('');
  const [fbSent, setFbSent] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([
    { topic: 'Асуудал', text: 'Газрын зургийг шинэчлэх боломжтой юу?', status: 'Хариулсан ✓', stColor: '#a8d5a2' },
  ]);

  const copy = (key: string, val: string) => () => {
    try { navigator.clipboard.writeText(val); } catch { /* clipboard unavailable */ }
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  const infoRows = [
    { icon: Hash, label: 'Host ID', value: 'BB-H-00214', mono: 'ui-monospace,Menlo,monospace', copyable: true, key: 'id', val: 'BB-H-00214' },
    { icon: Phone, label: 'Утасны дугаар', value: phone, mono: 'inherit', copyable: true, key: 'ph', val: phone },
    { icon: Mail, label: 'Имэйл', value: email, mono: 'inherit', copyable: true, key: 'em', val: email },
    { icon: Clock, label: 'Бүртгүүлсэн', value: '2026 оны 3-р сар', mono: 'inherit', copyable: false, key: '', val: '' },
  ];

  const stats = [
    { value: '3', label: 'Газар', color: '#f2ede3' },
    { value: '2.4k', label: 'Үзэлт', color: 'var(--accent,#E8B84B)' },
    { value: '182', label: 'Хадгалалт', color: '#a8d5a2' },
  ];

  useEffect(() => { setQuery(''); }, [view]);

  const list = (t: ContentTab) => BASE[t].concat(added[t]);
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
  const onFormSubmit = (data: CreateFormData) => {
    setAdded((s) => {
      const item: ContentItem =
        data.kind === 'place'
          ? { name: data.name + (data.access ? ' ♿' : ''), meta: [data.catName, data.sub, data.aimag].filter(Boolean).join(' · '), img: data.images[0] || '1441974231531-c6227db76b6e', ...PENDING }
          : data.kind === 'scenic'
          ? { name: (data.icon || '🏔️') + ' ' + data.name, meta: (data.desc || '—') + (data.lat != null ? ' · ' + data.lat.toFixed(3) + ', ' + data.lng!.toFixed(3) : ''), img: data.images[0] || '1441974231531-c6227db76b6e', ...PENDING }
          : { name: data.name, meta: [data.date, data.time].filter(Boolean).join(' ') + ' · дээд тал ' + data.max + ' хүн', img: data.images[0] || '1441974231531-c6227db76b6e', ...PENDING };
      const tabKey: ContentTab = data.kind === 'place' ? 'places' : data.kind === 'scenic' ? 'scenic' : 'events';
      return { ...s, [tabKey]: [item, ...s[tabKey]] };
    });
    setAddOpen(false);
  };

  const addKind: CreateKind = contentKey === 'scenic' ? 'scenic' : contentKey === 'events' ? 'event' : 'place';
  const addLabel = contentKey === 'scenic' ? 'Үзэсгэлэнт газар нэмэх' : contentKey === 'events' ? 'Эвент нэмэх' : 'Газар нэмэх';

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
    <div style={{ ...css(isMobile ? 'display:flex;flex-direction:column;min-height:100vh;color:#f2ede3' : 'display:flex;height:100vh;overflow:hidden;color:#f2ede3'), background: '#0b0a08', fontFamily: "'Manrope', sans-serif" }}>
      <aside style={isMobile
        ? css('width:100%;flex-shrink:0;display:flex;align-items:center;gap:6px;padding:10px 12px;box-sizing:border-box;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.08);overflow-x:auto')
        : { ...css('flex-shrink:0;display:flex;flex-direction:column;box-sizing:border-box;background:rgba(255,255,255,.03);border-right:1px solid rgba(255,255,255,.08);transition:width .2s ease'), width: sbCollapsed ? 76 : 240, padding: sbCollapsed ? '26px 12px' : '26px 16px' }
      }>
        <div style={css(`display:flex;align-items:center;gap:8px;flex-shrink:0;padding:${isMobile ? '0 10px 0 0' : sbCollapsed ? '0 0 22px' : '0 4px 22px'};justify-content:${!isMobile && sbCollapsed ? 'center' : 'flex-start'}`)}>
          <div style={css('width:30px;height:30px;border-radius:9px;background:var(--accent,#E8B84B);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#132a1f;flex-shrink:0')}>b</div>
          {!isMobile && !sbCollapsed && (
            <div style={css('flex:1;min-width:0')}>
              <div style={css('font-size:14.5px;font-weight:800;letter-spacing:-0.02em')}>big bang</div>
              <div style={css('font-family:ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(242,237,227,.45)')}>host</div>
            </div>
          )}
          {isMobile && <span style={css('font-family:ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(242,237,227,.45)')}>host</span>}
          {!isMobile && (
            <Hover as="button" onClick={() => setSbCollapsed((v) => !v)} title={sbCollapsed ? 'Цэсийг дэлгэх' : 'Цэсийг хумих'} s="cursor:pointer;font-family:inherit;flex-shrink:0;width:26px;height:26px;border-radius:8px;border:none;background:transparent;color:rgba(242,237,227,.5);display:flex;align-items:center;justify-content:center;transition:all .2s" h="background:rgba(255,255,255,.08);color:rgba(242,237,227,.9)">
              {sbCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </Hover>
          )}
        </div>

        {NAV.map((n) => {
          const on = view === n.key;
          const badge = badgeFor(n.key);
          return (
            <Hover key={n.key} as="button" onClick={() => setView(n.key)} title={!isMobile && sbCollapsed ? n.label : undefined}
              s={`cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:${isMobile ? '7' : '11'}px;justify-content:${!isMobile && sbCollapsed ? 'center' : 'flex-start'};font-size:${isMobile ? '12' : '13'}px;font-weight:700;text-align:left;white-space:nowrap;flex-shrink:0;padding:${isMobile ? '9px 12px' : sbCollapsed ? '11px' : '11px 14px'};border-radius:11px;border:none;background:${on ? 'var(--accent,#E8B84B)' : 'transparent'};color:${on ? '#132a1f' : 'rgba(242,237,227,.8)'};transition:all .2s;position:relative`}
              h={on ? undefined : 'background:rgba(255,255,255,.07)'}>
              <n.icon size={16} />
              {(isMobile || !sbCollapsed) && <span>{n.label}</span>}
              {badge > 0 && (!isMobile && sbCollapsed
                ? <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: on ? '#132a1f' : 'var(--accent,#E8B84B)' }} />
                : <span style={{ ...css('margin-left:auto;font-size:10.5px;font-weight:800;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;border-radius:999px'), background: on ? 'rgba(0,0,0,.25)' : 'rgba(232, 184, 75,.2)', color: on ? '#132a1f' : 'var(--accent,#E8B84B)' }}>{badge}</span>)}
            </Hover>
          );
        })}

        <Hover as={Link as any} href="/" title={!isMobile && sbCollapsed ? 'Гарах' : undefined}
          s={`text-decoration:none;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:${!isMobile && sbCollapsed ? 'center' : 'flex-start'};gap:${isMobile ? '7' : '10'}px;font-size:${isMobile ? '12' : '12'}px;font-weight:700;white-space:nowrap;flex-shrink:0;padding:${isMobile ? '9px 12px' : '10px'};border-radius:11px;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.75);transition:all .2s${isMobile ? '' : ';margin-top:auto'}`}
          h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">
          {!isMobile && sbCollapsed ? 'Г' : 'Гарах'}
        </Hover>
      </aside>

      <main style={{ ...css('box-sizing:border-box'), flex: 1, overflowY: isMobile ? undefined : 'auto', padding: isMobile ? '20px 16px 40px' : '32px 40px 60px' }}>
        <div style={css('max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:18px')}>

          {view === 'profile' && (
            <>
              <div style={css('position:relative;border:1px solid rgba(255,255,255,.12);border-radius:20px;overflow:hidden;background:rgba(255,255,255,.03)')}>
                <div style={{ ...css('height:110px;background-size:cover;background-position:center'), backgroundImage: `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.55)), url("${PLACEHOLDER_IMG}")` }}></div>
                <div style={css('padding:0 22px 22px')}>
                  <div style={css('width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,#E8B84B,#b57f42);border:3px solid #171410;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:#132a1f;margin-top:-38px')}>Б</div>
                  <div style={css('display:flex;align-items:center;gap:9px;margin-top:12px')}>
                    <span style={css('font-size:19px;font-weight:800;letter-spacing:-0.02em')}>Болд-Эрдэнэ</span>
                    <span style={css('font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px;background:rgba(168,213,162,.15);border:1px solid rgba(168,213,162,.45);color:#a8d5a2')}>Баталгаажсан</span>
                  </div>
                  <div style={css('font-size:12px;color:rgba(242,237,227,.55);margin-top:3px')}>Sky Lounge 21 · Улаанбаатар</div>

                  <div style={css('display:flex;flex-direction:column;gap:1px;margin-top:18px;border:1px solid rgba(255,255,255,.09);border-radius:13px;overflow:hidden')}>
                    {infoRows.map((r, i) => (
                      <div key={i} style={css('display:flex;align-items:center;gap:12px;padding:11px 15px;background:rgba(255,255,255,.03);border-bottom:1px solid rgba(255,255,255,.05)')}>
                        <span style={css('display:flex;align-items:center;justify-content:center;width:20px')}><r.icon size={14} /></span>
                        <span style={css('flex:1')}>
                          <span style={css('display:block;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(242,237,227,.45)')}>{r.label}</span>
                          <span style={{ ...css('display:block;font-size:13px;font-weight:700;margin-top:2px'), fontFamily: r.mono }}>{r.value}</span>
                        </span>
                        {r.copyable && (
                          <Hover as="button" onClick={copy(r.key, r.val)} s="cursor:pointer;font-family:inherit;font-size:10px;font-weight:700;padding:4px 10px;border-radius:999px;border:1px solid rgba(242,237,227,.25);background:transparent;color:rgba(242,237,227,.65);transition:all .2s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">{copied === r.key ? '✓' : 'Хуулах'}</Hover>
                        )}
                      </div>
                    ))}
                  </div>

                  <Hover as="button" onClick={() => { setEditOpen((v) => !v); setEPhone(phone); setEEmail(email); }} s="cursor:pointer;font-family:inherit;width:100%;box-sizing:border-box;margin-top:14px;font-size:12px;font-weight:700;padding:10px;border-radius:11px;border:1px solid rgba(242,237,227,.3);background:transparent;color:rgba(242,237,227,.85);transition:all .2s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">Мэдээлэл засах</Hover>
                </div>
              </div>

              <div style={css('display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px')}>
                {stats.map((s, i) => (
                  <div key={i} style={css('border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:14px;background:rgba(255,255,255,.03);text-align:center')}>
                    <div style={{ ...css('font-size:21px;font-weight:800;letter-spacing:-0.02em'), color: s.color }}>{s.value}</div>
                    <div style={css('font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:rgba(242,237,227,.5);margin-top:4px')}>{s.label}</div>
                  </div>
                ))}
              </div>

              {editOpen && (
                <div style={css('border:1px solid rgba(232, 184, 75,.4);border-radius:18px;padding:20px 22px;background:rgba(232, 184, 75,.06)')}>
                  <div style={css('font-size:14px;font-weight:800;margin-bottom:14px')}>Мэдээлэл засах</div>
                  <div style={{ ...css('display:grid;gap:12px'), gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
                    <label style={css('display:flex;flex-direction:column;gap:6px')}>
                      <span style={css('font-size:11px;font-weight:700;color:rgba(242,237,227,.65)')}>Утасны дугаар</span>
                      <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} style={{ ...css('font-family:inherit;color:#f2ede3;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:9px 12px;outline:none'), fontSize: inputFont }} />
                    </label>
                    <label style={css('display:flex;flex-direction:column;gap:6px')}>
                      <span style={css('font-size:11px;font-weight:700;color:rgba(242,237,227,.65)')}>Имэйл</span>
                      <input value={eEmail} onChange={(e) => setEEmail(e.target.value)} style={{ ...css('font-family:inherit;color:#f2ede3;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:9px 12px;outline:none'), fontSize: inputFont }} />
                    </label>
                  </div>
                  <div style={css('display:flex;gap:8px;margin-top:14px')}>
                    <button onClick={() => { setPhone(ePhone || phone); setEmail(eEmail || email); setEditOpen(false); }} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:800;padding:9px 22px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f')}>Хадгалах</button>
                    <button onClick={() => setEditOpen(false)} style={css('cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:9px 18px;border-radius:999px;border:1px solid rgba(242,237,227,.25);background:transparent;color:rgba(242,237,227,.7)')}>Болих</button>
                  </div>
                </div>
              )}
            </>
          )}

          {(view === 'places' || view === 'scenic' || view === 'events') && (
            <div style={css('border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.03);overflow:hidden')}>
              <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.08);flex-wrap:wrap')}>
                <div style={css('font-size:15px;font-weight:800')}>{NAV.find((n) => n.key === view)?.label}</div>
                <Hover as="button" onClick={openAdd} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;padding:6px 14px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-1px)"><span style={css('font-size:13px;line-height:1')}>+</span>{addLabel}</Hover>
              </div>

              <div style={css('padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.06)')}>
                <div style={css('position:relative;max-width:280px')}>
                  <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(242,237,227,.4)', pointerEvents: 'none' }} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Хайх..."
                    style={{ ...css('width:100%;box-sizing:border-box;font-family:inherit;color:#f2ede3;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:7px 12px 7px 32px;outline:none'), fontSize: inputFont }}
                  />
                </div>
              </div>

              {places.length === 0 && (
                <div style={css('padding:22px 20px;font-size:12px;color:rgba(242,237,227,.45);text-align:center')}>Илэрц олдсонгүй</div>
              )}
              {places.map((p, i) => (
                <Hover key={i} as="div" s="display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.05)" h="background:rgba(255,255,255,.04)">
                  <div style={{ ...css('width:64px;height:46px;border-radius:9px;background-size:cover;background-position:center;flex-shrink:0'), backgroundImage: p.thumbBg }}></div>
                  <div style={css('flex:1;min-width:0')}>
                    <div style={css('font-size:13px;font-weight:700')}>{p.name}</div>
                    <div style={css('font-size:11px;color:rgba(242,237,227,.5);margin-top:2px')}>{p.meta}</div>
                  </div>
                  <span style={{ ...css('font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:4px 11px;border-radius:999px;flex-shrink:0'), background: p.stBg, color: p.stColor }}>{p.status}</span>
                </Hover>
              ))}
            </div>
          )}

          {view === 'feedback' && (
            <div style={css('border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:20px 22px;background:rgba(255,255,255,.03)')}>
              <div style={css('font-size:14px;font-weight:800')}>Админд санал хүсэлт илгээх</div>
              <div style={css('font-size:11.5px;color:rgba(242,237,227,.5);margin:4px 0 14px')}>Асуудал, гомдол, шинэ санал — бид 24 цагийн дотор хариулна.</div>

              <div style={css('display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap')}>
                {TOPICS.map((t) => {
                  const on = fbTopic === t;
                  return (
                    <button key={t} onClick={() => setFbTopic(t)} style={{ ...css('cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;padding:6px 14px;border-radius:999px;transition:all .2s'), border: `1px solid ${on ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.25)'}`, background: on ? 'rgba(232, 184, 75,.18)' : 'transparent', color: on ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.7)' }}>{t}</button>
                  );
                })}
              </div>

              <textarea value={fbText} onChange={(e) => { setFbText(e.target.value); setFbSent(false); }} rows={4} placeholder="Санал хүсэлтээ энд бичнэ үү..." style={{ ...css('width:100%;box-sizing:border-box;font-family:inherit;line-height:1.55;color:#f2ede3;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:12px 14px;outline:none;resize:vertical'), fontSize: inputFont }}></textarea>

              <div style={css('display:flex;align-items:center;gap:12px;margin-top:12px')}>
                <Hover as="button" onClick={sendFb} s="cursor:pointer;font-family:inherit;font-size:12px;font-weight:800;padding:10px 26px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-2px)">Илгээх →</Hover>
                {fbSent && <span style={css('font-size:12px;font-weight:700;color:#a8d5a2')}>✓ Илгээгдлээ — админ удахгүй хариулна</span>}
              </div>

              {history.length > 0 && (
                <div style={css('margin-top:18px;border-top:1px solid rgba(255,255,255,.08);padding-top:14px;display:flex;flex-direction:column;gap:8px')}>
                  <div style={css('font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(242,237,227,.45)')}>Илгээсэн хүсэлтүүд</div>
                  {history.map((h, i) => (
                    <div key={i} style={css('display:flex;align-items:center;gap:10px;font-size:12px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.04)')}>
                      <span style={css('font-size:10px;font-weight:800;padding:2px 9px;border-radius:999px;background:rgba(232, 184, 75,.15);color:var(--accent,#E8B84B);flex-shrink:0')}>{h.topic}</span>
                      <span style={css('flex:1;color:rgba(242,237,227,.75);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{h.text}</span>
                      <span style={{ ...css('font-size:10.5px;font-weight:700;flex-shrink:0'), color: h.stColor }}>{h.status}</span>
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
