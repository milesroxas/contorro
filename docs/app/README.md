# Contorro implementation map

This document maps what is currently implemented in the repo.

## Apps

- **CMS app** (`apps/cms`, npm **`@repo/cms`**): Next.js 16 + Payload 3. Hosts admin UI, auth/session, Payload migrations/seeds, the **Studio** surface at **`/studio`** (separate from `/admin`), **Studio-facing HTTP APIs** under `/api/studio/*` (composition load/save), REST for collections/globals used by the design-system editor, preview routes, and same-origin **gateway** forwarding (`/api/gateway/*`).
- **`apps/gateway`**: Hono app. Exposes `/api/gateway/health` and `/api/gateway/contracts/*` (composition mutations go through the CMS app’s `/api/studio/*` routes only).

## Package groups

- `packages/kernel`: shared `Result`/error primitives.
- `packages/domains/*`: business/domain logic (`composition`, `design-system`, `publishing`, `runtime-catalog`).
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
- Contracts: `apps/gateway/src/routes/contracts.ts`
- **Forwarder** (CMS app): `apps/cms/src/app/api/gateway/[[...route]]/route.ts`

## Root commands

Run these from the **repository root** unless you are inside a package directory.

### Development

- **`pnpm dev`** — CMS, Studio watch, admin extensions, payload-config watch, and gateway (same as the historical multi-process dev stack).
- **`pnpm dev:cms`** — CMS app only.
- **`pnpm dev:gw`** — Gateway only (`tsx watch`).
- **`pnpm dev:studio`** — `@repo/presentation-studio` TypeScript watch only.

### Build and quality

- **`pnpm build`** — TypeScript project references (`tsc -b`).
- **`pnpm build:cms`** — Next production build for `@repo/cms`.
- **`pnpm build:gw`** — Gateway `tsc` build.
- **`pnpm lint`** — Biome check (no writes).
- **`pnpm lint:fix`** — Biome check with `--write` (lint fixes).
- **`pnpm format`** / **`pnpm fmt`** — Biome format write.
- **`pnpm typecheck`** / **`pnpm tc`** — Workspace `tsc -b` plus CMS `tsc --noEmit`.
- **`pnpm check`** — Lint, typecheck, build, migrate (twice, per script), then `pnpm test` (integration).

### Database, migrations, seeding

- **`pnpm db:up`** / **`pnpm db:reset`** — Local Postgres via Docker Compose.
- **`pnpm migrate`** — Repo migration helper (`scripts/migrate.mjs`).
- **`pnpm migrate:create`** — `payload migrate:create` in `@repo/cms`.
- **`pnpm seed`** — Main Payload seed: `payload run src/seeds/index.ts` in the CMS app.
- **`pnpm seed:design-system`** — `scripts/seed-design-system.mjs`.
- **`pnpm payload`** — Forwards to the CMS app’s Payload CLI (same `NODE_OPTIONS` as other CMS scripts). Example: `pnpm payload migrate`, `pnpm payload generate:types`.

### Testing

- **`pnpm test`** / **`pnpm test:int`** — CMS **integration** suite (Vitest, `apps/cms/tests/int/**/*.int.spec.ts`). Expects Postgres when tests touch the DB.
- **`pnpm test:cov`** — Same int suite with **V8 coverage** (reports under `apps/cms/coverage/`; root `.gitignore` covers `coverage/`).
- **`pnpm test:watch`** — CMS Vitest in watch mode.
- **`pnpm test:gw`** — Gateway unit tests (`apps/gateway`, Vitest).
- **`pnpm test:all`** — `test:int` then `test:gw`.
- **`pnpm e2e`** — CMS Playwright E2E (`apps/cms` config and env).
- **`pnpm e2e:ui`** — Playwright with `--ui`.
- **`pnpm test:e2e`** — Alias for **`pnpm e2e`**.

Integration specs that open Payload should use **`getTestPayload`** + **`closeTestPayload`** from `apps/cms/tests/helpers/getTestPayload.ts` so the DB pool is torn down consistently (see that file for details).

### CMS-only scripts

From **`apps/cms`**, you can also run package scripts directly (e.g. `pnpm test:int`, `pnpm test:cov`, `pnpm payload`). Root shortcuts above delegate to these.

## Continuous integration (GitHub Actions)

**Workflow:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (this is the only place CI sets Payload/Postgres env for tests).

On each push and pull request, jobs run in parallel:

| Job | What runs |
|-----|-----------|
| `lint` | `pnpm lint` |
| `typecheck` | `pnpm typecheck` |
| `build` | `pnpm build` (workspace `tsc -b`) |
| `test-gateway` | `pnpm test:gw` |
| `test-integration` | Postgres **17** service (same user/db as [`docker-compose.yml`](../../docker-compose.yml) `db`), `pnpm --filter @repo/cms exec payload migrate`, `pnpm test:int` |

`test-integration` env vars are **non-production placeholders** that satisfy `@repo/config-env/studio` (`PAYLOAD_SECRET`, `PREVIEW_SECRET`, `SITE_URL`, etc.). DB user, password, and database name match the Compose service **`db`** (`app` / `app` / `builder`). CI connects on **`localhost:5432`**; local Compose defaults to host port **`54332`** → `5432` in the container.

**Playwright E2E** is intentionally **not** in this workflow (browser install + app server cost). Run **`pnpm e2e`** locally or add a separate workflow when you want it gated.

**Branch protection (manual):** In GitHub → Settings → Branches, require these checks to pass before merge: `lint`, `typecheck`, `build`, `test-gateway`, `test-integration`.

## Optional env (CMS app / Next)

Studio’s fetch client can be aimed at different path prefixes without code changes:

- `NEXT_PUBLIC_STUDIO_COMPOSITION_API_BASE` — default `/api/studio`
- `NEXT_PUBLIC_STUDIO_RESOURCE_API_BASE` — default `/api` (design token sets + globals)
