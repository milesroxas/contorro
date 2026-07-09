# Contorro implementation map

This document maps what is currently implemented in the repo. Architecture rationale: `docs/refactor-plan.md`.

## App

- **CMS app** (`apps/cms`, npm **`@repo/cms`**): Next.js 16 + Payload 3. Hosts the admin UI, auth/session, Payload migrations/seeds, the **Studio** surface at **`/studio`**, Studio-facing HTTP APIs under `/api/studio/*`, design-system REST + compiled CSS, preview routes, and public page rendering at `(frontend)/[slug]`.

## Packages (7)

- `packages/contracts/zod` — Zod contracts, the **block catalog** (`block-catalog.ts`), `StudioAuthoringClient` transport types + runtime schemas, kernel utilities (`Result`, `ok`/`err`, `makeId`).
- `packages/domains/composition` — composition tree model, mutations, validation, row-id mapping.
- `packages/runtime/renderer` — primitives registry, composition renderer, style resolver, `inject-block-values.ts`.
- `packages/presentation/studio` — the visual Studio (browser-only; no Payload imports). Default transport: `src/lib/fetch-studio-authoring-client.ts`.
- `packages/infrastructure/payload-config` — collections, globals, access, hooks, `blocks-from-catalog.ts`, design-token module.
- `packages/config/env` — env schema/parsing. `packages/config/tailwind` — design-token → CSS-variable compiler.

## Content model

- **Block catalog (code)**: block types (hero, feature, cta, content) with typed fields; drives Payload block configs, Studio binding UI, and render injection.
- **`components`**: Studio-authored designs. `blockType` set = implements that block contract (bindings validated at publish); empty = design-only library part.
- **`page-compositions`**: design-only page templates with layout regions (`primitive.slot`).
- **`pages`**: `pageComposition` relationship + `contentSlots[]` (region rows) each holding a native Payload **blocks** field; each block row = typed values + `design` relationship (published designs of that blockType).
- **Render**: `apps/cms/src/lib/render-designer-content.tsx` + `packages/runtime/renderer/src/inject-block-values.ts` — values injected into bound nodes only when present; embedded library parts are design-only.

## Composition API

- `/api/studio/compositions/[id]` — GET / POST (save draft|publish, conditional `ifMatchUpdatedAt`) / PATCH (meta: `name`, `blockType`).
- `/api/studio/compositions` — POST create.
- Commands: `apps/cms/src/lib/studio-commands/`; Payload adapter: `apps/cms/src/app/api/studio/_lib/payload-studio-mutation-repository.ts`.
- Request/response payloads are Zod-validated on both ends (`@repo/contracts-zod/studio-authoring-client`).

## Preview

- Enter: `GET /api/preview/enter?pageId=…` (authenticated, role-checked). Exit: `GET /api/preview/exit`. Live preview: `Pages.admin.livePreview` + `LivePreviewRefresh` client component in the slug route. No shared preview secret.

## Design tokens

- `design-token-sets` collection + `design-system-settings` global (edited in Studio via Payload REST).
- Compiler (`packages/config/tailwind/src/compiler.ts`) emits `:root`/`.dark` variable blocks bridged to shadcn theme names (`color.primary` → `--primary`). Served by `/api/design-system/compiled-css?v=<updatedAt>` (immutable-cached). Token-bound node styles render as inline `var(--…)`; no utility-class generation.

## Root commands

Run from the repository root.

### Development

- **`pnpm dev`** — CMS + Studio watch + payload-config watch.
- **`pnpm dev:cms`** / **`pnpm dev:studio`** — single-package dev.

### Build and quality

- **`pnpm build`** — workspace `tsc -b`. **`pnpm build:cms`** — Next production build.
- **`pnpm lint`** / **`pnpm lint:fix`** / **`pnpm format`** — Biome.
- **`pnpm typecheck`** / **`pnpm tc`** — workspace `tsc -b` + CMS `tsc --noEmit`.
- **`pnpm check`** — lint, typecheck, build, migrate, integration tests.

### Database, migrations, seeding

- **`pnpm db:up`** / **`pnpm db:reset`** — local Postgres via Docker Compose (host port 54332).
- **`pnpm migrate`** — `scripts/migrate.mjs`. **`pnpm migrate:create`** — `payload migrate:create`.
- **`pnpm seed`** — main seed (production-guarded: refuses prod envs without `SEED_ALLOW_PRODUCTION=true` + strong `SEED_PASSWORD`).
- **`pnpm seed:design-system`** — tokens only. **`pnpm payload`** — CMS Payload CLI passthrough.

### Testing

- **`pnpm test`** / **`pnpm test:int`** — CMS integration suite (Vitest). Postgres required.
- **`pnpm test:cov`** — int suite with V8 coverage. **`pnpm test:watch`** — watch mode.
- **`pnpm e2e`** / **`pnpm e2e:ui`** / **`pnpm test:e2e`** — Playwright (not in CI).

Integration specs that open Payload should use **`getTestPayload`** + **`closeTestPayload`** from `apps/cms/tests/helpers/getTestPayload.ts`.

## Continuous integration (GitHub Actions)

**Workflow:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (the only place CI sets Payload/Postgres env for tests).

| Job | What runs |
|-----|-----------|
| `lint` | `pnpm lint` |
| `typecheck` | `pnpm typecheck` |
| `build` | `pnpm build` |
| `test-integration` | Postgres 17 service, `payload migrate`, `pnpm test:int` |

CI DB credentials match Compose service `db` (`app`/`app`/`builder`) on `localhost:5432`; local Compose maps host `54332` → container `5432`. Playwright E2E is intentionally not in this workflow — run `pnpm e2e` locally.

**Branch protection (manual):** require `lint`, `typecheck`, `build`, `test-integration`.

## Optional env (CMS app / Next)

- `NEXT_PUBLIC_STUDIO_COMPOSITION_API_BASE` — default `/api/studio`.
- `NEXT_PUBLIC_COMPOSITION_DEBUG=true` — render debug placeholders for failed library-component expansion (otherwise production renders nothing and logs).
