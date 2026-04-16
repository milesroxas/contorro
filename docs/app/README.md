# Contorro implementation map

This document maps what is currently implemented in the repo.

## Apps

- **CMS app** (`apps/cms`, npm **`@repo/cms`**): Next.js 16 + Payload 3. Hosts admin UI, auth/session, Payload migrations/seeds, the **Studio** surface at **`/studio`** (separate from `/admin`), **Studio-facing HTTP APIs** under `/api/studio/*` (composition load/save), REST for collections/globals used by the design-system editor, preview routes, and same-origin **gateway** forwarding (`/api/gateway/*`).
- **`apps/gateway`**: Hono app. Exposes `/api/gateway/health`, `/api/gateway/contracts/*`, and a **`/api/gateway/studio/*` namespace** where composition mutations are intentionally **`NOT_IMPLEMENTED`** (canonical mutations go through the CMS app’s `/api/studio/*` routes).

## Package groups

- `packages/kernel`: shared `Result`/error primitives.
- `packages/domains/*`: business/domain logic (`composition`, `design-system`, `publishing`, `runtime-catalog`, `user-access`).
- `packages/application/*`: command/query services (`studio`, `design-system`, `publish-flow`, `contract-sync`).
- `packages/infrastructure/*`: adapters and config (`payload-config`, `blob-storage`, `event-bus`, `telemetry`, `cache`).
- `packages/presentation/*`: UI packages — **`@repo/presentation-studio`** (visual Studio: compositions + design-system screens), `preview-ui`, `admin-extensions`, `shared`.
- `packages/runtime/*`: runtime renderers/primitives/code-components.
- `packages/contracts/*`: Zod + JSON-schema contracts (includes **`StudioAuthoringClient`** for CMS-agnostic Studio ↔ host transport types).
- `packages/config/*`: env parsing + Tailwind token compiler.

## Payload source of truth

- Collections: `packages/infrastructure/payload-config/src/collections/index.ts`
- Globals: `packages/infrastructure/payload-config/src/globals/index.ts`
- Payload assembly: `apps/cms/src/payload.config.ts`
- Migrations: `apps/cms/src/migrations`

Current collections include `pages`, `users`, `media`, `design-token-sets`, `components`, `page-compositions`, `release-snapshots`, `publish-jobs`, `catalog-activity`, `composition-presence`.

## Studio (presentation) vs CMS (host)

- **`@repo/presentation-studio`** implements the **visual Studio** (e.g. `StudioApp`, design-system editor). It does **not** import Payload or other CMS SDKs. It talks to the host only via **`StudioAuthoringClient`** (`packages/contracts/zod`) — default implementation: `packages/presentation/studio/src/lib/fetch-studio-authoring-client.ts` (fetch to same-origin routes).
- **`@repo/cms`** wires Payload and Next routes; composition endpoints are explicit route handlers (application commands + Payload repository adapter), while design-system resources are served by Payload REST endpoints consumed by the same `StudioAuthoringClient`.

## Composition API and mutations

- **Canonical HTTP API** for the Studio UI: `/api/studio/compositions/*` (implemented in the CMS app).
  - `apps/cms/src/app/api/studio/compositions/[id]/route.ts` — GET/POST/PATCH
  - `apps/cms/src/app/api/studio/compositions/route.ts` — POST create
- **Mutation orchestration**: `packages/application/studio/src/commands/*`
- **Persistence adapter (Payload)**: `apps/cms/src/app/api/studio/_lib/payload-studio-mutation-repository.ts`
- **Domain graph**: `packages/domains/composition/src`
- **Runtime render/style**: `packages/runtime/renderer/src`

Design-system editing in Studio uses Payload **REST** for `design-token-sets` and `design-system-settings` globals; those calls are also abstracted behind **`StudioAuthoringClient`** in the browser (same default fetch client, `resourceApiBase` default `/api`).

## Gateway routes

- Gateway app entry: `apps/gateway/src/app.ts`
- Studio-namespace file: `apps/gateway/src/routes/studio.ts`
- Composition mutations stub: `apps/gateway/src/routes/composition-mutations.ts` (`NOT_IMPLEMENTED` by design)
- Contracts: `apps/gateway/src/routes/contracts.ts`
- **Forwarder** (CMS app): `apps/cms/src/app/api/gateway/[[...route]]/route.ts`

## Root commands

- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Integration tests: `pnpm test` (CMS app int suite)
- E2E tests: `pnpm test:e2e`
- DB up: `pnpm db:up`
- Migrations: `pnpm migrate`, `pnpm migrate:create`
- Seed: `pnpm seed`

## Optional env (CMS app / Next)

Studio’s fetch client can be aimed at different path prefixes without code changes:

- `NEXT_PUBLIC_STUDIO_COMPOSITION_API_BASE` — default `/api/studio`
- `NEXT_PUBLIC_STUDIO_RESOURCE_API_BASE` — default `/api` (design token sets + globals)
