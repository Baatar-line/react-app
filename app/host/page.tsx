/* eslint-disable @typescript-eslint/no-explicit-any */
// Host Profile — full app screen. Ported from Host Profile.dc.html.
// Shares the place/scenic/event creation modal with AdminPanel via shared/CreateForm
// instead of re-implementing the map/image/criteria form a third time. The original
// dc.html also had a "quick add" mini-form whose open state was hardcoded to false
// (dead code, never reachable) — dropped here in favour of the one real add flow.
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Hash, Phone, Mail, Clock } from 'lucide-react';
import { css, Hover, useIsMobile } from '@/components/bigbang/ui';
import { imgUrl, PLACEHOLDER_IMG } from '@/components/bigbang/data';
import CreateForm, { CreateFormData, CreateKind } from '@/components/CreateForm';

type ContentTab = 'places' | 'scenic' | 'events';
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

const TABS: [ContentTab, string][] = [['places', 'Газрууд'], ['scenic', 'Үзэсгэлэнт'], ['events', 'Эвент']];
const TOPICS = ['Санал', 'Асуудал', 'Гомдол', 'Хамтын ажиллагаа'];

export default function HostProfile() {
  const isMobile = useIsMobile();
  const inputFont = isMobile ? '16px' : '12.5px';
  const [contentTab, setContentTab] = useState<ContentTab>('places');
  const [added, setAdded] = useState<Record<ContentTab, ContentItem[]>>({ places: [], scenic: [], events: [] });
  const [addOpen, setAddOpen] = useState(false);

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

  const list = (t: ContentTab) => BASE[t].concat(added[t]);
  const places = list(contentTab).map((p) => ({ ...p, thumbBg: thumb(p.img) }));

  const contentTabs = TABS.map(([key, label]) => {
    const on = contentTab === key;
    return { key, label, num: list(key).length, on };
  });

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

  const addKind: CreateKind = contentTab === 'scenic' ? 'scenic' : contentTab === 'events' ? 'event' : 'place';
  const addLabel = contentTab === 'scenic' ? 'Үзэсгэлэнт газар нэмэх' : contentTab === 'events' ? 'Эвент нэмэх' : 'Газар нэмэх';

  const sendFb = () => {
    if (!fbText.trim()) return;
    setHistory((h) => [{ topic: fbTopic, text: fbText.trim(), status: 'Хүлээгдэж буй', stColor: 'var(--accent,#E8B84B)' }, ...h]);
    setFbText('');
    setFbSent(true);
  };

  return (
    <div style={{ ...css('min-height:100vh;color:#f2ede3'), background: '#0b0a08', fontFamily: "'Manrope', sans-serif" }}>
      <div style={{ ...css('display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.08)'), padding: isMobile ? '14px 16px' : '18px 40px' }}>
        <div style={css('display:flex;align-items:center;gap:10px')}>
          <div style={css('width:30px;height:30px;border-radius:9px;background:var(--accent,#E8B84B);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#132a1f')}>b</div>
          <span style={css('font-size:15px;font-weight:800;letter-spacing:-0.03em')}>big bang</span>
          <span style={css('font-family:ui-monospace,Menlo,monospace;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(242,237,227,.45);margin-left:4px')}>host</span>
        </div>
        <Hover as={Link as any} href="/" s="text-decoration:none;cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;padding:6px 16px;border-radius:999px;border:1px solid rgba(242,237,227,.28);background:transparent;color:rgba(242,237,227,.85);transition:all .2s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">Гарах</Hover>
      </div>

      <div style={{ ...css('max-width:1060px;margin:0 auto;display:grid;gap:24px;align-items:start;box-sizing:border-box'), padding: isMobile ? '20px 16px 40px' : '36px 40px 70px', gridTemplateColumns: isMobile ? '1fr' : '360px 1fr' }}>

        <div style={css('display:flex;flex-direction:column;gap:18px')}>
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
        </div>

        <div style={css('display:flex;flex-direction:column;gap:18px')}>

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

          <div style={css('border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.03);overflow:hidden')}>
            <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.08);flex-wrap:wrap')}>
              <div style={css('display:flex;gap:5px;flex-wrap:wrap')}>
                {contentTabs.map((t) => (
                  <button key={t.key} onClick={() => setContentTab(t.key)} style={{ ...css('cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;padding:6px 13px;border-radius:999px;transition:all .2s'), border: `1px solid ${t.on ? 'var(--accent,#E8B84B)' : 'rgba(255,255,255,.22)'}`, background: t.on ? 'var(--accent,#E8B84B)' : 'transparent', color: t.on ? '#132a1f' : 'rgba(242,237,227,.75)' }}>
                    {t.label} <span style={{ fontWeight: 800, color: t.on ? 'rgba(0,0,0,.6)' : 'var(--accent,#E8B84B)' }}>{t.num}</span>
                  </button>
                ))}
              </div>
              <Hover as="button" onClick={openAdd} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;padding:6px 14px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:transform .2s" h="transform:translateY(-1px)"><span style={css('font-size:13px;line-height:1')}>+</span>{addLabel}</Hover>
            </div>

            {places.map((p, i) => (
              <div key={i} style={css('display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,.05)')}>
                <div style={{ ...css('width:64px;height:46px;border-radius:9px;background-size:cover;background-position:center;flex-shrink:0'), backgroundImage: p.thumbBg }}></div>
                <div style={css('flex:1;min-width:0')}>
                  <div style={css('font-size:13px;font-weight:700')}>{p.name}</div>
                  <div style={css('font-size:11px;color:rgba(242,237,227,.5);margin-top:2px')}>{p.meta}</div>
                </div>
                <span style={{ ...css('font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;padding:4px 11px;border-radius:999px;flex-shrink:0'), background: p.stBg, color: p.stColor }}>{p.status}</span>
              </div>
            ))}
          </div>

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
        </div>
      </div>

      {addOpen && <CreateForm kind={addKind} onClose={closeAdd} onSubmit={onFormSubmit} />}
    </div>
  );
}
