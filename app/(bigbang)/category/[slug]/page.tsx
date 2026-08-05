'use client';

// Big Bang — Category grid (/category/:slug).
import React, { useContext } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Accessibility, Heart } from 'lucide-react';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { ratingOf, catBgOf, itemThumbOf, aimagName, isVideoUrl } from '@/components/bigbang/data';
import { BgMedia } from '@/components/bigbang/ui';

export default function CategoryPage() {
  const V: any = useContext(BigBangContext);
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  // Home's category-nav flyout can deep-link straight into a sub-category via
  // ?sub=<name> — otherwise this always starts on the unfiltered "Бүгд" view.
  const searchParams = useSearchParams();
  const subParam = searchParams.get('sub');
  const [sub, setSub] = React.useState(subParam || 'Бүгд');

  React.useEffect(() => { setSub(subParam || 'Бүгд'); }, [slug, subParam]);

  const cats: any[] = V.cats || [];
  const cat: any = cats.find((c: any) => c.slug === slug) || cats[0] || { slug: '', num: '', name: '', nameEn: '', desc: '', descEn: '', hero: '', pool: [], subs: [], items: [] };
  const accent = V.accent;
  const L = V.L;

  const chips = (['Бүгд'] as string[]).concat(cat.subs).map((label) => {
    const on = sub === label;
    return { label: label === 'Бүгд' ? L.all : label, on: () => setSub(label), bg: on ? accent : 'transparent', color: on ? '#132a1f' : 'rgba(242,237,227,.75)', border: on ? accent : 'rgba(242,237,227,.22)' };
  });

  const renderChip = (ch: any) => (
    <button key={ch.label} onClick={ch.on} className="cursor-pointer rounded-full py-1.5 px-[13px] text-[12.5px] font-semibold transition-all duration-[250ms]" style={{ border: `1px solid ${ch.border}`, background: ch.bg, color: ch.color }}>{ch.label}</button>
  );

  const gridItems = cat.items
    .filter((it: any) => (sub === 'Бүгд' || it.sub === sub) && (V.aimag === 'Бүгд' || (it.aimag || 'Улаанбаатар') === V.aimag))
    .map((it: any, i: number) => {
      const key = 'p:' + cat.slug + ':' + it.name;
      const acc = !!it.access;
      return {
        ...it, rating: ratingOf(it.name), access: acc, accShow: acc ? 'flex' : 'none',
        openPlace: () => { router.push('/category/' + cat.slug + '/place/' + i); try { window.scrollTo(0, 0); } catch (err) { /* ignore */ } },
        toggleFav: V.toggleFav(key), favOn: !!V.favs[key], heartColor: V.favs[key] ? accent : 'rgba(242,237,227,.9)',
        thumb: itemThumbOf(it.img).replace('rgba(0,0,0,.12)', 'rgba(0,0,0,.05)').replace('rgba(0,0,0,.42)', 'rgba(0,0,0,.15)'),
        displayMeta: it.meta + ' · ' + aimagName(it.aimag || 'Улаанбаатар', V.lang),
      };
    })
    .sort((a: any, b: any) => { if (V.spNeeds && a.access !== b.access) return a.access ? -1 : 1; return +b.rating - +a.rating; });

  const catBgOverride = V.catBgOverride[cat.slug] || '';
  // The background video (uploaded separately from the photo above) only
  // plays here, inside the category's own page — Home's hover/selection
  // preview always stays the still photo instead. Falls back to the photo
  // when no video has been uploaded for this category.
  const catVideoOverride = V.catVideoOverride[cat.slug] || '';

  return (
    <section data-screen-label="Ангиллын дэлгэрэнгүй">
      <header className="relative flex h-[52vh] min-h-[380px] items-end overflow-hidden">
        <BgMedia
          bg={catBgOf(cat, catBgOverride)} isVideo={!!catVideoOverride || isVideoUrl(catBgOverride)} videoSrc={catVideoOverride || catBgOverride}
          className="absolute inset-0" imgClassName="bg-cover bg-center [animation:var(--drift,none)]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.4)_0%,_rgba(0,0,0,0)_40%,_rgba(0,0,0,.94)_100%)]"></div>
        <div className="relative z-[5] box-border w-full" style={{ padding: V.isMobile ? '0 20px 28px' : '0 48px 40px' }}>
          <button onClick={V.goHome} className="cursor-pointer border-0 bg-transparent text-[13px] font-semibold text-[rgba(242,237,227,.6)] transition-colors duration-[250ms] hover:text-[var(--accent,#E8B84B)]">{L.back}</button>
          <div className="mt-3.5 flex flex-wrap items-baseline gap-5">
            <h1 className="m-0 text-[clamp(38px,9vw,92px)] font-extrabold leading-none tracking-[-0.04em] text-cream">{V.lang === 'en' ? cat.nameEn : cat.name}</h1>
            <span className="font-mono text-xs text-[rgba(242,237,227,.5)]">{gridItems.length} {L.places}</span>
          </div>
          <p className="mt-3 max-w-[520px] text-[15px] text-[rgba(242,237,227,.6)]">{V.lang === 'en' ? cat.descEn : cat.desc}</p>
        </div>
      </header>
      <div className="flex flex-wrap gap-2.5" style={{ padding: V.isMobile ? '20px 20px 8px' : '28px 48px 8px' }}>
        {/* "Бүгд" first, then the accessibility toggle, then the real subs —
            it sits next to the reset-to-everything chip because it cuts across
            all of them rather than belonging in that list. */}
        {chips.slice(0, 1).map(renderChip)}
        {/* Accessibility filter — a toggle, not a sub-category: it drives the
            same global spNeeds flag the profile switch does (so it persists and
            stays in sync), which the sort below reads to float wheelchair-
            friendly places to the front. Kept on the teal accessibility colour
            rather than the yellow accent so it doesn't read as one more sub. */}
        <button
          onClick={V.toggleSp}
          aria-pressed={V.spNeeds}
          aria-label={L.a11yWheelTitle}
          title={L.a11yWheelTitle + ' — ' + L.a11yWheelSub}
          className="flex cursor-pointer items-center gap-1.5 rounded-full py-1.5 px-[13px] text-[12.5px] font-semibold transition-all duration-[250ms]"
          style={{
            border: `1px solid ${V.spNeeds ? 'rgba(120,200,170,.9)' : 'rgba(242,237,227,.22)'}`,
            background: V.spNeeds ? 'rgba(120,200,170,.16)' : 'transparent',
            color: V.spNeeds ? '#8fd6c6' : 'rgba(242,237,227,.75)',
          }}
        >
          <Accessibility size={15} />
        </button>
        {chips.slice(1).map(renderChip)}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-[22px]" style={{ padding: V.isMobile ? '20px 20px 32px' : '26px 48px 40px' }}>
        {gridItems.map((it: any, i: number) => (
          <div key={i} onClick={it.openPlace} className="relative aspect-[677/525] cursor-pointer overflow-hidden rounded-[18px] border border-[rgba(0,0,0,.6)] transition-all duration-[350ms] ease-[cubic-bezier(.22,.8,.3,1)] animate-[bbFadeUp_.5s_cubic-bezier(.22,.8,.3,1)_both] hover:-translate-y-[5px] hover:shadow-[0_22px_48px_rgba(0,0,0,.5)]">
            <BgMedia bg={it.thumb} className="absolute inset-0" imgClassName="bg-cover bg-center transition-transform duration-[600ms] ease-[cubic-bezier(.22,.8,.3,1)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.18)_0%,_rgba(0,0,0,0)_28%,_rgba(0,0,0,.4)_50%,_rgba(0,0,0,.99)_100%)]"></div>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,_rgba(0,0,0,.55)_0%,_rgba(0,0,0,0)_45%),radial-gradient(120%_90%_at_100%_0%,_rgba(0,0,0,.55)_0%,_rgba(0,0,0,0)_45%)]"></div>
            <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
              <span className="rounded-full bg-[rgba(255,255,255,.1)] py-1 px-[11px] text-[10px] font-bold uppercase tracking-[.08em] text-[rgba(246,241,231,.95)] backdrop-blur-[10px] border border-[rgba(255,255,255,.28)]">{it.sub}</span>
              <span title="Тусгай хэрэгцээт хүнд ээлтэй" className="h-6 w-6 items-center justify-center rounded-full border border-[rgba(255,255,255,.26)] bg-[rgba(0,0,0,.5)] text-[#8fd6c6] backdrop-blur-[10px]" style={{ display: it.accShow }}><Accessibility size={13} /></span>
            </div>
            <button onClick={it.toggleFav} className="absolute right-3 top-3 z-[5] flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-[rgba(255,255,255,.28)] bg-[rgba(0,0,0,.45)] backdrop-blur-[10px] transition-all duration-[200ms] hover:border-[var(--accent,#E8B84B)]" style={{ color: it.heartColor }}><Heart size={15} fill={it.favOn ? 'currentColor' : 'none'} /></button>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 py-4 px-[18px]">
              <div className="mb-2 flex items-center gap-[5px]"><span className="text-xs leading-none text-[var(--accent,#E8B84B)]">★</span><span className="text-xs font-extrabold leading-none text-cream-2">{it.rating}</span></div>
              <div className="text-[16.5px] font-extrabold leading-[1.2] tracking-[-0.01em] text-cream-2">{it.name}</div>
              <div className="mt-[5px] text-xs leading-[1.45] text-[rgba(242,237,227,.62)]">{it.displayMeta}</div>
            </div>
          </div>
        ))}
      </div>
      {gridItems.length === 0 && (
        <div className="flex flex-col items-center gap-3.5 text-center" style={{ padding: V.isMobile ? '10px 20px 50px' : '10px 48px 70px' }}>
          <div className="text-[15px] text-[rgba(242,237,227,.55)]">{L.empty}</div>
          <button onClick={V.resetAimag} className="cursor-pointer rounded-full border border-[var(--accent,#E8B84B)] bg-transparent py-[9px] px-5 text-[12.5px] font-bold text-[var(--accent,#E8B84B)] transition-all duration-[250ms] hover:bg-[var(--accent,#E8B84B)] hover:text-[#132a1f]">{L.reset}</button>
        </div>
      )}
      <footer className="flex justify-between border-t border-[rgba(255,255,255,.07)] text-xs text-[rgba(242,237,227,.4)]" style={{ padding: V.isMobile ? '20px 20px' : '26px 48px' }}>
        <span>© 2026 atlas</span>
        <span>{L.tag}</span>
      </footer>
    </section>
  );
}
