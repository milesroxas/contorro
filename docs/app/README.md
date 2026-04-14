# Contorro implementation map

This document maps what is currently implemented in the repo.

## Apps

- **CMS app** (`apps/studio`, npm **`@repo/cms`**): Next.js 16 + Payload 3. Hosts admin UI, auth/session, Payload migrations/seeds, **Studio-facing HTTP APIs** under `/api/builder/*` (composition load/save), REST for collections/globals used by the design-system editor, preview routes, and same-origin **gateway** forwarding (`/api/gateway/*`).
- **`apps/gateway`**: Hono app. Exposes `/api/gateway/health`, `/api/gateway/contracts/*`, and a **`/api/gateway/builder/*` namespace** where composition mutations are intentionally **`NOT_IMPLEMENTED`** (canonical mutations go through the CMS app’s `/api/builder/*` routes).

## Package groups

- `packages/kernel`: shared `Result`/error primitives.
- `packages/domains/*`: business/domain logic (`composition`, `design-system`, `publishing`, `runtime-catalog`, `user-access`).
- `packages/application/*`: command/query services (`builder`, `design-system`, `publish-flow`, `contract-sync`).
- `packages/infrastructure/*`: adapters and config (`payload-config`, `persistence`, `blob-storage`, `event-bus`, `telemetry`, `cache`).
- `packages/presentation/*`: UI packages — **`@repo/presentation-studio`** (visual Studio: compositions + design-system screens), `preview-ui`, `admin-extensions`, `shared`.
- `packages/runtime/*`: runtime renderers/primitives/code-components.
- `packages/contracts/*`: Zod + JSON-schema contracts (includes **`StudioAuthoringClient`** for CMS-agnostic Studio ↔ host transport types).
- `packages/config/*`: env parsing + Tailwind token compiler.

## Payload source of truth

- Collections: `packages/infrastructure/payload-config/src/collections/index.ts`
- Globals: `packages/infrastructure/payload-config/src/globals/index.ts`
- Payload assembly: `apps/studio/src/payload.config.ts`
- Migrations: `apps/studio/src/migrations`

Current collections include `pages`, `users`, `media`, `design-token-sets`, `components`, `page-compositions`, `release-snapshots`, `publish-jobs`, `catalog-activity`, `composition-presence`.

## Studio (presentation) vs CMS (host)

- **`@repo/presentation-studio`** implements the **visual Studio** (e.g. `BuilderApp`, design-system editor). It does **not** import Payload or other CMS SDKs. It talks to the host only via **`StudioAuthoringClient`** (`packages/contracts/zod`) — default implementation: `packages/presentation/studio/src/lib/fetch-studio-authoring-client.ts` (fetch to same-origin routes).
- **`@repo/cms`** wires Payload and Next routes; route handlers implement the HTTP contract expected by `StudioAuthoringClient` (application commands + Payload repository adapters — not the interface type itself, which is browser-side).

## Composition API and mutations

- **Canonical HTTP API** for the Studio UI: `/api/builder/compositions/*` (implemented in the CMS app).
  - `apps/studio/src/app/api/builder/compositions/[id]/route.ts` — GET/POST/PATCH
  - `apps/studio/src/app/api/builder/compositions/route.ts` — POST create
- **Mutation orchestration**: `packages/application/builder/src/commands/*`
- **Persistence adapter (Payload)**: `apps/studio/src/app/api/builder/_lib/payload-builder-mutation-repository.ts`
- **Domain graph**: `packages/domains/composition/src`
- **Runtime render/style**: `packages/runtime/renderer/src`

Design-system editing in Studio uses Payload **REST** for `design-token-sets` and `design-system-settings` globals; those calls are also abstracted behind **`StudioAuthoringClient`** in the browser (same default fetch client, `resourceApiBase` default `/api`).

## Gateway routes

- Gateway app entry: `apps/gateway/src/app.ts`
- Builder-namespace file: `apps/gateway/src/routes/builder.ts`
- Composition mutations stub: `apps/gateway/src/routes/composition-mutations.ts` (`NOT_IMPLEMENTED` by design)
- Contracts: `apps/gateway/src/routes/contracts.ts`
- **Forwarder** (CMS app): `apps/studio/src/app/api/gateway/[[...route]]/route.ts`

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

- `NEXT_PUBLIC_STUDIO_COMPOSITION_API_BASE` — default `/api/builder`
- `NEXT_PUBLIC_STUDIO_RESOURCE_API_BASE` — default `/api` (design token sets + globals)
