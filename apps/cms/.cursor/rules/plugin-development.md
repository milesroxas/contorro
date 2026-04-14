# Plugin usage in the CMS app

Current `apps/cms/src/payload.config.ts` sets `plugins: []`.

If adding plugin:

- Prefer wiring in `packages/infrastructure/payload-config` so config stays centralized.
- Ensure plugin does not bypass layer boundaries.
- Regenerate types/import map if plugin changes fields/admin components.
- Validate with lint/typecheck/integration tests.
