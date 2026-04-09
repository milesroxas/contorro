# Implementation-Ready Architecture Spec

**Version:** 0.3.1  
**Owner:** Miles Roxas  
**Updated:** April 9, 2026  
**Surface:** Payload-powered visual builder platform

---

## Table of Contents

- [Changelog from v0.2.2](#changelog-from-v022)
- [1. Product Framing](#1-product-framing)
- [2. Architecture Overview](#2-architecture-overview)
- [3. Architectural Principles](#3-architectural-principles)
- [4. Monorepo Layout](#4-monorepo-layout)
- [5. Bounded Contexts](#5-bounded-contexts)
- [6. Application Layer — CQRS Lite](#6-application-layer--cqrs-lite)
- [7. Persistence — Repository Pattern](#7-persistence--repository-pattern)
- [8. API and Orchestration — Hono Gateway](#8-api-and-orchestration--hono-gateway)
- [9. Persistence Model in Payload](#9-persistence-model-in-payload)
- [10. Builder State Architecture](#10-builder-state-architecture)
- [11. Design System Implementation](#11-design-system-implementation)
- [12. Runtime Renderer](#12-runtime-renderer)
- [13. Preview Strategy](#13-preview-strategy)
- [14. Auth and Security](#14-auth-and-security)
- [15. Testing Strategy](#15-testing-strategy)
- [16. Observability](#16-observability)
- [17. CI/CD Pipeline](#17-cicd-pipeline)
- [18. Local Development](#18-local-development)
- [19. Delivery Phases](#19-delivery-phases)
- [20. Decisions Log](#20-decisions-log)
- [21. What Not to Build](#21-what-not-to-build-until-explicitly-phased-in)

---

## Changelog from v0.2.2

| # | Issue | Resolution |
|---|---|---|
| 1 | Gateway could not use Payload local API as standalone process | §8.1 clarified: gateway initializes Payload via `getPayload()` using a headless config variant. §4.1 splits payload-config into base/studio/headless layers |
| 2 | Payload `livePreview.url` function signature was wrong (`req` param doesn't exist) | §13 rewritten: livePreview scoped to composer only, draft preview uses `admin.preview`, builder canvas is its own preview |
| 3 | User Access ACL imported Payload types in a domain package (violated layer rule) | §5.8 moved Payload ACL to `packages/infrastructure/persistence/src/acl/` |
| 4 | Package dependency graph arrows were semantically reversed | §4.2 Mermaid diagram corrected — arrows now point from dependent to dependency |
| 5 | Zod import path ambiguous between v3 subpath and v4 root | Standardized on `zod@^4.0.0` with `import { z } from 'zod'` throughout |
| 6 | dnd-kit packages are legacy; new `@dnd-kit/react` API exists at v0.x | Documented in §20 decisions log with migration plan for when v1.0 ships |
| 7 | `application/contract-sync` missing from dependency map | Added §4.4 section for this package |
| 8 | Payload auth described as "session auth" — it's JWT-in-cookie | §14.1 corrected; added short-expiration mitigation for user deactivation |
| 9 | Zustand v5 `useShallow` requirement not documented | §10.3 adds `createSafeStore` factory pattern baked into presentation packages |
| 10 | Tailwind v4 requires `@tailwindcss/postcss` for Next.js — not listed | §11.2 updated; runtime token injection via `:root` overrides documented |
| 11 | No HTTP error response contract for gateway | Added §8.4 with `resultToResponse` mapping and consistent JSON envelope |
| 12 | `contracts/payload-field-mappers` specified but solves no real problem | Removed from §4.1. Payload fields and Zod schemas serve different concerns by design |
| 13 | `@payload-config` alias is Next.js-only; shared packages can't use it | Added rule in §4.4: no shared package may use this alias |
| 14 | No connection pooling guidance for Neon + two Payload processes | Added §9.5 Connection Strategy |
| 15 | Gateway deployed separately creates CORS, env duplication, and deployment complexity | §8.1 updated: gateway deploys within studio's Vercel project for Phases 0–5 |
| 16 | Lexical rich text and composition text nodes could overlap | §5.4 and §5.5 add explicit boundary rule |
| 17 | No guidance on Result<T,E> to HTTP response mapping | §8.4 added |
| 18 | Docker Compose included app containers that slow local dev | §18.1 simplified to Postgres-only Docker |
| 19 | Phase 0 included work that depends on collections not yet defined | §19 Phase 0 narrowed; access control moves to each phase that introduces collections |
| 20 | Typed EventBus registry recommended prematurely | Kept simple string bus; typed registry deferred to Phase 6 |
| 21 | Hono rate-limit middleware described as built-in — it's third-party | §14.2 corrected; infrastructure-level rate limiting recommended for production |
| 22 | Style resolver didn't handle unpublished tokens (no Tailwind class generated) | §11.4 updated: resolver returns both `classes` and `inlineStyle` |
| 23 | Deployment topology (one Vercel project vs two) unspecified | §8.1 specifies single-project deployment with extraction path for Phase 6 |
| 24 | `infrastructure/event-bus` and `infrastructure/cache` missing from dependency map | Added to §4.4 |
| 25 | `apps/site` listed but never elaborated or delivered in any phase | Removed from §4.1; renderer lives in studio for Phases 0–6 |
| 26 | Migration ownership ambiguous when two processes share one DB | §9.3 clarifies only studio runs migrations; gateway is a consumer |
| 27 | Monorepo build performance with 25+ packages unaddressed | §18.2 adds guidance: IDE for types in dev, `tsc --noEmit` in CI only |
| 28 | §4.1 tree omitted root-level workspace/CI/Docker files and blurred studio vs `payload-config` ownership | §4.1 lists `pnpm-workspace.yaml`, root `package.json`, lockfile, `tsconfig.json`, `docker-compose.yml`, `.github/workflows/`; **Layout notes** state collections/globals are defined only under `infrastructure/payload-config` |

---

## 1. Product Framing

This platform is a **multi-surface authoring system** with Payload as the typed content, auth, workflow, and admin backbone. The Webflow-like canvas is an application layer built on top of Payload's primitives, not inside them.

### Three authoring personas

| Persona | Surface | Primary tools |
|---|---|---|
| Designer | Visual builder canvas | Builder UI, primitive catalog, style inspector |
| Content Editor | Page composer | Constrained section picker, content fields, draft preview |
| Engineer | Code + contract surface | Zod schemas, contract export, runtime binding |

### What Payload owns vs. what we own

| Payload owns | Platform owns |
|---|---|
| Auth, sessions, roles | Business capability matrix |
| Collection CRUD, versions, drafts | Composition lifecycle and publish semantics |
| Admin panel shell | Designer and editor custom views |
| Field modeling | Style schema and node graph model |
| Access control hooks | Role-specific surface gating |

---

## 2. Architecture Overview

```mermaid
C4Context
  title System Context — Builder Platform

  Person(designer, "Designer", "Authors components and style in the visual builder")
  Person(editor, "Content Editor", "Composes pages from approved components")
  Person(engineer, "Engineer", "Registers runtime components and contracts")

  System(platform, "Builder Platform", "Next.js + Payload mono-app with embedded Hono gateway. Admin, builder, composer, and renderer surfaces.")

  System_Ext(vercel, "Vercel", "Hosting + Edge CDN + Fluid Compute")
  System_Ext(neon, "Neon Postgres", "Primary database (pooled endpoint)")
  System_Ext(blob, "Vercel Blob", "Object storage")

  Rel(designer, platform, "Authors in builder canvas")
  Rel(editor, platform, "Composes pages in page composer")
  Rel(engineer, platform, "Registers contracts and runtime components")
  Rel(platform, vercel, "Deployed to")
  Rel(platform, neon, "Reads/writes via Payload local API + Drizzle")
  Rel(platform, blob, "Stores artifacts")
```

### 2.1 End-to-End: Designer Work to Live Site

```mermaid
sequenceDiagram
  participant D as Designer
  participant UI as Builder Canvas
  participant Z as Zustand (local)
  participant GW as Hono Gateway
  participant PL as Payload / Neon DB
  participant AP as Approver
  participant PJ as Publish Job
  participant RT as Renderer (Next.js)
  participant US as Live Site (User)

  Note over D,Z: Authoring — changes are local only
  D->>UI: drag, drop, edit props/styles
  UI->>Z: update local composition tree (instant, in-memory)
  Z-->>UI: canvas re-renders optimistically

  Note over UI,PL: Save Draft — persisted but not live
  D->>UI: click Save Draft
  UI->>UI: validate composition via Zod (prepareForSave)
  UI->>GW: POST /api/gateway/builder/compositions/:id/draft
  GW->>PL: save PageComposition as DRAFT (versions enabled)
  PL-->>GW: ok
  GW-->>UI: 200
  UI->>Z: clear dirty flag

  Note over D,PL: Submit — enters approval workflow
  D->>UI: click Submit for Catalog / Publish
  UI->>GW: POST /api/gateway/builder/compositions/:id/submit
  GW->>PL: set revision status → submitted

  Note over AP,PL: Approval — human gate
  AP->>PL: review revision in Payload admin
  AP->>PL: approve → status → approved

  Note over PJ,RT: Publish Job — makes it live
  PJ->>PL: fetch approved revision + composition tree
  PJ->>PL: create ReleaseSnapshot, set status → published
  PJ->>RT: trigger revalidation (Next.js ISR or on-demand)

  Note over RT,US: Live — visible to the public
  US->>RT: GET /your-page-slug
  RT->>PL: load published PageComposition
  RT->>RT: resolve nodes → runtime components → style bindings
  RT-->>US: rendered HTML + styles
```

**Key points:**
- **Save Draft** persists to the database but the live site is unaffected
- **Zustand is local memory only** — nothing is visible to anyone else until Save Draft
- **The approval step is a human gate** — publishing requires `approved` status
- **The renderer reads from Payload at request time** — it serves the current `published` revision
- **Next.js revalidation** is triggered by the publish job

---

## 3. Architectural Principles

### 3.1 Non-negotiable rules

1. **Single source of truth by concern**
   - Payload documents → persisted content and composition records
   - Zod schemas → input contracts and runtime validation
   - Tailwind `@theme` variables → compiled design token output
   - React components → interactive runtime behavior

2. **No raw Tailwind class strings as canonical data** — store typed style decisions; compile to Tailwind output.

3. **Builder stores a structured composition tree** — not HTML blobs, not flat block arrays.

4. **Domain logic lives in domain packages** — never in Payload hooks, Next.js API handlers, or React components.

5. **Application services are the only entry point to domain mutation** — both the Hono gateway and Payload hooks call application services, never domain aggregates directly.

6. **Lexical rich text and composition text nodes do not overlap.** Lexical is for Payload admin metadata fields only. All visual text content is authored through the composition tree.

### 3.2 Layer dependency rule

```mermaid
flowchart TD
  P[presentation] --> A[application]
  A --> D[domains]
  A --> I[infrastructure]
  I --> D
  D --> K[kernel]
  I --> K
  P --> K

  style K fill:#f5f5f5,stroke:#999
  style D fill:#dbeafe,stroke:#3b82f6
  style A fill:#dcfce7,stroke:#16a34a
  style I fill:#fef9c3,stroke:#ca8a04
  style P fill:#fce7f3,stroke:#db2777
```

- **kernel** — no dependencies; pure types, Result, errors, IDs, events
- **domains** — depends on kernel only
- **application** — depends on domains and kernel; orchestrates use cases
- **infrastructure** — implements domain ports; depends on domains and kernel
- **presentation** — depends on application, kernel; never imports from infrastructure directly

### 3.3 FSD vs DDD — Where Each Applies

| Concern | Methodology | Where |
|---|---|---|
| Domain modeling | DDD — aggregates, entities, value objects, domain events | `packages/domains/*` |
| Frontend code organization | FSD — features, entities, shared, ui | `packages/presentation/*`, `apps/studio/src` |
| Application orchestration | CQRS-lite — commands, queries, handlers | `packages/application/*` |
| Infrastructure implementation | Ports & Adapters (hexagonal) | `packages/infrastructure/*` |

---

## 4. Monorepo Layout

### 4.1 Repo structure

```
/
  pnpm-workspace.yaml           # Declares workspace globs; see §4.4
  package.json                  # Root workspace scripts (dev, db, migrate, lint, typecheck, …); see §18.2
  pnpm-lock.yaml                # Dependency lockfile (generated; not hand-edited)
  tsconfig.json                 # Solution-style TS project references (packages + gateway); see §4.4
  docker-compose.yml            # Local Postgres only; full definition §18.1
  biome.json                    # Repo-wide formatter/linter config
  tsconfig.base.json            # Shared TS compiler defaults for packages / gateway
  .github/
    workflows/                  # CI (lint, typecheck, test); see §17.2

  apps/
    studio/                     # Next.js + Payload app shell: routes, payload.config.ts, tests, env — not collection source files
    gateway/                    # Hono app — builder mutation API (deployed within studio's Vercel project)

  packages/
    kernel/
      src/
        ids/                    # NanoID-based branded ID types
        result/                 # Result<T, E> and AsyncResult<T, E>
        errors/                 # Base domain error types
        events/                 # DomainEvent base type + EventBus interface

    domains/
      design-system/            # Tokens, primitives, style policies
      composition/              # Composition tree, nodes, bindings
      content/                  # Pages, templates, metadata
      publishing/               # Lifecycle: draft → approved → published
      runtime-catalog/          # Runtime component registry
      user-access/              # Roles, capabilities, surface permissions

    application/
      builder/                  # Commands/queries for designer builder
      page-composer/            # Commands/queries for editor surface
      publish-flow/             # Publish lifecycle orchestration
      contract-sync/            # Engineer contract import/export

    presentation/
      builder-ui/               # FSD-structured designer builder UI
      composer-ui/              # FSD-structured editor UI
      admin-extensions/         # Payload custom views
      preview-ui/               # Shared preview surface
      shared/                   # Shared presentation utilities (createSafeStore, etc.)

    infrastructure/
      payload-config/           # Payload collections, globals, hooks, config variants
        src/
          collections/          # All collection definitions
          globals/              # All global definitions
          hooks/                # Server-side hooks
          db.ts                 # Database adapter factory
          base-config.ts        # Shared: collections + globals + hooks + db
          studio-config.ts      # Extends base: admin panel, Lexical, live preview
          headless-config.ts    # Extends base: no admin, no UI deps — for gateway
      persistence/              # Repository implementations + ACLs
      event-bus/                # InProcessEventBus implementation
      blob-storage/             # Vercel Blob adapter
      cache/                    # In-memory cache adapter (Phase 6: Redis)
      telemetry/                # OpenTelemetry setup

    contracts/
      zod/                      # Canonical Zod schemas
      json-schema/              # Derived JSON Schema output

    runtime/
      renderer/                 # React composition tree renderer
      primitives/               # Base primitive components
      code-components/          # Engineer-registered runtime components

    config/
      env/                      # Zod-validated env schema per app
      tailwind/                 # Shared tailwind config + token compiler
```

**Layout notes**

- **Collections and globals** are defined only under `packages/infrastructure/payload-config/src/` (`collections/`, `globals/`). `apps/studio` imports them and assembles `buildConfig` (e.g. DB adapter, `secret`, Lexical, `sharp`, admin `importMap` paths)—it does not duplicate collection modules locally.
- **Optional IDE metadata** (e.g. `.vscode/`, `.cursor/rules/`) may live at the repo root for editor/CI ergonomics; behavior is still governed by this file and §17–18.

### 4.2 Package dependency graph

```mermaid
graph LR
  D_DS[domains/design-system] --> K[kernel]
  D_C[domains/composition] --> K
  D_CT[domains/content] --> K
  D_P[domains/publishing] --> K
  D_RC[domains/runtime-catalog] --> K
  D_UA[domains/user-access] --> K

  A_B[application/builder] --> D_C & D_DS & D_P
  A_PC[application/page-composer] --> D_CT & D_C
  A_PF[application/publish-flow] --> D_P & D_RC

  I[infrastructure/*] --> A_B & A_PC & A_PF
  PR[presentation/*] --> A_B & A_PC
  RT[runtime/*] --> D_C & D_DS & D_RC
  CNT[contracts/*] --> K & D_C & D_DS
```

Arrows point from the **dependent** to its **dependency**.

### 4.3 Shared Kernel

The kernel is depended on by everything and depends on nothing. It must remain minimal.

```ts
// packages/kernel/src/result/index.ts
export type Ok<T> = { ok: true; value: T }
export type Err<E> = { ok: false; error: E }
export type Result<T, E> = Ok<T> | Err<E>
export type AsyncResult<T, E> = Promise<Result<T, E>>

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value })
export const err = <E>(error: E): Err<E> => ({ ok: false, error })

// packages/kernel/src/errors/index.ts
export type DomainErrorCode = string

export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

// packages/kernel/src/events/index.ts
export type DomainEvent<T extends string, P> = {
  type: T
  occurredAt: Date
  payload: P
}

export interface EventBus {
  publish<E extends DomainEvent<string, unknown>>(event: E): Promise<void>
  subscribe<E extends DomainEvent<string, unknown>>(
    type: E['type'],
    handler: (event: E) => Promise<void>,
  ): void
}

// packages/kernel/src/ids/index.ts
import { nanoid } from 'nanoid'

export type BrandedId<T extends string> = string & { __brand: T }
export const makeId = <T extends string>(): BrandedId<T> => nanoid() as BrandedId<T>
```

### 4.4 Package Installation and Dependency Management

#### Workspace bootstrap

**Step 1 — Root `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/kernel'
  - 'packages/domains/*'
  - 'packages/application/*'
  - 'packages/presentation/*'
  - 'packages/infrastructure/*'
  - 'packages/contracts/*'
  - 'packages/runtime/*'
  - 'packages/config/env'
  - 'packages/config/tailwind'
```

**Step 2 — Bootstrap `apps/studio` with Payload**

```bash
pnpm dlx create-payload-app@latest --dir apps/studio
```

When prompted: Postgres adapter, pnpm, minimal template. Verify template names with `--help` — names change between releases.

**Step 3 — Bootstrap `apps/gateway`**

```bash
mkdir -p apps/gateway/src
```

```json
{
  "name": "@repo/gateway",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

#### Dependency placement rules

| Rule | Rationale |
|---|---|
| Install runtime deps in the package that **directly imports** them | Prevents phantom dependencies |
| Install `react` and `react-dom` only in **app-level** packages (`apps/*`) | All `packages/*` that use React declare it as a `peerDependency` |
| Never install a domain package dep in `packages/kernel` | Kernel has zero dependencies by contract |
| Use `workspace:*` for all internal cross-package references | Ensures pnpm links to local source |
| Install shared dev tools at the **root** with `-w` | One version across the repo |
| Never install `payload` inside `packages/*` directly | Use `peerDependency` where Payload types are needed |
| No shared package may import from `@payload-config` | This alias is Next.js-only; apps compose their own config from infrastructure exports |
| Pin `zod` at `^4.0.0` | Use `import { z } from 'zod'` — not the transitional `'zod/v4'` subpath |

#### Complete dependency map

**Root (devDependencies only)**

```bash
pnpm add -D -w @biomejs/biome typescript
```

**`apps/studio`** — bootstrapped by `create-payload-app`, then add:

```bash
pnpm add sharp --filter @repo/studio
pnpm add @tailwindcss/postcss --filter @repo/studio

# Internal workspace packages
pnpm add @repo/kernel @repo/contracts-zod \
  @repo/application-builder @repo/application-page-composer \
  @repo/application-publish-flow \
  @repo/presentation-builder-ui @repo/presentation-composer-ui \
  @repo/presentation-admin-extensions @repo/presentation-preview-ui \
  @repo/presentation-shared \
  @repo/infrastructure-payload-config @repo/infrastructure-persistence \
  @repo/infrastructure-event-bus @repo/infrastructure-blob-storage \
  @repo/infrastructure-telemetry \
  @repo/runtime-renderer @repo/runtime-primitives \
  @repo/config-env @repo/config-tailwind \
  --filter @repo/studio
```

**`apps/gateway`**

```bash
pnpm add hono @hono/node-server --filter @repo/gateway
pnpm add payload @payloadcms/db-postgres --filter @repo/gateway

pnpm add @repo/kernel @repo/application-builder @repo/application-publish-flow \
  @repo/application-contract-sync @repo/infrastructure-payload-config \
  @repo/infrastructure-persistence @repo/infrastructure-event-bus \
  @repo/contracts-zod @repo/config-env \
  --filter @repo/gateway

pnpm add -D tsx @types/node --filter @repo/gateway
```

Note: The gateway installs `payload` and `@payloadcms/db-postgres` directly because it initializes its own Payload instance via `getPayload()`. It uses the **headless** config variant from `@repo/infrastructure-payload-config` — no admin panel, no React dependencies.

**`packages/kernel`** — nanoid only:

```bash
pnpm add nanoid --filter @repo/kernel
```

**`packages/domains/*`** — zod + kernel for each:

```bash
pnpm add zod @repo/kernel --filter @repo/domains-design-system
pnpm add zod @repo/kernel --filter @repo/domains-composition
pnpm add zod @repo/kernel --filter @repo/domains-content
pnpm add zod @repo/kernel --filter @repo/domains-publishing
pnpm add zod @repo/kernel --filter @repo/domains-runtime-catalog
pnpm add zod @repo/kernel --filter @repo/domains-user-access
```

Domain packages must **not** import from each other in business logic. The one exception is explicitly defined ACL modules (§5.8), which must use `import type` only.

**`packages/application/contract-sync`**

```bash
pnpm add @repo/kernel @repo/domains-runtime-catalog @repo/contracts-zod \
  --filter @repo/application-contract-sync
```

**`packages/contracts/zod`**

```bash
pnpm add zod @repo/kernel @repo/domains-composition \
  @repo/domains-design-system @repo/domains-content \
  --filter @repo/contracts-zod
```

**`packages/contracts/json-schema`** — no third-party deps. Uses Zod v4's built-in `z.toJSONSchema()`:

```bash
pnpm add @repo/contracts-zod --filter @repo/contracts-json-schema
```

**`packages/presentation/builder-ui`**

```bash
pnpm add zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities \
  --filter @repo/presentation-builder-ui

pnpm add @repo/application-builder @repo/contracts-zod \
  @repo/runtime-renderer @repo/runtime-primitives \
  @repo/presentation-shared @repo/kernel \
  --filter @repo/presentation-builder-ui
```

React is a peer dependency. dnd-kit legacy packages are used because `@dnd-kit/react` (v0.x) is not yet stable. See §20 for migration plan.

**`packages/presentation/shared`** — Zustand wrapper and shared presentation utilities:

```bash
pnpm add zustand --filter @repo/presentation-shared
```

React is a peer dependency.

**`packages/infrastructure/payload-config`**

```json
{
  "peerDependencies": {
    "payload": "^3.x"
  },
  "dependencies": {
    "@repo/kernel": "workspace:*",
    "@repo/domains-composition": "workspace:*",
    "@repo/domains-design-system": "workspace:*",
    "@repo/domains-content": "workspace:*",
    "@repo/domains-publishing": "workspace:*",
    "@repo/domains-runtime-catalog": "workspace:*",
    "@repo/domains-user-access": "workspace:*"
  }
}
```

Collection definitions in this package must not import React components or admin panel code. Admin-specific components belong in `packages/presentation/admin-extensions` and are wired into the config by `apps/studio` only.

**`packages/infrastructure/event-bus`**

```bash
pnpm add @repo/kernel --filter @repo/infrastructure-event-bus
```

**`packages/infrastructure/persistence`**

```bash
pnpm add @repo/kernel @repo/domains-composition \
  @repo/domains-design-system @repo/domains-content \
  @repo/domains-publishing @repo/domains-runtime-catalog \
  --filter @repo/infrastructure-persistence
```

Payload is a peer dependency.

**`packages/infrastructure/blob-storage`**

```bash
pnpm add @vercel/blob @repo/kernel --filter @repo/infrastructure-blob-storage
```

**`packages/infrastructure/telemetry`**

```bash
pnpm add @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http \
  --filter @repo/infrastructure-telemetry
```

**`packages/runtime/renderer`**

```bash
pnpm add @repo/domains-composition @repo/domains-runtime-catalog \
  @repo/config-tailwind @repo/kernel \
  --filter @repo/runtime-renderer
```

React is a peer dependency.

**`packages/runtime/primitives`**

```bash
pnpm add @repo/domains-design-system @repo/kernel \
  --filter @repo/runtime-primitives
```

React is a peer dependency.

**`packages/runtime/code-components`**

```bash
pnpm add @repo/domains-runtime-catalog @repo/contracts-zod @repo/kernel \
  --filter @repo/runtime-code-components
```

React is a peer dependency.

**`packages/config/tailwind`**

```bash
pnpm add tailwindcss @repo/domains-design-system --filter @repo/config-tailwind
```

**`packages/config/env`**

```bash
pnpm add zod --filter @repo/config-env
```

#### TypeScript project references

Each package has its own `tsconfig.json` extending the shared base with `"composite": true` and `"references"` entries for each workspace dependency.

```json
// tsconfig.base.json (repo root)
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "skipLibCheck": true
  }
}
```

Module resolution per package type:
- **`packages/*`** (non-Next.js): `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
- **`apps/studio`** (Next.js): extend `next/typescript` config
- **`apps/gateway`** (Hono/Node): `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`

#### Adding a new package — checklist

1. Create directory under correct `packages/` subtree
2. Create `package.json` with `@repo/<category>-<name>`, `"private": true`, `"type": "module"`
3. Create `tsconfig.json` extending base with `"composite": true`
4. Add to `pnpm-workspace.yaml` if glob doesn't cover it
5. Install third-party deps with `pnpm add <pkg> --filter @repo/<name>`
6. Add workspace cross-references with `pnpm add @repo/<dep> --filter @repo/<name>`
7. Add `"references"` in `tsconfig.json` for each workspace dep
8. Run `pnpm install` from root
9. Confirm `pnpm tsc --build` passes before writing source

---

## 5. Bounded Contexts

### 5.1 Context map

```mermaid
graph TD
  UA[User Access\nupstream]
  DS[Design System\nupstream]
  C[Composition\ncore]
  CT[Content\ndownstream]
  RC[Runtime Catalog\ndownstream]
  PB[Publishing\ndownstream]

  UA -->|ACL provider| C
  UA -->|ACL provider| DS
  UA -->|ACL provider| PB
  DS -->|style contracts| C
  DS -->|token output| RC
  C -->|composition ref| CT
  C -->|component def| RC
  C -->|revision| PB
  RC -->|runtime bindings| PB
```

### 5.2 User Access

**Aggregate root:** `User`

**Entities:** `Role`, `Capability`, `SurfacePermission`

**Invariants:**
- A `User` must have exactly one `Role` at creation
- `admin` role implies all capabilities
- A `SurfacePermission` references a named surface key — invalid keys are rejected

**Roles and capabilities matrix:**

| Capability | admin | designer | contentEditor | engineer |
|---|---|---|---|---|
| manage tokens | ✓ | ✓ | — | — |
| author components | ✓ | ✓ | — | — |
| compose pages | ✓ | ✓ | ✓ | — |
| register runtime components | ✓ | — | — | ✓ |
| publish to live | ✓ | ✓ | — | — |
| approve for catalog | ✓ | ✓ | — | — |
| manage users | ✓ | — | — | — |

**Domain events:** `UserCreated`, `UserRoleChanged`, `UserDeactivated`

### 5.3 Design System

**Aggregate root:** `DesignTokenSet`

**Entities:** `DesignToken`, `PrimitiveDefinition`, `StyleCapabilitySet`, `SlotContract`, `PropContract`

**Value objects:** `LengthValue`, `ColorValue`, `TokenReference`

**Invariants:**
- `DesignToken` key must match `{category}.{name}` or `{category}.{scale}.{name}`
- Override values must carry a validated unit when length-typed
- A `PrimitiveDefinition` must declare its full `StyleCapabilitySet` before use in composition
- Token keys are immutable after first publish — updates require a new token key

**Token categories:** `color`, `space`, `size`, `radius`, `typography`, `shadow`, `border`, `zIndex`, `opacity`, `transition`, `breakpoint`, `container`

**Typed value shapes:**

```ts
import { z } from 'zod'

export const LengthUnitSchema = z.enum(['px', 'rem', 'em', '%', 'vw', 'vh'])
export const LengthValueSchema = z.object({
  value: z.number(),
  unit: LengthUnitSchema,
})

export const ColorValueSchema = z.object({
  hex: z.string().regex(/^#[0-9a-fA-F]{3,8}$/),
  alpha: z.number().min(0).max(1).optional(),
})

export const TokenReferenceSchema = z.object({
  kind: z.literal('reference'),
  key: z.string().regex(/^[a-z]+(\.[a-z0-9]+)+$/),
})

export type LengthValue = z.infer<typeof LengthValueSchema>
export type ColorValue = z.infer<typeof ColorValueSchema>
export type TokenReference = z.infer<typeof TokenReferenceSchema>
```

**Domain events:** `TokenSetCreated`, `TokenPublished`, `PrimitiveRegistered`, `StylePolicyUpdated`

#### 5.3.4 Component versioning strategy

Breaking changes to a `PrimitiveDefinition` or `PropContract`:
1. New version created as a new `PrimitiveDefinition` with incremented `version` field
2. Old version enters `deprecated` lifecycle status
3. Composer surfaces show deprecation warnings
4. Minimum deprecation window: one published release cycle

### 5.4 Composition

**Aggregate root:** `PageComposition`

**Entities:** `CompositionNode`, `StyleBinding`, `PropBinding`, `SlotAssignment`, `ContentBinding`

**Value objects:** `NodeId`, `NodeKind`, `DefinitionKey`

**Invariants:**
- A `CompositionNode` with `parentId: null` is the root — exactly one per composition
- `childIds` ordering is canonical — reordering is a mutation
- A `StyleBinding` referenced by a node must exist in the same aggregate
- `slotValues` keys must match the node definition's declared `SlotContract`
- `propValues` must pass the node definition's `PropContract` validation before commit

**Text content boundary:** Text content in the composition tree is authored in the builder canvas and stored as `CompositionNode` with `kind: 'text'`. Payload's Lexical rich text editor is used only for content fields outside the composition tree (page-level SEO description, template descriptions, admin notes). A content editor modifies text by editing a text node's `contentBinding`, never through a Payload rich text field that would duplicate the same content.

**Composition node type:**

```ts
import { z } from 'zod'

export const NodeKindSchema = z.enum([
  'primitive',
  'designerComponent',
  'engineerComponent',
  'slot',
  'text',
  'container',
])

export const CompositionNodeSchema = z.object({
  id: z.string(),
  kind: NodeKindSchema,
  definitionKey: z.string(),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()),
  styleBindingId: z.string().optional(),
  propValues: z.record(z.string(), z.unknown()).optional(),
  slotValues: z.record(z.string(), z.array(z.string())).optional(),
  contentBinding: z.object({
    source: z.enum(['inline', 'field', 'global']),
    key: z.string(),
  }).optional(),
  visibility: z.object({ hidden: z.boolean() }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type CompositionNode = z.infer<typeof CompositionNodeSchema>
```

**Style binding:**

```ts
import { z } from 'zod'

const TokenStylePropertySchema = z.object({
  type: z.literal('token'),
  property: z.string(),
  token: z.string(),
})

const OverrideStylePropertySchema = z.object({
  type: z.literal('override'),
  property: z.string(),
  value: z.union([
    z.object({ value: z.number(), unit: z.enum(['px', 'rem', 'em', '%', 'vw', 'vh']) }),
    z.object({ hex: z.string(), alpha: z.number().optional() }),
    z.number(),
    z.string(),
  ]),
})

export const StyleBindingSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  properties: z.array(z.union([TokenStylePropertySchema, OverrideStylePropertySchema])),
})

export type StyleBinding = z.infer<typeof StyleBindingSchema>
```

**Domain events:** `CompositionCreated`, `NodeAdded`, `NodeRemoved`, `NodeReordered`, `NodeStyleChanged`, `NodePropChanged`, `CompositionSavedAsDraft`

### 5.5 Content

**Aggregate root:** `Page`

**Entities:** `PageVariant`, `PageMeta`, `Template`, `ContentEntry`

**Invariants:**
- `slug` must be unique per locale within a site
- A `Page` in `published` status may not be deleted — only archived
- A `Template` must reference a valid `TemplateDefinition` in the Composition domain

**Lexical usage:** Lexical rich text fields on the `Page` collection are reserved for page-level metadata (SEO descriptions, social sharing text) — never for content that is part of the composition tree.

**Domain events:** `PageCreated`, `PageSlugChanged`, `PagePublished`, `PageArchived`

### 5.6 Publishing

**Aggregate root:** `PublishableRevision`

**Entities:** `ApprovalState`, `PublishJob`, `DependencyImpact`, `ReleaseSnapshot`

**Lifecycle state machine:**

```mermaid
stateDiagram-v2
  [*] --> draft : created
  draft --> submitted : submit for review
  submitted --> approved : approved
  submitted --> draft : rejected
  approved --> publishing : publish triggered
  publishing --> published : job succeeded
  publishing --> failed : job failed
  published --> archived : archive
  failed --> draft : retry
  archived --> [*]
```

**Invariants:**
- Only `approved` revisions may be published
- A `PublishJob` is idempotent — re-triggering a succeeded job is a no-op
- Rollback creates a new `PublishJob` pointing at a previous `ReleaseSnapshot`
- `DependencyImpact` must be computed and acknowledged before a breaking component change can be published

**Domain events:** `RevisionSubmitted`, `RevisionApproved`, `RevisionRejected`, `PublishJobStarted`, `PublishJobSucceeded`, `PublishJobFailed`, `RevisionRolledBack`

### 5.7 Runtime Catalog

**Aggregate root:** `RuntimeComponent`

**Entities:** `RuntimeComponentVersion`, `CapabilityManifest`, `RuntimeBinding`

**Invariants:**
- `RuntimeComponent` `key` is globally unique and immutable after registration
- New `RuntimeComponentVersion` must pass contract validation before acceptance
- `bindingStrategy` must be `'static' | 'lazy' | 'remote'`

**Domain events:** `RuntimeComponentRegistered`, `RuntimeComponentVersionPublished`, `RuntimeBindingUpdated`

### 5.8 Anti-Corruption Layer

When consuming cross-context data, ACL modules translate foreign models into local types.

**Design System ACL** (in the composition domain — uses `import type` only):

```ts
// packages/domains/composition/src/acl/design-system-acl.ts
import type { DesignTokenSet } from '@repo/domains-design-system'
import type { TokenReference } from '../value-objects'

export function toTokenReference(tokenSet: DesignTokenSet, key: string): TokenReference | null {
  const token = tokenSet.tokens.find((t) => t.key === key)
  if (!token) return null
  return { kind: 'reference', key: token.key }
}
```

**Payload User ACL** (in infrastructure — this is where Payload types are permitted):

```ts
// packages/infrastructure/persistence/src/acl/user-access-acl.ts
import type { User as PayloadUser } from 'payload'
import type { RequestContext } from '@repo/domains-user-access'

export function toRequestContext(payloadUser: PayloadUser): RequestContext {
  return {
    userId: payloadUser.id as string,
    role: payloadUser.role as string,
    capabilities: resolveCapabilities(payloadUser.role as string),
  }
}
```

Payload user objects are never imported into domain packages. The translation happens at the infrastructure boundary.

### 5.9 Domain Events — Inter-context Communication

```mermaid
flowchart LR
  DS[Design System] -->|TokenPublished| C[Composition]
  C[Composition] -->|CompositionSavedAsDraft| PB[Publishing]
  PB[Publishing] -->|PublishJobSucceeded| RC[Runtime Catalog]
  UA[User Access] -->|UserRoleChanged| C & PB & DS
```

The `EventBus` interface in kernel is the contract. Infrastructure implements it with an in-process synchronous bus. The bus uses string-based event types — a typed registry is deferred to Phase 6 when cross-team event contracts become a real concern.

```ts
// packages/infrastructure/event-bus/src/in-process-bus.ts
import type { DomainEvent, EventBus } from '@repo/kernel/events'

type Handler = (event: DomainEvent<string, unknown>) => Promise<void>

export class InProcessEventBus implements EventBus {
  private handlers = new Map<string, Handler[]>()

  async publish<E extends DomainEvent<string, unknown>>(event: E): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      JSON.parse(JSON.stringify(event)) // catch non-serializable payloads early
    }
    const hs = this.handlers.get(event.type) ?? []
    await Promise.all(hs.map((h) => h(event)))
  }

  subscribe<E extends DomainEvent<string, unknown>>(
    type: E['type'],
    handler: (event: E) => Promise<void>,
  ): void {
    const existing = this.handlers.get(type) ?? []
    this.handlers.set(type, [...existing, handler as Handler])
  }
}
```

---

## 6. Application Layer — CQRS Lite

Every surface interacts with the system exclusively through application service commands and queries. Domain aggregates are never mutated directly from outside this layer.

### 6.1 Pattern

```mermaid
flowchart LR
  UI[Surface / API Handler]
  AS[Application Service]
  AG[Domain Aggregate]
  REPO[Repository]
  EB[Event Bus]

  UI -->|Command or Query| AS
  AS -->|load| REPO
  REPO -->|returns aggregate| AS
  AS -->|mutate| AG
  AS -->|save| REPO
  AS -->|publish event| EB
  AS -->|Result T E| UI
```

### 6.2 Command and query conventions

```ts
// packages/application/builder/src/commands/add-node.ts
import { ok, err, type AsyncResult } from '@repo/kernel/result'
import type { CompositionRepository } from '@repo/domains-composition'
import type { AddNodeInput } from '@repo/contracts-zod'

export type AddNodeError = 'COMPOSITION_NOT_FOUND' | 'INVALID_NODE' | 'SLOT_CAPACITY_EXCEEDED'

export async function addNodeCommand(
  input: AddNodeInput,
  deps: { compositions: CompositionRepository },
): AsyncResult<{ nodeId: string }, AddNodeError> {
  const composition = await deps.compositions.findById(input.compositionId)
  if (!composition) return err('COMPOSITION_NOT_FOUND')

  const result = composition.addNode(input)
  if (!result.ok) return result

  await deps.compositions.save(composition)
  return ok({ nodeId: result.value.id })
}
```

All commands return `AsyncResult<T, E>` — never throw. All queries return `AsyncResult<T, E>` — never return null directly.

### 6.3 Application service index per package

```
packages/application/builder/src/
  commands/
    add-node.ts
    remove-node.ts
    reorder-nodes.ts
    update-node-props.ts
    update-node-style.ts
    save-draft.ts
    submit-for-catalog.ts
  queries/
    get-composition.ts
    get-node-details.ts
    get-available-primitives.ts
  index.ts
```

---

## 7. Persistence — Repository Pattern

Domain aggregates are persisted through repository interfaces defined in domain packages and implemented in infrastructure.

```ts
// packages/domains/composition/src/ports/composition-repository.ts
import type { AsyncResult } from '@repo/kernel/result'
import type { PageComposition } from '../aggregates/page-composition'

export interface CompositionRepository {
  findById(id: string): Promise<PageComposition | null>
  save(composition: PageComposition): AsyncResult<void, 'PERSISTENCE_ERROR'>
  delete(id: string): AsyncResult<void, 'NOT_FOUND' | 'PERSISTENCE_ERROR'>
}
```

Infrastructure implements these using Payload's local API:

```ts
// packages/infrastructure/persistence/src/composition-repository.ts
import type { CompositionRepository } from '@repo/domains-composition'
import type { Payload } from 'payload'
import { ok, err } from '@repo/kernel/result'

export class PayloadCompositionRepository implements CompositionRepository {
  constructor(private payload: Payload) {}

  async findById(id: string) {
    const doc = await this.payload.findByID({ collection: 'page-compositions', id })
    if (!doc) return null
    return mapDocToAggregate(doc)
  }

  async save(composition: PageComposition) {
    try {
      await this.payload.update({
        collection: 'page-compositions',
        id: composition.id,
        data: mapAggregateToDoc(composition),
      })
      return ok(undefined)
    } catch {
      return err('PERSISTENCE_ERROR' as const)
    }
  }
}
```

This repository implementation works identically in both studio and gateway because both initialize Payload with the same collections and database adapter. The Payload instance is provided via dependency injection — the repository does not know which app is using it.

**Always use Payload's local API** for server-side persistence calls. It is type-safe, bypass-auth capable for service-level operations, and has no HTTP overhead. Repository implementations must validate data against the domain's Zod schema before persisting — this is the enforcement point for detecting schema drift.

---

## 8. API and Orchestration — Hono Gateway

### 8.1 Placement and Deployment

The Hono gateway lives in `apps/gateway/` — architecturally separate code with its own middleware stack and test suite. For **Phases 0–5**, it is deployed as a Vercel serverless function within the studio project at `/api/gateway/*`. This avoids CORS, environment variable duplication, and a second deployment pipeline.

The gateway can be extracted to a separate Vercel project in Phase 6 if independent scaling is needed. The code is already decoupled — extraction is a deployment concern, not a code change.

The gateway initializes its own Payload instance using the **headless** config variant:

```ts
// apps/gateway/src/payload.ts
import { getPayload } from 'payload'
import { headlessConfig } from '@repo/infrastructure-payload-config'

let cached: Awaited<ReturnType<typeof getPayload>> | null = null

export async function getPayloadInstance() {
  if (!cached) {
    cached = await getPayload({ config: headlessConfig })
  }
  return cached
}
```

### 8.2 Endpoint groups

```
/api/gateway/builder/
  POST   /compositions/:id/nodes           addNode
  DELETE /compositions/:id/nodes/:nodeId   removeNode
  PATCH  /compositions/:id/nodes/:nodeId   updateNodeProps
  PATCH  /compositions/:id/nodes/:nodeId/style  updateNodeStyle
  POST   /compositions/:id/draft           saveDraft
  POST   /compositions/:id/submit          submitForCatalog

/api/gateway/catalog/
  GET    /components                       listApprovedComponents
  POST   /components/:id/promote           promoteToLive

/api/gateway/contracts/
  GET    /components/:key/schema           exportZodSchema
  POST   /components/:key/schema           importRuntimeContract

/api/gateway/publishing/
  POST   /revisions/:id/approve            approveRevision
  POST   /revisions/:id/publish            publishRevision
  POST   /revisions/:id/rollback           rollbackRevision
```

### 8.3 Hono middleware stack

```ts
// apps/gateway/src/app.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { authMiddleware } from './middleware/auth'
import { builderRouter } from './routes/builder'
import { catalogRouter } from './routes/catalog'

const app = new Hono()
  .use(logger())
  .use(authMiddleware)
  .route('/api/gateway/builder', builderRouter)
  .route('/api/gateway/catalog', catalogRouter)

export default app
```

Note: CORS middleware is not needed in Phases 0–5 because the gateway is same-origin with studio. If extracted to a separate deployment, re-enable CORS with studio origin allowlist.

### 8.4 Error response contract

All gateway endpoints return a consistent JSON envelope:

```ts
// apps/gateway/src/lib/result-to-response.ts
import type { Result } from '@repo/kernel/result'
import type { Context } from 'hono'

const ERROR_STATUS_MAP: Record<string, number> = {
  COMPOSITION_NOT_FOUND: 404,
  NOT_FOUND: 404,
  INVALID_NODE: 422,
  SLOT_CAPACITY_EXCEEDED: 422,
  PERSISTENCE_ERROR: 500,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
}

export function resultToResponse<T, E extends string>(
  c: Context,
  result: Result<T, E>,
): Response {
  if (result.ok) {
    return c.json({ data: result.value }, 200)
  }
  const status = ERROR_STATUS_MAP[result.error] ?? 500
  return c.json({ error: { code: result.error } }, status)
}
```

- **Success:** `{ "data": T }` with HTTP 200/201
- **Error:** `{ "error": { "code": string } }` with appropriate HTTP status

Domain error codes are the API's error contract. They must not change without a migration path.

---

## 9. Persistence Model in Payload

### 9.1 Collections

| Collection | Purpose | Drafts/Versions |
|---|---|---|
| `users` | Auth + role assignment | — |
| `pages` | Page content + composition reference | ✓ |
| `templates` | Page templates | ✓ |
| `page-compositions` | Composition tree data | ✓ |
| `component-definitions` | Stable catalog entities | ✓ |
| `component-revisions` | Immutable revision history | — |
| `primitive-definitions` | Designer primitive registry | ✓ |
| `runtime-components` | Engineer-registered runtime | ✓ |
| `design-token-sets` | Token storage per scope/brand | ✓ |
| `design-token-overrides` | Controlled overrides | — |

### 9.2 Globals

| Global | Purpose |
|---|---|
| `design-system-settings` | Default token set, active brand |
| `builder-settings` | Feature flags for builder surfaces |
| `site-settings` | Site-wide config, base URL, locales |

### 9.3 Migration strategy

Payload uses Drizzle under its Postgres adapter. Migrations are generated and applied from **`apps/studio` only**. The gateway never creates, modifies, or runs migrations — it is a database consumer.

```bash
# Generate migration after schema change (run from repo root)
pnpm --filter @repo/studio exec payload migrate:create

# Apply migrations (run in CI before deploy)
pnpm --filter @repo/studio exec payload migrate

# Status check
pnpm --filter @repo/studio exec payload migrate:status
```

**Rules:**
- Migrations are committed alongside the schema change
- Never run `migrate:fresh` against staging or production
- Every PR that changes a Payload collection must include a migration file
- Rollback plan: each migration PR documents its down-migration as a comment

### 9.4 Seeding

```
packages/infrastructure/persistence/src/seeds/
  design-tokens.seed.ts
  primitive-defs.seed.ts
  users.seed.ts
```

Run seeds in local Docker only: `pnpm seed`

### 9.5 Connection strategy

Both `apps/studio` and `apps/gateway` connect to the same Neon Postgres instance. Neon provides two connection endpoints:

- **Pooled** (hostname includes `-pooler`): routes through PgBouncer, handles up to 10,000 concurrent connections. **Use this for all application connections.**
- **Direct**: connects straight to Postgres, limited by `max_connections`. **Use this only for migration scripts.**

```ts
// packages/infrastructure/payload-config/src/db.ts
import { postgresAdapter } from '@payloadcms/db-postgres'

export function createDbAdapter() {
  return postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL, // must be pooled endpoint
      max: 5, // conservative per-instance limit for serverless
    },
  })
}
```

In local development, Docker Postgres has no pooler. Use the direct connection string with `max: 10`. This is safe because there is only one instance of each app locally.

---

## 10. Builder State Architecture

### 10.1 Zustand store slices

Zustand manages **transient interaction state only**. It is never the source of truth for persisted data.

```mermaid
graph TD
  Z[Zustand Store]
  Z --> SEL[selection\nselectedNodeId, hoveredNodeId]
  Z --> CANVAS[canvas\nzoom, pan, viewport]
  Z --> DRAG[dragSession\ndragging, insertionTarget]
  Z --> HIST[history\nundoStack, redoStack]
  Z --> PROP[propertyInspector\npanelMode, activeTab]
  Z --> DIRTY[dirtyTracking\ndirtyNodeIds, isDirty]
  Z --> PREV[preview\npreviewMode, previewUrl]
  Z --> COMP[localComposition\nnormalizedNodeMap]
```

### 10.2 Local composition vs. persisted composition

```mermaid
sequenceDiagram
  participant UI as Builder UI
  participant Z as Zustand
  participant GW as Hono Gateway
  participant AS as App Service
  participant DB as Payload/DB

  UI->>Z: mutate local node (instant)
  Z->>UI: re-render canvas (optimistic)
  UI->>GW: POST /api/gateway/builder/compositions/:id/draft
  GW->>AS: saveDraftCommand(compositionId, tree)
  AS->>DB: save validated aggregate
  DB-->>AS: ok
  AS-->>GW: Result<ok>
  GW-->>UI: 200
  UI->>Z: clear dirty flag
```

### 10.3 Builder Persistence Contract and Safe Store Pattern

The builder never sends raw Zustand state to the API. Before any save, the local composition is:

1. Assembled into a `PageComposition` shape from the normalized node map
2. Validated against `CompositionSchema` (Zod)
3. Only the validated shape is sent to the gateway

```ts
// packages/presentation/builder-ui/src/lib/persist.ts
import { CompositionSchema } from '@repo/contracts-zod'

export function prepareForSave(nodeMap: NodeMap, rootId: string) {
  const tree = assembleTree(nodeMap, rootId)
  const result = CompositionSchema.safeParse(tree)
  if (!result.success) throw new Error('Invalid composition state — cannot save')
  return result.data
}
```

**Safe store factory:** All presentation packages use `createSafeStore` to prevent Zustand v5's infinite re-render footgun. Selectors returning objects or arrays must use `useShallow` — the factory bakes this in so developers cannot skip it:

```ts
// packages/presentation/shared/src/create-safe-store.ts
import { create, type StateCreator } from 'zustand'
import { useShallow } from 'zustand/shallow'

export function createSafeStore<T>(initializer: StateCreator<T>) {
  const useStoreRaw = create<T>()(initializer)

  function useStore<R>(selector: (state: T) => R): R {
    return useStoreRaw(useShallow(selector))
  }

  useStore.getState = useStoreRaw.getState
  useStore.setState = useStoreRaw.setState
  useStore.subscribe = useStoreRaw.subscribe

  return useStore
}
```

Only `useBuilderStore` (from builder-ui) and `useComposerStore` (from composer-ui) are exposed in the public API of their respective packages. The raw store is internal.

### 10.4 Optimistic updates and conflict resolution

- All builder mutations are **optimistic** — Zustand is updated immediately
- On API failure, the store reverts using the `history` slice
- Concurrent editing is **not** supported in Phases 0–5 — soft locking in Phase 6
- Save operations carry an `updatedAt` timestamp; a newer server `updatedAt` returns `409 Conflict` and the UI prompts the user to refresh

---

## 11. Design System Implementation

### 11.1 Internal style model

Style decisions are stored as typed `StyleBinding` objects. Raw Tailwind class strings are never the canonical model.

### 11.2 Token compilation pipeline

```mermaid
flowchart LR
  DB[(Token Set\nin Payload)] -->|fetch| TC[Token Compiler\npackages/config/tailwind]
  TC -->|generates| CSS["@theme { --color-surface-primary: ...; }"]
  CSS -->|injected into| TW[Tailwind v4 runtime]
  TW -->|produces| U[Utility classes]
  TC -->|also generates| META[Token metadata JSON\nfor property panel]
```

**Build-time:** The token compiler generates `@theme` CSS from the published token set. This CSS is imported into the app's stylesheet. Tailwind v4 generates utility classes from `@theme` variables. `apps/studio` uses `@tailwindcss/postcss` for the Next.js build integration.

**Runtime (builder preview):** When a designer changes a token in the style inspector, the change is injected as a `:root` CSS variable override via a `<style>` tag in the canvas iframe. Tailwind utilities referencing those variables update automatically because Tailwind v4's utilities use `var()` references.

**On publish:** The token compiler regenerates the `@theme` CSS. A Next.js rebuild (or ISR revalidation) picks up the new values. Tokens created at runtime that didn't exist in the previous `@theme` become available as Tailwind utility classes after the rebuild.

### 11.3 Token compiler design

```ts
// packages/config/tailwind/src/compiler.ts
import type { DesignTokenSet } from '@repo/domains-design-system'

export type TokenMeta = {
  key: string
  cssVar: string
  category: string
}

export type CompiledTokenOutput = {
  cssVariables: string
  tokenMetadata: TokenMeta[]
}

export function compileTokenSet(tokenSet: DesignTokenSet): CompiledTokenOutput {
  const cssLines: string[] = []
  const meta: TokenMeta[] = []

  for (const token of tokenSet.tokens) {
    const varName = tokenKeyToCssVar(token.key)
    cssLines.push(`  ${varName}: ${token.resolvedValue};`)
    meta.push({ key: token.key, cssVar: varName, category: token.category })
  }

  return {
    cssVariables: `@theme {\n${cssLines.join('\n')}\n}`,
    tokenMetadata: meta,
  }
}

function tokenKeyToCssVar(key: string): string {
  return '--' + key.replace(/\./g, '-')
}
```

Token variable names must follow Tailwind v4's theme variable namespace conventions (e.g., `--color-*` for color utilities, `--spacing-*` for spacing) to generate the correct utility classes.

### 11.4 Style class generation from StyleBinding

```ts
// packages/runtime/renderer/src/style-resolver.ts
import type { StyleBinding } from '@repo/domains-composition'
import type { TokenMeta } from '@repo/config-tailwind'

export type ResolvedStyle = {
  classes: string
  inlineStyle: Record<string, string>
}

export function resolveStyleBinding(
  binding: StyleBinding,
  tokenMeta: TokenMeta[],
): ResolvedStyle {
  const classes: string[] = []
  const inlineStyle: Record<string, string> = {}

  for (const prop of binding.properties) {
    if (prop.type === 'token') {
      const meta = tokenMeta.find((m) => m.key === prop.token)
      if (meta) {
        // Token exists in compiled @theme — use Tailwind utility class
        classes.push(tokenToTailwindClass(prop.property, prop.token, tokenMeta))
      } else {
        // Token not in compiled set (new/unpublished) — use inline CSS var
        inlineStyle[cssPropName(prop.property)] = `var(${tokenKeyToCssVar(prop.token)})`
      }
    }
    if (prop.type === 'override') {
      inlineStyle[cssPropName(prop.property)] = resolveOverrideValue(prop.value)
    }
  }

  return { classes: classes.join(' '), inlineStyle }
}
```

Published tokens resolve to Tailwind utility classes. Unpublished tokens and overrides resolve to inline `style` props referencing CSS variables. On publish, a rebuild makes new tokens available as utility classes.

---

## 12. Runtime Renderer

### 12.1 Renderer data flow

```mermaid
flowchart TD
  PC[PageComposition] --> RES[Resolver]
  RES -->|lookup| RR[Runtime Registry]
  RES -->|lookup| DS[Design System\nToken Metadata]
  RES --> BUILD[Tree Builder]
  BUILD --> REACT[React Element Tree]
  REACT --> PREVIEW[Preview Surface]
  REACT --> SITE[Public Site]
```

### 12.2 Renderer entry point

```ts
// packages/runtime/renderer/src/index.ts
import type { PageComposition } from '@repo/domains-composition'
import type { RuntimeRegistry } from '@repo/domains-runtime-catalog'
import type { TokenMeta } from '@repo/config-tailwind'
import { renderNode } from './render-node'

export function renderComposition(
  composition: PageComposition,
  registry: RuntimeRegistry,
  tokenMeta: TokenMeta[],
): React.ReactElement {
  const rootNode = composition.nodes[composition.rootId]
  if (!rootNode) throw new Error('No root node found in composition')
  return renderNode(rootNode, composition, registry, tokenMeta)
}
```

---

## 13. Preview Strategy

### 13.1 Preview modes

| Mode | Surface | Method |
|---|---|---|
| Component preview | Builder canvas | The canvas IS the preview — renders from Zustand state |
| Page draft preview | Composer top bar | Next.js draft mode + `admin.preview` URL |
| Published preview | Composer | Next.js ISR or SSR page |

The builder canvas does not use Payload's `livePreview` feature. The canvas renders directly from Zustand state — there is no iframe.

### 13.2 Draft preview (Page Composer)

Payload's `admin.preview` function generates a URL for the preview button in the Payload admin. This enters Next.js draft mode via a secret token.

```ts
// packages/infrastructure/payload-config/src/collections/pages.ts
import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: { drafts: true },
  admin: {
    preview: (doc) => {
      if (!doc?.slug) return ''
      return `${process.env.SITE_URL}/api/preview?secret=${process.env.PREVIEW_SECRET}&slug=${doc.slug}`
    },
  },
  // ...
}
```

The `/api/preview` route in studio validates the secret and enters Next.js draft mode. Payload's `livePreview` (iframe-based real-time editing) can be added in Phase 4 for the composer surface if real-time editing is needed — defer the decision until then.

---

## 14. Auth and Security

### 14.1 Auth strategy

Payload manages JWT-based auth using HTTP-only cookies. The JWT is stateless and validated server-side on each request. For the gateway (same-origin in Phases 0–5), the same JWT cookie is available on every request without CORS configuration.

```mermaid
sequenceDiagram
  participant UI as Browser
  participant ST as Studio (Next.js + Payload)
  participant GW as Hono Gateway (same-origin)

  UI->>ST: POST /api/users/login (credentials)
  ST-->>UI: Set-Cookie: payload-token (HTTP-only)
  UI->>GW: POST /api/gateway/builder/... (cookie sent automatically)
  GW->>GW: Validate JWT via Payload local API
  GW->>GW: ACL → RequestContext
  GW->>GW: Check capability matrix
  GW-->>UI: 200 or 403
```

**User deactivation mitigation:** JWTs cannot be revoked server-side. Set `tokenExpiration` to 15 minutes with auto-refresh on each save operation. A deactivated user's JWT expires within 15 minutes. If immediate revocation is required (enterprise compliance), enable Payload's auth sessions feature (available since v3.44) — this adds server-side session storage but enables instant invalidation.

### 14.2 Security model

| Concern | Implementation |
|---|---|
| CSRF | Same-origin deployment eliminates cross-origin requests in Phases 0–5 |
| CORS | Not needed while gateway is same-origin; re-enable if gateway is extracted |
| Rate limiting | Production: Vercel Edge rate limiting. Development: `hono-rate-limiter` with in-memory store (third-party, not built into Hono) |
| Input validation | All command inputs validated with Zod before reaching application service |
| SQL injection | Drizzle parameterized queries via Payload; no raw SQL |
| Secrets | All secrets in Vercel environment variables; validated at boot via env schema |
| Preview tokens | Time-limited HMAC tokens for draft preview |

### 14.3 Environment schema validation

```ts
// packages/config/env/src/studio.ts
import { z } from 'zod'

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  PAYLOAD_SECRET: z.string().min(32),
  BLOB_READ_WRITE_TOKEN: z.string(),
  SITE_URL: z.string().url(),
  PREVIEW_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'test', 'production']),
})

export const env = EnvSchema.parse(process.env)
```

Runs at boot — a missing or malformed env variable crashes the process with a clear error.

---

## 15. Testing Strategy

### 15.1 Test types per layer

| Layer | Test type | Tool | What is tested |
|---|---|---|---|
| kernel | unit | Vitest | Result types, error types, event bus |
| domains | unit | Vitest | Aggregate invariants, value object validation |
| application | integration | Vitest | Command/query handlers with in-memory repos |
| infrastructure | integration | Vitest + testcontainers | Repo impls against real Postgres |
| presentation | component | Vitest + Testing Library | UI components in isolation |
| E2E | e2e | Playwright | Full builder and composer user flows |

### 15.2 Test structure

Co-located tests:

```
packages/domains/composition/
  src/
    aggregates/
      page-composition.ts
      page-composition.test.ts
```

### 15.3 Phase test gates

| Phase | Test gate |
|---|---|
| 0 | Local boot, auth round-trip, Payload admin accessible, migration runs clean |
| 1 | Token set CRUD, compiler output validates, override policy enforced, `TokenPublished` event fires |
| 2 | Composition validates end-to-end, renderer renders two-level tree, JSON Schema export valid |
| 3 | Builder E2E: create section, add primitives, save draft, reopen, preview renders |
| 4 | Composer E2E: create page, edit content, publish, verify live route |
| 5 | Contract round-trip: export schema, implement runtime component, bind, render |
| 6 | Publish flow E2E: submit, approve, publish, rollback; concurrent save load test |

---

## 16. Observability

### 16.1 Telemetry setup

```ts
// packages/infrastructure/telemetry/src/index.ts
import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export function initTelemetry() {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'builder-platform',
  })
  sdk.start()
}
```

### 16.2 Key traces

- `builder.saveDraft` — duration, compositionId, nodeCount
- `publishing.publishJob` — duration, revisionId, success/failure
- `renderer.render` — duration, nodeCount, cacheHit

---

## 17. CI/CD Pipeline

### 17.1 GitHub Actions pipeline

```mermaid
flowchart LR
  PR[Pull Request] --> LINT[Biome lint + format]
  LINT --> TYPE[tsc --noEmit]
  TYPE --> TEST[Vitest unit + integration]
  TEST --> BUILD[Next.js build]
  BUILD --> PREV[Vercel preview deploy]
  PREV --> E2E[Playwright E2E\nagainst preview URL]
  E2E --> DONE[PR ready to merge]

  MERGE[Merge to main] --> MIGRATE[payload migrate]
  MIGRATE --> DEPLOY[Vercel production deploy]
  DEPLOY --> SMOKE[Smoke tests]
```

### 17.2 Pipeline jobs

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm biome check .

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - run: pnpm tsc --noEmit

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: app
          POSTGRES_DB: builder_test
    steps:
      - run: pnpm test --reporter=verbose

  e2e:
    needs: [lint, typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - run: pnpm playwright test
```

---

## 18. Local Development

### 18.1 Docker Compose

Docker is used for Postgres only in local development. Studio and gateway run natively via `pnpm dev` for faster HMR and better debugger integration.

```yaml
# docker-compose.yml — database only (explicit Compose `name` + non-default host port)
name: contorro

services:
  db:
    image: postgres:16
    restart: unless-stopped
    ports:
      - "${CONTORRO_DB_PORT:-54332}:5432"
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: builder
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d builder"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Local `POSTGRES_URL` must use the published host port (default **54332**), e.g. `postgresql://app:app@127.0.0.1:54332/builder`. Override with root `.env` `CONTORRO_DB_PORT` if needed.

### 18.2 Dev script

```json
{
  "scripts": {
    "dev": "pnpm --filter @repo/studio dev & pnpm --filter @repo/gateway dev",
    "db:up": "docker compose up db -d",
    "db:reset": "docker compose down -v && docker compose up db -d",
    "migrate": "pnpm --filter @repo/studio exec payload migrate",
    "migrate:create": "pnpm --filter @repo/studio exec payload migrate:create",
    "seed": "pnpm --filter @repo/studio exec payload run src/seeds/index.ts",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "lint": "biome check .",
    "format": "biome format --write ."
  }
}
```

**Build performance:** In development, rely on IDE type checking (VS Code) rather than running `tsc --build` continuously. Next.js and `tsx` handle compilation. `tsc --noEmit` runs in CI as a type-checking gate. This keeps the dev loop fast regardless of monorepo size.

### 18.3 Environment-specific config

| Variable | local | staging | production |
|---|---|---|---|
| `DATABASE_URL` | Docker Postgres (direct) | Neon pooled endpoint | Neon pooled endpoint |
| `DATABASE_URL_DIRECT` | Same as DATABASE_URL | Neon direct endpoint | Neon direct endpoint |
| `BLOB_READ_WRITE_TOKEN` | Mock / local file adapter | Vercel Blob staging | Vercel Blob prod |
| `NODE_ENV` | `development` | `production` | `production` |
| `PAYLOAD_SECRET` | Any 32+ char string | Vercel secret | Vercel secret |

`DATABASE_URL_DIRECT` is used only for migration scripts. Application code always uses `DATABASE_URL` (pooled).

---

## 19. Delivery Phases

### Phase timeline

```mermaid
gantt
  title Delivery Phases
  dateFormat  YYYY-MM-DD
  section Phase 0
  Foundation           :p0, 2026-04-14, 14d
  section Phase 1
  Design System Core   :p1, after p0, 14d
  section Phase 2
  Contract & Composition Model :p2, after p1, 14d
  section Phase 3
  Builder MVP          :p3, after p2, 21d
  section Phase 4
  Editor Composer      :p4, after p3, 14d
  section Phase 5
  Engineer Pull-and-Extend :p5, after p4, 14d
  section Phase 6
  Collaboration & Hardening :p6, after p5, 21d
```

### Phase 0 — Foundation

**Goal:** Boot the platform. Every other phase depends on this being stable.

**Deliverables:**
- pnpm workspace monorepo with `biome.json` and `tsconfig.base.json`
- `packages/config/env` with Zod env schema per app
- `packages/kernel` — Result, DomainError, EventBus interface, BrandedId
- `packages/infrastructure/payload-config` — base, studio, headless config variants, DB adapter factory
- Next.js + Payload studio app boots locally and on Vercel
- Hono gateway app boots, initializes Payload via headless config
- Postgres adapter + first migration
- Docker Compose for local Postgres
- `users` collection with role field and basic auth
- GitHub Actions CI skeleton (lint, typecheck, test placeholder)
- Vercel preview deploy pipeline
- Neon pooled connection configured

**Test gate:**
- `pnpm dev` boots both apps without errors
- Payload admin loads at `/admin`
- Login/logout works for all four roles
- Gateway health check confirms DB access
- Vercel preview deploy succeeds
- `pnpm --filter @repo/studio exec payload migrate` runs clean

### Phase 1 — Design System Core

**Goal:** Make the style system real before any UI is built.

**Deliverables:**
- `packages/domains/design-system` — aggregate, entities, value objects, ports
- `packages/infrastructure/persistence` — DesignTokenSet repository
- `design-token-sets` and `design-token-overrides` collections with access control hooks
- `design-system-settings` global
- Token compiler in `packages/config/tailwind`
- `packages/contracts/zod` — `DesignTokenSchema`, `StyleBindingSchema`
- Override policy enforcement in application service
- Design-system admin views in `packages/presentation/admin-extensions`
- `packages/infrastructure/event-bus` — InProcessEventBus wired; `TokenPublished` fires on publish

**Test gate:**
- Designer can create a token set and publish it
- Invalid override rejected (Zod validation, 400 returned)
- Token compiler emits valid `@theme { }` CSS block
- Compiled output injected into app; Tailwind utilities resolve in a test page
- `TokenPublished` event received by a test subscriber

### Phase 2 — Contract and Composition Model

**Goal:** Define the builder language before building the builder UI.

**Deliverables:**
- `packages/domains/composition` — aggregate, entities, ports
- `packages/infrastructure/persistence` — CompositionRepository
- `page-compositions` collection with versions, drafts, access control hooks
- `component-definitions` and `component-revisions` collections
- `packages/domains/runtime-catalog` — skeleton
- `packages/contracts/zod` — `CompositionNodeSchema`, `PropContractSchema`, `SlotContractSchema`
- `packages/contracts/json-schema` — JSON Schema export via `z.toJSONSchema()`
- `packages/runtime/renderer` — initial rendering with `resolveStyleBinding`
- `packages/runtime/primitives` — Box, Text, Stack, Grid, Image (skeleton props)

**Phase 2 primitives:**

| Primitive | Props |
|---|---|
| `Box` | padding, margin, background, border, radius |
| `Text` | content, fontSize, fontWeight, color, align |
| `Stack` | direction, gap, align, justify |
| `Grid` | columns, gap |
| `Image` | src, alt, width, height, objectFit |

**Test gate:**
- `PageComposition` with Stack > Box > Text validates end-to-end
- Renderer renders that tree to React without errors
- `PropContract` for Stack validates correctly
- JSON Schema export produces valid JSON Schema 2020-12

### Phase 3 — Builder MVP

**Goal:** First real designer authoring experience.

**Deliverables:**
- `packages/presentation/builder-ui` — FSD-structured:
  - `features/primitive-catalog`
  - `features/canvas`
  - `features/property-inspector`
  - `features/draft-save`
- `packages/presentation/shared` — `createSafeStore` factory
- Custom Payload admin view routing to builder
- Zustand store all slices wired via `createSafeStore`
- dnd-kit canvas integration
- Node CRUD commands wired through gateway
- Prop editor and style binding editor
- Draft save with `prepareForSave` validation
- Component preview in canvas

**Scope limit:** Five primitives, single breakpoint, no assets, no repeaters, no multi-user locking.

**Test gate (Playwright E2E):**
1. Designer logs in → navigates to builder
2. Drags `Box` onto canvas → `Text` into `Box`
3. Sets `Text` content prop to "Hello"
4. Sets `Box` background token to `color.surface.primary`
5. Saves draft → server confirms
6. Refreshes → composition restored
7. Preview renders with correct styles

### Phase 4 — Editor Composer

**Goal:** Give content editors a constrained page workflow.

**Deliverables:**
- `packages/presentation/composer-ui` — FSD-structured, using `createSafeStore`
- Page creation from template or blank
- Approved component catalog (editor cannot access builder)
- Content field editing controls
- Draft preview via `admin.preview` URL + Next.js draft mode
- Publish flow trigger
- `pages` collection access control hooks
- Lexical rich text scoped to page-level metadata only (SEO, social)

**Test gate (Playwright E2E):**
1. Editor logs in → cannot access `/builder`
2. Creates page from template
3. Edits a `Text` content field
4. Views draft preview — changes visible
5. Publishes → public route resolves
6. Designer's unpublished components not visible in catalog

### Phase 5 — Engineer Pull-and-Extend

**Goal:** Bridge designer structures and code-defined runtime behavior.

**Deliverables:**
- `packages/runtime/code-components` — engineer component registration
- Contract export/import endpoints
- `packages/domains/runtime-catalog` — full implementation
- Runtime binding system
- `CapabilityManifest` model
- Engineer surface admin view

**Test gate:**
1. Engineer exports prop schema for a designer component
2. Implements `RuntimeComponent` against that schema
3. Registers via contract import endpoint
4. Binding verified in runtime catalog
5. Preview renders the enhanced component
6. Schema mismatch caught at registration

### Phase 6 — Collaboration and Release Hardening

**Goal:** Make it operationally safe for production use.

**Deliverables:**
- Approval workflow in publishing surface
- Dependency impact analysis before breaking changes
- Usage analysis — which pages use a component
- Rollback flow — return to previous `ReleaseSnapshot`
- Activity history log per composition and component
- Soft locking — warn when another user has a composition open
- `PublishJob` idempotency hardened
- Payload migration stability audit
- Load test against builder save endpoint
- Typed EventBus registry (replace string-based bus if cross-team event contracts are needed)
- Evaluate: extract gateway to separate Vercel project if scaling demands require it
- Evaluate: migrate from `@dnd-kit/core` to `@dnd-kit/react` if v1.0 has shipped

**Test gate:**
1. Submit → approve → publish → verify live
2. Rollback → verify live reflects rollback
3. Breaking change blocked until dependency impact acknowledged
4. Two users opening same composition → second sees lock warning
5. Load test: 50 concurrent saves without data corruption

---

## 20. Decisions Log

| Decision | Rationale | Alternatives considered |
|---|---|---|
| Payload as persistence backbone | Excellent for typed collections, versions, access control. Not an interactive state container. | Full custom backend |
| Hono gateway deployed within studio | Same-origin eliminates CORS and env duplication. Architecturally separate code, operationally unified deployment. Extraction path available in Phase 6. | Separate Vercel project from Phase 0 |
| Payload config split (base/studio/headless) | Prevents gateway from importing React, Lexical, and admin panel code. Both apps share collections and DB config. | Single config imported everywhere |
| Gateway initializes Payload via `getPayload()` | Full local API access, type safety, hook execution. Officially supported for standalone processes. | REST API calls from gateway to studio |
| Zod v4 as canonical contract source | Built-in `z.toJSONSchema()`, 14x faster parsing, TypeScript compilation improvements. | io-ts, Valibot |
| DDD for domain packages, FSD for presentation | DDD models the problem domain. FSD organizes UI by feature. Complementary. | FSD-only, layered architecture |
| Structured `StyleBinding` over raw Tailwind strings | Validated, diffable, policy-enforceable. Raw class strings are none of these. | CVA |
| InProcessEventBus, string-based, Phase 0–5 | Zero infrastructure dependency. Simple to test. Typed registry deferred to Phase 6. | Typed registry from Phase 0 |
| dnd-kit legacy packages (`@dnd-kit/core`) | `@dnd-kit/react` is v0.x (not stable). Legacy packages work with React 19 and are widely deployed. Migration path: when `@dnd-kit/react` reaches v1.0, evaluate in Phase 6. Canvas is FSD-isolated — swap is contained to one feature directory. | `@dnd-kit/react` v0.x, react-dnd, custom |
| Drizzle migrations via Payload adapter | Payload manages migration lifecycle; Drizzle handles type-safe schema. | Prisma, raw SQL |
| Optimistic UI with `409 Conflict` guard | Best UX for interactive builder. Conflict guard prevents silent data loss. | Pessimistic locking |
| `createSafeStore` wrapper for Zustand | Zustand v5 removed custom equality from `create()`. Selectors returning objects/arrays cause infinite loops without `useShallow`. Wrapper makes the safe path the default. | Document `useShallow` and rely on developer discipline |
| No `payload-field-mappers` package | Composition tree stored as JSON blob — Payload doesn't model node fields. Zod/Payload field duplication is small and intentional (admin metadata). | Automated Zod → Payload field mapper |
| Neon pooled connection for all app traffic | Handles up to 10,000 concurrent connections via PgBouncer. Direct endpoint reserved for migrations only. | Direct connections with manual pool sizing |

---

## 21. What Not to Build (Until Explicitly Phased In)

| Feature | Reason to defer |
|---|---|
| Asset/media library | Depends on composition model being stable |
| Responsive breakpoint authoring | Multiplies property panel complexity |
| Repeaters / conditional visibility | Requires expression language design |
| AI generation features | Depends on contract system being complete |
| Real-time multiplayer | Soft locking in Phase 6 first; CRDT layer after if needed |
| Localization | Depends on content model being stable |
| Animation and interaction design | Requires runtime extension model (Phase 5) first |
| `payload-field-mappers` automation | Duplication between Zod and Payload is small and intentional |
| Typed EventBus registry | Not needed until multiple teams publish/subscribe across contexts |
| Separate gateway deployment | Not needed until scaling demands require it |
| Payload `livePreview` for builder | Builder canvas is its own preview; evaluate for composer in Phase 4 |
