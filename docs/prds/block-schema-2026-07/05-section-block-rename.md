# PR 05 — Rename Feature → Section

| | |
|---|---|
| **Depends on** | PR 03 (block slots) |
| **Type** | Block definition (breaking rename + reshape) |

## 1. Summary

Rename the `feature` block to `section` and reshape it to: `heading`, `eyebrow`
(new plain text), primary + secondary button, and a slot. Per direction, the old
`body` and `image` fields are **dropped** from this block.

## 2. Current Feature (`block-catalog.ts`)

| Field | Type | Required |
|---|---|---|
| `heading` | text | ✅ |
| `body` | richText | — |
| `image` | image | — |

## 3. Target Section

| Field | Type | Required | Note |
|---|---|---|---|
| `heading` | text | ✅ | kept |
| `eyebrow` | text | — | new (plain text above heading) |
| `primaryButton` | button | — | new |
| `secondaryButton` | button | — | new |
| `slot` | slot | — | new (PR 03) |

```ts
{
  slug: "section",
  label: "Section",
  fields: [
    { name: "eyebrow", type: "text", label: "Eyebrow", required: false },
    { name: "heading", type: "text", label: "Heading", required: true },
    { name: "primaryButton", type: "button", label: "Primary button", required: false },
    { name: "secondaryButton", type: "button", label: "Secondary button", required: false },
    { name: "slot", type: "slot", label: "Content slot", required: false },
  ],
}
```

`eyebrow` reuses the existing `text` field type — no new type needed.

## 4. Breaking change (double)

Both the **slug** (`feature` → `section`) and the **field set** change:

- `components.blockType === "feature"` designs no longer match a catalog entry
  (would fail publish validation with "Unknown block type").
- Dropped `body`/`image` orphan those bindings/values.
- Every reference to the `feature` slug must be updated.

Per product-not-live policy: regenerate the initial migration + `pnpm db:reset`;
update seeds and any fixtures. No data-preserving migration.

### 4.1 Slug references to update (grep `"feature"` before implementing)

- `apps/cms/src/seeds/seed-content-fixtures.ts` (seeded Feature design + any page
  block rows using it).
- `apps/cms/src/seeds/index.ts` if it names the block.
- `apps/cms/tests/**` fixtures/specs referencing `feature`
  (e.g. `blocks-content-model.int.spec.ts`, `seedPagesRegionBlockAdmin.ts`,
  `seedBridgeE2e.ts`).
- Regenerated `apps/cms/src/payload-types.ts` / `payload-generated-schema.ts`.

## 5. Files touched

| File | Change |
|---|---|
| `packages/contracts/zod/src/block-catalog.ts` | replace `feature` entry with `section` |
| `apps/cms/src/seeds/seed-content-fixtures.ts` | rename design `blockType`, rebind fields, add slot node |
| `apps/cms/tests/**` | update `feature` → `section` references |
| `apps/cms/src/payload-types.ts` | regenerated |
| `apps/cms/src/migrations/*` | regenerated initial migration |

## 6. Seed / design work

The seeded design must set `blockType: "section"`, bind `eyebrow` (text node),
`heading` (heading/text node), two button nodes to `primaryButton`/
`secondaryButton`, and a `primitive.slot` node to `slot`.

## 7. Tests

- Integration: seeded Section design publishes; `heading` required-once enforced.
- Integration: a Section page instance renders eyebrow + heading + buttons + slot
  children.
- Regression: no remaining `feature` slug references (grep clean).

## 8. Acceptance criteria

- [ ] Block type is `section`; no `feature` references remain.
- [ ] Section exposes eyebrow/heading/two buttons/slot in `/admin`.
- [ ] Seeded Section design publishes and renders.
- [ ] `pnpm --filter @repo/cms generate:types` run; migration regenerated.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test:int` green.

## 9. Checks

```bash
pnpm --filter @repo/cms generate:types
pnpm migrate:create && pnpm migrate   # or pnpm db:reset locally
pnpm lint && pnpm typecheck && pnpm test:int
pnpm seed
```
