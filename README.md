# Contorro

Monorepo for multi-surface authoring: a **CMS app** (Next.js + Payload), a **gateway** service, and **Studio** presentation packages (visual composition + design-system UI).

| What | Where | Package |
|------|--------|---------|
| CMS host (admin, APIs, Payload) | `apps/cms` | `@repo/cms` |
| Gateway (Hono) | `apps/gateway` | `@repo/gateway` |
| Studio UI (hosted at `/studio` in the CMS app, CMS-agnostic transport) | `packages/presentation/studio` | `@repo/presentation-studio` |

**Docs**

- Implementation map: [`docs/app/README.md`](docs/app/README.md)
- Repo boundaries and workflows: [`AGENTS.md`](AGENTS.md)
- CMS app–specific notes: [`apps/cms/README.md`](apps/cms/README.md), [`apps/cms/AGENTS.md`](apps/cms/AGENTS.md)

**Common commands** (full list: [`docs/app/README.md`](docs/app/README.md)):

| Area | Examples |
|------|----------|
| Dev | `pnpm dev`, `pnpm dev:cms`, `pnpm dev:studio` |
| Quality | `pnpm lint`, `pnpm lint:fix`, `pnpm tc`, `pnpm fmt` |
| Tests | `pnpm test`, `pnpm test:cov`, `pnpm test:watch`, `pnpm e2e`, `pnpm test:gw` |
| DB / data | `pnpm db:up`, `pnpm migrate`, `pnpm seed`, `pnpm payload -- …` |
| CI | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — details in [`docs/app/README.md`](docs/app/README.md#continuous-integration-github-actions) |
