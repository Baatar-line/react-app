'use client';

// Big Bang — Maps (/maps): aimag pin map, add-place form, pin detail panel.
import { useContext } from 'react';
import { Accessibility, Heart, MapPin } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';

export default function MapsPage() {
  const V: any = useContext(BigBangContext);
  return (
    <section data-screen-label="Пин — газрын зураг" className="relative h-screen overflow-hidden bg-ink">
      <div style={{ position: 'absolute', inset: 0, backgroundImage: V.pinBgA, backgroundSize: 'cover', backgroundPosition: 'center', opacity: V.pinBgAOpacity, transition: 'opacity .55s ease' }}></div>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: V.pinBgB, backgroundSize: 'cover', backgroundPosition: 'center', opacity: V.pinBgBOpacity, transition: 'opacity .55s ease' }}></div>
      <div className="absolute inset-0 box-border pt-24 px-1 pb-[60px]">
        <div ref={V.mainMapRef} className="absolute inset-x-1 top-24 bottom-[60px] overflow-hidden rounded-[18px] bg-[#1a2534]"></div>
      </div>

      {!V.isMobile && (
        <div className="absolute bottom-11 left-12 z-10">
          <p className="m-0 max-w-[340px] text-[13.5px] text-[rgba(242,237,227,.55)]">{V.L.panelHint}</p>
        </div>
      )}

      {V.showAddForm && (
        <div onClick={V.closeAddForm} className="animate-bbFadeUp absolute inset-0 z-40 box-border flex items-center justify-center bg-[rgba(6,8,12,.66)] px-3 py-5 backdrop-blur-[6px]">
          <div onClick={V.stop} className="w-[900px] max-w-full max-h-[88vh] overflow-auto rounded-[20px] border border-[rgba(255,255,255,.1)] bg-[rgba(20,18,15,.98)] p-[30px] pt-7 shadow-[0_30px_80px_rgba(0,0,0,.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[22px] font-extrabold tracking-[-0.02em] text-cream-2">{V.L.addTitle}</div>
                <div className="mt-1 text-[12.5px] text-[rgba(242,237,227,.5)]">{V.L.addSub}</div>
              </div>
              <button onClick={V.closeAddForm} className="h-[34px] w-[34px] cursor-pointer rounded-full border border-[rgba(242,237,227,.2)] bg-transparent font-[inherit] text-xl leading-none text-[rgba(242,237,227,.7)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">×</button>
            </div>

            <div className="mt-5">
              <div className="mb-2 text-[11px] font-bold tracking-[.06em] text-[rgba(242,237,227,.45)] uppercase">{V.L.roleLabel}</div>
              <div className="flex gap-2">
                {V.roleOpts.map((r: any, i: number) => (
                  <button key={i} onClick={r.pick} className="flex-1 cursor-pointer rounded-[11px] p-[11px] font-[inherit] text-[13px] font-bold transition-all duration-200" style={{ border: `1px solid ${r.border}`, background: r.bg, color: r.color }}>{r.label}</button>
                ))}
              </div>
            </div>

            <div className="mt-[22px] grid grid-cols-2 gap-[22px]">
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fName}</span>
                  <input value={V.formName} onChange={V.onName} placeholder={V.L.fNamePh} className="rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] font-[inherit] text-[13.5px] text-cream outline-none" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fPhone}</span>
                  <input value={V.formPhone} onChange={V.onPhone} placeholder="99112233" inputMode="numeric" className="rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] font-[inherit] text-[13.5px] text-cream outline-none" />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fCat}</span>
                    <select value={V.formCat} onChange={V.onCat} className="rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-2.5 py-[11px] font-[inherit] text-[13px] text-cream outline-none">
                      {V.catOpts.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#1a1712', color: '#f2ede3' }}>{o.label}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fSub}</span>
                    <select value={V.formSub} onChange={V.onSub} className="rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-2.5 py-[11px] font-[inherit] text-[13px] text-cream outline-none">
                      {V.subOpts.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#1a1712', color: '#f2ede3' }}>{o.label}</option>)}
                    </select>
                  </label>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fAimag}</span>
                  <select value={V.formAimag} onChange={V.onAimag} className="rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-2.5 py-[11px] font-[inherit] text-[13px] text-cream outline-none">
                    {V.aimagFormOpts.map((o: any) => <option key={o.value} value={o.value} style={{ background: '#1a1712', color: '#f2ede3' }}>{o.label}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fOpen}</span>
                    <input type="time" value={V.formOpen} onChange={V.onOpen} className="[color-scheme:dark] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-3 py-2.5 font-[inherit] text-[13px] text-cream outline-none" />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fClose}</span>
                    <input type="time" value={V.formClose} onChange={V.onClose} className="[color-scheme:dark] rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-3 py-2.5 font-[inherit] text-[13px] text-cream outline-none" />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fDesc}</span>
                  <textarea value={V.formDesc} onChange={V.onDesc} placeholder={V.L.fDescPh} rows={3} className="resize-y rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-[13px] py-[11px] font-[inherit] text-[13px] leading-[1.5] text-cream outline-none"></textarea>
                </label>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fMap}</span>
                  <div className="relative h-[240px] overflow-hidden rounded-xl border border-[rgba(242,237,227,.14)] bg-[#1a2534]">
                    <div ref={V.pickMapRef} className="absolute inset-0 cursor-crosshair"></div>
                    <div className="pointer-events-none absolute bottom-2 left-2.5 z-[500] rounded-full bg-[rgba(10,12,16,.72)] px-2.5 py-1 text-[10.5px] font-bold text-white">{V.mapPickHint}</div>
                  </div>
                  <input value={V.formMapUrl} onChange={V.onMapUrl} placeholder={V.L.fMapPh} className="rounded-[10px] border border-[rgba(242,237,227,.18)] bg-[rgba(255,255,255,.04)] px-3 py-2.5 font-[inherit] text-xs text-cream outline-none" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fImg}</span>
                  <label
                    className="flex h-[120px] cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-dashed border-[rgba(242,237,227,.25)] bg-cover bg-center transition-colors duration-200 hover:border-[var(--accent,#E8B84B)]"
                    style={{ background: V.imgPreviewBg, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  >
                    {V.noImg && <span className="text-[12.5px] text-[rgba(242,237,227,.5)]">{V.L.fImgPh}</span>}
                    <input type="file" accept="image/*" onChange={V.onImg} className="hidden" />
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-[rgba(242,237,227,.7)]">{V.L.fAccessLabel}</span>
                  <button onClick={V.toggleFAccess} className="flex cursor-pointer items-center gap-[11px] rounded-[11px] px-[13px] py-3 text-left font-[inherit] transition-all duration-250" style={{ border: `1px solid ${V.fAccBorder}`, background: V.fAccBg }}>
                    <Accessibility size={18} />
                    <span className="flex-1 text-[12.5px] font-bold leading-[1.35] text-cream">{V.L.fAccessToggle}</span>
                    <span className="relative h-[23px] w-10 flex-none rounded-full transition-colors duration-250" style={{ background: V.fAccSwBg }}><span className="absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white transition-[left] duration-250" style={{ left: V.fAccKnob }}></span></span>
                  </button>
                  {V.formAccess && (
                    <div className="flex flex-col gap-[7px] rounded-[11px] border border-dashed border-[rgba(120,200,170,.5)] bg-[rgba(120,200,170,.06)] px-[13px] py-3">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold tracking-[.06em] text-[rgba(120,200,170,.95)] uppercase"><Accessibility size={13} /> {V.L.fAccessReq}</div>
                      {V.accCriteria.map((cr: any, i: number) => (
                        <button key={i} onClick={cr.toggle} className="flex cursor-pointer items-center gap-[9px] rounded-lg px-2 py-1.5 text-left font-[inherit] transition-all duration-200" style={{ border: `1px solid ${cr.border}`, background: cr.bg }}>
                          <span className="flex h-[17px] w-[17px] flex-none items-center justify-center rounded-[5px] text-[11px] font-extrabold text-[#0b1512]" style={{ border: `1.5px solid ${cr.boxBorder}`, background: cr.boxBg }}>{cr.mark}</span>
                          <span className="text-xs font-semibold leading-[1.35] text-[rgba(242,237,227,.85)]">{cr.label}</span>
                        </button>
                      ))}
                      {V.accAll && <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#8fd6c6]"><Accessibility size={13} /> Бүх шалгуур хангасан — «Тусгай хэрэгцээт хүнд ээлтэй» тэмдэгтэй нэмэгдэнэ</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3.5 border-t border-[rgba(255,255,255,.08)] pt-[18px]">
              <span style={{ fontSize: '11.5px', color: V.errColor }}>{V.formMsg}</span>
              <div className="flex gap-2.5">
                <button onClick={V.closeAddForm} className="cursor-pointer rounded-full border border-[rgba(242,237,227,.25)] bg-transparent px-[22px] py-[11px] font-[inherit] text-[13px] font-bold text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[rgba(242,237,227,.5)]">{V.L.cancel}</button>
                <button onClick={V.submitPlace} className="cursor-pointer rounded-full border-none bg-[var(--accent,#E8B84B)] px-[26px] py-[11px] font-[inherit] text-[13px] font-bold text-[#132a1f] transition-opacity duration-200 hover:opacity-[.88]">{V.L.saveBtn}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {V.aimagPanelShow && (
        <div className="animate-bbCardIn absolute right-12 bottom-11 z-[18] w-[270px] rounded-2xl border border-[rgba(255,255,255,.1)] bg-[rgba(18,16,13,.88)] p-[18px] backdrop-blur-[18px]">
          <div className="text-lg font-extrabold text-cream">{V.panelName}</div>
          <div className="mt-1 text-xs font-bold text-[var(--accent,#E8B84B)]">{V.panelCount} пин</div>
          <div className="mt-2 text-[12.5px] leading-[1.5] text-[rgba(242,237,227,.6)]">{V.L.panelHint}</div>
        </div>
      )}

      {V.mapViewUrl && (
        <div onClick={V.closeMapView} className="animate-bbFadeUp absolute inset-0 z-50 box-border flex items-center justify-center bg-[rgba(6,8,12,.7)] p-10 backdrop-blur-[6px]">
          <div onClick={V.stop} className="relative w-[960px] max-w-full h-[min(620px,84vh)] overflow-hidden rounded-[18px] border border-[rgba(255,255,255,.12)] bg-[#14120f] shadow-[0_30px_80px_rgba(0,0,0,.6)]">
            <div className="absolute inset-x-0 top-0 z-[2] flex h-[52px] items-center justify-between gap-3 border-b border-[rgba(255,255,255,.08)] bg-[rgba(18,16,13,.92)] py-0 pr-3 pl-[18px]">
              <div className="flex items-center gap-2 text-sm font-extrabold text-cream"><MapPin size={15} />{V.mapViewName}</div>
              <button onClick={V.closeMapView} className="h-8 w-8 cursor-pointer rounded-full border border-[rgba(242,237,227,.2)] bg-transparent font-[inherit] text-lg leading-none text-[rgba(242,237,227,.75)] transition-all duration-200 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">×</button>
            </div>
            <iframe title="map" src={V.mapViewUrl} className="absolute inset-x-0 bottom-0 top-[52px] w-full h-[calc(100%-52px)] border-none" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      )}

      {V.pinSel && (
        <div className="absolute right-12 bottom-11 z-20 w-80 rounded-2xl border border-[rgba(255,255,255,.1)] bg-[rgba(18,16,13,.88)] p-3 backdrop-blur-[18px] [animation:bbCardIn_.45s_cubic-bezier(.22,.8,.3,1)_both]">
          <div className="h-[150px] rounded-[11px] bg-cover bg-center" style={{ backgroundImage: V.pinSel.thumb }}></div>
          <div className="flex flex-col gap-1.5 px-1 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[rgba(255,255,255,.08)] px-[9px] py-[3px] text-[10.5px] font-bold tracking-[.06em] text-[rgba(242,237,227,.8)]">{V.pinSel.type}</span>
              <span className="text-[11px] text-[rgba(242,237,227,.5)]">{V.pinSel.aimag}</span>
              <span title="Тусгай хэрэгцээт хүнд ээлтэй" className="h-[22px] w-[22px] items-center justify-center rounded-full border border-[rgba(255,255,255,.26)] bg-[rgba(0,0,0,.5)] text-[#8fd6c6]" style={{ display: V.pinSel.accShow }}><Accessibility size={12} /></span>
              <span className="ml-auto flex items-center gap-1"><span className="text-[11px] leading-none text-[var(--accent,#E8B84B)]">★</span><span className="text-xs font-extrabold leading-none text-cream-2">{V.pinSel.rating}</span></span>
              <button onClick={V.pinSel.toggleFav} className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-full border border-[rgba(255,255,255,.2)] bg-transparent transition-all duration-200 hover:border-[var(--accent,#E8B84B)]" style={{ color: V.pinSel.heartColor }}><Heart size={14} fill={V.pinSel.favOn ? 'currentColor' : 'none'} /></button>
            </div>
            <div className="text-base font-extrabold text-cream">{V.pinSel.name}</div>
            <div className="text-[12.5px] leading-[1.5] text-[rgba(242,237,227,.6)]">{V.pinSel.desc}</div>
            {V.pinSel.hours && <div className="flex items-center gap-1.5 text-[11.5px] text-[rgba(242,237,227,.5)]"><span className="text-[var(--accent,#E8B84B)]">◷</span>{V.pinSel.hours}</div>}
            <button onClick={V.openMapView} className="mt-0.5 box-border flex w-full cursor-pointer items-center gap-2 rounded-[11px] border border-[rgba(66,133,244,.4)] bg-[rgba(66,133,244,.14)] px-3.5 py-2.5 font-[inherit] text-xs font-bold text-[#8ab4f8] transition-all duration-200 hover:bg-[rgba(66,133,244,.22)]">
              <MapPin size={14} /><span>{V.L.openMaps}</span><span className="ml-auto opacity-70">→</span>
            </button>
            <div className="mt-1 flex gap-2">
              <button className="cursor-pointer rounded-full border border-[var(--accent,#E8B84B)] bg-[var(--accent,#E8B84B)] px-[18px] py-1.5 font-[inherit] text-xs font-bold text-[#132a1f] transition-all duration-250 hover:opacity-85">{V.L.detail} →</button>
              <button onClick={V.closePin} className="cursor-pointer rounded-full border border-[rgba(242,237,227,.25)] bg-transparent px-4 py-1.5 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.75)] transition-all duration-250 hover:border-[var(--accent,#E8B84B)] hover:text-[var(--accent,#E8B84B)]">{V.L.close}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
