import { PrismaClient } from '@prisma/client';
import { env } from '@config/env';

// Prevents creating a new PrismaClient (and new connection pool) on every
// hot-reload in development, which otherwise exhausts Postgres connections.
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
