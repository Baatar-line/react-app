// Real, backend-persisted favorites — replaces toggleFav()'s old pure local
// React state (see BigBangLayout.tsx). Favorite.placeId is a free-form string
// despite the field name (see prisma/schema.prisma), so this keeps whatever
// key format BigBangLayout already builds ('p:slug:name', 's:name') instead
// of switching to ratings.ts's separate '<kind>:<id>' convention.
import { apiGetAuthed, apiPost, apiDelete } from './api';

interface FavoriteRow { placeId: string; }

export async function getFavoriteKeys(token: string): Promise<string[]> {
  const rows = await apiGetAuthed<FavoriteRow[]>('/favorites', token);
  return rows.map((r) => r.placeId);
}

export async function addFavorite(token: string, key: string): Promise<void> {
  await apiPost('/favorites', { placeId: key }, token);
}

export async function removeFavorite(token: string, key: string): Promise<void> {
  await apiDelete(`/favorites/${encodeURIComponent(key)}`, token);
}
