# PR 06 — New Card block

| | |
|---|---|
| **Depends on** | PR 01 (link field type), PR 02 (element visibility) |
| **Type** | Block definition (new block + seed) |

## 1. Summary

Add a new `card` block: an `image`, a `body` (rich text), a whole-card **link**
(clickable card, no button chrome required), a `button`, and a per-element
**visibility** toggle content editors control.

## 2. Target Card

| Field | Type | Required | Purpose |
|---|---|---|---|
| `image` | image | — | card media |
| `body` | richText | — | card copy |
| `link` | link | — | makes the card (its container) clickable |
| `button` | button | — | optional explicit CTA |
| `imageVisible` | checkbox | — | editor show/hide image (default visible) |
| `bodyVisible` | checkbox | — | editor show/hide body |
| `buttonVisible` | checkbox | — | editor show/hide button |

```ts
{
  slug: "card",
  label: "Card",
  fields: [
    { name: "image", type: "image", label: "Image", required: false },
    { name: "body", type: "richText", label: "Body", required: false },
    { name: "link", type: "link", label: "Card link", required: false },
    { name: "button", type: "button", label: "Button", required: false },
    { name: "imageVisible", type: "checkbox", label: "Show image", required: false },
    { name: "bodyVisible", type: "checkbox", label: "Show body", required: false },
    { name: "buttonVisible", type: "checkbox", label: "Show button", required: false },
  ],
}
```

### 2.1 Visibility model

Uses PR 02 Option A: each visibility `checkbox` is bound to its element node via
`node.visibilityBinding` (not `contentBinding`, so the element keeps its value
binding too). "Visible when truthy or unset." The card `link` itself is toggled by
whether the editor fills the link target (empty target → unwrapped, per PR 01);
an explicit `linkVisible` is optional and omitted here to keep the field set lean —
add it only if editors need to disable a filled link without clearing it.

## 3. Clickable-card design guidance (HTML validity)

Per PR 01 §9, an `<a>`-wrapped container must not contain another interactive
`<a>` (the card `button`). Seeded Card design options:

- **Recommended:** bind `link` to the card's media/body wrapper box, and place the
  `button` **outside** that wrapper (sibling), so the anchor never nests the
  button.
- Alternatively bind `link` to the outer card box and omit the `button` for that
  design (pure clickable card).

Document this in the seed and in Studio guidance copy.

## 4. Files touched

| File | Change |
|---|---|
| `packages/contracts/zod/src/block-catalog.ts` | add `card` entry |
| `apps/cms/src/seeds/seed-content-fixtures.ts` | seed a Card design (bindings + visibility bindings) |
| `apps/cms/src/payload-types.ts` | regenerated |
| `apps/cms/src/migrations/*` | regenerated initial migration |

Depends on `link` (PR 01) and `visibilityBinding` + render/injection (PR 02) being
present.

## 5. Seed / design work

Seed a `card` design (`blockType: "card"`) that:

- Binds an `primitive.image` node to `image`, a `primitive.text` node to `body`,
  a `primitive.button` node to `button`.
- Binds a container box to `link` (clickable card), following §3 guidance.
- Sets `visibilityBinding` on the image/body/button nodes to
  `imageVisible`/`bodyVisible`/`buttonVisible`.

## 6. Tests

- Integration: Card publishes with no required fields (all optional) and renders
  image + body + button.
- Integration: filled `link` wraps the bound container in `<a>`; empty leaves it
  unwrapped.
- Integration: editor unticks "Show image" → image absent from published HTML;
  body/button unaffected.
- Integration: HTML validity — bound button is not rendered inside the link
  anchor (per §3 seed layout).

## 7. Acceptance criteria

- [ ] `card` block available in `/admin` with image/body/link/button + three
      visibility checkboxes.
- [ ] Seeded Card design publishes and renders; clickable-card link works.
- [ ] Per-element visibility toggles take effect on publish and preview.
- [ ] No nested `<a>` in the seeded clickable-card layout.
- [ ] `pnpm --filter @repo/cms generate:types` run; migration regenerated.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test:int` green.

## 8. Checks

```bash
pnpm --filter @repo/cms generate:types
pnpm migrate:create && pnpm migrate   # or pnpm db:reset locally
pnpm lint && pnpm typecheck && pnpm test:int
pnpm seed
```
