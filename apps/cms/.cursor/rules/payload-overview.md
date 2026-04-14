# Payload overview (repo-specific)

## Runtime assembly

- Payload config is assembled in `apps/studio/src/payload.config.ts`.
- Shared base config comes from `@repo/infrastructure-payload-config` (`buildStudioConfig`).
- DB adapter is Postgres (`createPostgresAdapter`), migrations in `apps/studio/src/migrations`.

## Source of truth

- Collections: `packages/infrastructure/payload-config/src/collections`.
- Globals: `packages/infrastructure/payload-config/src/globals`.
- The CMS app must not re-define collection configs outside infrastructure.

## Route split

- **Composition API** (Studio UI):
  - `apps/studio/src/app/api/builder/compositions/[id]/route.ts` (GET/POST/PATCH)
  - `apps/studio/src/app/api/builder/compositions/route.ts` (POST create)
- Gateway proxy route: `apps/studio/src/app/api/gateway/[[...route]]/route.ts`.

## Core rule

CMS app route handlers orchestrate. Domain rules belong in `packages/domains/*`, mutation use-cases in `packages/application/*`.
