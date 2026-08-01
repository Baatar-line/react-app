// Turns a CreateForm submission into a real Place/Event/ScenicPin row —
// shared by BigBangLayout (Profile page's add-content flow) and AdminPanel,
// so the categoryId/aimagId lookup + image upload + POST sequence isn't
// implemented twice. `token` is optional — when omitted, apiPost/uploadImage
// fall back to AdminPanel's bootstrapped admin token (see lib/api.ts); the
// Profile-page flow always passes the visitor's real OTP session token.
import { apiGet, apiPost, uploadImage } from './api';
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

async function firstImageUrl(data: CreateFormData, token: string | undefined, folder: string): Promise<string | undefined> {
  const file = data.imageFiles[0];
  if (!file) return undefined;
  return uploadImage(file, folder, token);
}

// Place is the one kind with mandatory contact info (phone/Instagram/
// Facebook/email) — see app/api/places/route.ts, which 400s without them.
// There's no "host" tier: anyone signed in can submit one, it just lands
// `pending` until an admin approves it (unlike scenic pins/events, which
// publish immediately for any signed-in account).
export async function createPlace(token: string | undefined, data: CreateFormData): Promise<void> {
  const [categoryId, aimagId, image] = await Promise.all([
    resolveCategoryId(data.catSlug),
    resolveAimagId(data.aimag),
    firstImageUrl(data, token, 'bigbang/places'),
  ]);
  await apiPost('/places', {
    name: data.name,
    description: data.desc || undefined,
    image,
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
  const [aimagId, image] = await Promise.all([
    resolveAimagId(data.aimag),
    firstImageUrl(data, token, 'bigbang/scenic'),
  ]);
  await apiPost('/scenic-pins', {
    name: data.name,
    type: data.scenicType || 'Үзэсгэлэнт газар',
    description: data.desc || undefined,
    image,
    aimagId,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
  }, token);
}

export async function createEvent(token: string | undefined, data: CreateFormData): Promise<void> {
  const [aimagId, image] = await Promise.all([
    resolveAimagId(data.aimag),
    firstImageUrl(data, token, 'bigbang/events'),
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
    image,
    startDate: startDate.toISOString(),
    aimagId,
    lat: data.lat ?? undefined,
    lng: data.lng ?? undefined,
  }, token);
}
