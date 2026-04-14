# Contorro

Monorepo for multi-surface authoring: a **CMS app** (Next.js + Payload), a **gateway** service, and **Studio** presentation packages (visual composition + design-system UI).

| What | Where | Package |
|------|--------|---------|
| CMS host (admin, APIs, Payload) | `apps/studio` | `@repo/cms` |
| Gateway (Hono) | `apps/gateway` | `@repo/gateway` |
| Studio UI (embedded in admin, CMS-agnostic transport) | `packages/presentation/studio` | `@repo/presentation-studio` |

**Docs**

- Implementation map: [`docs/app/README.md`](docs/app/README.md)
- Repo boundaries and workflows: [`AGENTS.md`](AGENTS.md)
- CMS app–specific notes: [`apps/studio/README.md`](apps/studio/README.md), [`apps/studio/AGENTS.md`](apps/studio/AGENTS.md)

**Common commands** (see `docs/app/README.md` for the full list): `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:up`.
