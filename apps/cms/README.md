# CMS app (`@repo/cms`)

This app is the **Next.js + Payload** host: admin UI, auth, content API, and the **HTTP surface** consumed by `@repo/presentation-studio` via `StudioAuthoringClient`. Composition mutations are orchestrated with `@repo/application-studio` + Payload adapters in route handlers; design-token sets and design-system globals are served through Payload REST endpoints.

The workspace folder is `apps/cms`; the npm package name is **`@repo/cms`**.

## What lives here

- Payload runtime assembly: `src/payload.config.ts`
- Next app routes: `src/app`
- **Composition API** (canonical for `@repo/presentation-studio`):
  - `src/app/api/studio/compositions/[id]/route.ts` (GET/POST/PATCH)
  - `src/app/api/studio/compositions/route.ts` (POST create)
- Route handlers orchestrate; mutations use **`@repo/application-studio`** commands and the Payload repository adapter.
- Same-origin gateway forwarding: `src/app/api/gateway/[[...route]]/route.ts`
- Migrations: `src/migrations`
- Seeds: `src/seeds`
- Integration tests: `tests/int`

Collection/global **definitions** live in **`@repo/infrastructure-payload-config`**, not duplicated here.

## Visual Studio (presentation package)

Authoring UI is **`@repo/presentation-studio`** (`packages/presentation/studio`). It is mounted at the first-class Next route **`/studio`** (see `app/(studio)/`) with its own layout/CSS, and uses **`StudioAuthoringClient`** + `fetch-studio-authoring-client` to call this app’s routes — not Payload Local API from the browser. The admin sidebar links here via custom components (e.g. `StudioNavLink`).

## Local development

From repo root:

1. `pnpm install`
2. `pnpm db:up`
3. `pnpm dev`

Root `pnpm dev` runs the CMS app, `@repo/presentation-studio` watch, `@repo/presentation-admin-extensions` watch, `@repo/infrastructure-payload-config` watch, and gateway.

## Useful scripts

- `pnpm --filter @repo/cms dev`
- `pnpm --filter @repo/cms build`
- `pnpm --filter @repo/cms run generate:types`
- `pnpm --filter @repo/cms run generate:importmap`
- `pnpm --filter @repo/cms run test:int`
- `pnpm --filter @repo/cms run test:e2e`

## Guardrails

- Use Postgres adapter (`@payloadcms/db-postgres`) only.
- Pass `overrideAccess: false` when Local API call includes `user`.
- Pass `req` for nested Local API operations inside hooks.
- Keep business rules in `packages/domains/*` and mutation orchestration in `packages/application/*`.
