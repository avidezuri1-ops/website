# E-commerce foundation safety

This repository powers the Avidezuri storefront and order-management Worker. Production data, credentials, domains, and deployment settings require explicit owner approval.

## Safe workflow
1. Work on a feature branch and open a pull request against main.
2. Run automated tests and a Wrangler dry-run check.
3. Review the preview and manually test affected customer/admin flows.
4. Merge only after owner approval.
5. Deploy only through the configured Cloudflare workflow after separate approval.

## Production safeguards
- Do not deploy from local verification or CI.
- Do not apply remote D1 migrations during development.
- Do not edit production secrets, domains, DNS, or Cloudflare build settings in this PR.
- Do not rewrite or delete existing orders, items, or status history.
- Treat customer names, phone numbers, addresses, and notes as confidential.

## Verification commands
Run `npm install`, `npm test`, `npm run check:config`, and `npm run dev` with Node.js 22 or newer. The config check must use Wrangler dry-run mode and must not deploy.

## Current system
- Worker: `src/index.js`
- Static assets: `public/`
- D1 binding: `DB`
- Database name in Wrangler config: `avidezuri-orders`
- Migrations: `migrations/`
- Checkout stores order and line-item snapshots in D1 before WhatsApp handoff.
- Storefront JS and D1 seed data carry per-product price tiers. The global `store_price_policy` table conflicts with this approach and must not be treated as authoritative until the owner confirms pricing policy.

## Follow-up work
- Confirm one authoritative catalogue pricing source.
- Add idempotency protection for repeated checkout submissions.
- Add database-backed admin accounts and server-enforced roles.
- Add login throttling and dedicated CSRF protection.
- Add inventory and stock movement history.
- Add verified customer order tracking.
- Replace browser-limited dashboard totals with database aggregates.

## Before any future database migration
Verify the Cloudflare account, Worker and D1 database; confirm remote migration history; take and verify a recoverable backup; test against an isolated database; and obtain explicit owner approval before applying a remote migration.
