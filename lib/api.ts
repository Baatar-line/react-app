// Thin client for the app's own /api/* route handlers (see app/api/).
// AdminPanel has no real login screen yet, so it authenticates itself with a
// seeded dev admin account (see prisma/seed.ts) and caches the token — same
// idea as any other session token, just bootstrapped instead of typed in.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api';

const TOKEN_KEY = 'bb_admin_token';
const ADMIN_EMAIL = 'admin@bigbang.mn';
const ADMIN_PASSWORD = 'bigbang-admin-dev';

let tokenPromise: Promise<string> | null = null;

async function login(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error('Admin login failed — is the database seeded? (bun run seed)');
  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.token as string;
}

export function ensureAdminToken(): Promise<string> {
  const cached = localStorage.getItem(TOKEN_KEY);
  if (cached) return Promise.resolve(cached);
  if (!tokenPromise) tokenPromise = login().finally(() => { tokenPromise = null; });
  return tokenPromise;
}

// `token` lets a caller act as a real logged-in user (host/admin session from
// lib/session.ts) instead of the AdminPanel's bootstrapped dev-admin account.
// Omitted entirely (undefined) — the default everywhere already calling this
// — it keeps falling back to ensureAdminToken(), so every existing AdminPanel
// call site behaves exactly as before.
async function authedFetch(path: string, opts: RequestInit = {}, token?: string, retried = false): Promise<Response> {
  const authToken = token ?? await ensureAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${authToken}` },
  });
  // Only the bootstrapped admin token retries itself — a real user session
  // that's expired/invalid should surface the 401 to its caller instead.
  if (res.status === 401 && !retried && token === undefined) {
    localStorage.removeItem(TOKEN_KEY);
    return authedFetch(path, opts, undefined, true);
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

// For GET routes that require auth (e.g. /places/pending, admin-only) —
// same optional-token/bootstrap-fallback behavior as apiPost/apiPatch/apiPut.
export async function apiGetAuthed<T>(path: string, token?: string): Promise<T> {
  const res = await authedFetch(path, {}, token);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await authedFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, token);
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error(errBody?.error || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await authedFetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, token);
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await authedFetch(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, token);
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

// Phone camera photos routinely land at 8-15MB+ (or 30-50MP), well past Cloudinary's
// 10MB free-plan upload cap — that showed up as a raw "Upload failed: 500" with no
// indication of why. Downscale + re-encode before it ever leaves the browser so
// uploads succeed and transfer faster, instead of just surfacing the error better.
async function shrinkImage(file: File, maxDim: number, quality: number): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // e.g. HEIC the browser can't decode — upload as-is
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

const CLOUDINARY_FREE_LIMIT = 10 * 1024 * 1024;
// Cloudinary's free-plan video/raw cap. The upload now goes straight to
// Cloudinary (see uploadImage below), so this is just a client-side
// pre-check for a clean error message instead of whatever Cloudinary itself
// returns for an oversized file.
const SERVER_UPLOAD_LIMIT = 100 * 1024 * 1024;

async function prepareImageForUpload(file: File): Promise<File> {
  let out = await shrinkImage(file, 2400, 0.85);
  if (out.size > CLOUDINARY_FREE_LIMIT) out = await shrinkImage(out, 1600, 0.75);
  return out;
}

// Uploads a real file (image or video) straight to Cloudinary and returns the
// resulting URL. Images are shrunk client-side first; video is sent as-is
// since it can't be cheaply re-encoded in the browser.
//
// The file goes browser → Cloudinary directly (signed by our backend, see
// /api/upload-signature) instead of being proxied through our own API route.
// Vercel's Serverless Functions reject request bodies over ~4.5MB regardless
// of any limit our own code sets, which used to surface as an opaque
// "Upload failed: 413" for anything bigger than that — a multi-MB photo or
// any real video. Only the tiny signature request now touches our function;
// the actual bytes bypass Vercel's limit entirely.
export async function uploadImage(file: File, folder: string, token?: string): Promise<string> {
  const toSend = file.type.startsWith('image/') ? await prepareImageForUpload(file) : file;
  if (toSend.size > SERVER_UPLOAD_LIMIT) {
    throw new Error(`Файл хэтэрхий том байна (дээд тал ${SERVER_UPLOAD_LIMIT / (1024 * 1024)}MB)`);
  }
  const sigRes = await authedFetch('/upload-signature', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder }),
  }, token);
  if (!sigRes.ok) {
    const body = await sigRes.json().catch(() => null);
    throw new Error(body?.error || `Upload signature failed: ${sigRes.status}`);
  }
  const sig = await sigRes.json();

  const form = new FormData();
  form.append('file', toSend);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || `Upload failed: ${res.status}`);
  }
  const data = await res.json();
  return data.secure_url as string;
}
