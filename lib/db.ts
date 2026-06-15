import { PrismaClient } from '@prisma/client';

// Prisma client singleton. In dev, Next.js HMR re-imports modules repeatedly;
// caching the client on globalThis prevents exhausting the connection pool.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Run a callback with the Postgres RLS session GUC `app.current_user_id` set to
 * the given user id, inside a single transaction. Row-Level Security policies on
 * `members` and `transactions` (see prisma/rls.sql) read this GUC to scope access
 * to the current user's own rows. Use this for all member-context data access;
 * queries run outside it (with no GUC set) see no RLS-protected rows by design.
 *
 * Wired into request handling once auth lands in Phase 0.4.
 */
export async function withUser<T>(
  userId: string,
  fn: (
    tx: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // set_local scopes the GUC to this transaction only. Parameterized to avoid
    // injection — cuid ids are safe, but never interpolate identity into SQL.
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return fn(tx);
  });
}
