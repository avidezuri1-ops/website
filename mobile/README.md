# Avidezuri Android Apps

This directory is an isolated mobile-app workspace. It does not change the Cloudflare Worker, storefront assets, D1 schema, production secrets, domains, or deployment configuration.

## Separate applications

- `customer_app/`: customer shopping app (catalogue, product details, cart, Karachi delivery selection, COD checkout, WhatsApp handoff, and order tracking).
- `admin_app/`: administrator app (secure sign-in, order dashboard, order details, status updates, and role-aware access).

Both apps use Flutter and share the Avidezuri ivory / beige / gold visual language, but they are separate installable Android applications with separate package IDs and app icons.

## Existing backend integration

The current Worker is the source of truth for orders and admin permissions.

Customer-facing endpoints confirmed in the current Worker:
- `GET /api/health`
- `POST /api/orders`
- `GET /api/track-order?number=ADZ...`

Admin endpoints confirmed in the current Worker:
- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/admin/analytics`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `PATCH /api/admin/orders/:id/status`
- Super Admin account and audit endpoints.

## Integration gate before enabling mobile admin sign-in

The current Worker deliberately requires admin write/login requests to originate from a trusted Avidezuri admin website origin. A native Android app does not naturally send that trusted browser Origin. Do not weaken this protection or embed admin credentials in the app. A separately reviewed backend change is required before the admin app can authenticate safely (for example, a mobile-specific, short-lived token/session exchange with explicit device/client controls and CSRF-safe semantics).

The customer checkout endpoint also currently requires the Avidezuri website Origin. Before enabling native-app checkout, add and test an explicit mobile client path with server-side validation, abuse controls, and idempotency. Do not bypass origin checks in the app.

## Delivery sequence

1. Build both Flutter app shells independently.
2. Port the exact catalogue, size tiers, prices, delivery areas, and product imagery from the current storefront.
3. Implement customer catalogue, cart, COD checkout, WhatsApp handoff, and tracking against a dedicated test environment.
4. Design the admin experience; implement sign-in only after the backend mobile-auth gate is reviewed and approved.
5. Run Flutter analysis/tests and test APKs on Android devices.
6. Owner reviews both apps and test results.
7. Google Play preparation is a separate release step.

## Safety

- Work only on the `feature/android-apps-foundation` branch until reviewed.
- Never point test builds at production order data.
- No production deployment, D1 migration, secret change, or live backend modification is authorized by this mobile foundation.
