# Studio agent rules

Use this file for changes inside `apps/studio`. Root constraints still apply from repo `AGENTS.md`.

## Ownership boundaries

- Studio owns Payload runtime assembly, Next routes, migrations, seeds, and app-level UI wiring.
- Collections/globals/hooks source of truth is `packages/infrastructure/payload-config`.
- Do not duplicate collection definitions in `apps/studio`.

## Current architecture facts

- Payload config entry: `apps/studio/src/payload.config.ts`
- DB adapter: Postgres via `createPostgresAdapter` from `@repo/infrastructure-payload-config`
- Builder composition persistence endpoint: `apps/studio/src/app/api/builder/compositions/[id]/route.ts`
- Gateway forwarding endpoint: `apps/studio/src/app/api/gateway/[[...route]]/route.ts`

## Security-critical patterns

1. If Local API call includes `user`, set `overrideAccess: false`.
2. In hooks, pass `req` to nested Local API calls to preserve transaction scope.
3. Prevent hook loops with explicit context flags.

## Layering rules in studio code

- Next route handlers should orchestrate only.
- Put business rules in domain/application packages.
- Studio can wire dependencies and map HTTP <-> application/domain contracts.

## Required checks after relevant changes

- Schema/config changes: run `payload generate:types` and `payload generate:importmap` as needed.
- Run `pnpm lint`.
- Run `pnpm typecheck` for cross-package impact.
- Run `pnpm --filter @repo/studio run test:int` for behavior changes.
