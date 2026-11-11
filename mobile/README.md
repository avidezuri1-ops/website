# Avidezuri Admin Android App

This directory contains the separate Flutter application for Avidezuri administrators.

## Application

- `admin_app/`: administrator sign-in and dashboard foundation for order oversight, order details, status updates, and role-aware access.

The app uses the Avidezuri ivory / beige / gold visual language and remains separate from the customer-facing website.

## Backend security boundary

The current Worker deliberately requires admin login and write requests to originate from a trusted Avidezuri admin website origin. A native Android app does not naturally send that trusted browser Origin. Do not weaken this protection, embed admin credentials, or copy website cookies into the app.

Before enabling native sign-in, design and review a dedicated mobile authentication/session flow with short-lived credentials, device/client controls, and CSRF-safe semantics. Initial app scope is Super Admin only; delegated roles can be considered later. No inventory-management feature is in scope.

## Delivery sequence

1. Build the admin app independently.
2. Review the native authentication design and required backend changes.
3. Use a dedicated preview environment for integration and test data.
4. Run Flutter analysis/tests and test APKs on an Android device.
5. Obtain explicit approval before any production migration, secret/config change, or deployment.

## Safety

- Keep the admin app separate from the live storefront.
- Never point test builds at production order data.
- Never weaken existing Origin, session, or CSRF protections.
- No production deployment, D1 migration, secret change, or live backend modification is authorized by this app foundation.
