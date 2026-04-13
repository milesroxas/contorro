# Cursor agent instructions

Treat this file as source of truth for repo boundaries and delivery rules. For a concrete implementation map, use `docs/app/README.md`.

## Product and stack

Contorro is multi-surface authoring:

- Studio app: Next.js + Payload 3 admin/CMS/auth.
- Builder UI: composition-tree editor rendered by shared presentation/runtime packages.
- Gateway app: Hono API mounted under `/api/gateway/*` (same-origin via Studio route).
- Primary database: Postgres (Neon in production, Docker locally).

## Layer rules (non-negotiable)

- Domain rules live in `packages/domains/*` only.
- Mutations must enter through `packages/application/*` commands/services.
- Presentation packages may depend on application + kernel, never import infrastructure directly.
- Infrastructure implements ports/adapters and Payload config.
- Kernel stays minimal (`Result`, errors, IDs, events). Keep runtime deps minimal.

## Source of truth by concern

- Payload collections/globals: `packages/infrastructure/payload-config`.
- Studio assembly (`buildConfig`, secrets, import map, migrations): `apps/studio`.
- Builder API endpoints:
  - `apps/studio/src/app/api/builder/compositions/[id]/route.ts` (GET/POST/PATCH)
  - `apps/studio/src/app/api/builder/compositions/route.ts` (POST create)
- Builder mutation orchestration: `packages/application/builder/*`.
- Gateway API surface: `apps/gateway/src/app.ts` and `apps/gateway/src/routes/*`.
- Shared contracts/validation: `packages/contracts/zod` and domain schemas.
- Builder component row-id mapping (single parser/formatter): `packages/infrastructure/payload-config/src/builder-row-id.ts`.

## Current API split (important)

- Canonical builder composition API is Studio `/api/builder/compositions/*`.
- Route handlers orchestrate only; mutation logic goes through `packages/application/builder` commands.
- Gateway composition mutation routes are intentionally `NOT_IMPLEMENTED`.
- Gateway remains active for health and contracts endpoints under `/api/gateway/*`.

## Drift prevention rules (important)

- Do not add direct `payload.create/update/delete` mutation logic in Studio builder route handlers; use application commands + repository adapter.
- Do not reintroduce builder mirror sync hooks for `builder.compositions`; builder state must come from canonical Payload collections + Studio API.
- When changing builder endpoints, update both:
  - `docs/app/README.md`
  - `apps/studio/.cursor/rules/endpoints.md`
- Keep `cmp-` logic centralized in `builder-row-id.ts` only.

## Monorepo layout

- Workspace packages follow `pnpm-workspace.yaml` (`apps/*`, `packages/*` groups).
- Use `workspace:*` for internal deps.
- `@payload-config` import is Next/Studio-only.

## Tooling and checks

- Lint/format: Biome only (`pnpm lint`, `pnpm format`).
- Typecheck: `pnpm typecheck`.
- Root dev: `pnpm dev` (studio + gateway).
- DB local: `pnpm db:up`.

## Testing

- Integration tests: `pnpm test` (studio int suite).
- E2E tests: `pnpm test:e2e`.
- Persistence tests expect Postgres available.

## Default workflow for agents

1. Pick owning layer and keep changes inside it.
2. For mutations use application -> domain -> infrastructure port flow.
3. After schema/config changes run required generation/migrations in studio.
4. Run lint/typecheck/tests proportional to change before done.
