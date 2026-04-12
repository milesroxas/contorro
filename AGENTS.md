# Cursor agent instructions

Treat **this file** as the source of truth for layout, boundaries, tooling, and delivery. Use **[`docs/app/README.md`](docs/app/README.md)** for a concise map of what is implemented (apps, domains, gateway routes, infra). If instructions conflict, follow this document or update it deliberately in a dedicated change.

## Product and stack

Multi-surface authoring: Payload for content, auth, and admin; a **designer builder** (composition tree) on top. Studio is **Next.js + Payload**; builder and related APIs go through a **Hono gateway** (same-origin under `/api/gateway/*`). Primary DB is **Postgres** (Neon in production; Docker locally).

## Layer rules (non-negotiable)

- **Domain logic** lives only in `packages/domains/*`. Do not put business rules in Payload hooks, Next.js route handlers, Hono handlers, or React UI except as thin orchestration.
- **Application services** in `packages/application/*` are the only entry point for **mutating** domain state. Gateway routes and Payload hooks call application commands/queries (with repositories and deps injected)—not aggregates directly.
- **Presentation** (`packages/presentation/*`) may depend on **application** and **kernel**. It **must not import `packages/infrastructure/*` directly.** Bridge persistence and config through application services or app-level wiring in `apps/studio` / `apps/gateway`.
- **Infrastructure** implements domain ports (repositories, ACLs, event bus, blob, telemetry). **Payload user/document types** are translated at this boundary (e.g. user ACL)—**not** inside domain packages.
- **Kernel** (`packages/kernel`) stays minimal: Result, errors, events, IDs. **Only `nanoid`** is allowed as a runtime dependency there; do not add other deps to kernel.

## Single source of truth by concern

- **Payload documents** — persisted content and composition records.
- **Zod** (`packages/contracts/zod`, domains) — input contracts and validation. Use **`zod@^4`** and `import { z } from 'zod'` (no transitional `zod/v4` subpath).
- **Composition tree** — structured nodes; not HTML blobs, not canonical Tailwind class strings. Store typed style decisions (`StyleBinding`); compile tokens to Tailwind output via `packages/config/tailwind`.
- **Lexical vs composition text:** Lexical is for **admin/metadata** fields only (e.g. SEO, descriptions). **All visual body text** is authored as **composition tree** nodes (`kind: 'text'` and bindings)—no overlapping rich-text fields for the same content.

## Monorepo layout (high level)

- **Collections and globals** are defined under **`packages/infrastructure/payload-config`** (`collections/`, `globals/`, hooks, `base-config`, `studio-config`). `apps/studio` assembles `buildConfig` (secrets, DB, Lexical, importMap paths); it does not duplicate collection modules as the source of truth.
- **`@payload-config`** is **Next.js-only**. No shared `packages/*` may import it; apps compose config from infrastructure exports.
- **Workspace and globs** match `pnpm-workspace.yaml`—use `workspace:*` for internal packages; place deps in the package that imports them.

## Application and API patterns

- Commands and queries return **`AsyncResult<T, E>`** (or `Result` where synchronous); **avoid throwing** for expected failures. Map results to HTTP in the gateway with a **stable JSON envelope** (success `data`, errors `error.code` and status codes).
- Validate command input with **Zod** before calling application services.
- The gateway does **not** run Payload; it uses Postgres (pool / Drizzle for builder) and JWT auth. **Migrations run from `apps/studio` only**—gateway is a DB consumer.

## Tooling

- **Lint/format:** **Biome only** at repo root (`pnpm lint` / `biome check .`). Do not introduce ESLint or Prettier as project linters.
- **Typecheck:** Follow root `package.json` scripts: composite packages emit; then `tsc --noEmit` in `apps/studio`.

## Testing and local dev

- **Integration tests** that hit persistence expect **Postgres**; start DB (`pnpm db:up` or equivalent) and set env per `apps/studio/.env.example`.
- Prefer **co-located** tests; respect layer-appropriate test types (unit vs integration vs E2E).

## When working inside `apps/studio`

Payload-specific patterns (Local API `overrideAccess`, hook transactions, import maps) are elaborated in **`apps/studio/AGENTS.md`**. Use that for Payload API details, but **always** respect the layer and folder rules above—studio must not become a shortcut around domains or application services.

## Default workflow for agents

1. Decide which **layer** owns the change; keep diffs within that boundary.
2. For mutations: **application service → domain → repository port;** infrastructure implements the port.
3. After schema or collection changes: migrations from studio; types/import maps as required by the Payload workflow.
4. Run **`pnpm lint`** (and typecheck/tests when relevant) before considering work complete.
