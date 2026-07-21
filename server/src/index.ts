import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { uploadRouter } from './routes/upload.routes';
import { profileRouter } from './routes/profile.routes';
import { aimagsRouter } from './routes/aimags.routes';
import { categoriesRouter } from './routes/categories.routes';
import { placesRouter } from './routes/places.routes';
import { scenicPinsRouter } from './routes/scenicPins.routes';
import { eventsRouter } from './routes/events.routes';
import { favoritesRouter } from './routes/favorites.routes';
import { settingsRouter } from './routes/settings.routes';

const app = express();

// Vite picks the next free port (5173, 5174, ...) whenever the usual one is
// already taken, so pinning CORS to a single origin kept silently breaking
// every fetch from the frontend the moment it landed on a different port —
// surfaced in the UI as "couldn't connect to backend" even though the
// server was up. Any localhost/127.0.0.1 origin is safe to allow here since
// this API only ever runs against a local dev frontend and auth is a bearer
// token (not cookies), not something a third-party site could ride on.
// CORS_ORIGIN still pins it to one origin for non-local deployments.
const allowedOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: allowedOrigin || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/profile', profileRouter);
app.use('/api/aimags', aimagsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/places', placesRouter);
app.use('/api/scenic-pins', scenicPinsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/settings', settingsRouter);

app.use((req, res) => res.status(404).json({ error: `Not found: ${req.method} ${req.path}` }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  // Cloudinary errors carry `http_code` (e.g. 400 for "file too large"); multer's
  // own size-limit rejection carries `code`. Surface those instead of a blanket 500
  // so the client can show what actually went wrong instead of a bare "failed: 500".
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Файл хэтэрхий том байна (дээд тал 25MB)' });
  }
  const status = typeof err.http_code === 'number' ? err.http_code : typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({ error: err.message || 'Дотоод алдаа гарлаа' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`bigbang-server listening on http://localhost:${port}`));
