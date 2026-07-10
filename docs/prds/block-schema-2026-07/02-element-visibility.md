# PR 02 — Editor-controlled element visibility

| | |
|---|---|
| **Depends on** | — |
| **Blocks** | PR 06 (Card) |
| **Type** | Capability (new binding channel + render behavior) |

## 1. Summary

Let a designer mark a design element as **hideable by the content editor**, and
let the editor toggle it per page. "Everything should have a visibility option."

## 2. Current state

- `CompositionNode.visibility` already exists in the schema
  (`packages/contracts/zod/src/composition.ts`): `{ hidden: boolean }`.
- It is **latent** — a repo-wide search finds no reader in the renderer, domains,
  or Studio. So today it does nothing.
- `contentBinding` on a node is a **single** channel (editor value *or* collection
  field, mutually exclusive). Visibility is orthogonal to a node's value: an image
  node can have both an `image` value binding **and** a hide toggle. Therefore
  visibility needs its **own** binding channel, not `contentBinding`.

## 3. Design decision (needs sign-off)

Two ways to model "editor can hide this element":

**Option A — catalog-scoped boolean fields (recommended).**
Visibility is a normal catalog `checkbox` field (semantic default `true` =
visible). A node opts in via a new `visibilityBinding` that references that field
by name. Fits the existing "catalog is the contract" model; publish validation and
Payload field generation work unchanged. Cost: each hideable element needs a
declared boolean field in the block (e.g. Card: `imageVisible`, `bodyVisible`,
`linkVisible`, `buttonVisible`).

**Option B — generic per-node editor toggle.**
A node carries `editorHideable: true`; the CMS synthesizes a per-instance
show/hide control outside the catalog. More "automatic," but introduces
per-instance node state that lives outside the block catalog contract — a new
architectural surface (`refactor-plan.md` deliberately routes all editor content
through native catalog fields). Higher risk; deferred.

**This PRD implements Option A.** Option B is noted as out of scope.

## 4. Design (Option A)

### 4.1 Contracts (`composition.ts`)

Add an optional, independent visibility binding to `CompositionNode`:

```ts
visibilityBinding: z
  .object({ source: z.literal("editor"), editorFieldName: z.string() })
  .optional(),
```

Keep the existing `visibility: { hidden }` for a static designer-time hide
(now also honored at render — see 4.3).

### 4.2 Catalog

No new field *type* — reuse `checkbox`. Add a convention: visibility fields are
`checkbox` with `required: false` and are interpreted as "visible when truthy or
unset." Studio surfaces `checkbox` fields as visibility-binding candidates.

### 4.3 Renderer (`render-composition.tsx`)

In `renderNode`, before rendering, resolve effective hidden:

- `node.visibility?.hidden === true` → render `null` (honor the latent flag).
- After injection (4.4) sets `visibility.hidden` from the editor value, the same
  check hides editor-toggled-off nodes.

### 4.4 Injection (`inject-block-values.ts`)

`injectBlockValues` currently only patches `propValues`. Extend it to also read
`node.visibilityBinding`: when present and the referenced boolean field resolves
to `false`, set `node.visibility = { hidden: true }` on the output node. Unset or
`true` → leave visible. Missing value → leave visible (never hide authored content
implicitly).

Keep this in a separate pass/helper (`applyVisibilityBindings`) so the value-patch
logic stays single-responsibility and cognitive complexity stays under the Biome
cap (15).

### 4.5 Studio UX

New control in the property inspector (near the **Content field** binding,
`property-inspector-active.tsx` / a new `visibility-binding-section.tsx`):

- A "Content editor can hide this" select listing the block's `checkbox` fields
  (via a `visibilityBindableFields(entry)` helper, mirroring
  `compatibleCatalogFields`).
- Selecting a field sets `node.visibilityBinding`; "Not hideable" clears it.
- Requires a store action `setNodeVisibilityBinding(fieldName | null)` in
  `studio-store.ts` (alongside `setNodeEditorFieldBinding`).

### 4.6 Payload admin

`checkbox` visibility fields already generate as native Payload checkboxes
(`blocks-from-catalog.ts` `case "checkbox"`). Editors get a normal checkbox per
element. Consider `admin.description` copy like "Show this element" — optional.

## 5. Files touched

| File | Change |
|---|---|
| `packages/contracts/zod/src/composition.ts` | `visibilityBinding` on node |
| `packages/runtime/renderer/src/render-composition.tsx` | honor `visibility.hidden` |
| `packages/runtime/renderer/src/inject-block-values.ts` | `applyVisibilityBindings` pass |
| `packages/presentation/studio/src/features/property-inspector/visibility-binding-section.tsx` *(new)* | designer toggle |
| `packages/presentation/studio/src/features/property-inspector/property-inspector-active.tsx` | mount the section |
| `packages/presentation/studio/src/model/studio-store.ts` | `setNodeVisibilityBinding` |
| `packages/contracts/zod/src/block-catalog.ts` | `visibilityBindableFields` helper (optional) |

## 6. Data model & migration

`visibilityBinding` lives inside the composition JSON (no new SQL column). The
boolean fields themselves are per-block `checkbox` columns added by their block
PRs (PR 06 for Card). No standalone migration for this PR.

## 7. Validation

Visibility checkbox fields are validated by name like any field. Additionally
(optional guard): publish-time check that every `visibilityBinding.editorFieldName`
refers to an existing `checkbox` field of the block — extend
`blockBindingProblems`. Recommended to prevent dangling bindings.

## 8. Tests

- Unit: `renderNode` renders `null` when `visibility.hidden` is true.
- Unit: `applyVisibilityBindings` hides a node when its bound checkbox is `false`;
  keeps it visible for `true`/unset/missing.
- Integration: editor unticks "Show image" on a Card instance → image absent from
  published HTML; retick → present.

## 9. Acceptance criteria

- [ ] Latent `visibility.hidden` is now honored at render.
- [ ] Designer can mark an element hideable by choosing a checkbox field.
- [ ] Editor toggle in `/admin` shows/hides the element on publish and preview.
- [ ] Unset visibility value never hides authored content.
- [ ] `pnpm typecheck`, `pnpm lint`, tests green.

## 10. Risks / open questions

- **Scope of "everything"**: Option A requires a declared boolean per hideable
  element. If the intent is *every node in any design* hideable without declaring
  fields, that is Option B (deferred) and needs its own epic.
- Interaction with slots: hiding a slot-bound node hides its injected blocks too —
  intended, but worth a test.
