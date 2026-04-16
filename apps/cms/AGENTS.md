# CMS app agent rules

Use this file for changes inside **`apps/cms`** (package **`@repo/cms`**). Root constraints still apply from repo `AGENTS.md`.

## Ownership boundaries

- This app owns Payload runtime assembly, Next routes, migrations, seeds, and app-level UI wiring for admin, Payload custom components, and the **`/studio`** host route.
- Collections/globals/hooks source of truth is `packages/infrastructure/payload-config`.
- Do not duplicate collection definitions in `apps/cms`.

## Current architecture facts

- Payload config entry: `apps/cms/src/payload.config.ts`
- DB adapter: Postgres via `createPostgresAdapter` from `@repo/infrastructure-payload-config`
- **Composition API** (HTTP routes called by `@repo/presentation-studio` via `StudioAuthoringClient`):
  - `apps/cms/src/app/api/studio/compositions/[id]/route.ts` (GET/POST/PATCH)
  - `apps/cms/src/app/api/studio/compositions/route.ts` (POST create)
- Mutation commands: `packages/application/studio/src/commands/*`
- Payload repository adapter: `apps/cms/src/app/api/studio/_lib/payload-studio-mutation-repository.ts`
- Gateway forwarding endpoint: `apps/cms/src/app/api/gateway/[[...route]]/route.ts`
- Studio UI: Next route **`/studio`** (`app/(studio)/studio/page.tsx`) — `payload.auth` + `StudioShell` from `@repo/presentation-studio` (hub, design system screen, editor) and `createFetchStudioAuthoringClient` (optional env: `NEXT_PUBLIC_STUDIO_COMPOSITION_API_BASE`, `NEXT_PUBLIC_STUDIO_RESOURCE_API_BASE`).

## Security-critical patterns

1. If Local API call includes `user`, set `overrideAccess: false`.
2. In hooks, pass `req` to nested Local API calls to preserve transaction scope.
3. Prevent hook loops with explicit context flags.

## Layering rules in CMS app code

- Next route handlers should orchestrate only.
- Put business rules in domain/application packages.
- This app can wire dependencies and map HTTP ↔ application/domain contracts.
- Import `cmp-` helpers from `@repo/domains-composition` (or the infrastructure re-export); implementation lives in `studio-component-row-id.ts`.
- Do not add legacy mirror sync hooks; avoid dual-write drift.

## Required checks after relevant changes

- Schema/config changes: run `pnpm --filter @repo/cms run generate:types` and `pnpm --filter @repo/cms run generate:importmap` as needed.
- Run `pnpm lint` (no `biome-ignore` or other suppressions to silence rules — see root `AGENTS.md`).
- Run `pnpm typecheck` for cross-package impact.
- Run `pnpm --filter @repo/cms run test:int` for behavior changes.
