# Cursor agent instructions

Treat this file as source of truth for repo boundaries and delivery rules. For a concrete implementation map, use `docs/app/README.md`.

## Product and stack

Contorro is multi-surface authoring:

- **CMS app** (`apps/cms`, package **`@repo/cms`**): Next.js + Payload 3 admin/CMS/auth and HTTP APIs that back Studio.
- **Studio (presentation)** (`@repo/presentation-studio`): visual authoring UI (composition tree, design system screens). Browser code uses **`StudioAuthoringClient`** (`@repo/contracts-zod`) + **`fetch-studio-authoring-client`** to call the CMS app over HTTP — **no** `packages/infrastructure/*` imports and **no** Payload/CMS SDK imports under `packages/presentation/studio/src/`.
- **Gateway app**: Hono API mounted under `/api/gateway/*` (same-origin via CMS app route).
- **Primary database**: Postgres (Neon in production, Docker locally).

## Layer rules (non-negotiable)

- Domain rules live in `packages/domains/*` only.
- Mutations must enter through `packages/application/*` commands/services.
- Presentation packages **must not** import `packages/infrastructure/*`. Authoring UI (`@repo/presentation-studio`) depends on kernel, contracts, domains, and related presentation/runtime packages; **orchestration** (`@repo/application-studio`) runs in the **CMS app** route handlers, not inside the Studio package.
- Infrastructure implements ports/adapters and Payload config.
- Kernel stays minimal (`Result`, errors, IDs, events). Keep runtime deps minimal.

## Source of truth by concern

- Payload collections/globals: `packages/infrastructure/payload-config`.
- CMS app assembly (`buildConfig`, secrets, import map, migrations): `apps/cms` (`@repo/cms`).
- **Composition HTTP API** (canonical for Studio UI):
  - `apps/cms/src/app/api/studio/compositions/[id]/route.ts` (GET/POST/PATCH)
  - `apps/cms/src/app/api/studio/compositions/route.ts` (POST create)
- Mutation orchestration: `packages/application/studio/*`.
- Gateway API surface: `apps/gateway/src/app.ts` and `apps/gateway/src/routes/*`.
- Shared contracts: `packages/contracts/zod` (includes **`StudioAuthoringClient`**); default fetch implementation: `packages/presentation/studio/src/lib/fetch-studio-authoring-client.ts`.
- Component row-id mapping for Payload `cmp-` IDs: **`packages/domains/composition/src/studio-component-row-id.ts`** (re-exported from `packages/infrastructure/payload-config/src/studio-row-id.ts` for compatibility).

## Current API split (important)

- Canonical **composition** API for Studio is the CMS app’s **`/api/studio/compositions/*`** routes.
- Route handlers orchestrate only; mutation logic goes through `packages/application/studio` commands.
- Gateway composition mutation routes are intentionally **`NOT_IMPLEMENTED`**.
- Gateway remains active for health and contracts under `/api/gateway/*`.

## Drift prevention rules (important)

- Do not add direct `payload.create/update/delete` mutation logic in composition route handlers; use application commands + repository adapter.
- Do not reintroduce a parallel composition store (e.g. mirrored SQL tables); state must come from Payload collections + the CMS composition API only.
- When changing **`/api/studio/compositions`** behavior or paths, update both:
  - `docs/app/README.md`
  - `apps/cms/.cursor/rules/endpoints.md`
- Keep `cmp-` logic centralized in `studio-component-row-id.ts` (domains) only; do not duplicate parsers elsewhere.

## shadcn/ui (CLI source of truth)

- **Add components only via the shadcn CLI** (e.g. `pnpm dlx shadcn@latest add …`) run from the package directory that owns the relevant `components.json` (Studio UI: `packages/presentation/studio`; CMS app UI: `apps/cms` when applicable). Do **not** paste or hand-rebuild shadcn component source from docs or other projects — that creates a second source of truth and makes upgrades drift.
- **Customize in one place:** prefer extending **CVA variants** (or a small wrapper component) in the owning `components/ui/*` file. Keep diffs small and aligned with upstream patterns so future `add` / registry updates stay workable. **Avoid wholesale rewrites** of shadcn primitives unless there is a strong reason; replacing whole components bypasses the shared baseline and invites inconsistency across the codebase.

### No ad-hoc visual overrides at call sites (design drift)

Call-site `className` on shadcn primitives (`Button`, `Item`, `Card`, inputs, etc.) to change **radius, borders, background, shadow, or spacing** causes **inconsistent screens** and is **hard to maintain**. Treat this as **disallowed by default**.

- **Allowed without asking:** use the component **as documented** — built-in **`variant` / `size`** (and any other props the primitive exposes). Prefer matching sibling screens by using the **same variant**, not a copy-pasted `className`.
- **Overrides only when necessary:** add `className` (or one-off tweaks) **only** when there is a **clear, unavoidable** reason *or* the **user explicitly requested** that override for that change. If a new look is product-intended, do **not** leave it as a feature-local override.
- **When the design needs a new look:** add or extend **CVA variants** on the primitive (or a shared wrapper) so the style has a **name** and **one definition**. Do **not** satisfy “slightly different dashboard rows” by sprinkling `className="rounded-lg bg-card/80 …"` across `features/*`.
- **`cn()` / merges** belong **inside** the primitive or wrapper when defining variants — not scattered across call sites for visual differentiation.

This applies across **Studio** (`packages/presentation/studio`) and **CMS app UI** (`apps/cms`) wherever shadcn components are used.

## Monorepo layout

- Workspace packages follow `pnpm-workspace.yaml` (`apps/*`, `packages/*` groups).
- Use `workspace:*` for internal deps.
- `@payload-config` import is Next/CMS-app-only.

## Tooling and checks

- Lint/format: Biome only (`pnpm lint`, `pnpm format`).
- Typecheck: `pnpm typecheck`.
- Root dev: `pnpm dev` (CMS app + `@repo/presentation-studio` watch + `@repo/presentation-admin-extensions` watch + `@repo/infrastructure-payload-config` watch + gateway).
- DB local: `pnpm db:up`.

### Lint discipline (Biome)

- Cognitive complexity is capped at **15** via `lint/complexity/noExcessiveCognitiveComplexity` in the repo root `biome.json`. Reduce complexity by extracting helpers or smaller components instead of raising the limit.
- Do **not** add `biome-ignore`, `eslint-disable`, `@ts-ignore`, or other suppressions to silence lint or type errors. Address the root cause (refactor, typings, or control flow).
- Large warning counts are not a reason to use ignores: fix violations incrementally until clean.

## Testing

- Integration tests: `pnpm test` (CMS app int suite, `@repo/cms`).
- E2E tests: `pnpm test:e2e`.
- Persistence tests expect Postgres available.

## Default workflow for agents

1. Pick owning layer and keep changes inside it.
2. For mutations use application → domain → infrastructure port flow.
3. After schema/config changes run required generation/migrations in the CMS app.
4. Run lint/typecheck/tests proportional to change before done.
