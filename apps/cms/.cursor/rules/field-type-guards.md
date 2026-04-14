# Field typing guidance

Prefer generated Payload types from `apps/cms/src/payload-types.ts` for document fields.

When handling unknown JSON payloads:

- Validate with zod schemas from `@repo/contracts-zod`.
- Narrow with explicit guards before using values.

After schema changes, regenerate types with `pnpm --filter @repo/cms exec payload generate:types`.
