import { PrismaClient } from '@prisma/client';

/**
 * CLI scripts (seed, reset) prefer DIRECT_URL — Neon pooler can fail for writes.
 * Falls back to DATABASE_URL for local Postgres.
 */
export function createScriptPrismaClient() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error('Set DATABASE_URL or DIRECT_URL in .env');
  }

  return new PrismaClient({
    datasources: { db: { url } },
  });
}
