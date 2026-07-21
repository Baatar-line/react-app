'use client';

// Big Bang — Suggest collection detail (/suggest/:slug).
import { useContext } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { css, Hover } from '@/components/bigbang/ui';
import { SUGGESTS, SUGGEST_COLLECTIONS, imgUrl } from '@/components/bigbang/data';

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
    <section data-screen-label="Санал болгох дэлгэрэнгүй" style={css('padding:110px 48px 60px;min-height:100vh;box-sizing:border-box')}>
      <Hover as="button" onClick={() => router.push('/suggest')} s="all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:rgba(242,237,227,.6);margin-bottom:26px;transition:color .25s" h="color:var(--accent,#E8B84B)">← {L.suggestTitle}</Hover>
      <h2 style={css('margin:0 0 8px;font-size:clamp(24px,2.6vw,34px);font-weight:800;letter-spacing:-0.02em;color:#f2ede3')}>{info ? info.title : ''}</h2>
      <p style={css('margin:0 0 30px;font-size:13.5px;color:rgba(242,237,227,.55);max-width:560px;line-height:1.5')}>{V.lang === 'en' ? 'Curated picks for this category.' : 'Энэ ангилалд зориулсан тусгайлан бэлтгэсэн жагсаалтууд.'}</p>
      <div style={css('display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px')}>
        {items.map((it: any, i: number) => (
          <div key={i} style={css('border:1px solid rgba(255,255,255,.1);border-radius:18px;overflow:hidden;background:rgba(255,255,255,.03)')}>
            <div style={{ ...css('position:relative;aspect-ratio:16/10;background-size:cover;background-position:center'), backgroundImage: it.cover }}></div>
            <div style={css('padding:16px 18px 18px')}>
              <div style={css('font-size:15px;font-weight:800;color:#f6f1e7')}>{it.name}</div>
              <div style={css('font-size:12.5px;color:rgba(242,237,227,.55);margin-top:5px;line-height:1.4')}>{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
