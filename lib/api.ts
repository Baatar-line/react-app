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

async function authedFetch(path: string, opts: RequestInit = {}, retried = false): Promise<Response> {
  const token = await ensureAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 && !retried) {
    localStorage.removeItem(TOKEN_KEY);
    return authedFetch(path, opts, true);
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await authedFetch(path, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await authedFetch(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
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
// Must stay <= the upload size cap in app/api/upload/route.ts. Checking it
// client-side lets us fail with a clean message instead of a raw "Failed to
// fetch" — a request that blows past the server's limit gets its connection
// cut mid-upload, which the browser reports as a network error rather than
// delivering the 413 the server tried to send.
const SERVER_UPLOAD_LIMIT = 100 * 1024 * 1024;

async function prepareImageForUpload(file: File): Promise<File> {
  let out = await shrinkImage(file, 2400, 0.85);
  if (out.size > CLOUDINARY_FREE_LIMIT) out = await shrinkImage(out, 1600, 0.75);
  return out;
}

// Uploads a real file (image or video) to Cloudinary via the backend and
// returns the resulting URL. Images are shrunk client-side first; video is
// sent as-is since it can't be cheaply re-encoded in the browser.
export async function uploadImage(file: File, folder: string): Promise<string> {
  const toSend = file.type.startsWith('image/') ? await prepareImageForUpload(file) : file;
  if (toSend.size > SERVER_UPLOAD_LIMIT) {
    throw new Error(`Файл хэтэрхий том байна (дээд тал ${SERVER_UPLOAD_LIMIT / (1024 * 1024)}MB)`);
  }
  const form = new FormData();
  form.append('file', toSend);
  form.append('folder', folder);
  const res = await authedFetch('/upload', { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Upload failed: ${res.status}`);
  }
  const data = await res.json();
  return data.url as string;
}
