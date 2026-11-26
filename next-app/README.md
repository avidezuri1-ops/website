# Avidezuri Next.js foundation (isolated)

This directory is a separate Next.js 16 + React + TypeScript foundation for the Avidezuri redesign.

## Safety boundaries

- This app is isolated under `next-app/`; the existing production storefront and Worker entry point remain unchanged.
- Its Wrangler configuration uses the distinct Worker name `avidezuri-next-preview`.
- The Next.js preview Worker is bound only to the separate `avidezuri-preview` D1 database. It does not use the production `avidezuri-orders` database.
- The preview deploy workflow is manual-only (`workflow_dispatch`) and targets only the `avidezuri-next-preview` Worker on `workers.dev`.
- The preview workflow requires GitHub Environment secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`; it does not read or use production credentials.
- The preview Worker has no custom domain or production route. Keep its D1 binding pointed only at `avidezuri-preview`.
- Preview checkout writes test orders only to the isolated preview database using the `/api/orders` route. It never calls the production order API or sends WhatsApp messages.
- Apply the isolated preview database migrations using the manual `Apply isolated preview D1 migrations` GitHub Actions workflow before testing checkout. This workflow targets only `avidezuri-preview`.
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
3. Connect preview checkout to an isolated preview database and validate order creation.
4. Migrate admin routes while preserving the current authentication and permission model.
5. Migrate the admin routes while preserving the current authentication and permission model.
6. Test against isolated preview services and data.
7. Plan a separately reviewed production cutover only after explicit approval.
