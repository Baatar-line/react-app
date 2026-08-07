// Real, backend-persisted "Очно" attendance — replaces toggleJoin()'s old
// pure local React state (see BigBangLayout.tsx), which meant the headcount
// couldn't exist at all and the button forgot itself on every refresh.
// Keyed by the event's real row id (not a name-derived string like
// lib/favorites.ts uses), since an attendance can only ever point at an Event.
import { apiGetAuthed, apiPost, apiDelete } from './api';

export async function getAttendingEventIds(token: string): Promise<number[]> {
  return apiGetAuthed<number[]>('/events/attending', token);
}

// Both return the event's fresh total, so a caller that guessed optimistically
// can settle on the real number instead of leaving its own arithmetic in place.
export async function attendEvent(token: string, eventId: number): Promise<number> {
  const res = await apiPost<{ count: number }>(`/events/${eventId}/attend`, {}, token);
  return res.count;
}

export async function unattendEvent(token: string, eventId: number): Promise<void> {
  await apiDelete(`/events/${eventId}/attend`, token);
}
