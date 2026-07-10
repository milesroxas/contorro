# Epic: Block schema update — Studio-mappable Hero, Section, Card

| | |
|---|---|
| **Date** | 2026-07-09 |
| **Owner** | Miles Roxas |
| **Status** | Draft — for review before implementation |
| **Companion docs** | `docs/refactor-plan.md` (architecture), `AGENTS.md` (repo boundaries) |

## 1. Goal

Update the block catalog so designers can map Studio designs onto richer block
contracts. Three block-authoring outcomes:

1. **Hero** gains a primary + secondary button and an editor **slot** (a region
   inside the design where content editors drop more blocks).
2. **Feature** is renamed to **Section** and re-shaped: `heading`, `eyebrow`
   (new plain text), primary + secondary button, and a slot.
3. A new **Card** block: `image`, `body`, a whole-card **link** (clickable card,
   no button chrome required), a `button`, and a per-element **visibility**
   toggle content editors control.

## 2. Architectural context (why this is more than a catalog edit)

The block catalog (`packages/contracts/zod/src/block-catalog.ts`) is the single
source of truth that drives three surfaces: Payload block field generation
(`packages/infrastructure/payload-config/src/blocks-from-catalog.ts`), the Studio
binding UI, and render-time value injection
(`packages/runtime/renderer/src/inject-block-values.ts`). The current field-type
vocabulary is `text | richText | image | button | number | checkbox`.

Three of the requested capabilities are **not supported today** and require new
plumbing, not just catalog data:

- **`link` field type** — does not exist. `refactor-plan.md` §"Core architectural
  decision" lists `link` in the intended 7-type vocabulary, but it was never
  implemented. Needed for the clickable Card. → **PR 1**.
- **Editor-controlled visibility** — `CompositionNode.visibility.hidden` exists in
  the schema (`packages/contracts/zod/src/composition.ts`) but is **latent**:
  nothing in the renderer, domains, or Studio reads it (verified by search). No
  binding channel exists for an editor to toggle a node. → **PR 2**.
- **Block slots inside a design** — `primitive.slot` exists but only works at the
  **page-template** level: page `contentSlots[]` inject into template slots via
  `renderComposition({ slotContent })`. A slot placed inside a hero/section
  *design* renders an empty `<div>` — there is no mechanism for an editor to add
  blocks *inside* a block instance. → **PR 3**.

The remaining work (Hero, Section, Card definitions) is catalog + seed data that
depends on the three capability PRs above.

## 3. PR sequencing

PRs are ordered by dependency. The three capability PRs (1–3) are independent of
each other and can land in parallel; the block-definition PRs (4–6) depend on them.

| PR | Title | Depends on | Type |
|---|---|---|---|
| [01](./01-link-field-type.md) | `link` field type (clickable elements) | — | Capability |
| [02](./02-element-visibility.md) | Editor-controlled element visibility | — | Capability |
| [03](./03-block-slots.md) | Block slots (nested blocks in designs) | — | Capability |
| [04](./04-hero-block-update.md) | Hero: primary/secondary buttons + slot | PR 03 | Block def |
| [05](./05-section-block-rename.md) | Rename Feature → Section | PR 03 | Block def |
| [06](./06-card-block.md) | New Card block | PR 01, PR 02 | Block def |

```
PR01 (link) ─────────────┐
PR02 (visibility) ───────┼──▶ PR06 (Card)
PR03 (slots) ──┬─────────┘
               ├──▶ PR04 (Hero)
               └──▶ PR05 (Section)
```

## 4. Cross-cutting conventions

- **A field's `name` is both the Studio binding key and the Payload column.**
  Renaming a `name` is a breaking data change (orphans bound designs + stored
  values). Renaming a `label` is safe.
- **Publish validation is name-based** and already generic
  (`page-and-component-validation.ts` → `blockBindingProblems`): required bound
  once, no unknown/duplicate names. New field types inherit this for free.
- **The Studio binding dropdown is data-driven** by
  `BLOCK_FIELD_BINDABLE_DEFINITION_KEYS` (`block-field-binding-section.tsx` →
  `compatibleCatalogFields`). Adding a type + its bindable primitive keys makes it
  appear automatically for compatible nodes.
- **No id→URL resolver layer** (per `AGENTS.md`). Image/link relations arrive
  populated; injection reads populated relation docs only.

## 5. Required checks per PR (per `apps/cms/AGENTS.md`)

After any catalog/schema change:

```bash
pnpm --filter @repo/cms generate:types
pnpm --filter @repo/cms generate:importmap   # only if admin components change
pnpm migrate:create && pnpm migrate           # schema/column changes
pnpm lint && pnpm typecheck
pnpm test:int
```

## 6. Product-not-live assumption

Per `refactor-plan.md`, the product is not live and does no backward-compat work.
Breaking catalog changes (the Feature→Section rename, Hero `cta`→button rename)
are handled by regenerating the initial migration and re-running `pnpm db:reset` +
`pnpm seed` locally rather than by data-preserving migrations. Each PRD notes this
in its migration section.

## 7. Out of scope (this epic)

- Rich-text rendering upgrades (`richText` still renders as plain text today).
- Generic per-node visibility for *arbitrary* designs outside a block contract
  (PR 2 scopes visibility to catalog-declared boolean fields — see PR 2 §"Design
  decision").
- Nesting depth beyond one level inside slots (PR 3 §"Recursion guard").
