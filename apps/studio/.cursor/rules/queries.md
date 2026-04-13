# Query boundaries

Use correct path by purpose:

- Payload document reads/writes for builder composition: Studio route `src/app/api/builder/compositions/[id]/route.ts`.
- Contract schema routes and health checks: gateway routes under `/api/gateway/*`.

For Local API queries with user context, always pass `overrideAccess: false`.

Prefer domain/application abstractions for non-trivial logic; keep route handlers thin.
