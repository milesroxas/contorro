# PR 01 — `link` field type (clickable elements)

| | |
|---|---|
| **Depends on** | — |
| **Blocks** | PR 06 (Card) |
| **Type** | Capability (new field-type vocabulary) |

## 1. Summary

Add a `link` field type to the block catalog: a link target (URL or internal
page + open-in-new-tab) **without a visible label**. Binding a `link` field to a
container/media node makes that whole element clickable — the primary use case is
a **clickable card** with no button chrome.

## 2. Motivation / user story

> As a designer, I want to make an entire Card (or any box/image) clickable and
> point it at a URL or page the content editor fills in, without adding a button.

`button` already models label + target, but it always renders as an `<a>` with
text. A bare `link` lets the designer attach a destination to an existing element.

## 3. Design

### 3.1 Catalog (`packages/contracts/zod/src/block-catalog.ts`)

- Add `"link"` to `BlockFieldType`.
- Add bindable primitive keys. A link wraps a container or media element:

```ts
// BLOCK_FIELD_BINDABLE_DEFINITION_KEYS
link: ["primitive.box", "primitive.section", "primitive.image"],
```

Rationale: these are the elements a designer would make "the clickable card." We
deliberately exclude `primitive.button` (it already carries its own link) and
text/heading (link-wrapping inline text is a future concern).

### 3.2 Payload field generation (`blocks-from-catalog.ts`)

Add a `case "link"` to `fieldFromSpec` that emits a `group` mirroring the button
group **minus the `label`**:

- `linkType` select: `url` | `page` (default `url`)
- `url` text (shown when `linkType !== "page"`)
- `page` relationship → `pages` (shown when `linkType === "page"`)
- `openInNewTab` checkbox (default `false`)

Extract the shared link sub-fields from `buttonGroupField` into a helper
(`linkTargetFields(required)`) reused by both button and link to avoid drift.

### 3.3 Render-time injection (`inject-block-values.ts`)

Add `linkPatch(value)` and wire it into `propValuesPatchForField`. It reads the
populated relation doc (same shape as `buttonPatch`, reusing `buttonHref`) and
returns:

```ts
{ href, linkType: "url", openInNewTab }   // omit href when target is empty
```

`href` is written to `propValues.href` so the target primitive can render an
anchor. No id→URL resolver — `buttonHref` already resolves `page` relations to
`/slug` from the populated doc.

### 3.4 Clickable container rendering (renderer primitives)

`Box`/`Section`/`Image` must render as (or wrap in) an `<a>` when their
`propValues.href` is a non-empty string.

- Preferred: a small shared `LinkWrapper` in the renderer that, given
  `propValues.href`, wraps children in `<a href rel target>` (mirrors
  `primitives/button.tsx` anchor logic) and otherwise renders children as-is.
- `Box` (`primitives/box.tsx`) and `Section` opt in via that wrapper; `Image`
  wraps its `<img>`.

Accessibility note: a link with no text content needs an accessible name. When a
box is link-bound and contains no text, fall back to `aria-label` from
`propValues.alt`/a design-provided label (documented as a known limitation if not
provided).

### 3.5 Studio binding UI

No new component needed. `link` appears in the existing **Content field**
dropdown (`block-field-binding-section.tsx`) for box/section/image nodes because
`compatibleCatalogFields` reads `BLOCK_FIELD_BINDABLE_DEFINITION_KEYS`.

## 4. Files touched

| File | Change |
|---|---|
| `packages/contracts/zod/src/block-catalog.ts` | `link` type + bindable keys |
| `packages/infrastructure/payload-config/src/blocks-from-catalog.ts` | `link` group field + extract `linkTargetFields` |
| `packages/runtime/renderer/src/inject-block-values.ts` | `linkPatch` |
| `packages/runtime/renderer/src/primitives/box.tsx` | link wrapper |
| `packages/runtime/renderer/src/primitives/section.tsx` | link wrapper |
| `packages/runtime/renderer/src/primitives/image.tsx` | link wrapper |
| `packages/runtime/renderer/src/primitives/link-wrapper.tsx` *(new)* | shared anchor wrapper |

## 5. Data model & migration

Adds no columns until a block declares a `link` field (PR 06). This PR is
type-vocabulary + rendering only. No migration on its own.

## 6. Validation

Inherited: `blockBindingProblems` validates `link` fields by name like any other
(required-once / no-unknown / no-duplicate). No new validation code.

## 7. Tests

- Unit: `linkPatch` returns `href` for URL and page-relation values; returns
  `null` for empty/missing targets (never blanks authored content).
- Unit: `LinkWrapper` renders `<a>` only when `href` present; passes through
  otherwise; sets `rel`/`target` for new-tab.
- Integration (with PR 06 or a fixture): a box bound to a `link` field renders an
  anchor around its children on the published page.

## 8. Acceptance criteria

- [ ] Designer can bind a `link` field to a box/section/image node in Studio.
- [ ] Published render wraps the element in `<a>` pointing at the editor's URL or
      selected page, honoring open-in-new-tab.
- [ ] Empty/missing link value leaves the element unwrapped (no dead `<a>`).
- [ ] `pnpm typecheck`, `pnpm lint`, renderer unit tests green.

## 9. Risks

- **Accessible name** for text-less link-wrapped boxes — document/enforce an
  `aria-label` source.
- **Nested interactive content** (a link inside a link-wrapped card, e.g. Card's
  own `button`) produces invalid HTML. Card design guidance (PR 06) should avoid
  placing a bound `button` inside a link-bound container, or the wrapper should
  downgrade to a non-anchor click target. Call out in PR 06.
