# Avidezuri mobile integration audit and secure checkout plan

## Scope

This is a design-only plan for the separate Flutter customer and admin Android apps. It does not change the Worker, D1 databases, secrets, domains, production configuration, or storefront behavior.

## Audit findings (main branch)

### Customer catalogue assets

- The Flutter catalogue contains 22 fragrances.
- The repository contains 22 corresponding PNG files under `public/images/`.
- The app builds image paths as `https://avidezuri.com/images/<slug>.png`, matching the repository's public asset path convention.
- The apostrophe normalization for `DE ALEE’SHA` produces `de-aleesha`, matching `public/images/de-aleesha.png`.
- The app uses an `Image.network` error builder, so a failed image request falls back to a spa icon rather than breaking the product card.
- Repository presence confirms the source assets exist; it does not prove that every asset is currently served correctly by the live production deployment. Live URL verification remains a release check.

### Karachi delivery zones

The Flutter app and `migrations/0002_seed_catalog.sql` contain the same 36 Karachi area names and fees:
- Rs 200: 12 areas
- Rs 300: 14 areas
- Rs 400: 10 areas

The app's delivery selection is therefore consistent with the repository's seed data. At checkout, the Worker must remain authoritative: it looks up the selected city/area in D1 and calculates the delivery fee server-side. The app must never be trusted to submit its own fee or total.

### Current order API constraints

- `POST /api/orders` currently accepts only requests whose Origin is exactly `https://avidezuri.com` or `https://www.avidezuri.com`.
- The Worker validates JSON content type and request size, customer fields, line count, product slug, size, quantity, active product state, current D1 prices, and active delivery zone.
- The server calculates subtotal, delivery fee, and total, then writes the order and line items.
- The current order creation path has no visible idempotency-key handling or per-IP/device order-creation rate limit.
- The admin login and mutation routes separately enforce trusted admin-origin checks and session/CSRF protections. These must not be weakened for the native admin app.

## Recommended customer mobile COD design

Do not add an Origin exception and do not embed a shared API secret in the Flutter binary. A native app binary is inspectable and any static secret can be extracted. Origin/CORS checks are browser controls, not proof that a request came from a genuine app.

Before implementation, agree a dedicated mobile order-submission flow, for example `POST /api/mobile/orders`, with these controls:

1. **Reuse server-side business rules.** Share the existing order validation and pricing logic so both website and mobile orders use current D1 product prices and delivery-zone fees. The client sends product slug, size, quantity, customer details, and area only; it does not supply trusted prices, fees, totals, order status, or payment status.
2. **Idempotency.** Require a random per-checkout idempotency key. Store it with the created order under a unique database constraint so retries/timeouts cannot create duplicate COD orders. Return the original order result for a valid replay.
3. **Abuse controls.** Add server-side rate limits for order attempts using IP and a privacy-conscious app/device signal, request size limits, strict field validation, and monitoring. Do not rely on a client-side delay or a hard-coded app key.
4. **App integrity (release phase).** Before enabling broad public native checkout, evaluate Google Play Integrity verification on the Worker side, including server-verified request binding/nonce, package identity, signing certificate, and app-recognition verdict. Keep a controlled internal-testing mode for APK testing; do not treat an unverified debug APK as production-authenticated.
5. **Operational safety.** Use only the `avidezuri-preview` D1 binding and a preview Worker for end-to-end tests. Never point test orders at `avidezuri-orders`. Add tests for invalid product/size/quantity, inactive delivery area, price changes, duplicate submissions, rate limits, and failed D1 writes.
6. **Customer confirmation.** Only show an order-confirmed screen after the Worker returns a saved order number. WhatsApp can remain an optional follow-up, not the source of truth.

## Admin app authentication boundary

The admin app remains a separate app. Do not reuse website cookies by copying them into the app, embed admin credentials, disable Origin checks, or expose admin endpoints without authentication. A dedicated native admin authentication/session design must be reviewed separately. Initial app scope remains Super Admin only, as previously requested; future delegated roles can be added later. No inventory-management feature is in scope.

## Proposed implementation sequence

1. Verify production image URLs and app preview rendering without modifying production.
2. Add a preview-only mobile order endpoint and idempotency/rate-limit schema behind a separate PR, after approval of the design.
3. Run automated tests against `avidezuri-preview`, then test a complete COD order with a clearly identified test customer/order.
4. Review the admin app's separate authentication design.
5. Build signed internal APKs and test on a physical Android device.
6. Request explicit approval before any production migration, secret/config change, or deployment.

## Explicit non-goals

- No production Worker or D1 changes in this audit.
- No weakening of existing Origin, session, or CSRF protections.
- No shared secrets embedded in mobile apps.
- No inventory-management system.
- No production deployment without explicit approval.
