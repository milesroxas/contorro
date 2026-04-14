# CMS app agent rules

Use this file for changes inside **`apps/studio`** (package **`@repo/cms`**). Root constraints still apply from repo `AGENTS.md`.

## Ownership boundaries

- This app owns Payload runtime assembly, Next routes, migrations, seeds, and app-level UI wiring for admin + Studio embedding.
- Collections/globals/hooks source of truth is `packages/infrastructure/payload-config`.
- Do not duplicate collection definitions in `apps/studio`.

## Current architecture facts

- Payload config entry: `apps/studio/src/payload.config.ts`
- DB adapter: Postgres via `createPostgresAdapter` from `@repo/infrastructure-payload-config`
- **Composition API** (HTTP routes called by `@repo/presentation-studio` via `StudioAuthoringClient`):
  - `apps/studio/src/app/api/builder/compositions/[id]/route.ts` (GET/POST/PATCH)
  - `apps/studio/src/app/api/builder/compositions/route.ts` (POST create)
- Mutation commands: `packages/application/builder/src/commands/*`
- Payload repository adapter: `apps/studio/src/app/api/builder/_lib/payload-builder-mutation-repository.ts`
- Gateway forwarding endpoint: `apps/studio/src/app/api/gateway/[[...route]]/route.ts`
- Studio embed: Payload custom view **`/builder`** → `components/admin/BuilderView.tsx` mounts `@repo/presentation-studio` and injects `createFetchStudioAuthoringClient` (optional env: `NEXT_PUBLIC_STUDIO_COMPOSITION_API_BASE`, `NEXT_PUBLIC_STUDIO_RESOURCE_API_BASE`).

## Security-critical patterns

1. If Local API call includes `user`, set `overrideAccess: false`.
2. In hooks, pass `req` to nested Local API calls to preserve transaction scope.
3. Prevent hook loops with explicit context flags.

## Layering rules in CMS app code

- Next route handlers should orchestrate only.
- Put business rules in domain/application packages.
- This app can wire dependencies and map HTTP ↔ application/domain contracts.
- Keep component row-id parsing in `@repo/infrastructure-payload-config/builder-row-id`.
- Do not add legacy mirror sync hooks; avoid dual-write drift.

## Required checks after relevant changes

- Schema/config changes: run `payload generate:types` and `payload generate:importmap` as needed.
- Run `pnpm lint`.
- Run `pnpm typecheck` for cross-package impact.
- Run `pnpm --filter @repo/cms run test:int` for behavior changes.
