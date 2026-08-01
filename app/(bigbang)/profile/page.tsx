'use client';

// Big Bang — Profile (/profile): favorites, accessibility settings, add-content
// cards, and the user's own submitted places / scenic spots / events. No
// "host" tier — any signed-in account can submit all three (a place just
// lands pending until an admin approves it — see BigBangLayout's onPlaceSubmit).
import { useContext } from 'react';
import Link from 'next/link';
import { Accessibility, Heart, User } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { BgMedia, Isometric3DIcon } from '@/components/bigbang/ui';

// Reusable favorite / place card (Profile page places + scenic).
function FavCard({ d }: { d: any }) {
  return (
    <div className="relative aspect-[4/5] rounded-[18px] overflow-hidden border border-[rgba(255,255,255,.1)] animate-[bbFadeUp_.5s_cubic-bezier(.22,.8,.3,1)_both] [transition:transform_.35s_cubic-bezier(.22,.8,.3,1),_box-shadow_.35s_ease] hover:translate-y-[-5px] hover:shadow-[0_22px_48px_rgba(0,0,0,.5)]">
      <BgMedia bg={d.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.18)_0%,_rgba(0,0,0,0)_35%,_rgba(0,0,0,.32)_62%,_rgba(0,0,0,.92)_100%)] pointer-events-none"></div>
      <div className="absolute left-3 top-3 flex gap-1.5 pointer-events-none">
        <span className="text-[10px] font-bold tracking-[.08em] uppercase py-1 px-[11px] rounded-full bg-[rgba(255,255,255,.1)] border border-[rgba(255,255,255,.28)] backdrop-blur-[10px] text-[rgba(246,241,231,.95)]">{d.sub}</span>
        <span title="Тусгай хэрэгцээт хүнд ээлтэй" className="items-center justify-center w-6 h-6 rounded-full bg-[rgba(0,0,0,.5)] backdrop-blur-[10px] text-[#8fd6c6] border border-[rgba(255,255,255,.26)]" style={{ display: d.accShow }}><Accessibility size={13} /></span>
      </div>
      <button
        onClick={d.toggleFav}
        className="absolute right-3 top-3 z-[5] cursor-pointer w-[34px] h-[34px] rounded-full border border-[rgba(255,255,255,.28)] bg-[rgba(0,0,0,.45)] backdrop-blur-[10px] flex items-center justify-center transition-all duration-[200ms] hover:border-[var(--accent,#E8B84B)]"
        style={{ color: d.heartColor }}
      ><Heart size={15} fill={d.favOn ? 'currentColor' : 'none'} /></button>
      <div className="absolute left-0 right-0 bottom-0 py-4 px-[18px] pointer-events-none">
        <div className="flex items-center gap-[5px] mb-2"><span className="text-xs leading-none text-[var(--accent,#E8B84B)]">★</span><span className="text-xs font-extrabold leading-none text-cream-2">{d.rating}</span></div>
        <div className="text-[16.5px] font-extrabold tracking-[-0.01em] leading-[1.2] text-cream-2">{d.name}</div>
        <div className="text-xs text-[rgba(242,237,227,.62)] mt-[5px] leading-[1.45]">{d.displayMeta}</div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const V: any = useContext(BigBangContext);

  // This page is per-account (favorites, own submissions, add-content) — not
  // logged in means nothing real to show, so prompt to sign in instead of
  // rendering the full page shell empty (which is what used to happen after
  // clicking "Гарах": the nav correctly hid "Нэвтрэх" for logged-in-only
  // areas, but /profile's own body kept rendering as if nothing changed).
  if (!V.loggedIn) {
    return (
      <section
        data-screen-label="Профайл — нэвтрээгүй"
        className={`min-h-screen box-border max-w-[1080px] mx-auto flex items-center justify-center ${V.isMobile ? 'px-[18px]' : 'px-12'}`}
      >
        <div className="flex flex-col items-center gap-4 text-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(242,237,227,.2)] bg-[rgba(255,255,255,.03)] text-[rgba(242,237,227,.6)]">
            <User size={22} />
          </div>
          <div className="text-[19px] font-extrabold tracking-[-0.02em] text-cream-2">Нэвтрээгүй байна</div>
          <p className="max-w-[360px] text-[13px] leading-[1.5] text-[rgba(242,237,227,.55)]">
            Профайлаа, дуртай газруудаа болон нэмсэн контентоо харахын тулд эхлээд нэвтэрнэ үү.
          </p>
          <Link
            href="/login"
            className="mt-1 cursor-pointer whitespace-nowrap rounded-full border-none bg-[var(--accent,#E8B84B)] px-6 py-3 font-[inherit] text-[13px] font-extrabold !text-[#132a1f] no-underline transition-transform duration-200 hover:-translate-y-0.5"
          >
            Нэвтрэх →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      data-screen-label="Профайл"
      className={`min-h-screen box-border max-w-[1080px] mx-auto ${V.isMobile ? 'pt-24 px-[18px] pb-10' : 'pt-[110px] px-12 pb-[60px]'}`}
    >
      <div className="flex items-center gap-5 pb-7 border-b border-[rgba(255,255,255,.1)]">
        <div className="w-[78px] h-[78px] rounded-full bg-[linear-gradient(135deg,_var(--accent,#E8B84B),_#b8895a)] flex items-center justify-center text-[30px] font-extrabold text-[#132a1f] flex-none">Б</div>
        <div className="flex-1 min-w-0">
          <div className="text-[26px] font-extrabold tracking-[-0.02em] text-cream-2">{V.L.profileName}</div>
          <div className="text-[13px] text-[rgba(242,237,227,.55)] mt-1">{V.L.profileMeta}</div>
        </div>
        {V.loggedIn && (
          <button
            onClick={V.logout}
            className="cursor-pointer whitespace-nowrap rounded-full border border-[rgba(242,237,227,.25)] bg-transparent px-4 py-2 font-[inherit] text-xs font-bold text-[rgba(242,237,227,.7)] transition-all duration-200 hover:border-[#f08a8a] hover:text-[#f08a8a]"
          >
            Гарах
          </button>
        )}
      </div>

      <div className="mt-[34px]">
        <div className="flex items-center gap-2.5 mb-4">
          <Heart size={16} className="text-[var(--accent,#E8B84B)]" fill="currentColor" />
          <div className="text-xs font-extrabold tracking-[.08em] uppercase text-[rgba(242,237,227,.5)]">{V.L.favTitle}</div>
        </div>
        <div className="flex items-baseline gap-3 mb-[14px]">
          <h2 className="m-0 text-[17px] font-extrabold tracking-[-0.02em] text-cream">{V.L.favPlaces}</h2>
          <span className="font-mono text-[11px] text-[rgba(242,237,227,.45)]">{V.favPlaceCount} {V.L.places}</span>
        </div>
        {V.favPlacesEmpty && <div className="p-[22px] border border-dashed border-[rgba(242,237,227,.22)] rounded-[14px] text-[13px] text-[rgba(242,237,227,.45)]">{V.L.favEmpty}</div>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px] mt-1">
          {V.favPlaces.map((fp: any, i: number) => <FavCard key={i} d={fp} />)}
        </div>

        <div className="flex items-baseline gap-3 mt-[34px] mb-[14px]">
          <h2 className="m-0 text-[17px] font-extrabold tracking-[-0.02em] text-cream">{V.L.favScenic}</h2>
          <span className="font-mono text-[11px] text-[rgba(242,237,227,.45)]">{V.favScenicCount} {V.L.places}</span>
        </div>
        {V.favScenicEmpty && <div className="p-[22px] border border-dashed border-[rgba(242,237,227,.22)] rounded-[14px] text-[13px] text-[rgba(242,237,227,.45)]">{V.L.favEmptyScenic}</div>}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-[18px] mt-1">
          {V.favScenic.map((fs: any, i: number) => <FavCard key={i} d={fs} />)}
        </div>
      </div>

      <div className="mt-[38px]">
        <div className="text-xs font-extrabold tracking-[.08em] uppercase text-[rgba(242,237,227,.5)] mb-[14px]">{V.L.addContent}</div>

        {/* Газар нэмэх gets 40% (amber, admin-approval badge), scenic/event
            30% each (green, "publishes instantly" badge) — one row. */}
        <div className={V.isMobile ? 'flex flex-col gap-[14px]' : 'grid gap-[14px]'} style={V.isMobile ? undefined : { gridTemplateColumns: '4fr 3fr 3fr' }}>
          <button
            onClick={V.openPlaceForm}
            className="relative cursor-pointer font-[inherit] flex flex-col items-start gap-2.5 text-left p-5 rounded-2xl border border-[rgba(232,184,75,.3)] bg-[rgba(232,184,75,.05)] transition-all duration-[250ms] ease-in-out hover:border-[var(--accent,#E8B84B)] hover:translate-y-[-3px]"
          >
            <span className="mr-6 text-[9.5px] font-extrabold tracking-[.05em] uppercase py-1 px-[11px] rounded-full bg-[rgba(232,184,75,.16)] text-[var(--accent,#E8B84B)]">{V.L.addPlaceApproval}</span>
            <Isometric3DIcon kind="place" />
            <span className="text-[15px] font-extrabold text-cream-2">{V.L.addPlaceTitle}</span>
            <span className="text-xs text-[rgba(242,237,227,.5)] leading-[1.4]">{V.L.addPlaceDesc}</span>
          </button>

          {[
            { icon3d: 'scenic' as const, title: V.L.addScenicTitle, desc: V.L.addScenicDesc, onClick: V.openScenicForm },
            { icon3d: 'event' as const, title: V.L.addEventTitle, desc: V.L.addEventDesc, onClick: V.openEventForm },
          ].map((c, i) => (
            <button
              key={i}
              onClick={c.onClick}
              className="relative cursor-pointer font-[inherit] flex flex-col items-start gap-2.5 text-left p-5 rounded-2xl border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.03)] transition-all duration-[250ms] ease-in-out hover:border-[var(--accent,#E8B84B)] hover:translate-y-[-3px]"
            >
              <span className="text-[9.5px] font-extrabold tracking-[.05em] uppercase py-1 px-[11px] rounded-full bg-[rgba(168,213,162,.15)] text-[#a8d5a2]">{V.L.addInstantNote}</span>
              <Isometric3DIcon kind={c.icon3d} />
              <span className="text-[15px] font-extrabold text-cream-2">{c.title}</span>
              <span className="text-xs text-[rgba(242,237,227,.5)] leading-[1.4]">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {V.hasMyPlaces && (
        <div className="mt-[38px]">
          <div className="text-xs font-extrabold tracking-[.08em] uppercase text-[rgba(242,237,227,.5)] mb-[14px]">{V.L.myPlacesTitle}</div>
          <div className="grid grid-cols-3 gap-[14px]">
            {V.myPlaceItems.map((p: any, i: number) => (
              <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-[14px] overflow-hidden bg-[rgba(255,255,255,.03)]">
                <BgMedia bg={p.thumb} className="relative aspect-[16/10]" imgClassName="bg-cover bg-center" />
                <div className="pt-3 px-[14px] pb-[14px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-extrabold text-cream-2">{p.name}</div>
                    <span
                      className="flex-shrink-0 text-[9.5px] font-extrabold py-0.5 px-2 rounded-full whitespace-nowrap"
                      style={{
                        background: p.pending ? 'rgba(232,184,75,.15)' : p.rejected ? 'rgba(240,138,138,.15)' : 'rgba(168,213,162,.15)',
                        color: p.pending ? 'var(--accent,#E8B84B)' : p.rejected ? '#f08a8a' : '#a8d5a2',
                      }}
                    >
                      {p.statusLabel}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{p.aimag} · {p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {V.hasMyScenic && (
        <div className="mt-[38px]">
          <div className="text-xs font-extrabold tracking-[.08em] uppercase text-[rgba(242,237,227,.5)] mb-[14px]">{V.L.myScenicTitle}</div>
          <div className="grid grid-cols-3 gap-[14px]">
            {V.myScenicItems.map((s: any, i: number) => (
              <div key={i} className="border border-[rgba(255,255,255,.1)] rounded-[14px] overflow-hidden bg-[rgba(255,255,255,.03)]">
                <BgMedia bg={s.thumb} className="relative aspect-[16/10]" imgClassName="bg-cover bg-center" />
                <div className="pt-3 px-[14px] pb-[14px]">
                  <div className="text-sm font-extrabold text-cream-2">{s.name}</div>
                  <div className="text-[11.5px] text-[rgba(242,237,227,.5)] mt-[3px]">{s.aimag} · {s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {V.hasMyEvents && (
        <div className="mt-[38px]">
          <div className="text-xs font-extrabold tracking-[.08em] uppercase text-[rgba(242,237,227,.5)] mb-[14px]">{V.L.myEventsTitle}</div>
          <div className="flex flex-col gap-3 max-w-[640px]">
            {V.myEventItems.map((ev: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-[14px] border border-[rgba(255,255,255,.1)] rounded-[14px] bg-[rgba(255,255,255,.03)]">
                <div className="flex flex-col items-center justify-center min-w-[54px] h-[54px] rounded-[11px] border border-[rgba(232,184,75,.4)] bg-[rgba(232,184,75,.08)]">
                  <span className="text-[17px] font-extrabold text-[var(--accent,#E8B84B)] leading-none">{ev.day}</span>
                  <span className="text-[9px] font-semibold text-[rgba(242,237,227,.55)] mt-0.5">{ev.mon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-cream-2">{ev.name}</div>
                  <div className="text-xs text-[rgba(242,237,227,.55)] mt-[3px]">{ev.meta}</div>
                </div>
                <span className="text-[10.5px] font-bold py-1 px-[11px] rounded-full bg-[rgba(255,255,255,.07)] text-[rgba(242,237,227,.7)] whitespace-nowrap">{ev.tag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
