// Turns a CreateForm submission into a real Place/Event/ScenicPin row —
// shared by BigBangLayout (Profile page's add-content flow) and AdminPanel,
// so the categoryId/aimagId lookup + image upload + POST sequence isn't
// implemented twice. `token` is optional — when omitted, apiPost/uploadImage
// fall back to AdminPanel's bootstrapped admin token (see lib/api.ts); the
// Profile-page flow always passes the visitor's real OTP session token.
import { apiGet, apiPatch, apiPost, apiDelete, uploadImage } from './api';
import type { CreateFormData } from '../components/CreateForm';

interface CategoryRow { id: number; slug: string; }
interface AimagRow { id: number; name: string; }

async function resolveCategoryId(slug: string | undefined): Promise<number> {
  const cats = await apiGet<CategoryRow[]>('/categories');
  const match = slug ? cats.find((c) => c.slug === slug) : undefined;
  if (!match) throw new Error('Тодорхойгүй ангилал сонгогдлоо');
  return match.id;
}

async function resolveAimagId(name: string): Promise<number> {
  const aimags = await apiGet<AimagRow[]>('/aimags');
  const match = aimags.find((a) => a.name === name);
  if (!match) throw new Error(`Тодорхойгүй аймаг: ${name}`);
  return match.id;
}

// Uploads every newly-picked file (in parallel) and appends the results
// after whatever pre-existing photos CreateForm still has kept, capped at 4 —
// used for both create (existingImages is always []) and edit.
async function uploadImages(data: CreateFormData, token: string | undefined, folder: string): Promise<string[]> {
  const uploaded = await Promise.all(data.imageFiles.map((f) => uploadImage(f, folder, token)));
  return [...data.existingImages, ...uploaded].slice(0, 4);
}

// Place is the one kind with mandatory contact info (phone/Instagram/
// Facebook/email) — see app/api/places/route.ts, which 400s without them.
// There's no "host" tier: anyone signed in can submit one, it just lands
// `pending` until an admin approves it (unlike scenic pins/events, which
// publish immediately for any signed-in account).
export async function createPlace(token: string | undefined, data: CreateFormData): Promise<void> {
  const [categoryId, aimagId, images] = await Promise.all([
    resolveCategoryId(data.catSlug),
    resolveAimagId(data.aimag),
    uploadImages(data, token, 'bigbang/places'),
  ]);
  await apiPost('/places', {
    name: data.name,
    description: data.desc || undefined,
    images,
    categoryId,
    aimagId,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
    openTime: data.openTime || undefined,
    closeTime: data.closeTime || undefined,
    subCategory: data.sub || undefined,
    phone: data.phone || undefined,
    instagramUrl: data.instagram || undefined,
    facebookUrl: data.facebook || undefined,
    contactEmail: data.contactEmail || undefined,
    accessible: !!data.access,
  }, token);
}

export async function createScenicPin(token: string | undefined, data: CreateFormData): Promise<void> {
  const [aimagId, images] = await Promise.all([
    resolveAimagId(data.aimag),
    uploadImages(data, token, 'bigbang/scenic'),
  ]);
  await apiPost('/scenic-pins', {
    name: data.name,
    type: data.scenicType || 'Үзэсгэлэнт газар',
    description: data.desc || undefined,
    images,
    aimagId,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
  }, token);
}

export async function createEvent(token: string | undefined, data: CreateFormData): Promise<void> {
  const [aimagId, images] = await Promise.all([
    resolveAimagId(data.aimag),
    uploadImages(data, token, 'bigbang/events'),
  ]);
  let startDate = new Date();
  if (data.date) {
    const parsed = new Date(data.time ? `${data.date}T${data.time}` : data.date);
    if (!isNaN(+parsed)) startDate = parsed;
  }
  const meta = [data.time, data.desc.trim(), data.max ? `Хамгийн ихдээ ${data.max} хүн` : '']
    .filter(Boolean).join(' · ');
  await apiPost('/events', {
    name: data.name,
    meta: meta || undefined,
    images,
    startDate: startDate.toISOString(),
    aimagId,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
    instagram: data.instagram || undefined,
    facebook: data.facebook || undefined,
    phone: data.phone || undefined,
    phone2: data.phone2 || undefined,
  }, token);
}

// Admin-only edits — PATCH the existing row with CreateForm's edited fields
// instead of creating a new one. `data.id` is required (set by CreateForm
// only when opened in edit mode).
export async function updatePlace(token: string | undefined, id: number, data: CreateFormData): Promise<void> {
  const [categoryId, aimagId, images] = await Promise.all([
    resolveCategoryId(data.catSlug),
    resolveAimagId(data.aimag),
    uploadImages(data, token, 'bigbang/places'),
  ]);
  await apiPatch(`/places/${id}`, {
    name: data.name,
    description: data.desc || undefined,
    images,
    categoryId,
    aimagId,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
    openTime: data.openTime || undefined,
    closeTime: data.closeTime || undefined,
    subCategory: data.sub || undefined,
    phone: data.phone || undefined,
    instagramUrl: data.instagram || undefined,
    facebookUrl: data.facebook || undefined,
    contactEmail: data.contactEmail || undefined,
    accessible: !!data.access,
  }, token);
}

export async function updateScenicPin(token: string | undefined, id: number, data: CreateFormData): Promise<void> {
  const [aimagId, images] = await Promise.all([
    resolveAimagId(data.aimag),
    uploadImages(data, token, 'bigbang/scenic'),
  ]);
  await apiPatch(`/scenic-pins/${id}`, {
    name: data.name,
    type: data.scenicType || 'Үзэсгэлэнт газар',
    description: data.desc || undefined,
    images,
    aimagId,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
  }, token);
}

export async function updateEvent(token: string | undefined, id: number, data: CreateFormData): Promise<void> {
  const [aimagId, images] = await Promise.all([
    resolveAimagId(data.aimag),
    uploadImages(data, token, 'bigbang/events'),
  ]);
  let startDate = new Date();
  if (data.date) {
    const parsed = new Date(data.time ? `${data.date}T${data.time}` : data.date);
    if (!isNaN(+parsed)) startDate = parsed;
  }
  // Unlike createEvent, don't re-combine time/max into meta here — CreateForm
  // pre-fills `desc` with the row's existing (already-combined) meta text, so
  // re-running the same time-prefix/max-suffix join on every edit would keep
  // stacking duplicate prefixes. `date`/`time` still drive startDate above;
  // any meta wording changes are just typed directly into the desc field.
  await apiPatch(`/events/${id}`, {
    name: data.name,
    meta: data.desc.trim() || undefined,
    images,
    startDate: startDate.toISOString(),
    aimagId,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
    instagram: data.instagram || undefined,
    facebook: data.facebook !== undefined ? data.facebook : undefined,
    phone: data.phone || undefined,
    phone2: data.phone2 !== undefined ? data.phone2 : undefined,
  }, token);
}

export async function deletePlace(token: string | undefined, id: number): Promise<void> {
  await apiDelete(`/places/${id}`, token);
}

export async function deleteScenicPin(token: string | undefined, id: number): Promise<void> {
  await apiDelete(`/scenic-pins/${id}`, token);
}

export async function deleteEvent(token: string | undefined, id: number): Promise<void> {
  await apiDelete(`/events/${id}`, token);
}
