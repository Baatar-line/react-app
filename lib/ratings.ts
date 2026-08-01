// Real, backend-persisted 1-5 ratings — replaces the old ratingOf() name-hash
// placeholder on the two pages that actually show a "rate this" widget
// (PlaceDetail, EventDetail). See app/api/ratings/route.ts.
import { apiGet, apiPost } from './api';

export interface RatingSummary {
  average: number | null;
  count: number;
  mine: number | null;
}

export function ratingTargetKey(kind: 'place' | 'scenic' | 'event', id: number): string {
  return `${kind}:${id}`;
}

export async function getRatingSummary(targetKey: string, token?: string): Promise<RatingSummary> {
  const qs = `targetKey=${encodeURIComponent(targetKey)}`;
  if (!token) return apiGet<RatingSummary>(`/ratings?${qs}`);
  // apiGet sends no Authorization header — a signed-in visitor still needs
  // their own token forwarded so the response's `mine` is populated.
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || '/api'}/ratings?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET /ratings failed: ${res.status}`);
  return res.json();
}

export async function submitRating(token: string, targetKey: string, score: number): Promise<RatingSummary> {
  return apiPost<RatingSummary>('/ratings', { targetKey, score }, token);
}
