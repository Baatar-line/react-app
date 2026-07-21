// Shared PrismaClient singleton. Prisma 7 no longer accepts a `url` in the
// schema's datasource block (runtime connections go through a driver
// adapter instead) — PrismaNeon matches the hosted Neon Postgres this app
// already uses, and its pooled/HTTP-friendly driver works well from
// Vercel's serverless functions.
import { PrismaClient } from '../generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Next.js dev-mode hot-reload re-evaluates modules on every change — without
// stashing the client on `globalThis`, each reload would spin up a fresh
// connection pool and eventually exhaust the database's connection limit.
export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
