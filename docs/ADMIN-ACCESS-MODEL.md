# Avidezuri administrator access model

Phase 2 introduces individual administrator identities. This document is the authorization contract for the implementation.

## Roles

| Role | Default access |
| --- | --- |
| Super Admin | Full access, administrator lifecycle, permission assignment, security settings and audit log |
| Order Manager | Read and update orders; view customer and delivery details needed to fulfil orders |
| Product Manager | Read and manage catalogue entries, prices and product photos |
| Inventory Manager | Read and manage stock and stock movements |
| Analyst | Read-only reports and aggregate business metrics |

## Security invariants

- Every administrator has an individual account; shared credentials are not used.
- Authorization is enforced in the Worker for every protected API route. Hiding a screen or button is never authorization.
- Only Super Admin can create, activate, deactivate or reset another administrator, change roles, or grant/revoke permission overrides.
- An administrator cannot change their own role or elevate their own permissions.
- Super Admin-only permissions cannot be granted to another role through an override.
- Passwords are stored only as salted PBKDF2-HMAC-SHA-256 hashes; plaintext passwords are never stored or logged.
- Sessions are signed, time-limited, HttpOnly and Secure. Account activation and session-version changes are checked server-side so deactivation and password resets revoke existing sessions.
- State-changing admin requests require the trusted admin origin and a CSRF token.
- Login attempts are throttled. Authentication failures do not reveal whether an email account exists.
- Administrator creation, activation/deactivation, role/permission changes, password resets and sensitive admin actions are written to the audit log.
- Audit entries must not contain passwords, password hashes, session tokens, customer addresses or unnecessary personal data.

## Initial Super Admin bootstrap

The first Super Admin is provisioned from the existing Worker secrets only when the administrator table is empty and a login matches the configured legacy admin email and password. The Worker must immediately hash the password and insert the account. Subsequent logins use the database hash. The legacy secrets remain a recovery/compatibility dependency until a separately approved cleanup.

## Migration and rollout safety

Migration `0003_admin_accounts.sql` is additive and does not alter existing orders, products, pricing, delivery zones or order history. It must be applied only after the owner approves a production rollout and a verified D1 backup exists. The code and schema must be deployed together; do not deploy the new authentication code against a database where this migration has not been applied.

No remote migration, secret change or production deployment is authorized by this document.

\n## Isolated Cloudflare preview environment

- The production/default Worker environment remains bound to `avidezuri-orders`.
- The named Wrangler `preview` environment binds `DB` only to the separate `avidezuri-preview` database.
- Deploy preview builds with `npm run deploy:preview`; keep production deployments on `npm run deploy`.
- Configure the Cloudflare Workers Builds preview deployment command to use `npm run deploy:preview` and the production deployment command to use `npm run deploy`. Do not use the production command for branch previews.
- The preview origin is explicitly allowlisted only in the preview environment. Production does not trust the preview hostname.
- API requests on non-production Avidezuri hostnames fail closed unless the Worker has the explicit `APP_ENV=preview` flag. This prevents a branch preview accidentally deployed with the default production binding from reading or changing production data.
- Apply the additive migrations to the preview database first and verify the preview DB binding before attempting any admin login. This repository change does not apply migrations or deploy either environment.
- Before merge, verify the Cloudflare branch-preview workflow actually invokes the preview command and points at the preview Worker. If the Cloudflare dashboard is configured to run a different command, update that setting before testing.
