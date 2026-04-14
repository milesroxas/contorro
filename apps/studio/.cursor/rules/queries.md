# Query boundaries

Use the correct path by purpose:

- **Composition API** (Studio):
  - `src/app/api/builder/compositions/[id]/route.ts` (GET/POST/PATCH)
  - `src/app/api/builder/compositions/route.ts` (POST create)
- Route handlers orchestrate; mutations flow through `@repo/application-builder` commands.
- Contract schema routes and health checks: gateway routes under `/api/gateway/*`.

For Local API queries with user context, always pass `overrideAccess: false`.

Prefer domain/application abstractions for non-trivial logic; keep route handlers thin.
