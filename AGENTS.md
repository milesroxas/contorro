# Cursor agent instructions

Treat this file as source of truth for repo boundaries and delivery rules. Refactor context: `docs/refactor-plan.md` (architecture) and `docs/audit-2026-07-08.md` (history).

## Product and stack

Contorro is a website builder: designers author block **designs** and page **templates** in Studio; content editors compose pages from typed **blocks** in Payload `/admin`; published pages render for anonymous visitors.

- **CMS app** (`apps/cms`, package `@repo/cms`): Next.js + Payload 3 admin/CMS/auth, the `/api/studio/*` HTTP API that backs Studio, and public page rendering (`(frontend)/[slug]`).
- **Studio** (`@repo/presentation-studio`): browser-only visual editor mounted at `/studio`. Talks to the CMS via `StudioAuthoringClient` (`@repo/contracts-zod`) + `fetch-studio-authoring-client`. No Payload/CMS SDK imports under `packages/presentation/studio/src/`.
- **Primary database**: Postgres (Neon in production, Docker locally, `contorro-db-1`).

## Content model (core architecture — do not regress)

Content schema and visual design are split:

- **Block catalog** (`packages/contracts/zod/src/block-catalog.ts`): code-defined block types (hero, feature, cta, content) with typed fields. Adding a block type is a code change + deploy. The catalog drives three surfaces: Payload block configs (`packages/infrastructure/payload-config/src/blocks-from-catalog.ts`), Studio binding UI, and render-time value injection.
- **Designs** (`components` collection): Studio-authored composition trees. A component with `blockType` set implements that block's contract by binding nodes to catalog field names (`contentBinding: { source: "editor", editorField: { name } }`). Publish-time validation enforces required fields bound exactly once, no unknown/duplicate names. `blockType` empty = design-only library part (embeddable in templates, no CMS fields).
- **Templates** (`page-compositions` collection): design-only page layouts with named regions (`primitive.slot`). Templates carry no CMS-editable fields.
- **Pages**: `pageComposition` relationship + `contentSlots[]` array (one row per region) each holding a **native Payload blocks field** built from the catalog. Each block row = typed values + a `design` relationship filtered to published components of that blockType.
- **Render** (`apps/cms/src/lib/render-designer-content.tsx`, `packages/runtime/renderer/src/inject-block-values.ts`): per block, load the design composition, inject the block's typed values at bound nodes (only when a value exists — never blank content from missing values), graft into the template's slot nodes. Image/link values arrive as populated Payload relations; there is NO id→URL resolver layer — do not reintroduce one.
- Public reads use `overrideAccess: false`; `components`/`page-compositions` have anonymous read scoped to `_status: published`. Do not widen access or flip overrideAccess on public paths.

## Layer rules

- Composition tree model, mutations, and validation: `packages/domains/composition` only.
- Studio mutations enter through `apps/cms/src/lib/studio-commands` + the repository adapter (`apps/cms/src/app/api/studio/_lib/payload-studio-mutation-repository.ts`). Saves are conditional single-operation updates (`ifMatchUpdatedAt`); renames update the title only — never resubmit the composition.
- Presentation (`@repo/presentation-studio`) depends on contracts, domains, and renderer packages only.
- Shared kernel utilities (`Result`, `ok`/`err`, `makeId`) live in `@repo/contracts-zod`.

## Source of truth by concern

- Payload collections/globals: `packages/infrastructure/payload-config` (incl. design tokens under `src/design-tokens/`).
- CMS app assembly (`buildConfig`, secrets, import map, migrations): `apps/cms`.
- Composition HTTP API (canonical for Studio): `apps/cms/src/app/api/studio/compositions/[id]/route.ts` (GET/POST/PATCH) and `.../compositions/route.ts` (POST create).
- Shared contracts + block catalog: `packages/contracts/zod`.
- Component row-id mapping for Payload `cmp-` IDs: `packages/domains/composition/src/studio-component-row-id.ts` only; do not duplicate parsers.
- Design tokens: compiled to CSS variables bridged to the shadcn theme names (`color.primary` → `--primary`) by `packages/config/tailwind/src/compiler.ts`; served via `/api/design-system/compiled-css?v=<updatedAt>` (immutable-cached). Token-bound node styles render as inline `var(--…)` styles — there is no token utility-class generation; do not reintroduce it.

## Drift prevention rules

