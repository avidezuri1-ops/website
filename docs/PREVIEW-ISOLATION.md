# Isolated Worker Preview

The production Worker keeps its existing `DB` binding to `avidezuri-orders`.
Worker Previews use the separate `avidezuri-preview` database configured under
`previews.d1_databases` in `wrangler.jsonc`.

The preview migration configuration is deliberately separate:
`wrangler.preview-migrations.jsonc` binds only `PREVIEW_DB` to the preview
database. Before testing admin authentication, apply the repository migrations
to that database only:

```sh
npx wrangler d1 migrations apply PREVIEW_DB --remote --config wrangler.preview-migrations.jsonc
```

Verify the displayed database name and ID are `avidezuri-preview` and
`09ad3f01-e071-46d2-ab12-1abf48609593` before confirming the command.

Never use `wrangler.preview-migrations.jsonc` for production. Production
migration and deployment remain separate owner-approved rollout steps.

The admin API accepts the production admin hostname and the current named
Worker Preview hostname (plus Cloudflare's immutable eight-hex deployment
hostnames), but only when the request Origin exactly matches the request URL
origin. Storefront origins remain unchanged.
