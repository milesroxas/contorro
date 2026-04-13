# Studio app

Studio is Next.js + Payload app for CMS/admin/auth and builder-adjacent APIs.

## What lives here

- Payload runtime assembly in `src/payload.config.ts`
- Next app routes in `src/app`
- Builder APIs in:
  - `src/app/api/builder/compositions/[id]/route.ts` (GET/POST/PATCH)
  - `src/app/api/builder/compositions/route.ts` (POST create)
- Builder route mutations orchestrated through `@repo/application-builder` commands
- Same-origin gateway forwarding in `src/app/api/gateway/[[...route]]/route.ts`
- Migrations in `src/migrations`
- Seeds in `src/seeds`
- Integration tests in `tests/int`

Collections and globals definitions do not live in this app. Source of truth is `@repo/infrastructure-payload-config`.

## Local development

From repo root:

1. `pnpm install`
2. `pnpm db:up`
3. `pnpm dev`

Studio runs with gateway in root `dev` command.

## Useful scripts

- `pnpm --filter @repo/studio dev`
- `pnpm --filter @repo/studio build`
- `pnpm --filter @repo/studio exec payload generate:types`
- `pnpm --filter @repo/studio exec payload generate:importmap`
- `pnpm --filter @repo/studio run test:int`
- `pnpm --filter @repo/studio run test:e2e`

## Guardrails

- Use Postgres adapter (`@payloadcms/db-postgres`) only.
- Pass `overrideAccess: false` when Local API call includes `user`.
- Pass `req` for nested Local API operations inside hooks.
- Keep business/domain rules in `packages/domains/*` and mutation orchestration in `packages/application/*`.
