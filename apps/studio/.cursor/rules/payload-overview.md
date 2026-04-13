# Payload overview (repo-specific)

## Runtime assembly

- Payload config is assembled in `apps/studio/src/payload.config.ts`.
- Shared base config comes from `@repo/infrastructure-payload-config` (`buildStudioConfig`).
- DB adapter is Postgres (`createPostgresAdapter`), migrations in `apps/studio/src/migrations`.

## Source of truth

- Collections: `packages/infrastructure/payload-config/src/collections`.
- Globals: `packages/infrastructure/payload-config/src/globals`.
- Studio should not re-define collection configs.

## Route split

- Builder composition persistence: `apps/studio/src/app/api/builder/compositions/[id]/route.ts`.
- Gateway proxy route: `apps/studio/src/app/api/gateway/[[...route]]/route.ts`.

## Core rule

Studio route handlers orchestrate. Domain rules belong in `packages/domains/*`, mutation use-cases in `packages/application/*`.