- No direct `payload.create/update/delete` mutation logic in composition route handlers; use the studio-commands modules + repository adapter.
- No parallel composition store (mirrored SQL tables, raw SQL against Payload tables); state comes from Payload collections + the CMS composition API only.
- No new hand-rolled versioning/publishing machinery — Payload `versions: { drafts: true, maxPerDoc }` is the mechanism.
- No json blobs for admin-editable content values; content values are native Payload block fields generated from the catalog.
- Hooks doing nested Local API calls must thread `req` (transaction atomicity).
- When changing `/api/studio/compositions` behavior or paths, update `docs/app/README.md` and `apps/cms/.cursor/rules/endpoints.md`.

## shadcn/ui (CLI source of truth)

- **Add components only via the shadcn CLI** (e.g. `pnpm dlx shadcn@latest add …`) run from the package directory that owns the relevant `components.json` (Studio UI: `packages/presentation/studio`; CMS app UI: `apps/cms` when applicable). Do **not** paste or hand-rebuild shadcn component source from docs or other projects — that creates a second source of truth and makes upgrades drift.
- **Customize in one place:** prefer extending **CVA variants** (or a small wrapper component) in the owning `components/ui/*` file. Keep diffs small and aligned with upstream patterns so future `add` / registry updates stay workable. **Avoid wholesale rewrites** of shadcn primitives unless there is a strong reason.

### No ad-hoc visual overrides at call sites (design drift)

Call-site `className` on shadcn primitives (`Button`, `Item`, `Card`, inputs, etc.) to change **radius, borders, background, shadow, or spacing** causes **inconsistent screens** and is **hard to maintain**. Treat this as **disallowed by default**.

- **Allowed without asking:** use the component **as documented** — built-in **`variant` / `size`** (and any other props the primitive exposes). Prefer matching sibling screens by using the **same variant**, not a copy-pasted `className`.
- **Overrides only when necessary:** add `className` (or one-off tweaks) **only** when there is a **clear, unavoidable** reason *or* the **user explicitly requested** that override for that change.
- **When the design needs a new look:** add or extend **CVA variants** on the primitive (or a shared wrapper) so the style has a **name** and **one definition**.
- **`cn()` / merges** belong **inside** the primitive or wrapper when defining variants — not scattered across call sites.

This applies across **Studio** and **CMS app UI** wherever shadcn components are used.

## Monorepo layout

7 packages + 1 app: `apps/cms`, `packages/contracts/zod`, `packages/domains/composition`, `packages/runtime/renderer`, `packages/presentation/studio`, `packages/infrastructure/payload-config`, `packages/config/env`, `packages/config/tailwind`. Use `workspace:*` for internal deps. `@payload-config` import is CMS-app-only. Do not add new workspace packages without a strong reason — prefer a module in an existing package.

## Tooling and checks

- Lint/format: Biome only (`pnpm lint`, `pnpm format`; apply fixes with `pnpm lint:fix`).
- Typecheck: `pnpm typecheck` (shortcut: `pnpm tc`).
- Root dev: `pnpm dev` (CMS app + studio watch + payload-config watch). Single-package dev: `pnpm dev:cms`, `pnpm dev:studio`.
- DB local: `pnpm db:up`; reset: `pnpm db:reset`.
- Seeding: `pnpm seed` (guarded against production envs; `SEED_ALLOW_PRODUCTION=true` + strong `SEED_PASSWORD` required to override).
- After schema changes: `pnpm --filter @repo/cms generate:types` (and importmap when admin components change); migrations via `pnpm migrate:create` / `pnpm migrate`.

### Lint discipline (Biome)

- Cognitive complexity capped at **15** (`lint/complexity/noExcessiveCognitiveComplexity`). Extract helpers instead of raising the limit.
- No `biome-ignore`, `eslint-disable`, `@ts-ignore`, or other suppressions. Address the root cause.

## Testing

- **CI:** `.github/workflows/ci.yml` runs lint, typecheck, workspace build, and CMS integration tests (with Postgres).
- Integration tests: `pnpm test` / `pnpm test:int`; coverage `pnpm test:cov`; watch `pnpm test:watch`.
- E2E: `pnpm e2e` (alias `pnpm test:e2e`); UI mode `pnpm e2e:ui` — not run in CI by default.
- Payload in tests: use `getTestPayload()` / `closeTestPayload()` from `apps/cms/tests/helpers/getTestPayload.ts`, not ad hoc `getPayload({ config })` without teardown.

## Default workflow for agents

1. Pick the owning package/module and keep changes inside it.
2. Content-model changes start from the block catalog; regenerate Payload types after schema changes.
3. Run lint/typecheck/tests proportional to the change before done.
