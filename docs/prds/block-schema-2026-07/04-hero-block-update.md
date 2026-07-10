# PR 04 — Hero: primary/secondary buttons + slot

| | |
|---|---|
| **Depends on** | PR 03 (block slots) |
| **Type** | Block definition (catalog + seed) |

## 1. Summary

Update the Hero block: replace the single `cta` button with a **primary** and
**secondary** button, and add an editor **slot** for nested blocks.

## 2. Current Hero (`block-catalog.ts`)

| Field | Type | Required |
|---|---|---|
| `heading` | text | ✅ |
| `body` | richText | — |
| `image` | image | — |
| `cta` | button | — |

## 3. Target Hero

| Field | Type | Required | Note |
|---|---|---|---|
| `heading` | text | ✅ | unchanged |
| `body` | richText | — | unchanged |
| `image` | image | — | unchanged |
| `primaryButton` | button | — | replaces `cta` |
| `secondaryButton` | button | — | new |
| `slot` | slot | — | new (PR 03) — editors add blocks here |

```ts
{
  slug: "hero",
  label: "Hero",
  fields: [
    { name: "heading", type: "text", label: "Heading", required: true },
    { name: "body", type: "richText", label: "Body", required: false },
    { name: "image", type: "image", label: "Image", required: false },
    { name: "primaryButton", type: "button", label: "Primary button", required: false },
    { name: "secondaryButton", type: "button", label: "Secondary button", required: false },
    { name: "slot", type: "slot", label: "Content slot", required: false },
  ],
}
```

## 4. Breaking change

Removing `cta` orphans any Hero design bound to `cta` and any stored `cta` value.
Per product-not-live policy: regenerate the initial migration + `pnpm db:reset`;
re-bind seed Hero designs to `primaryButton`. No data-preserving migration.

## 5. Files touched

| File | Change |
|---|---|
| `packages/contracts/zod/src/block-catalog.ts` | Hero fields |
| `apps/cms/src/seeds/seed-content-fixtures.ts` | Hero design: bind two buttons + a `primitive.slot` node to `slot` |
| `apps/cms/src/payload-types.ts` | regenerated |
| `apps/cms/src/migrations/*` | regenerated initial migration |

## 6. Seed / design work

The seeded Hero design (`seed-content-fixtures.ts`) must:

- Bind a `primitive.button` node to `primaryButton` and another to
  `secondaryButton`.
- Contain a `primitive.slot` node bound to the `slot` field (slotId convention
  per PR 03 §3.3).
- Keep existing `heading`/`body`/`image` bindings.

## 7. Tests

- Integration: publishing the seeded Hero design passes binding validation with
  the new fields; publishing without `heading` bound still fails (required).
- Integration: a page Hero instance with two buttons + one child block in the slot
  renders all three.

## 8. Acceptance criteria

- [ ] Hero exposes `primaryButton`, `secondaryButton`, and a `slot` in `/admin`.
- [ ] Seeded Hero design publishes and renders correctly.
- [ ] `pnpm --filter @repo/cms generate:types` run; migration regenerated.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test:int` green.

## 9. Checks

```bash
pnpm --filter @repo/cms generate:types
pnpm migrate:create && pnpm migrate   # or pnpm db:reset locally
pnpm lint && pnpm typecheck && pnpm test:int
pnpm seed
```
