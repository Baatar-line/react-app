# Big Bang — server

Express + Prisma (PostgreSQL) backend for the Big Bang app. Passwords are
hashed with bcrypt; images/videos are uploaded to Cloudinary and only the
resulting URL is ever stored in the database.

## Setup

```bash
cd server
cp .env.example .env        # then fill in JWT_SECRET + CLOUDINARY_* values
docker compose up -d        # starts local Postgres on localhost:5432
npm install
npm run prisma:migrate      # creates the tables
npm run seed                # seeds aimags + categories from the frontend's data
npm run dev                 # http://localhost:4000
```

Cloudinary credentials come from your [Cloudinary console](https://console.cloudinary.com/) (Dashboard → Account Details).

## Structure

```
server/
├─ docker-compose.yml   # local Postgres for development
├─ prisma/
│  ├─ schema.prisma      # data model (see comments for corrections vs. the original diagram)
│  └─ seed.ts            # seeds Aimag + Category from the frontend's bigbang/data.ts values
└─ src/
   ├─ index.ts           # Express app + route mounting
   ├─ lib/
   │  ├─ prisma.ts        # shared PrismaClient
   │  └─ cloudinary.ts    # Cloudinary config + buffer-upload helper
   ├─ middleware/
   │  ├─ auth.ts          # requireAuth / requireRole (JWT bearer token)
   │  └─ upload.ts        # multer (memory storage, image/video only, 25MB cap)
   ├─ utils/
   │  ├─ password.ts      # bcrypt hash/compare
   │  ├─ jwt.ts           # sign/verify
   │  └─ asyncHandler.ts  # forwards async route errors to Express
   └─ routes/
      ├─ auth.routes.ts        # register, login, me
      ├─ upload.routes.ts      # file -> Cloudinary -> { url }
      ├─ profile.routes.ts     # profile upsert
      ├─ aimags.routes.ts
      ├─ categories.routes.ts
      ├─ places.routes.ts      # includes host/admin submit + approval flow
      ├─ scenicPins.routes.ts
      ├─ events.routes.ts
      └─ favorites.routes.ts
```

## Upload flow

Media never touches this server's disk and the DB never stores binary data —
only a Cloudinary URL:

1. `POST /api/upload` (multipart, field name `file`, optional `folder` field) → uploads to Cloudinary, returns `{ url, publicId, resourceType }`.
2. Send that `url` as the `image` field when creating a place / scenic pin / event, or as `avatarImage`/`backgroundImage` on `PUT /api/profile/me`.

## Auth

`POST /api/auth/register` and `POST /api/auth/login` return `{ token, user }`.
Send `Authorization: Bearer <token>` on subsequent requests. Roles are
`user` / `host` / `admin` (`requireRole(...)` middleware gates host/admin-only
routes, e.g. creating places and approving them).

## API summary

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | /api/auth/register | — | |
| POST | /api/auth/login | — | |
| GET | /api/auth/me | user | |
| POST | /api/upload | user | multipart `file` |
| PUT | /api/profile/me | user | |
| GET | /api/aimags | — | |
| POST | /api/aimags | admin | |
| GET | /api/categories | — | |
| POST | /api/categories | admin | |
| GET | /api/places | — | approved only |
| GET | /api/places/mine | user | own submissions, any status |
| GET | /api/places/pending | admin | |
| GET | /api/places/:id | — | |
| POST | /api/places | host, admin | admin publishes instantly, host → pending |
| PATCH | /api/places/:id/status | admin | approve/reject |
| GET | /api/scenic-pins | — | |
| POST | /api/scenic-pins | user | |
| GET | /api/events | — | |
| POST | /api/events | user | |
| GET | /api/favorites | user | |
| POST | /api/favorites | user | body `{ placeId }` |
| DELETE | /api/favorites/:placeId | user | |
