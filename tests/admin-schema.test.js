import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(new URL("../migrations/0003_admin_accounts.sql", import.meta.url), "utf8");
const policy = await readFile(new URL("../docs/ADMIN-ACCESS-MODEL.md", import.meta.url), "utf8");
const wrangler = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
const previewMigrations = JSON.parse(await readFile(new URL("../wrangler.preview-migrations.jsonc", import.meta.url), "utf8"));

test("admin migration creates isolated identity, permission, audit and throttle tables", () => {
  for (const table of ["admin_users", "admin_permission_overrides", "admin_audit_log", "admin_login_attempts"]) {
    assert.ok(migration.includes("CREATE TABLE IF NOT EXISTS " + table), "missing " + table);
  }
});

test("admin identities enforce unique email, supported roles and active state", () => {
  assert.match(migration, /email TEXT NOT NULL COLLATE NOCASE UNIQUE/);
  assert.match(migration, /'super_admin'.*'order_manager'.*'product_manager'.*'inventory_manager'.*'analyst'/s);
  assert.match(migration, /is_active INTEGER NOT NULL DEFAULT 1 CHECK \(is_active IN \(0,1\)\)/);
});

test("permission overrides and audit entries are tied to admin identities", () => {
  assert.match(migration, /admin_id INTEGER NOT NULL REFERENCES admin_users\(id\) ON DELETE CASCADE/);
  assert.match(migration, /actor_admin_id INTEGER REFERENCES admin_users\(id\) ON DELETE SET NULL/);
  assert.match(migration, /target_admin_id INTEGER REFERENCES admin_users\(id\) ON DELETE SET NULL/);
});

test("access policy protects account administration and requires server-side authorization", () => {
  for (const phrase of [
    "Only Super Admin can create",
    "Authorization is enforced in the Worker",
    "An administrator cannot change their own role",
    "Passwords are stored only as salted PBKDF2",
    "State-changing admin requests require",
    "No remote migration, secret change or production deployment is authorized"
  ]) assert.ok(policy.includes(phrase), "missing policy: " + phrase);
});

test("Worker Previews use preview-only environment variables and the isolated D1 database", () => {
  assert.equal(wrangler.previews.vars.APP_ENV, "preview");
  assert.equal(wrangler.previews.d1_databases.length, 1);
  assert.deepEqual(
    { binding: wrangler.previews.d1_databases[0].binding, name: wrangler.previews.d1_databases[0].database_name, id: wrangler.previews.d1_databases[0].database_id },
    { binding: "DB", name: "avidezuri-preview", id: "09ad3f01-e071-46d2-ab12-1abf48609593" }
  );
  assert.equal(wrangler.d1_databases.length, 1);
  assert.deepEqual(
    { binding: wrangler.d1_databases[0].binding, name: wrangler.d1_databases[0].database_name, id: wrangler.d1_databases[0].database_id },
    { binding: "DB", name: "avidezuri-orders", id: "1bb50c92-8f5f-4414-abfa-fd13081ae84b" }
  );
  assert.notEqual(wrangler.previews.d1_databases[0].database_id, wrangler.d1_databases[0].database_id);
});

test("preview migration command targets the same isolated database through PREVIEW_DB", () => {
  assert.equal(previewMigrations.d1_databases.length, 1);
  assert.deepEqual(
    { binding: previewMigrations.d1_databases[0].binding, name: previewMigrations.d1_databases[0].database_name, id: previewMigrations.d1_databases[0].database_id },
    { binding: "PREVIEW_DB", name: wrangler.previews.d1_databases[0].database_name, id: wrangler.previews.d1_databases[0].database_id }
  );
});
