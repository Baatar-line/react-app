// Prisma 7 config file — replaces the old package.json "prisma".seed key.
// Run via Bun (`bunx --bun prisma ...`) so .env.local is loaded automatically;
// no dotenv import needed.
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun run prisma/seed.ts',
  },
  datasource: {
    // Migrations go through DIRECT_URL when it's set, falling back to the
    // pooled DATABASE_URL when it isn't.
    //
    // Prisma Migrate takes a session-level `pg_advisory_lock` before applying
    // anything. Neon's `-pooler` endpoint is PgBouncer, which hands each
    // statement whichever backend connection is free, so the lock and the
    // unlock can land on different sessions — `migrate deploy` then fails with
    // P1002 "Timed out trying to acquire a postgres advisory lock". It only
    // bites sometimes, which makes it worse to diagnose than a hard failure.
    //
    // Set DIRECT_URL to the same connection string with `-pooler` removed from
    // the host. Only the CLI reads this; the app keeps using DATABASE_URL
    // through the Neon adapter, where pooling is what you want.
    url: process.env.DIRECT_URL ? env('DIRECT_URL') : env('DATABASE_URL'),
  },
});
