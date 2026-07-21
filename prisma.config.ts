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
    url: env('DATABASE_URL'),
  },
});
