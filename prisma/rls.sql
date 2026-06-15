-- Row-Level Security for The Well Church (Phase 0.3)
-- ---------------------------------------------------------------------------
-- RLS cannot be expressed in schema.prisma, so these statements are folded into
-- the INITIAL migration. Provisioning runbook: after `prisma migrate dev
-- --create-only --name init` generates the table DDL, append the contents of
-- this file to that migration's migration.sql, then `prisma migrate dev` to
-- apply. This keeps RLS versioned in git and reproducible via `migrate deploy`.
--
-- Enforcement model: the app uses Auth.js (not Supabase Auth), so identity is
-- carried in the `app.current_user_id` session GUC, set per request via
-- lib/db.ts `withUser()`. `current_setting(..., true)` returns NULL when unset,
-- so any connection that has NOT set the GUC sees zero protected rows.
--
-- IMPORTANT (provisioning): the application must connect as a dedicated role
-- that is NOT a superuser and does NOT have BYPASSRLS — superusers/BYPASSRLS
-- roles ignore policies entirely. FORCE ROW LEVEL SECURITY below additionally
-- subjects the *table owner* (which the migration role usually is) to policies.
-- Create an app role on Railway, e.g.:
--   CREATE ROLE app_runtime LOGIN PASSWORD '...' NOSUPERUSER NOBYPASSRLS;
--   GRANT SELECT, INSERT, UPDATE ON "members", "transactions" TO app_runtime;
-- and point DATABASE_URL (pooled, app runtime) at it. DIRECT_URL (migrations)
-- may remain the owner/admin role.

ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" FORCE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" FORCE ROW LEVEL SECURITY;

-- A user may read/write only their own member row.
CREATE POLICY members_self_access ON "members"
  USING ("userId" = current_setting('app.current_user_id', true))
  WITH CHECK ("userId" = current_setting('app.current_user_id', true));

-- Transactions are scoped to the member row owned by the current user.
CREATE POLICY transactions_self_access ON "transactions"
  USING (
    "memberId" IN (
      SELECT id FROM "members"
      WHERE "userId" = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    "memberId" IN (
      SELECT id FROM "members"
      WHERE "userId" = current_setting('app.current_user_id', true)
    )
  );

-- NOTE: Staff/Admin/Finance-Admin broad-access policies (admin directory view,
-- finance reporting) are layered in Phase 2.3/2.4 and Phase 3.5 once role
-- context is set in a second GUC (`app.current_user_role`). Phase 0.3 ships
-- self-access only.
