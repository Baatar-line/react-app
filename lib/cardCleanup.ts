import { prisma } from './prisma';

// Ratings and favorites point at a card by string key rather than by foreign
// key (see Rating.targetKey / Favorite.placeId in prisma/schema.prisma —
// one table each covers places, scenic pins and events, which is why neither
// can be a real relation), so Postgres has no cascade to run when the card
// itself is deleted. Without this the rows just stay in the database, rating
// and favoriting a listing that no longer exists.
//
// The two key formats differ, and both are built on the client:
//   ratings    '<kind>:<id>'                      — ratingTargetKey, lib/ratings.ts
//   favorites  'p:<categorySlug>:<name>', 's:<name>' — BigBangLayout's toggleFav
//
// The rating key is id-derived and always matches. The favorite key is
// name-derived, so a card renamed (or moved to another category) after
// someone favorited it leaves behind a row this can't find — unavoidable
// without a real relation, and harmless beyond the space it takes.
export async function deleteCardSideRows(
  kind: 'place' | 'scenic' | 'event',
  id: number,
  favoriteKey?: string,
): Promise<void> {
  await prisma.rating.deleteMany({ where: { targetKey: `${kind}:${id}` } });
  // Events are never favoritable — only rated — so they pass no key.
  if (favoriteKey) await prisma.favorite.deleteMany({ where: { placeId: favoriteKey } });
}
