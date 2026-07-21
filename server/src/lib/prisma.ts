import { PrismaClient } from '@prisma/client';

// Single shared PrismaClient instance (ts-node-dev restarts the process on
// change, so no need for the usual "global" hot-reload guard here).
export const prisma = new PrismaClient();
