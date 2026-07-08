# Refactor plan: blocks architecture — 2026-07-08

Full refactor, no backward compatibility (product not live). Companion to `docs/audit-2026-07-08.md` (findings referenced as §N.N below).

## Goal

Fully functional loop: **engineering defines block content schemas in code → designers build block designs and page templates in Studio → content team composes pages in Payload /admin using native block fields with designer-built looks → pages render correctly for anonymous visitors.**

## Core architectural decision

Split content schema from visual design:

- **Block catalog (code, static):** each block type (hero, feature, cta, …) declares real Payload fields from the existing 7-type vocabulary (text, richText, image, link, number, boolean, button). Lives in `packages/contracts` as a pure data module consumed by three surfaces: payload-config (generates Payload `Block` configs), Studio (binding dropdowns), renderer (value injection).
- **Designs (Studio, runtime):** a `components` doc declares `blockType` and maps composition nodes to that block's field names. Publish validates mapping completeness (all required fields bound). New designs usable in /admin instantly — no config reload, because the design list is a filtered relationship query, not config.
- **Templates (Studio, runtime):** design-only page layouts with named regions (slots). No template-level CMS fields (`templateEditorFields` dies). Embedded library components in templates render with their authored `propValues` as-is.
- **Pages (/admin):** `contentSlots` array (one row per template region) each containing a **native Payload blocks field** built from the catalog. Each block instance: typed content fields + a `design` relationship filtered to `{ blockType, _status: published }`.
- **Render:** template composition → graft region block output into slot nodes. Per block: load design composition, inject the block's typed values at bound nodes (scoped to that instance, keyed by catalog field names). Image/link values arrive as populated Payload relations → no id→URL resolver machinery. The global render-time merge (`mergeEditorFieldValuesIntoComposition`) and all its failure modes (§1.3) are deleted, not fixed.

