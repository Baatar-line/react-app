'use client';

// Big Bang — Suggest collection detail (/suggest/:slug).
import { useContext, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BigBangContext } from '@/components/bigbang/BigBangLayout';
import { SUGGESTS, imgUrl } from '@/components/bigbang/data';
import { BgMedia } from '@/components/bigbang/ui';
import { apiGet } from '@/lib/api';

interface SuggestCardRow { id: number; name: string; description: string | null; image: string | null; link: string | null; group: string | null; }

export default function SuggestDetail() {
  const V: any = useContext(BigBangContext);
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const L = V.L;

  const info = SUGGESTS.find((s) => s.slug === slug);
  const [cards, setCards] = useState<SuggestCardRow[]>([]);
  useEffect(() => {
    if (!slug) return;
    apiGet<SuggestCardRow[]>(`/suggest-cards?collectionSlug=${encodeURIComponent(slug)}`)
      .then(setCards)
      .catch(() => setCards([]));
  }, [slug]);
  // Filter chips are built from whichever groups this collection's own cards
  // actually carry, in the order the API returned them — so a collection that
  // never sets a group (games, board games) shows no chips at all, and adding
  // a new bucket is a data change rather than a code change. Cards without a
  // group stay visible under "Бүгд" only.
  const groups: string[] = [];
  cards.forEach((c) => { if (c.group && !groups.includes(c.group)) groups.push(c.group); });
  const [activeGroup, setActiveGroup] = useState('');
  // A group that disappears (renamed in admin, or a different collection
  // opened) would otherwise leave the page filtered to nothing with no way
  // back except reloading.
  useEffect(() => { setActiveGroup(''); }, [slug]);
  const shown = activeGroup ? cards.filter((c) => c.group === activeGroup) : cards;

  const items = shown.map((it) => ({
    name: it.name, desc: it.description || '—', link: it.link || '',
    cover: 'linear-gradient(rgba(0,0,0,.12), rgba(0,0,0,.3)), url("' + imgUrl(it.image || '', 700) + '")',
  }));

  return (
    <section data-screen-label="Санал болгох дэлгэрэнгүй" className="box-border min-h-screen pt-[110px] px-12 pb-[60px]">
      <button
        onClick={() => router.push('/suggest')}
        className="mb-[26px] inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent text-[13px] font-semibold text-[rgba(242,237,227,.6)] transition-colors duration-[250ms] hover:text-[var(--accent,#E8B84B)]"
      >
        ← {L.suggestTitle}
      </button>
      {/* The generic "curated picks for this category" line that used to sit
          here said nothing the title didn't — it carried the gap down to the
          content, which is why the title now holds that margin itself. */}
      <h2 className="m-0 mb-[30px] text-[clamp(24px,2.6vw,34px)] font-extrabold tracking-[-0.02em] text-cream">{info ? info.title : ''}</h2>
      {/* Same pill row as the category page's chips, so filtering looks the
          same wherever it appears in the app. "Бүгд" leads because it's the
          state the page opens in. */}
      {groups.length > 0 && (
        <div className="mb-[26px] flex flex-wrap gap-2">
          {['', ...groups].map((g) => {
            const on = activeGroup === g;
            return (
              <button
                key={g || 'all'}
                onClick={() => setActiveGroup(g)}
                className="cursor-pointer rounded-full py-[9px] px-[18px] font-[inherit] text-[12.5px] font-bold transition-all duration-200"
                style={{
                  border: `1px solid ${on ? 'var(--accent,#E8B84B)' : 'rgba(242,237,227,.28)'}`,
                  background: on ? 'var(--accent,#E8B84B)' : 'transparent',
                  color: on ? '#132a1f' : 'rgba(242,237,227,.8)',
                }}
              >{g || (V.lang === 'en' ? 'All' : 'Бүгд')}</button>
            );
          })}
        </div>
      )}
      {items.length === 0 && (
        <div className="p-[22px] border border-dashed border-[rgba(242,237,227,.22)] rounded-[14px] text-[13px] text-[rgba(242,237,227,.45)] max-w-[560px]">
          {V.lang === 'en' ? 'No cards here yet.' : 'Одоогоор дэд карт алга байна.'}
        </div>
      )}
      {/* A fixed four across on desktop rather than auto-fill: auto-fill packs
          in as many 260px tracks as the width allows, so a wide screen got
          five or six cramped cards per row instead of four roomy ones. */}
      <div className={`grid gap-5 ${V.isMobile ? 'grid-cols-1' : V.isTablet ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {items.map((it: any, i: number) => {
          // A card with a link (a game's Steam store page, say) is a real
          // anchor so it opens in a new tab, is middle-clickable, and shows
          // its destination on hover — none of which an onClick handler
          // gives you. The hover lift is tied to the same condition: a card
          // without a link opens nothing, so promising a click would lie.
          const Tag: any = it.link ? 'a' : 'div';
          const linkProps = it.link ? { href: it.link, target: '_blank', rel: 'noopener noreferrer' } : {};
          return (
            // Full-bleed photo with the text over it, same treatment as the
            // place cards on a category page — the photo used to stop at a
            // 16/10 box with the name and description in a separate panel
            // underneath, which made the card mostly empty panel on a wide
            // screen.
            <Tag
              key={i}
              {...linkProps}
              className={`group relative block aspect-[677/525] overflow-hidden rounded-[18px] border border-[rgba(0,0,0,.6)] no-underline animate-[bbFadeUp_.5s_cubic-bezier(.22,.8,.3,1)_both] ${
                it.link ? 'cursor-pointer transition-all duration-[350ms] ease-[cubic-bezier(.22,.8,.3,1)] hover:-translate-y-[5px] hover:shadow-[0_22px_48px_rgba(0,0,0,.5)]' : ''
              }`}
            >
              <BgMedia bg={it.cover} className="absolute inset-0" imgClassName="bg-cover bg-center" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(0,0,0,.18)_0%,_rgba(0,0,0,0)_28%,_rgba(0,0,0,.4)_50%,_rgba(0,0,0,.99)_100%)]"></div>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,_rgba(0,0,0,.55)_0%,_rgba(0,0,0,0)_45%),radial-gradient(120%_90%_at_100%_0%,_rgba(0,0,0,.55)_0%,_rgba(0,0,0,0)_45%)]"></div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 py-4 px-[18px]">
                <div className="text-[16.5px] font-extrabold leading-[1.2] tracking-[-0.01em] text-cream-2">{it.name}</div>
                {/* Collapsed to nothing until the card is hovered. Because the
                    whole text block is anchored to the bottom edge, collapsing
                    this row lets the title settle at the very bottom, and
                    expanding it on hover pushes the title up to make room for
                    the description underneath.

                    The 0fr -> 1fr grid row is what animates: unlike a
                    max-height guess it resolves to the content's real height,
                    so a one-line and a two-line description both open cleanly.
                    The inner overflow-hidden is what the collapsed row clips
                    against, and the padding sits inside it so it collapses too.

                    Always open on mobile — there is no hover there, so hiding
                    it would hide it for good.

                    Clamped because the description is admin-authored free text:
                    a long one would climb past the scrim onto the bright part
                    of the photo and stop being readable. */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    V.isMobile ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] group-hover:grid-rows-[1fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`pt-[5px] line-clamp-2 text-xs leading-[1.45] text-[rgba(242,237,227,.62)] ${
                        V.isMobile ? '' : 'opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100'
                      }`}
                    >{it.desc}</div>
                  </div>
                </div>
              </div>
            </Tag>
          );
        })}
      </div>
    </section>
  );
}
