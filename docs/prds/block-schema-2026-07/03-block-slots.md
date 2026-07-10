# PR 03 — Block slots (nested blocks inside a design)

| | |
|---|---|
| **Depends on** | — |
| **Blocks** | PR 04 (Hero), PR 05 (Section) |
| **Type** | Capability (nested content model + render pipeline) |

## 1. Summary

Let a designer place a **slot** inside a block design (Hero, Section) where a
content editor can drop **more blocks**. This is nested blocks: a block instance
carries child block rows that render into a slot node of its design.

## 2. Current state

- `primitive.slot` exists (`packages/domains/composition/src/primitives.ts`,
  `defaultPropValues: { slotId: "main" }`) and renders via
  `primitives/slot.tsx`.
- Slots today only resolve at the **page-template** level:
  `renderPageBlocksBySlot` (`apps/cms/src/lib/render-designer-content.tsx`) groups
  page `contentSlots[]` by `slotId` and passes them to
  `renderComposition(template, registry, { slotContent })`. `renderNode` injects
  `slotContent[slotId]` under each `primitive.slot`.
- A `primitive.slot` placed inside a **block design** currently receives no
  `slotContent`, so it renders as an empty `<div>`. There is no field type, no
  Payload nesting, and no injection path for editor blocks inside a block.

## 3. Design

### 3.1 Catalog (`block-catalog.ts`)

- Add `"slot"` to `BlockFieldType`.
- Bindable key: `slot: ["primitive.slot"]`.
- Extend `BlockFieldSpec` with an optional slot descriptor controlling which block
  types may be nested:

```ts
type BlockFieldSpec = {
  name: string;
  type: BlockFieldType;
  label: string;
  required: boolean;
  /** For type: "slot" — block slugs allowed inside. Defaults to all leaf blocks. */
  allowedBlocks?: string[];
};
```

### 3.2 Payload nesting + recursion guard (`blocks-from-catalog.ts`)

`case "slot"` emits a native Payload `blocks` field whose `blocks` are generated
from the catalog — **but slot fields on those nested blocks are dropped** to stop
infinite config recursion:

- Introduce `blocksFromCatalog({ allowSlots }: { allowSlots: boolean })`.
  - Top level: `allowSlots: true` (Hero/Section keep their slot field).
  - Nested (inside a slot): `allowSlots: false` — `fieldFromSpec` skips `slot`
    fields, so nested blocks cannot themselves declare slots.
- **Nesting is one level deep.** Documented constraint; prevents unbounded trees
  and config-build recursion.
- `allowedBlocks` filters the nested block set when present.

Each nested block row keeps the same shape as a top-level block row: typed content
fields + a `design` relationship filtered to `{ blockType, _status: published }`
(reuse `designField`).

### 3.3 Slot ↔ field mapping

- The designer binds a `primitive.slot` node to the slot field via the existing
  **Content field** dropdown (contentBinding `source: "editor"`,
  `editorField.name = <slot field name>`).
- **Convention:** at render, the slot field name maps to the bound slot node's
  `propValues.slotId`. The editor's child blocks for that field render into that
  node.

### 3.4 Render (`render-designer-content.tsx`)

Extend `renderOneBlock`:

1. Scalar/link/visibility values continue through `injectBlockValues`.
2. For each `slot` field in the block's catalog entry, read the block row's nested
   blocks array (`block[fieldName]`), render each child via a recursive call to
   the existing single-block renderer, and collect them.
3. Find the design node bound to that slot field; use its `slotId` to build a
   `slotContent` map.
4. Pass `renderComposition(injected, registry, { slotContent })`.

Factor the "render one block row → ReactNode" logic so it can recurse for child
blocks (guard depth = 1, matching the config guard). Keep helpers small for the
Biome complexity cap.

### 3.5 Publish/normalization

- Draft vs published child designs follow the same path as top-level blocks
  (`draftDesignComposition` / populated relation), so preview shows draft child
  designs (audit M3/M8 parity).
- Unknown/parse-failing child block designs are skipped with a logged error, same
  as top-level (`renderOneBlock` already logs skips).

## 4. Files touched

| File | Change |
|---|---|
| `packages/contracts/zod/src/block-catalog.ts` | `slot` type, `allowedBlocks`, bindable key |
| `packages/infrastructure/payload-config/src/blocks-from-catalog.ts` | `slot` → nested `blocks`, `allowSlots` guard |
| `apps/cms/src/lib/render-designer-content.tsx` | render child blocks into design slot |
| `packages/runtime/renderer/src/inject-block-values.ts` | ignore `slot` fields in scalar patch switch |

## 5. Data model & migration

Adds a nested `blocks` column set per block that declares a slot (lands with
Hero/Section, PR 04/05). Product-not-live: regenerate initial migration +
`pnpm db:reset` rather than a data-preserving migration.

## 6. Validation

- `blockBindingProblems` counts a `slot` field binding by name like any field
  (required slot must be bound once). Works unchanged.
- Add a guard: a node bound to a `slot` field must be `primitive.slot`
  (type-compatibility already enforced in Studio via bindable keys; add a
  publish-time assertion for safety).

## 7. Tests

- Unit: `blocksFromCatalog({ allowSlots: false })` produces no `slot` fields
  (recursion guard).
- Integration: a Hero instance with two child blocks in its slot renders both
  children inside the design's slot node, in order.
- Integration: nested block whose design is unpublished is skipped and logged;
  siblings still render.
- Integration: draft preview renders draft child designs.

## 8. Acceptance criteria

- [ ] Designer can bind a `primitive.slot` node to a `slot` catalog field.
- [ ] `/admin` shows a nested blocks field on the block; editor can add child
      blocks (one level deep).
- [ ] Published page renders child blocks inside the design's slot region.
- [ ] Nested blocks cannot themselves expose slots (guard verified).
- [ ] `pnpm typecheck`, `pnpm lint`, integration tests green.

## 9. Risks / open questions

- **Multiple slots per design**: supported if each slot node has a distinct
  `slotId` and each maps to its own `slot` field. Hero/Section ship with one slot
  each; multi-slot is covered by the same mapping but tested lightly.
- **Depth cap = 1**: intentional. Deeper nesting is a future epic (would need a
  cycle guard and config-generation strategy beyond dropping slot fields).
- **Studio canvas preview** of an unfilled slot inside a design shows an empty
  region; consider a placeholder affordance (out of scope, note for follow-up).