### What this kills structurally
- 2,216 loc custom admin field UI (`EditorFieldsInputs`, `DesignerEditorFieldsField`, `PageTemplateEditorFieldsField`, `PageContentSlotsField` largely) + `designer-editor-fields-resolution.ts` (433 loc) + `page-composition-form-state.ts`.
- Render-time merge bugs: empty/stale content, button rewriting (§1.3), duplicate field names (§1.2b) — field names come from a fixed catalog, values are per-instance.
- Image id→URL resolution machinery (server + client resolvers, AGENTS.md's "do not regress" checklist).
- Editor-fields manifest derivation + `enrichComponentsEditorFieldsAfterRead` hook.
- Config-reload problem: block types static, designs dynamic.

## Target package layout (30 → 7 + app)

| Package | Absorbs | Notes |
|---|---|---|
| `apps/cms` | cms + admin-extensions + live application/studio commands + repository adapter + gateway's contract endpoint if ever needed (as CMS route) | The app |
| `packages/contracts` | contracts/zod + contracts/json-schema + kernel (`Result`, `ok/err`, `makeId`) + **new block catalog** | Pure TS/Zod, no runtime deps beyond zod |
| `packages/composition` | domains/composition + domains/design-system value objects | Tree model, mutations, validation |
| `packages/renderer` | runtime/renderer + runtime/primitives + domains/runtime-catalog types | Server + canvas rendering |
| `packages/studio` | presentation/studio + presentation/shared + infrastructure/payload-media-client | Browser-only |
| `packages/payload-config` | infrastructure/payload-config + application/design-system token hooks | Collections, access, hooks |
| `packages/config` | config/env + config/tailwind | Env schema + token compiler |
| **Deleted** | kernel, domains/{design-system,publishing,runtime-catalog}, application/{studio,design-system,publish-flow,contract-sync}, infrastructure/{persistence,telemetry,blob-storage,event-bus,payload-media-client,payload-config→moved}, presentation/{admin-extensions,shared,preview-ui}, runtime/code-components, contracts/json-schema→merged, **apps/gateway** | |

## Phases

### Phase 0 — checkpoint
Branch `refactor/blocks-architecture`; commit current working tree as WIP checkpoint (in-flight editor-fields work preserved in history). Baseline: `pnpm tc` green (verified), tests noted.

### Phase 1 — deletion pass (no behavior change)
1. Delete dead verticals: `application/publish-flow`, `domains/publishing`, `infrastructure/event-bus`, `application/contract-sync`, `apps/gateway` + CMS mount route `apps/cms/src/app/api/gateway/`.
2. Delete dead collections: `PublishJobs`, `ReleaseSnapshots`, `CatalogActivity`, `CompositionPresence`; drop `catalogReviewStatus`/`catalogSubmittedAt` from PageCompositions; remove `submitForCatalog` paths.
3. Delete empty shells: `infrastructure/persistence`, `telemetry`, `blob-storage`, `presentation/preview-ui`, `runtime/code-components`.
4. Delete dead code: `apps/cms/src/app/my-route`, 7 dead application/studio commands + `CompositionRepository`/`DesignTokenSetRepository` ports, `studio-row-id.ts` shim, `catalog-log.ts`, unused files flagged in audit §4.
5. Fix `check` script (duplicate `payload migrate`), remove deleted packages from `pnpm-workspace.yaml`, root tsconfig references, `next.config.ts` transpilePackages, all `package.json` deps.
6. **Migrations squash:** product not live → delete `apps/cms/src/migrations/*`, regenerate one fresh initial migration once schema stabilizes (end of Phase 4). Local dev: `pnpm db:reset`.
7. Verify: `pnpm lint`, `pnpm tc`, build.

### Phase 2 — package consolidation (mechanical)
Execute the 30→7 mapping: move sources, merge package.json/tsconfig, update all import specifiers, collapse kernel into contracts. Dedupe shadcn: studio keeps its `components/ui`; cms admin components import from `@repo/studio/ui` (or keep one copy in cms if bundling forbids — decide during move). Verify after each package move: `pnpm tc`.

### Phase 3 — critical fixes independent of content model
1. **Public read access (§1.1):** `page-compositions` + `components` read = `authenticated || { _status: { equals: 'published' } }`.
2. **Seed safety (§2):** refuse prod env without explicit flag + strong `SEED_PASSWORD`; never default `"test"`.
3. **CSRF (§2):** stop blanket cookie→Authorization promotion in `proxy.ts`; scope to the media-upload flows that need it.
4. **Design tokens (§1.4/§1.5/§5):**
   - Compile tokens to shadcn variable names (`color.primary` → `--primary`, `radius.base` → `--radius`, `typography.font.sans` → `--font-sans`) so published tokens retheme built utilities. Drop the dead `@theme` block from runtime CSS.
   - Kill the 47-property × 5-breakpoint utility explosion: emit small `:root`/`.dark` variable block + per-category utilities only (color → bg/text/border; space/size → the bound properties). Target ≤ 10 KB.
   - Cache compiled CSS keyed on token-set `updatedAt`; long-lived Cache-Control; revalidate on publish. Remove token CSS embedding from composition API responses.
   - Token freeze: reject only removed/renamed previously-published keys, publish-time only. Surface API error text in editor.
   - Canvas color mode driven by explicit canvas toggle defaulting to `activeColorMode`, decoupled from chrome theme.
   - Validate `resolvedValue` per category (color/length/font) — no raw CSS injection.
5. **Data safety:** atomic if-match (update with `where: { updatedAt }`), title-only rename, dirty-flag recompute after save, `req` threading in all hook-nested Local API calls, unique-key via insert-and-catch.
6. **Media:** restrict `mimeTypes`; Users read = admin or self.
7. Versions: `maxPerDoc: 25` on versioned collections.

### Phase 4 — content model (the core)
1. **Block catalog** `packages/contracts/src/block-catalog.ts`: initial set derived from existing seeds/components — `hero`, `content` (richText), `feature` (heading/body/image), `cta` (heading/body/button). Field spec type reuses the 7-type vocabulary; `link`/`button` = group (label, linkType url|page, url, page relationship, openInNewTab); `image` = upload relationTo media.
2. **payload-config:** generator `blocksFromCatalog()` → Payload `Block[]` with hidden `design` relationship per block (`relationTo: components`, `filterOptions: { blockType, _status: published }`). Pages: `contentSlots` array = `{ slotId (hidden text), blocks (native blocks field) }`. Delete `templateEditorFields`, `editorFieldValues` json, all four custom Field components; keep small `RowLabel`s. Slot-sync hook preserves orphaned blocks (reassign to first region) and never falls back to `["main"]` on read failure (§1.6). Required-value validation: publish only (§1.8). Hide admin create for components/page-compositions (§1.7).
3. **Components collection:** add `blockType` select from catalog (nullable → design-only library component). Publish-time validation: every required catalog field bound exactly once in composition; bindings reference catalog field names only. Delete `editorFields` stored field + enrich hook; `propContract` review — delete if only editor-fields plumbing.
4. **Renderer:** new `injectBlockValues(designTree, blockDoc, catalogEntry)` — scoped, typed, populated relations (no URL resolvers). Region rendering: blocks per slot grafted into template slot nodes. Expansion of embedded design components: prune ref-node style bindings (fix §1.2a) or transfer to grafted root; log + render `null` on failure in production (§1.2, §H5-admin). Delete `mergeEditorFieldValuesIntoComposition`, both image resolvers, `page-template-editor-fields` lib/route.
5. **Migrations:** regenerate single initial migration; rewrite seeds to new model (block catalog content + designs with bindings + template + page).

### Phase 5 — Studio updates
1. Component editor: blockType picker (create + settings); binding UI = dropdown of catalog fields for the component's blockType (replaces free-text expose flow). Remove button auto-bind and defaultValue-sync effects (§H6); remove text expose-to-CMS flow and `button-editor-binding.ts`.
2. Template editor: remove editor-field expose/manifest UI; templates design-only.
3. Save pipeline: single Zod parse + invariant check server-side (route), one client-side pre-check; delete duplicate validation layers. Zod-parse the 4 HTTP payloads on both ends (contracts get runtime Zod).
4. Surface actionable errors: invariant messages, invalid-token issues (list offending nodes), conflict UX kept.
5. Live preview: `admin.livePreview` on Pages; authenticated `/api/preview/enter`; add exit route; remove secret-in-URL preview button.

### Phase 6 — final cleanup & verification
- Adopt generated `payload-types` across cms (kill `as` casts on Local API results).
- Remove unused deps/exports (fallow re-run), `pnpm lint`, dedupe scripts env bootstrap.
- Tests: update int tests to new model (block render, access control anon read, binding validation, token compile size); e2e: designer→admin→public happy path.
- Full gate: `pnpm lint && pnpm tc && pnpm build && pnpm test`, migrate fresh DB, seed, manual smoke: studio save/publish, admin compose, anon render.

## Decisions locked
- No backward compatibility; DB reset + fresh migration + new seeds.
- Templates carry no CMS-editable fields (design + regions only).
- Block catalog is code; adding a block type is a deploy — accepted.
- `apps/gateway` deleted entirely (nothing calls it).
- Studio composition API stays a thin authenticated layer over Payload Local API (`overrideAccess: false` pattern kept).
