# Avidezuri Next.js foundation (isolated)

This directory is a separate Next.js 16 + React + TypeScript foundation for the Avidezuri redesign.

## Safety boundaries

- This app is isolated under `next-app/`; the existing production storefront and Worker entry point remain unchanged.
- Its Wrangler configuration uses the distinct Worker name `avidezuri-next-preview`.
- No D1 binding, production database ID, secrets, custom domain, routes, or production environment configuration is included.
- There is intentionally no deploy script in this foundation PR.
- The current landing page is design scaffolding only. It does not connect to orders, products, checkout, WhatsApp, admin authentication, or customer data.
- Do not add production credentials or connect the production D1 database during preview work.

## Local development

From this directory:

```bash
npm install
npm run dev
```

Type-check:

```bash
npm run typecheck
```

Build and preview in the Cloudflare Workers runtime:

```bash
npm run preview
```

The preview command builds and runs a local Wrangler preview. It does not deploy the Worker.

## Next migration stages

1. Validate this isolated foundation and preview.
2. Port the visual design and existing product assets.
3. Integrate existing product and order APIs without changing their data model.
4. Migrate admin routes while preserving the current authentication and permission model.
5. Test against isolated preview services and data.
6. Plan a separately reviewed production cutover only after explicit approval.
