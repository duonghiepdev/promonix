# Promonix Discounts

Embedded Shopify app: TypeScript/React Router, Polaris Web Components, PostgreSQL/Prisma session storage, and a Rust Discount Function.

## Requirements

Node >=22.12, pnpm 10.12.1, Shopify CLI 5, PostgreSQL 16+, Rust stable with wasm32-unknown-unknown.
On Windows, install Visual Studio Build Tools with C++ desktop tools and Windows SDK.

## Local setup

```powershell
pnpm install --frozen-lockfile
Copy-Item .env.example .env
shopify app env pull --config promonix-discount-dev
# Set DATABASE_URL in .env to your PostgreSQL connection.
pnpm setup
rustup target add wasm32-unknown-unknown
pnpm dev --store promonix-development.myshopify.com
```

Root `.env` is authoritative. `pnpm setup` and `pnpm dev` copy it to the admin workspace without logging values. Both files are ignored by Git. CLI supplies its HTTPS tunnel URL to the dev process. Leave the CLI running while using the embedded app.

App: Promonix Discount, organization App.
Dev store: promonix-development.myshopify.com (test data only).
Default config: shopify.app.promonix-discount-dev.toml.

## Test the discount

1. Open the preview URL printed by `pnpm dev`; install the app if prompted.
2. In Promonix, create a discount with percentage 10 and minimum quantity 3.
3. Add two items to the test cart: no discount.
4. Increase total quantity to three: all cart lines receive 10% off.
5. Disable/delete the test discount in Shopify Admin > Discounts afterwards.

Rules are JSON in the discount metafield `$app:promonix / discount-config`.
Missing or invalid rules return no discount. The Function uses total cart quantity and the PRODUCT discount class. It performs no network calls and does not grant free shipping. The merchant form validates title, percentage and quantity before calling GraphQL.

## Checks

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm function:build
pnpm function:test
```

For browser smoke tests, start the production server in another terminal:

```powershell
pnpm --filter @promonix/admin start
# In a second terminal (Chrome installed):
pnpm test:browser
```

`GET /health` checks PostgreSQL. Browser tests cover the landing page, health endpoint and rejection of unsigned webhooks. They do not replace authenticated Shopify Admin/checkout tests.

## Layout

- apps/admin/app: admin UI, authentication, health and verified webhook routes
- apps/admin/prisma: PostgreSQL session schema and migration
- extensions/promonix-discount: Rust, schema and WASM fixture tests
- scripts/sync-env.mjs: environment sync
- tests/browser: browser smoke tests

OAuth/session handling follows Shopify's official React Router template, including document security headers and auth error boundaries. Uninstall deletes shop sessions; scope updates refresh session scopes. Raw webhook payloads and access tokens are not logged.

## Deployment

`pnpm deploy` releases Shopify configuration and extensions; it does not host the Node server. Before releasing with webhook subscriptions, host the server and set a real HTTPS application_url and matching auth redirects. The Shopify default app URL is only a placeholder; local previews use the CLI tunnel. Never use a temporary tunnel as a permanent production URL.

Redis/workers are deferred until background processing is needed.
