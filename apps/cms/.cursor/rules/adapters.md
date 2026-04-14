# Adapters in this repo

## Database

- The CMS app’s Payload runtime uses Postgres via `@payloadcms/db-postgres` through `createPostgresAdapter`.
- Gateway uses `pg` pool directly (`apps/gateway/src/runtime/db.ts`).

## Infrastructure adapters

- Payload config + collection/globals wiring: `packages/infrastructure/payload-config`.
- Persistence implementations: `packages/infrastructure/persistence`.
- Blob/event bus/telemetry live under `packages/infrastructure/*`.

## Rule

Do not introduce Mongo-specific config/examples in CMS app docs or rules. Current runtime is Postgres.
