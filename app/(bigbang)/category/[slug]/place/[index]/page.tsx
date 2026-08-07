'use client';

// Big Bang — Place detail (/category/:slug/place/:index). Rebuilds its data
// straight from CATS + the URL params, same as openPlace() used to build it via setState.
import React, { useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Accessibility, Heart, MapPin, Phone, Star } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { imgUrl, aimagName, mapsUrlFor, FCRIT } from '@/components/bigbang/data';
import { BgMedia } from '@/components/bigbang/ui';
import { getRatingSummary, ratingTargetKey, submitRating, type RatingSummary } from '@/lib/ratings';

export default function PlaceDetail() {
  const V: any = useContext(BigBangContext);
  const router = useRouter();
  const { slug, index } = useParams<{ slug: string; index: string }>();
  const [pdImgIdx, setPdImgIdx] = React.useState(0);
  React.useEffect(() => { setPdImgIdx(0); }, [slug, index]);
  const [hoverStar, setHoverStar] = React.useState(0);
  const [ratingSummary, setRatingSummary] = React.useState<RatingSummary>({ average: null, count: 0, mine: null });

  const accent = V.accent;
  const L = V.L;
  const lang = V.lang;

  const cats = V.cats || [];
  const cat = cats.find((c: any) => c.slug === slug) || cats[0] || { slug: '', name: '', nameEn: '', pool: [], items: [] };
  const i = Math.max(0, Math.min(Number(index) || 0, cat.items.length - 1));
  const it = cat.items[i];

  if (!it) return null;

  const access = !!it.access;
  const gallery = it.images && it.images.length ? it.images : [it.img || ''];
  const favKey = 'p:' + cat.slug + ':' + it.name;
  const favOn = !!V.favs[favKey];
  const targetKey = ratingTargetKey('place', it.id);
  React.useEffect(() => {
    let cancelled = false;
    getRatingSummary(targetKey, V.mySessionToken).then((s) => { if (!cancelled) setRatingSummary(s); }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, V.mySessionToken]);
  const rateThis = async (score: number) => {
    if (!V.loggedIn) { V.openUserAuth(); return; }
    try {
      setRatingSummary((s) => ({ ...s, mine: score }));
      const updated = await submitRating(V.mySessionToken, targetKey, score);
      setRatingSummary(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };
  const myRating = ratingSummary.mine || 0;
  const sel = Math.min(pdImgIdx, Math.max(0, gallery.length - 1));
  const mainImg = 'linear-gradient(rgba(0,0,0,.06), rgba(0,0,0,.2)), url("' + imgUrl(gallery[sel], 1200) + '")';
  const aimag = it.aimag || 'Улаанбаатар';
  const rating = ratingSummary.average != null ? ratingSummary.average.toFixed(1) : '—';
  const hours = it.hours || '—';
  const phone = it.phone || '—';
  const desc = it.desc || it.meta;
  const catName = lang === 'en' ? cat.nameEn : cat.name;

  const info = [
    { label: L.pdCat, value: catName },
    { label: L.pdSub, value: it.sub },
    { label: L.pdLoc, value: aimagName(aimag, lang) },
    { label: L.pdHours, value: hours },
    { label: L.pdPhone, value: phone },
    { label: L.pdAccessRow, value: access ? L.pdYes : L.pdNo },
  ];

  return (
    <section data-screen-label="Газрын дэлгэрэнгүй" className="box-border min-h-screen" style={{ padding: V.isMobile ? '88px 18px 40px' : '96px 48px 60px' }}>
      <button onClick={() => router.push('/category/' + cat.slug)} className="mb-[26px] inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent text-[13px] font-semibold text-[rgba(242,237,227,.6)] transition-colors duration-[250ms] hover:text-[var(--accent,#E8B84B)]">{L.back}</button>
      <div className={V.isTablet ? 'flex flex-col gap-7' : 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-start gap-12'}>
        <div className="static flex flex-col gap-2.5">
          <div className="relative aspect-[4/3] max-h-[420px] overflow-hidden rounded-[22px] border border-[rgba(255,255,255,.1)]">
            <BgMedia bg={mainImg} className="absolute inset-0" imgClassName="bg-cover bg-center" />
          </div>
          <div className="flex gap-2.5">
            {gallery.map((id: string, k: number) => (
              <button
                key={k}
                onClick={() => setPdImgIdx(k)}
                className={`relative aspect-[4/3] max-h-24 max-w-44 flex-1 cursor-pointer overflow-hidden rounded-xl p-0 ${k === sel ? 'opacity-100' : 'opacity-60'}`}
                style={{ border: `1.5px solid ${k === sel ? accent : 'rgba(255,255,255,.14)'}` }}
              >
                <BgMedia bg={`url("${imgUrl(id, 300)}")`} className="absolute inset-0" imgClassName="bg-cover bg-center" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <h1 className="m-0 text-[clamp(32px,3.4vw,50px)] font-extrabold leading-[1.08] tracking-[-0.03em] text-cream">{it.name}</h1>
          <div className="mt-[18px] flex flex-wrap gap-2">
            <span className="rounded-full border border-[rgba(242,237,227,.2)] py-1.5 px-3.5 text-xs font-bold text-[rgba(242,237,227,.8)]">{it.sub}</span>
            <span className="rounded-full border border-[rgba(242,237,227,.2)] py-1.5 px-3.5 text-xs font-bold text-[rgba(242,237,227,.8)]">{catName}</span>
            <span className="rounded-full border border-[rgba(242,237,227,.2)] py-1.5 px-3.5 text-xs font-bold text-[rgba(242,237,227,.8)]">{aimagName(aimag, lang)}</span>
            <span className={access
              ? 'inline-flex items-center gap-1.5 rounded-full border border-[rgba(120,200,170,.5)] bg-[rgba(120,200,170,.16)] py-1.5 px-3.5 text-xs font-bold text-[#8fd6c6]'
              : 'hidden items-center gap-1.5 rounded-full border border-[rgba(120,200,170,.5)] bg-[rgba(120,200,170,.16)] py-1.5 px-3.5 text-xs font-bold text-[#8fd6c6]'}><Accessibility size={13} /> {L.pdAccess}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-[26px]">
            <div className="flex items-center gap-[11px]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(232,184,75,.4)] text-base text-[var(--accent,#E8B84B)]">★</span>
              <span className="flex flex-col"><span className="text-[15px] font-extrabold text-cream">{rating}</span><span className="text-[11px] text-[rgba(242,237,227,.5)]">{L.pdRating}{ratingSummary.count > 0 ? ` · ${ratingSummary.count}` : ''}</span></span>
            </div>
            <div className="flex items-center gap-[11px]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(232,184,75,.4)] text-base text-[var(--accent,#E8B84B)]">◷</span>
              <span className="flex flex-col"><span className="text-[15px] font-extrabold text-cream">{hours}</span><span className="text-[11px] text-[rgba(242,237,227,.5)]">{L.pdHours}</span></span>
            </div>
            <div className="flex items-center gap-[11px]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(232,184,75,.4)] text-[var(--accent,#E8B84B)]"><Phone size={17} /></span>
              <span className="flex flex-col"><span className="text-[15px] font-extrabold text-cream">{phone}</span><span className="text-[11px] text-[rgba(242,237,227,.5)]">{L.pdPhone}</span></span>
            </div>
          </div>
          <div className="my-[30px] h-px bg-[rgba(255,255,255,.1)]"></div>
          <h2 className="m-0 mb-3.5 inline-block border-b-2 border-[var(--accent,#E8B84B)] pb-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-cream">{L.pdAbout}</h2>
          <p className="mt-2 max-w-[560px] text-[15px] leading-[1.7] text-[rgba(242,237,227,.72)]">{desc}</p>
          <h2 className="mt-[34px] mb-4 inline-block border-b-2 border-[var(--accent,#E8B84B)] pb-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-cream">{L.pdInfo}</h2>
          <div className="flex max-w-[560px] flex-col gap-[11px]">
            {info.map((row, i2) => (
              <div key={i2} className="flex items-baseline gap-3">
                <span className="h-1.5 w-1.5 flex-none -translate-y-0.5 rounded-full bg-[var(--accent,#E8B84B)]"></span>
                <span className="min-w-[130px] text-[13.5px] text-[rgba(242,237,227,.5)]">{row.label}</span>
                <span className="text-sm font-semibold text-cream">{row.value}</span>
              </div>
            ))}
          </div>
          {access && (
            <div className="mt-[26px] max-w-[560px] rounded-2xl border border-[rgba(120,200,170,.35)] bg-[rgba(120,200,170,.06)] py-5 px-[22px]">
              <div className="mb-3 flex items-center gap-[9px] text-sm font-extrabold text-[#8fd6c6]"><Accessibility size={16} /> {L.pdA11yTitle}</div>
              <div className="flex flex-col gap-2">
                {FCRIT.map((c, i3) => (
                  <div key={i3} className="flex items-center gap-2.5 text-[13px] text-[rgba(242,237,227,.8)]"><span className="font-extrabold text-[#8fd6c6]">✓</span>{c}</div>
                ))}
              </div>
            </div>
          )}
          <h2 className="mt-[34px] mb-3.5 inline-block border-b-2 border-[var(--accent,#E8B84B)] pb-1.5 text-[22px] font-extrabold tracking-[-0.02em] text-cream">{L.pdRateTitle}</h2>
          <div className="flex items-center gap-3.5">
            <div className="flex gap-1.5" onMouseLeave={() => setHoverStar(0)}>
              {[1, 2, 3, 4, 5].map((n) => {
                const on = n <= (hoverStar || myRating);
                return (
                  <button
                    key={n}
                    onClick={() => rateThis(n)}
                    onMouseEnter={() => setHoverStar(n)}
                    aria-label={String(n)}
                    className="cursor-pointer border-0 bg-transparent p-0 transition-transform duration-150 hover:scale-110"
                    style={{ color: on ? accent : 'rgba(242,237,227,.28)' }}
                  >
                    <Star size={26} fill={on ? 'currentColor' : 'none'} />
                  </button>
                );
              })}
            </div>
            <span className="text-[13px] font-semibold text-[rgba(242,237,227,.6)]">
              {myRating ? `${L.pdRateThanks}: ${myRating}/5` : L.pdRateHint}
            </span>
          </div>
          <div className="mt-[30px] flex flex-wrap gap-3">
            <a href={mapsUrlFor({ name: it.name, aimag, lat: it.lat, lng: it.lng, mapUrl: it.mapUrl })} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-[rgba(66,133,244,.4)] bg-[rgba(66,133,244,.14)] py-3 px-[22px] text-[13px] font-bold text-[#8ab4f8] no-underline transition-all duration-[200ms] hover:bg-[rgba(66,133,244,.22)]"><MapPin size={14} />{L.openMaps}</a>
            <button onClick={V.toggleFav(favKey)} className="inline-flex cursor-pointer items-center gap-2 rounded-full py-3 px-[22px] text-[13px] font-bold transition-all duration-[250ms]" style={{ border: `1px solid ${favOn ? accent : 'rgba(242,237,227,.28)'}`, background: favOn ? accent : 'transparent', color: favOn ? '#132a1f' : 'rgba(242,237,227,.8)' }}><Heart size={15} fill={favOn ? 'currentColor' : 'none'} /> {favOn ? L.savedLabel : L.save}</button>
          </div>
        </div>
      </div>
    </section>
  );
}
