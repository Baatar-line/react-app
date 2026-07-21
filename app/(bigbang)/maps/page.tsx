'use client';

// Big Bang — Maps (/maps): aimag pin map, add-place form, pin detail panel.
import { useContext } from 'react';
import { Accessibility, Globe, Heart, MapPin } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { css, Hover } from '@/components/bigbang/ui';

export default function MapsPage() {
  const V: any = useContext(BigBangContext);
  return (
    <section data-screen-label="Пин — газрын зураг" style={css('position:relative;height:100vh;overflow:hidden;background:#0b0a08')}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: V.pinBgA, backgroundSize: 'cover', backgroundPosition: 'center', opacity: V.pinBgAOpacity, transition: 'opacity .55s ease' }}></div>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: V.pinBgB, backgroundSize: 'cover', backgroundPosition: 'center', opacity: V.pinBgBOpacity, transition: 'opacity .55s ease' }}></div>
      <div style={css('position:absolute;inset:0;padding:130px 4px 60px;box-sizing:border-box')}>
        {V.mapSvg}
      </div>

      {/* pin mode toggle + globe launcher — top-right over the map */}
      <div style={{ ...css('position:absolute;top:96px;z-index:16;display:flex;align-items:center;gap:10px'), right: V.isMobile ? 14 : 48 }}>
        <Hover as="button" onClick={V.openGlobe} title={V.L.globe} s={`flex:none;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#132a1f;background:${V.accent};border:none;box-shadow:0 8px 24px rgba(0,0,0,.4)`} h="transform:translateY(-2px);box-shadow:0 11px 26px rgba(0,0,0,.5)"><Globe size={18} /></Hover>
        {!V.isMobile && (
          <div style={css('position:relative;display:inline-grid;grid-template-columns:repeat(3,1fr);background:rgba(0,0,0,.72);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.4)')}>
            <div style={{ ...css('position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px) / 3);border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.35);transition:transform .3s cubic-bezier(.34,1.4,.5,1)'), background: V.accent, transform: `translateX(${V.pinPillShift})` }}></div>
            {V.pinModeOpts.map((m: any, i: number) => (
              <button key={i} onClick={m.pick} style={{ ...css('position:relative;z-index:2;cursor:pointer;font-family:inherit;white-space:nowrap;font-size:12px;font-weight:700;padding:6px 18px;border:none;background:transparent;transition:color .25s'), color: m.color }}>{m.label}</button>
            ))}
          </div>
        )}
      </div>

      {V.mapZoomed && (
        <Hover as="button" onClick={V.resetMap} s={`position:absolute;top:96px;z-index:15;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;padding:9px 20px;border-radius:999px;border:1px solid rgba(242,237,227,.3);background:rgba(0,0,0,.7);backdrop-filter:blur(8px);color:rgba(242,237,227,.85);transition:all .25s;left:${V.isMobile ? 14 : 48}px`} h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">← {V.L.resetMap}</Hover>
      )}
      {!V.isMobile && (
        <div style={css('position:absolute;left:48px;bottom:44px;z-index:10')}>
          <p style={css('margin:0;font-size:13.5px;color:rgba(242,237,227,.55);max-width:340px')}>{V.L.panelHint}</p>
        </div>
      )}

      {V.showAddForm && (
        <div onClick={V.closeAddForm} style={css('position:absolute;inset:0;z-index:40;background:rgba(6,8,12,.66);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px 12px;box-sizing:border-box;animation:bbFadeUp .3s ease both')}>
          <div onClick={V.stop} style={css('width:900px;max-width:100%;max-height:88vh;overflow:auto;background:rgba(20,18,15,.98);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:28px 30px 30px;box-shadow:0 30px 80px rgba(0,0,0,.6)')}>
            <div style={css('display:flex;align-items:flex-start;justify-content:space-between;gap:16px')}>
              <div>
                <div style={css('font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#f6f1e7')}>{V.L.addTitle}</div>
                <div style={css('font-size:12.5px;color:rgba(242,237,227,.5);margin-top:4px')}>{V.L.addSub}</div>
              </div>
              <Hover as="button" onClick={V.closeAddForm} s="cursor:pointer;font-family:inherit;font-size:20px;line-height:1;width:34px;height:34px;border-radius:50%;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.7);transition:all .2s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">×</Hover>
            </div>

            <div style={css('margin-top:20px')}>
              <div style={css('font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(242,237,227,.45);margin-bottom:8px')}>{V.L.roleLabel}</div>
              <div style={css('display:flex;gap:8px')}>
                {V.roleOpts.map((r: any, i: number) => (
                  <button key={i} onClick={r.pick} style={{ ...css('cursor:pointer;font-family:inherit;flex:1;font-size:13px;font-weight:700;padding:11px;border-radius:11px;transition:all .2s'), border: `1px solid ${r.border}`, background: r.bg, color: r.color }}>{r.label}</button>
                ))}
              </div>
            </div>

            <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:22px')}>
              <div style={css('display:flex;flex-direction:column;gap:16px')}>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fName}</span>
                  <input value={V.formName} onChange={V.onName} placeholder={V.L.fNamePh} style={css('font-family:inherit;font-size:13.5px;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')} />
                </label>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fPhone}</span>
                  <input value={V.formPhone} onChange={V.onPhone} placeholder="99112233" inputMode="numeric" style={css('font-family:inherit;font-size:13.5px;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')} />
                </label>
                <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:12px')}>
                  <label style={css('display:flex;flex-direction:column;gap:6px')}>
                    <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fCat}</span>
                    <select value={V.formCat} onChange={V.onCat} style={css('font-family:inherit;font-size:13px;padding:11px 10px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')}>
                      {V.catOpts.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#1a1712', color: '#f2ede3' }}>{o.label}</option>)}
                    </select>
                  </label>
                  <label style={css('display:flex;flex-direction:column;gap:6px')}>
                    <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fSub}</span>
                    <select value={V.formSub} onChange={V.onSub} style={css('font-family:inherit;font-size:13px;padding:11px 10px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')}>
                      {V.subOpts.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#1a1712', color: '#f2ede3' }}>{o.label}</option>)}
                    </select>
                  </label>
                </div>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fAimag}</span>
                  <select value={V.formAimag} onChange={V.onAimag} style={css('font-family:inherit;font-size:13px;padding:11px 10px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')}>
                    {V.aimagFormOpts.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#1a1712', color: '#f2ede3' }}>{o.label}</option>)}
                  </select>
                </label>
                <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:12px')}>
                  <label style={css('display:flex;flex-direction:column;gap:6px')}>
                    <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fOpen}</span>
                    <input type="time" value={V.formOpen} onChange={V.onOpen} style={css('font-family:inherit;font-size:13px;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;color-scheme:dark')} />
                  </label>
                  <label style={css('display:flex;flex-direction:column;gap:6px')}>
                    <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fClose}</span>
                    <input type="time" value={V.formClose} onChange={V.onClose} style={css('font-family:inherit;font-size:13px;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;color-scheme:dark')} />
                  </label>
                </div>
                <label style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fDesc}</span>
                  <textarea value={V.formDesc} onChange={V.onDesc} placeholder={V.L.fDescPh} rows={3} style={css('font-family:inherit;font-size:13px;line-height:1.5;padding:11px 13px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none;resize:vertical')}></textarea>
                </label>
              </div>

              <div style={css('display:flex;flex-direction:column;gap:16px')}>
                <div style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fMap}</span>
                  <div style={css('position:relative;height:240px;border-radius:12px;overflow:hidden;border:1px solid rgba(242,237,227,.14);background:#1a2534')}>
                    <div ref={V.pickMapRef} style={css('position:absolute;inset:0;cursor:crosshair')}></div>
                    <div style={css('position:absolute;left:10px;bottom:8px;z-index:500;font-size:10.5px;font-weight:700;color:#fff;background:rgba(10,12,16,.72);padding:4px 10px;border-radius:999px;pointer-events:none')}>{V.mapPickHint}</div>
                  </div>
                  <input value={V.formMapUrl} onChange={V.onMapUrl} placeholder={V.L.fMapPh} style={css('font-family:inherit;font-size:12px;padding:10px 12px;border-radius:10px;border:1px solid rgba(242,237,227,.18);background:rgba(255,255,255,.04);color:#f2ede3;outline:none')} />
                </div>

                <div style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fImg}</span>
                  <Hover as="label" s={`display:flex;align-items:center;justify-content:center;height:120px;border-radius:12px;border:1.5px dashed rgba(242,237,227,.25);background:${V.imgPreviewBg};background-size:cover;background-position:center;cursor:pointer;transition:border-color .2s`} h="border-color:var(--accent,#E8B84B)">
                    {V.noImg && <span style={css('font-size:12.5px;color:rgba(242,237,227,.5)')}>{V.L.fImgPh}</span>}
                    <input type="file" accept="image/*" onChange={V.onImg} style={{ display: 'none' }} />
                  </Hover>
                </div>

                <div style={css('display:flex;flex-direction:column;gap:6px')}>
                  <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.7)')}>{V.L.fAccessLabel}</span>
                  <button onClick={V.toggleFAccess} style={{ ...css('cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:11px;text-align:left;padding:12px 13px;border-radius:11px;transition:all .25s'), border: `1px solid ${V.fAccBorder}`, background: V.fAccBg }}>
                    <Accessibility size={18} />
                    <span style={css('flex:1;font-size:12.5px;font-weight:700;color:#f2ede3;line-height:1.35')}>{V.L.fAccessToggle}</span>
                    <span style={{ ...css('width:40px;height:23px;border-radius:999px;position:relative;flex:none;transition:background .25s'), background: V.fAccSwBg }}><span style={{ ...css('position:absolute;top:3px;width:17px;height:17px;border-radius:50%;background:#fff;transition:left .25s'), left: V.fAccKnob }}></span></span>
                  </button>
                  {V.formAccess && (
                    <div style={css('display:flex;flex-direction:column;gap:7px;padding:12px 13px;border-radius:11px;border:1px dashed rgba(120,200,170,.5);background:rgba(120,200,170,.06)')}>
                      <div style={css('display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(120,200,170,.95)')}><Accessibility size={13} /> {V.L.fAccessReq}</div>
                      {V.accCriteria.map((cr: any, i: number) => (
                        <button key={i} onClick={cr.toggle} style={{ ...css('cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:9px;text-align:left;padding:6px 8px;border-radius:8px;transition:all .2s'), border: `1px solid ${cr.border}`, background: cr.bg }}>
                          <span style={{ ...css('width:17px;height:17px;border-radius:5px;color:#0b1512;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none'), border: `1.5px solid ${cr.boxBorder}`, background: cr.boxBg }}>{cr.mark}</span>
                          <span style={css('font-size:12px;font-weight:600;color:rgba(242,237,227,.85);line-height:1.35')}>{cr.label}</span>
                        </button>
                      ))}
                      {V.accAll && <div style={css('display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:#8fd6c6')}><Accessibility size={13} /> Бүх шалгуур хангасан — «Тусгай хэрэгцээт хүнд ээлтэй» тэмдэгтэй нэмэгдэнэ</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={css('display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,.08)')}>
              <span style={{ fontSize: '11.5px', color: V.errColor }}>{V.formMsg}</span>
              <div style={css('display:flex;gap:10px')}>
                <Hover as="button" onClick={V.closeAddForm} s="cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;padding:11px 22px;border-radius:999px;border:1px solid rgba(242,237,227,.25);background:transparent;color:rgba(242,237,227,.75);transition:all .2s" h="border-color:rgba(242,237,227,.5)">{V.L.cancel}</Hover>
                <Hover as="button" onClick={V.submitPlace} s="cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;padding:11px 26px;border-radius:999px;border:none;background:var(--accent,#E8B84B);color:#132a1f;transition:opacity .2s" h="opacity:.88">{V.L.saveBtn}</Hover>
              </div>
            </div>
          </div>
        </div>
      )}

      {V.aimagPanelShow && (
        <div style={css('position:absolute;right:48px;bottom:44px;width:270px;background:rgba(18,16,13,.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:18px;z-index:18;animation:bbCardIn .45s ease both')}>
          <div style={css('font-size:18px;font-weight:800;color:#f2ede3')}>{V.panelName}</div>
          <div style={css('font-size:12px;color:var(--accent,#E8B84B);font-weight:700;margin-top:4px')}>{V.panelCount} пин</div>
          <div style={css('font-size:12.5px;line-height:1.5;color:rgba(242,237,227,.6);margin-top:8px')}>{V.L.panelHint}</div>
        </div>
      )}

      {V.mapViewUrl && (
        <div onClick={V.closeMapView} style={css('position:absolute;inset:0;z-index:50;background:rgba(6,8,12,.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:40px;box-sizing:border-box;animation:bbFadeUp .3s ease both')}>
          <div onClick={V.stop} style={css('position:relative;width:960px;max-width:100%;height:min(620px,84vh);background:#14120f;border:1px solid rgba(255,255,255,.12);border-radius:18px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6)')}>
            <div style={css('position:absolute;left:0;right:0;top:0;height:52px;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 12px 0 18px;background:rgba(18,16,13,.92);border-bottom:1px solid rgba(255,255,255,.08)')}>
              <div style={css('font-size:14px;font-weight:800;color:#f2ede3;display:flex;align-items:center;gap:8px')}><MapPin size={15} />{V.mapViewName}</div>
              <Hover as="button" onClick={V.closeMapView} s="cursor:pointer;font-family:inherit;font-size:18px;line-height:1;width:32px;height:32px;border-radius:50%;border:1px solid rgba(242,237,227,.2);background:transparent;color:rgba(242,237,227,.75);transition:all .2s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">×</Hover>
            </div>
            <iframe title="map" src={V.mapViewUrl} style={css('position:absolute;inset:52px 0 0 0;width:100%;height:calc(100% - 52px);border:none')} loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      )}

      {V.pinSel && (
        <div style={css('position:absolute;right:48px;bottom:44px;width:320px;background:rgba(18,16,13,.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:12px;z-index:20;animation:bbCardIn .45s cubic-bezier(.22,.8,.3,1) both')}>
          <div style={{ height: '150px', borderRadius: '11px', backgroundImage: V.pinSel.thumb, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          <div style={css('padding:12px 4px 4px;display:flex;flex-direction:column;gap:6px')}>
            <div style={css('display:flex;align-items:center;gap:8px')}>
              <span style={css('font-size:10.5px;font-weight:700;letter-spacing:.06em;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.08);color:rgba(242,237,227,.8)')}>{V.pinSel.type}</span>
              <span style={css('font-size:11px;color:rgba(242,237,227,.5)')}>{V.pinSel.aimag}</span>
              <span title="Тусгай хэрэгцээт хүнд ээлтэй" style={{ ...css('align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:rgba(0,0,0,.5);color:#8fd6c6;border:1px solid rgba(255,255,255,.26)'), display: V.pinSel.accShow }}><Accessibility size={12} /></span>
              <span style={css('margin-left:auto;display:flex;align-items:center;gap:4px')}><span style={css('font-size:11px;line-height:1;color:var(--accent,#E8B84B)')}>★</span><span style={css('font-size:12px;font-weight:800;line-height:1;color:#f6f1e7')}>{V.pinSel.rating}</span></span>
              <Hover as="button" onClick={V.pinSel.toggleFav} s={`cursor:pointer;width:28px;height:28px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:transparent;color:${V.pinSel.heartColor};display:flex;align-items:center;justify-content:center;transition:all .2s;flex:none`} h="border-color:var(--accent,#E8B84B)"><Heart size={14} fill={V.pinSel.favOn ? 'currentColor' : 'none'} /></Hover>
            </div>
            <div style={css('font-size:16px;font-weight:800;color:#f2ede3')}>{V.pinSel.name}</div>
            <div style={css('font-size:12.5px;line-height:1.5;color:rgba(242,237,227,.6)')}>{V.pinSel.desc}</div>
            {V.pinSel.hours && <div style={css('font-size:11.5px;color:rgba(242,237,227,.5);display:flex;align-items:center;gap:6px')}><span style={css('color:var(--accent,#E8B84B)')}>◷</span>{V.pinSel.hours}</div>}
            <Hover as="button" onClick={V.openMapView} s="cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;margin-top:2px;font-size:12px;font-weight:700;padding:9px 14px;border-radius:11px;background:rgba(66,133,244,.14);border:1px solid rgba(66,133,244,.4);color:#8ab4f8;transition:all .2s" h="background:rgba(66,133,244,.22)">
              <MapPin size={14} /><span>{V.L.openMaps}</span><span style={css('margin-left:auto;opacity:.7')}>→</span>
            </Hover>
            <div style={css('display:flex;gap:8px;margin-top:4px')}>
              <Hover as="button" s="cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:7px 18px;border-radius:999px;border:1px solid var(--accent,#E8B84B);background:var(--accent,#E8B84B);color:#132a1f;transition:all .25s" h="opacity:.85">{V.L.detail} →</Hover>
              <Hover as="button" onClick={V.closePin} s="cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;padding:7px 16px;border-radius:999px;border:1px solid rgba(242,237,227,.25);background:transparent;color:rgba(242,237,227,.75);transition:all .25s" h="border-color:var(--accent,#E8B84B);color:var(--accent,#E8B84B)">{V.L.close}</Hover>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
