# Contorro implementation map

This document maps what is currently implemented in repo.

## Apps

- `apps/studio`: Next.js 16 + Payload 3 app. Hosts admin UI, auth/session, Payload migrations/seeds, builder APIs (`/api/builder/*`), preview APIs, and same-origin gateway forwarding route (`/api/gateway/*`).
- `apps/gateway`: Hono app for gateway endpoints. Exposes `/api/gateway/health`, `/api/gateway/contracts/*`, and builder namespace routes where composition mutations are intentionally `NOT_IMPLEMENTED`.

## Package groups

- `packages/kernel`: shared `Result`/error primitives.
- `packages/domains/*`: business/domain logic (`composition`, `design-system`, `publishing`, `runtime-catalog`, `user-access`).
- `packages/application/*`: command/query services (`builder`, `design-system`, `publish-flow`, `contract-sync`).
- `packages/infrastructure/*`: adapters and config (`payload-config`, `persistence`, `blob-storage`, `event-bus`, `telemetry`, `cache`).
- `packages/presentation/*`: UI packages (`builder-ui`, `preview-ui`, `admin-extensions`, `shared`).
- `packages/runtime/*`: runtime renderers/primitives/code-components.
- `packages/contracts/*`: zod + json-schema contracts.
- `packages/config/*`: env parsing + tailwind token compiler.

## Payload source of truth

- Collections: `packages/infrastructure/payload-config/src/collections/index.ts`
- Globals: `packages/infrastructure/payload-config/src/globals/index.ts`
- Studio assembly: `apps/studio/src/payload.config.ts`
- Migrations: `apps/studio/src/migrations`

Current collections include `pages`, `users`, `media`, `design-token-sets`, `components`, `page-compositions`, `release-snapshots`, `publish-jobs`, `catalog-activity`, `composition-presence`.

## Composition and builder flow

- Builder UI entry: `packages/presentation/builder-ui/src/app/BuilderApp.tsx`
- Builder client API: `packages/presentation/builder-ui/src/lib/builder-api.ts`
- Canonical persist API: `apps/studio/src/app/api/builder/compositions/[id]/route.ts`
- Domain graph/mutations: `packages/domains/composition/src`
- Runtime render/style resolution: `packages/runtime/renderer/src`

## Gateway routes

- App composition: `apps/gateway/src/app.ts`
- Builder route namespace: `apps/gateway/src/routes/builder.ts`
- Composition mutation router: `apps/gateway/src/routes/composition-mutations.ts` (`NOT_IMPLEMENTED` by design)
- Contracts routes: `apps/gateway/src/routes/contracts.ts`
- Studio forwarding route: `apps/studio/src/app/api/gateway/[[...route]]/route.ts`

## Root commands

- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Integration tests: `pnpm test`
- E2E tests: `pnpm test:e2e`
- DB up: `pnpm db:up`
- Migrations: `pnpm migrate`, `pnpm migrate:create`
- Seed: `pnpm seed`
