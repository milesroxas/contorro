# Field/data contract rules

- Composition payloads must validate against `PageCompositionSchema` from `@repo/contracts-zod`.
- Keep canonical visual body content in composition tree, not overlapping rich-text body fields.
- Token/style bindings should remain typed and resolved through runtime/config packages.

When changing field shape in collections:

1. Update collection config in infrastructure payload-config.
2. Regenerate Payload types: `pnpm --filter @repo/cms run generate:types` (and `pnpm --filter @repo/cms run generate:importmap` if admin components changed).
3. Update zod contracts if external API payload shape changes.
