'use client';

// Big Bang — Suggest collection detail (/suggest/:slug).
import { useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { SUGGESTS, SUGGEST_COLLECTIONS, imgUrl } from '@/components/bigbang/data';
import { BgMedia } from '@/components/bigbang/ui';

export default function SuggestDetail() {
  const V: any = useContext(BigBangContext);
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const L = V.L;

  const info = SUGGESTS.find((s) => s.slug === slug);
  const items = (SUGGEST_COLLECTIONS[slug || ''] || []).map((it) => ({
    ...it, cover: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.3)), url("' + imgUrl(it.img, 700) + '")',
  }));

  return (
    <section data-screen-label="Санал болгох дэлгэрэнгүй" className="box-border min-h-screen pt-[110px] px-12 pb-[60px]">
      <button
        onClick={() => router.push('/suggest')}
        className="mb-[26px] inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent text-[13px] font-semibold text-[rgba(242,237,227,.6)] transition-colors duration-[250ms] hover:text-[var(--accent,#E8B84B)]"
      >
        ← {L.suggestTitle}
      </button>
      <h2 className="m-0 mb-2 text-[clamp(24px,2.6vw,34px)] font-extrabold tracking-[-0.02em] text-cream">{info ? info.title : ''}</h2>
      <p className="m-0 mb-[30px] max-w-[560px] text-[13.5px] leading-[1.5] text-[rgba(242,237,227,.55)]">
        {V.lang === 'en' ? 'Curated picks for this category.' : 'Энэ ангилалд зориулсан тусгайлан бэлтгэсэн жагсаалтууд.'}
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
        {items.map((it: any, i: number) => (
          <div key={i} className="overflow-hidden rounded-[18px] border border-[rgba(255,255,255,.1)] bg-[rgba(255,255,255,.03)]">
            <BgMedia bg={it.cover} className="relative aspect-[16/10]" imgClassName="bg-cover bg-center" />
            <div className="px-[18px] pt-4 pb-[18px]">
              <div className="text-[15px] font-extrabold text-cream-2">{it.name}</div>
              <div className="mt-[5px] text-[12.5px] leading-[1.4] text-[rgba(242,237,227,.55)]">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
