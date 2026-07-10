# Contorro — QA Feature Checklist

| | |
|---|---|
| **Document version** | 1.0 |
| **Date** | 2026-07-09 |
| **App state** | commit `fadd4fb` + uncommitted save-conflict fix (`payload-studio-mutation-repository.ts`, `studio-save-revision-loop.int.spec.ts`) |
| **Owner** | Miles Roxas |
| **Status** | Living document — update when features ship or change |

---

## 1. Purpose & scope

Single reference for **every user-facing feature and behavior that exists in Contorro today**, structured as a QA checklist. Use it to:

- Verify a release candidate (copy this doc per QA cycle, tick boxes, file bugs against IDs).
- Onboard anyone to what the product does.
- Trace manual checks to automated coverage (§7).

Covers: Payload `/admin`, Studio editor, Studio API, public rendering, preview, design-token pipeline, auth/security, seeds/environment. Out of scope: infra/deploy pipeline, third-party services themselves (Vercel Blob, Resend, Postgres).

## 2. Conventions

- **ID** — stable per feature (`AREA-NNN`). File bugs and reference test cases by ID. Never renumber; deprecate with ~~strikethrough~~.
- **Priority** — **P0**: security, data loss, or the core loop (design → compose → publish → render). **P1**: core feature, workaround exists. **P2**: secondary/cosmetic.
- **Coverage** — automated spec that exercises the item, if any (`int:` = `apps/cms/tests/int/`, `e2e:` = `apps/cms/tests/e2e/`). Blank = manual-only.
- Checkbox = one manual verification pass. Copy the doc (or a checklist export) per release; don't tick in the canonical copy.

## 3. Test environment & prerequisites

| Item | Value |
|---|---|
| Local DB | Docker `contorro-db-1`, port `54332` (`pnpm db:up`, reset with `pnpm db:reset`) |
| Dev server | `pnpm dev` → `http://localhost:3000` |
| Migrate + seed | `pnpm migrate` then `pnpm seed` (destructive full seed) or `pnpm seed:design-system` (safe, upsert-only) |
| Seed users | `seed-admin@local.test` (admin), `seed-designer@local.test` (designer), `seed-editor@local.test` (contentEditor) — shared password, non-prod default `test` |
| Seed content | 3 published pages (`seed-page`, `seed-designer-page`, `seed-page-with-library-template`), 4 block designs, 2 library parts, 2 templates, token set `seed-tokens` |
| Full gate | `pnpm check` (lint + typecheck + build + migrate + int tests); e2e via `pnpm test:e2e` |
| Required env | `POSTGRES_URL`, `PAYLOAD_SECRET` (≥32 chars), `BLOB_READ_WRITE_TOKEN`, `SITE_URL` — boot fails if invalid (see ENV section) |

## 4. Roles & permissions matrix

Roles: `admin`, `designer`, `contentEditor` (default), `engineer`. Role is stored in the JWT (`saveToJWT`) — access decisions do not re-query the DB.

| Capability | admin | designer | contentEditor | engineer | anonymous |
|---|---|---|---|---|---|
| Pages create/update | ✔ | ✔ | ✔ | — | — |
| Pages delete | ✔ | ✔ | — | — | — |
| Pages/components/templates read | all | all | all | all | published only |
| Components create/update/delete | ✔ | ✔ | — | — | — |
| Templates create/update | ✔ | ✔ | ✔ | — | — |
| Templates delete | ✔ | ✔ | — | — | — |
| Media upload | ✔ | ✔ | ✔ | ✔ | — |
| Media update/delete | ✔ | ✔ | — | — | — |
| Media read | ✔ | ✔ | ✔ | ✔ | ✔ (public) |
| Token sets read/write | ✔ | ✔ | — | — | — |
| Design-system global update | ✔ | ✔ | — | — | — |
| Users: create/delete | ✔ | — | — | — | — |
| Users: read/update others | ✔ | self only | self only | self only | — |
| Studio access (UI + API) | ✔ | ✔ | — | — | — |
| Draft preview (`/api/preview/enter`) | ✔ | ✔ | ✔ | — | — |

> Note: `engineer` appears in role options but in no access rule — it only gets generic authenticated capabilities. Confirm this is intended (see GAP-05).

---

## 5. Feature checklists

### 5.1 Authentication & session (AUTH)

- [ ] **AUTH-001** (P0) Login at `/admin/login` with valid credentials sets `payload-token` cookie and lands on dashboard. — e2e: helpers/login
- [ ] **AUTH-002** (P0) Invalid credentials rejected; no session established.
- [ ] **AUTH-003** (P1) Logout (`POST /api/users/logout`) clears the session.
- [ ] **AUTH-004** (P0) Designer visiting `/admin` dashboard is redirected to `/studio` (`DesignerDashboardRedirect`).
- [ ] **AUTH-005** (P0) `/api/studio/*` routes: no session → 401 `{error:{code:"UNAUTHORIZED"}}`; contentEditor/engineer → 403 `FORBIDDEN`; admin/designer pass. *(Int specs mock this seam — manual/e2e only, see GAP-06.)*
- [ ] **AUTH-006** (P1) Non-admin cannot list other users or change own `role`; admin can manage all users.
- [ ] **AUTH-007** (P1) Role changes take effect via JWT — re-login required for new role to apply; verify stale token doesn't grant new role.

### 5.2 Security (SEC)

Proxy cookie→Authorization promotion (`apps/cms/src/proxy.ts`) — applies to `/api/*`, `/studio`:

- [ ] **SEC-001** (P0) GET/HEAD navigation to `/studio` with only the session cookie authenticates (cookie promoted to `Authorization: JWT …`). — e2e: studio-phase3 (implicit)
- [ ] **SEC-002** (P0) Cross-site POST with valid cookie (`Sec-Fetch-Site: cross-site` or foreign `Origin`) is **not** promoted → Payload rejects (CSRF guard).
- [ ] **SEC-003** (P0) Same-origin POST promotes and succeeds.
- [ ] **SEC-004** (P1) Non-browser client (no `Origin`, no `Sec-Fetch-Site`) with cookie promotes (curl/API usage works).
- [ ] **SEC-005** (P1) Pre-existing `Authorization` header is never overwritten by the proxy.

Other:

- [ ] **SEC-006** (P0) SVG/HTML upload to Media rejected — only jpeg/png/webp/gif/avif accepted (script-injection guard).
- [ ] **SEC-007** (P0) Token values containing `;`, `{`, `}`, `<`, `>`, or newlines rejected with 400 (CSS injection guard). — int: phase-1-design-system
- [ ] **SEC-008** (P1) `/api/preview/exit` referer redirect: cross-origin or malformed referer lands on `/`, never off-site (open-redirect guard).
- [ ] **SEC-009** (P0) Seeding against a production-looking DB (`neon.tech`/`supabase.co`/`amazonaws.com` or `NODE_ENV=production`) refuses unless `SEED_ALLOW_PRODUCTION=true` **and** `SEED_PASSWORD` ≥16 chars.
- [ ] **SEC-010** (P1) Anonymous REST reads on `pages`/`components`/`page-compositions` return published docs only; drafts invisible. — int: blocks-content-model
- [ ] **SEC-011** (P1) `design-token-sets` unreadable to anonymous and contentEditor via API (compiled CSS route is the only public surface).

### 5.3 Admin — Pages (PAGE)

- [ ] **PAGE-001** (P1) Create page: `title` + unique `slug` required; slug uniqueness enforced; trimmed on save.
- [ ] **PAGE-002** (P1) Metadata collapsible holds `seoDescription` + `socialShareText` richText fields (note: not yet emitted to `<head>` — GAP-01).
- [ ] **PAGE-003** (P0) "Page template" relationship selects a page-composition; "Layout regions" array syncs one row per template region (rows not sortable, labeled ``Region `slotId` ``). — e2e: pages-region-block-fields
- [ ] **PAGE-004** (P0) Each region offers exactly the 4 catalog block types (hero, feature, cta, content) with typed fields. — e2e: pages-region-block-fields
- [ ] **PAGE-005** (P0) Block "Design" dropdown lists only **published** components of the **matching blockType** — drafts and wrong-type designs hidden.
- [ ] **PAGE-006** (P0) Switching templates: blocks in removed/unknown regions are appended to the first region — never dropped (orphan reassignment). — int: blocks-content-model
- [ ] **PAGE-007** (P0) Publishing a page with neither a template nor ≥1 block fails: "Set either a page template or at least one content block before publishing." Draft saves are unrestricted. — int: blocks-content-model
- [ ] **PAGE-008** (P1) Required block fields (e.g. hero heading) don't block draft saves but do block publish (Payload draft semantics).
- [ ] **PAGE-009** (P1) Versions: drafts enabled, max 25 per doc; restore of an older version works.
- [ ] **PAGE-010** (P1) Block rows labeled "<Catalog label> — <heading>" (fallback slug / "Block NN").
- [ ] **PAGE-011** (P1) contentEditor can create/edit pages but cannot delete.

### 5.4 Admin — Components & templates (CMP)

- [ ] **CMP-001** (P1) Components: `key` auto-slugified from title on create (diacritics stripped, ≤120 chars, unique with random suffix fallback); read-only in admin. — int: designer-library
- [ ] **CMP-002** (P0) Rename never changes `key` (immutable on update; restored from original). — int: designer-library
- [ ] **CMP-003** (P1) `blockType` select (sidebar, clearable): hero/feature/cta/content; empty = design-only library part.
- [ ] **CMP-004** (P0) Publishing a component with `blockType` set requires every required catalog field bound exactly once; unknown or duplicate bindings rejected with actionable 400 ("required field \"x\" is not bound"). Draft saves exempt. Clearing blockType lifts the gate. — int: blocks-content-model, studio-compositions-route
- [ ] **CMP-005** (P1) Templates ("Page templates"): admin Create New with title only succeeds — defaults a valid template shell and is openable in Studio.
- [ ] **CMP-006** (P1) "Open Studio" button on components (`/studio?composition=cmp-<id>`) and templates edit views; visible to admin/designer on saved docs only.
- [ ] **CMP-007** (P1) Studio nav link in admin sidebar visible to admin/designer only.
- [ ] **CMP-008** (P1) Components support folder browsing (`folders: true`); searchable by displayName/key.
- [ ] **CMP-009** (P2) `lastTouchedBy` auto-stamped from the acting user on change.
- [ ] **CMP-010** (P1) contentEditor: cannot create/edit/delete components; can create/edit (not delete) templates.

### 5.5 Admin — Media & users (MED)

- [ ] **MED-001** (P1) Upload requires `alt` text; file stored via Vercel Blob; served at `/api/media/file/…`.
- [ ] **MED-002** (P1) Allowed types upload fine: jpeg, png, webp, gif, avif. (Rejection = SEC-006.)
- [ ] **MED-003** (P1) Any authenticated role can upload; only admin/designer can edit/delete media; anonymous can read/fetch media.
- [ ] **MED-004** (P2) Admin theme toggle (Light/Dark segmented control in actions bar) switches admin chrome theme.
- [ ] **MED-005** (P2) Dashboard shows design-system preview callout linking `/design-system/preview`.

### 5.6 Admin — Design tokens & global settings (TOK-A)

- [ ] **TOKA-001** (P1) Token set: `title` + unique `scopeKey` + ≥1 token row (`key`, category from 12 options, mode light/dark, `resolvedValue`). Zero tokens → 400. — int: phase-1-design-system
- [ ] **TOKA-002** (P1) Key format enforced: `^[a-z]+(\.[a-z0-9]+)+$` (e.g. `color.primary`); duplicate key+mode rejected. — int: phase-1-design-system
- [ ] **TOKA-003** (P1) `color` category values must parse as hex/rgb/hsl/oklch/color()/keyword; invalid → 400. (Other categories: forbidden-char guard only — GAP-04.) — int: phase-1-design-system
- [ ] **TOKA-004** (P0) Freeze rule: after first publish, publishing a version that removes/renames a previously published key → 400 listing missing keys. Draft saves may remove keys freely. Additions always allowed. — int: phase-1-design-system
- [ ] **TOKA-005** (P1) Design system global: `defaultTokenSet` relationship, `activeBrandKey`, `activeColorMode` (light/dark); admin/designer update only.
- [ ] **TOKA-006** (P1) Token set versions: drafts, max 25/doc; draft → publish flow works. — int: phase-1-design-system

### 5.7 Block catalog & content model (BLK)

- [ ] **BLK-001** (P0) Catalog (code-defined, `packages/contracts/zod/src/block-catalog.ts`): **hero** (heading* text, body richText, image, cta button), **feature** (heading* , body, image), **cta** (heading*, body, button*), **content** (body* richText). Adding a type = deploy.
- [ ] **BLK-002** (P0) Value injection: block field values injected at design nodes bound via `contentBinding.source: "editor"` (binding name = catalog field name); missing/empty optional values never blank authored design content. — int: blocks-content-model
- [ ] **BLK-003** (P1) Type handling: richText flattens to text (paragraphs `\n`-joined); number stringified; checkbox → checked; image requires populated media doc (id-only never blanks src); button → label + href from internal page slug or external URL + openInNewTab. — int: blocks-content-model
- [ ] **BLK-004** (P1) Binding targets per field type: text → text/heading primitives; richText/number/checkbox → text; image → image; button → button.
- [ ] **BLK-005** (P1) Unknown blockType on a page block → block skipped with server log, page still renders (catalog-entry removal is non-fatal).

### 5.8 Studio editor (STU)

Shell & navigation:

- [ ] **STU-001** (P0) `/studio` logged-out redirects to `/admin/login?redirect=<returnTo>` preserving query params; returns to the same URL after login.
- [ ] **STU-002** (P0) contentEditor sees "Studio is limited to admin and designer roles" — never the editor; admin/designer get the full shell.
- [ ] **STU-003** (P1) Query-param routing: `?screen=templates|components|design-system`, `?composition=<id>` opens editor; `screen` wins over `composition`; nav highlight follows composition kind.
- [ ] **STU-004** (P1) Dashboard: quick actions (New template/component/Design system), searchable Templates & Components lists, workspace stats, 6 most-recent "continue" cards; auto-refetch on window focus/visibility/bfcache. "New" mints a session URL (`?composition=new-…`) — no DB row until first save.
- [ ] **STU-005** (P2) Dashboard inline rename: Enter = save draft; menu offers draft/publish intents; errors inline.
- [ ] **STU-006** (P2) Collection views search filters by title+key, case-insensitive.

Canvas:

- [ ] **STU-007** (P0) Canvas renders composition via primitive registry; empty text shows italic "Placeholder text"; unknown definitionKey renders nothing (no crash).
- [ ] **STU-008** (P0) Click selects node (auto-switches left panel to Layers), background click deselects; selection ring synced across canvas, layers, inspector. `?selectNode=<id>` deep-link selects once on load.
- [ ] **STU-009** (P1) Breakpoint switcher Base/SM/MD/LG/XL: style edits write to active breakpoint; switching resets viewport width to that breakpoint's min-width.
- [ ] **STU-010** (P2) Viewport controls: width 280–6000px, zoom 25–250%, font 12–24px (clamp, invalid reverts); right-edge drag resize; auto-fit shrinks to container, never upscales.
- [ ] **STU-011** (P1) Canvas color mode toggle flips preview tokens (`data-studio-canvas-mode`) independent of chrome theme; session-only (resets to light on reload).
- [ ] **STU-012** (P2) Chrome theme toggle persists to `localStorage["studio-theme"]`; bootstrap script prevents flash on load.
- [ ] **STU-013** (P1) Context menus: node menu (Edit component / Create component / Wrap / Delete; destructive items disabled on root), canvas background menu "Select root"; opening a node menu selects it.
- [ ] **STU-014** (P1) Library component nodes render server-expanded preview read-only (skeleton while loading, placeholder on failure); nested refs expand recursively.

Drag & drop:

- [ ] **STU-015** (P0) Palette drag (primitives: Box/Section/Text/Heading/Button/Image/Video/Collection/Slot; components: published only) inserts at drop index; new node auto-selected. Canvas drop zones mount only mid-drag; hovered strip expands. — e2e: studio-phase3
- [ ] **STU-016** (P0) Moving existing nodes (canvas + layers rows): root and locked template-shell sections not draggable; same-parent moves compensate insert index.
- [ ] **STU-017** (P1) Collision: inner empty-container zones win over ancestor strips; targeted container shows active dashed outline.
- [ ] **STU-018** (P2) Touch: 180ms/8px activation (scroll doesn't start drags); mobile tap-to-insert arms staged insertion with HUD + cancel; rotating to desktop cancels.

Panels & shortcuts:

- [ ] **STU-019** (P1) Digit shortcuts: 1 Templates, 2 Layers, 3 Primitives, 4 Components — ignored while typing in inputs. *(4 also documented as Styles tab — collision, GAP-09.)*
- [ ] **STU-020** (P1) Templates panel: Draft/Published badges + dates, status filter (All/Draft/Published), current doc highlighted; navigation runs the unsaved-changes guard.
- [ ] **STU-021** (P1) Layers tree: per-row collapse, bulk collapse/expand, template shell renders BODY + Header/Main/Footer headings, library refs show CMS display name; deleting selected node re-selects parent.
- [ ] **STU-022** (P2) Layer keyboard nav: W/S prev-next, A parent, D first child (auto-expands), Q/E shell sections — global, outside inputs.

Inspector:

- [ ] **STU-023** (P1) Styles/Settings tabs; empty state when nothing selected; "Reset styles" clears the node's style binding (undoable).
- [ ] **STU-024** (P1) Style sections (layout, spacing, size, color, text, border) default collapsed; primary props up front, rest behind "More options".
- [ ] **STU-025** (P0) Style value pickers: Default + Tailwind values + Tokens filtered by property category; color props show swatches; unknown token rejected with "Unknown token: X".
- [ ] **STU-026** (P1) Breakpoint cascade: non-base breakpoint without override shows base value + "Inherited from base" badge; setting a value creates the override; per-prop reset.
- [ ] **STU-027** (P2) Specialized controls: margin/padding box-model ring (per-side), border control (sides/width/style/color/radius), display & flex icon buttons.
- [ ] **STU-028** (P1) Per-primitive settings: text content; heading level h1–h6; button link (URL or collection entry with Browse sheet, new-tab); image (URL or media picker — browse recent 50 / upload with alt); video (source, poster, playback flags); box (div/section tag — locked shell tags excluded — background image section); collection (slug, dynamic/manual, sort, per-kind filter operators); slot id.
- [ ] **STU-029** (P1) Collection field binding: type-compatible CMS fields only, "(type mismatch)" flag on incompatible existing binding, hides Content input, mutually exclusive with block binding.

Block binding:

- [ ] **STU-030** (P0) blockType picker: components only, root node selected, disabled until first draft save; change PATCHes immediately (draft intent); never shown on templates.
- [ ] **STU-031** (P0) Binding dropdown on non-root nodes when blockType set: compatible catalog fields with "(required)" suffix; duplicate binding → amber warning on both nodes; stale binding → "(not in catalog)"; warnings advisory — draft save still allowed.
- [ ] **STU-032** (P0) Publish-gate failures (unbound required fields etc.) render the server message verbatim in the save bar.

Save & publish:

- [ ] **STU-033** (P0) Dirty tracking + status pill: Saving… → Unsaved changes → Draft/Published; edits mid-save keep doc dirty; **no autosave** — persistence is explicit only.
- [ ] **STU-034** (P0) Save menu (Save draft / Publish): client Zod+invariant pre-check; stale-revision 409 shows "This template was saved elsewhere. Reload the builder and try again."; publish uses same if-match check. — int: studio-save-revision-loop; e2e: studio-phase3
- [ ] **STU-035** (P0) First save of a new session creates the doc, swaps URL to the real id (replaceState); reload keeps the doc; default names "Untitled component/page template".
- [ ] **STU-036** (P1) Unsaved-changes guard: `beforeunload` prompt + same-origin link interception dialog (Stay / Discard / Save and leave; blocks nav if save fails); cmd-click, target=_blank, hash, mailto not intercepted.

Node operations:

- [ ] **STU-037** (P1) Undo/redo: Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, Ctrl+Y + toolbar buttons; new edit clears redo stack; history resets on load; undo/redo mark dirty.
- [ ] **STU-038** (P1) Delete/Backspace removes selected subtree (undoable); Cmd+C/V copy-paste (internal ref, pastes after target); Cmd+D duplicate; Cmd+W wrap in Box *(browser close-tab conflict — GAP-10)*.
- [ ] **STU-039** (P1) Create component from node: name dialog → subtree saved as new component draft → replaced by library ref (undoable, selects ref); unavailable on root and library-ref rows.
- [ ] **STU-040** (P2) Shortcuts drawer (backtick or rail button) documents layer nav + builder shortcuts.
- [ ] **STU-041** (P1) In-editor rename: pencil → inline input, Enter saves (PATCH, title-only — never resubmits composition), Esc cancels; new sessions rename locally only.
- [ ] **STU-042** (P2) No doc-level delete or duplicate anywhere in Studio (Payload admin only) — confirm intentional.

Template editing:

- [ ] **STU-043** (P1) Template shell locked: Header/Main/Footer sections can't be dragged/reordered; their children stay editable; shell normalized server-side on load.
- [ ] **STU-044** (P0) Slot primitive renders dashed "Layout slot" card with editable slot id; slots define the page regions Pages sync to (PAGE-003/006).
- [ ] **STU-045** (P1) Edit-component-from-template round trip: opens component editor with return bar ("Back to page template"), primary nav hidden; returning re-selects the library instance node.

Mobile:

- [ ] **STU-046** (P2) Below `lg`: bottom dock (Menu/Add/Layers/Inspect — Inspect disabled without selection) + sheets; menu sheet mirrors save/publish/undo/breakpoint/theme; sheet tab prefs persisted.

Design-system screen:

- [ ] **STU-047** (P1) `?screen=design-system` token editor (admin/designer): color sections, typography fonts, radius, sidebar tokens; light/dark toggle edits per-mode values.
- [ ] **STU-048** (P0) Save draft / Publish tokens from Studio; publish also updates the design-system global (activeBrandKey/activeColorMode); hook errors (e.g. freeze rule) surface verbatim.
- [ ] **STU-049** (P2) Design-system live-preview iframe with path input + refresh.

### 5.9 Studio API (API)

All `/api/studio/*` routes: admin/designer only; envelope `{ data }` / `{ error: { code, message?, issues? } }`.

- [ ] **API-001** (P1) `POST /api/studio/compositions` — mints new-session temp id; empty body defaults `kind: template`; `kind: component` honored; garbage JSON → 400 `INVALID_JSON`; bad kind → 400 `VALIDATION_ERROR`.
- [ ] **API-002** (P0) `GET /api/studio/compositions/[id]` — loads temp/component (`cmp-…`)/template ids draft-aware; returns `composition`, `studioResource`, `blockType`, `updatedAt` (revision token), `tokenMetadata`, `cssVariables` scoped to `[data-studio-canvas-mode]`; 404 unknown; 400 invalid stored composition.
- [ ] **API-003** (P0) `POST …/[id]` save: wire-level Zod (400 with `Invalid save request at "<path>": …`), graph invariants (400 with message), unknown design tokens → 400 listing offenders per node. — int: studio-compositions-route
- [ ] **API-004** (P0) Save conflict: stale `ifMatchUpdatedAt` → 409 `COMPOSITION_CONFLICT` for both draft and publish intents; **fresh token round-trip GET → draft → draft → publish → draft all succeed (no false 409 after draft save)** — the uncommitted `draft: true` conditional-update fix. — int: studio-save-revision-loop *(new)*
- [ ] **API-005** (P0) Publish intent surfaces Payload hook failures (e.g. binding gate) as 400 with the hook's message, not a generic error. — int: studio-compositions-route
- [ ] **API-006** (P1) New-session save creates the doc (empty title → 400) and returns `{ id, updatedAt, _status, componentKey? }`.
- [ ] **API-007** (P1) `PATCH …/[id]` meta: rename (trimmed, min 1) and/or `blockType` (valid slug or null); never resubmits composition (title-only rename semantics); blockType on a template id → 400; empty patch → 400; unknown slug → 400 "unknown block type". — int: studio-compositions-route
- [ ] **API-008** (P1) `GET /api/studio/library-components` — published, non-empty key + composition only, ≤500, sorted by displayName.
- [ ] **API-009** (P1) `GET …/library-components/preview?key=` — fully expanded composition (nested refs resolved); empty key → 400; unknown key → 404.
- [ ] **API-010** (P2) `GET /api/studio/payload-collections` + `…/[slug]/fields` — collection slugs (excl. `users`, `payload-*`) and filterable field metadata; unknown slug → 404. *(Note: bare response shape, no `{data}` envelope — GAP-07.)*

### 5.10 Public rendering (REN)

- [ ] **REN-001** (P0) `/{slug}` renders a published page anonymously (force-dynamic, access control on — `overrideAccess: false`). — e2e: frontend, bridge-designer-public
- [ ] **REN-002** (P0) Full loop: template composition + per-region blocks grafted into `primitive.slot` nodes by `slotId`; block design loaded, typed values injected at bound nodes. — int: blocks-content-model; e2e: bridge-designer-public
- [ ] **REN-003** (P0) 404 rules: missing/draft slug → 404; page with no renderable blocks AND no template → 404; blocks-without-template renders standalone.
- [ ] **REN-004** (P1) Slot fallback: unknown slotId → `main` if present; no matching slot → orphan blocks appended after the tree; zero-slot template → blocks after template output. Nothing silently dropped.
- [ ] **REN-005** (P1) Failure isolation: unpublished/missing block design, corrupt design JSON, unknown definitionKey, failed library expansion — each skips that node/block with a server log; page never crashes; no debug placeholder in production.
- [ ] **REN-006** (P1) Template shell normalized to semantic HTML: root fragment, `header`/`main`/`footer` landmarks.
- [ ] **REN-007** (P1) Responsive styles: Tailwind utilities emitted mobile-first with `sm:/md:/lg:/xl:` prefixes; all emittable classes safelisted (styles set in Studio always paint). — int: studio-canvas-styling
- [ ] **REN-008** (P1) Token-bound style properties render as inline `var(--…)` and follow the published token set.
- [ ] **REN-009** (P1) Library components on pages: authored propValues render as-is; editor bindings stripped inside embeds (page values never leak in); instance style overrides transfer to grafted root; duplicates get independent node ids; nesting bounded at 64 expansions.
- [ ] **REN-010** (P1) Image primitive: plain `<img>` (no next/image — GAP-02), src precedence propValues → mediaUrl, `object-cover` default; empty src → "IMAGE" placeholder box, never broken img.
- [ ] **REN-011** (P2) Video primitive: media src, poster, autoplay/loop/muted/playsInline/controls/preload attrs; placeholder when unset.
- [ ] **REN-012** (P2) Button primitive: internal links `/{collection}/{entry}` or page slug; `target=_blank` adds `rel="noopener noreferrer"`.
- [ ] **REN-013** (P1) Collection primitive (client-side): fetches public Payload REST with visitor credentials — list respects that collection's access control; filters/sort apply; distinct loading/error/empty states; bound fields resolve from row docs with authored fallbacks.
- [ ] **REN-014** (P1) Heading levels h1–h6 render as the chosen tag (invalid → h2); box `tag` prop emits fragment/semantic tags.
- [ ] **REN-015** (P2) `<title>` = page title (fallback slug); draft titles show in preview. `seoDescription`/OG not emitted — GAP-01.
- [ ] **REN-016** (P1) Site-wide color mode: global `activeColorMode: dark` sets `<html class="dark">` on all public pages; token dark overrides and `dark:` utilities respond.

### 5.11 Draft & live preview (PRE)

- [ ] **PRE-001** (P0) `GET /api/preview/enter?pageId=` — anonymous → 401; engineer → 403; admin/designer/contentEditor → draft mode cookie + redirect to `/{slug}`; unreadable page → 404. No secret in URL.
- [ ] **PRE-002** (P0) Draft mode shows unpublished edits to the **page, its template, and block designs** (all re-fetched draft-aware); anonymous visitors still see published only.
- [ ] **PRE-003** (P1) `GET /api/preview/exit` — draft mode off, back to published content (redirect rules = SEC-008).
- [ ] **PRE-004** (P1) Admin Preview button targets `/api/preview/enter?pageId=<id>`.
- [ ] **PRE-005** (P1) Live preview panel on Pages loads `/{slug}` at breakpoints 390×844 / 834×1194 / 1440×900; saving refreshes the iframe without full reload (`RefreshRouteOnSave` + `router.refresh()`); refresh component only mounts in draft mode.

### 5.12 Design-token pipeline & theming (TOK)

- [ ] **TOK-001** (P0) Publishing `color.primary` rethemes every `bg-primary`/`text-primary` site-wide (token keys compile to shadcn variable names: `color.card.foreground` → `--card-foreground`, `radius.base` → `--radius`, `typography.font.sans` → `--font-sans`). — int: phase-1-design-system
- [ ] **TOK-002** (P1) Compiled CSS = `:root { … }` + `.dark { … }` only; dark-only tokens also emit as base (light never unset). — int: phase-1-design-system
- [ ] **TOK-003** (P0) `GET /api/design-system/compiled-css?v=<updatedAt>` → 1-year immutable cache; versionless → `no-store`; token-set publish changes `updatedAt` → new URL busts cache; frontend layout links the versioned URL after globals.css so published values win.
- [ ] **TOK-004** (P1) Token-set selection: published global default → else first published set → else theme.css fallback values (no custom CSS).
- [ ] **TOK-005** (P2) `/design-system/preview` page shows source set, active mode, swatch, raw compiled blocks; helpful empty state when nothing published.
- [ ] **TOK-006** (P2) One token compile per request (React `cache()` dedupe) — no duplicate token-set queries.

### 5.13 Seeds & environment (ENV)

- [ ] **ENV-001** (P0) Boot fails fast on env violations: missing `POSTGRES_URL`/`BLOB_READ_WRITE_TOKEN`/`SITE_URL`, `PAYLOAD_SECRET` <32 chars.
- [ ] **ENV-002** (P1) Malformed blob token (not `vercel_blob_rw_…`) silently disables Blob plugin rather than crashing; Resend adapter only active when `RESEND_API_KEY` set.
- [ ] **ENV-003** (P1) `pnpm seed` (destructive) rebuilds all seed content on a fresh DB; `pnpm seed:design-system` is upsert-only and honors the freeze rule (creates `seed-tokens-v<ts>` when keys drifted).
- [ ] **ENV-004** (P1) `SITE_URL` resolution: explicit wins, else Vercel prod URL, else `VERCEL_URL` — hostname drift breaks cookies/CSRF, verify after deploy config changes.
- [ ] **ENV-005** (P2) Single squashed initial migration applies cleanly to an empty DB (`pnpm db:reset && pnpm migrate`).

---

## 6. Known gaps & watch items (GAP)

Found during this inventory — decide: fix, accept, or track.

| ID | Item | Impact |
|---|---|---|
| GAP-01 | `seoDescription`/`socialShareText` authored on Pages but never emitted into `<head>` (only `<title>`) | SEO/social sharing incomplete |
| GAP-02 | Renderer uses raw `<img>`; `next.config.ts` `images.localPatterns` present but next/image unused | No image optimization |
| GAP-03 | No size-budget test for compiled token CSS (plan targeted ≤10 KB; implementation is variables-only, likely fine — but unasserted) | Silent regression risk |
| GAP-04 | Only `color` category has value-shape validation; other 11 categories rely on forbidden-char guard alone | Malformed values reach CSS |
| GAP-05 | `engineer` role exists in options but appears in no access rule | Confirm intended |
| GAP-06 | Int route specs mock `requireStudioDesigner` — 401/403 studio-API behavior has no direct automated coverage | Auth regression risk |
| GAP-07 | Response-envelope inconsistency: payload-collections routes return bare objects; preview routes return plain-text errors | Client error-handling friction |
| GAP-08 | `proxy.ts:3` comment references deleted gateway route; `gatewayEnvSchema` exported with no consumer; `PAYLOAD_COOKIE_PREFIX` read unvalidated | Stale-code confusion |
| GAP-09 | Shortcut collision: digit `4` maps to both Components panel and Styles inspector tab; panel wins, but the shortcuts drawer documents both | Only `5` (Settings) reachable; drawer copy wrong |
| GAP-10 | `Cmd+W` (wrap in Box) collides with browser close-tab; plain `W` doubles as layer-nav up | Accidental tab close / surprise nav |
| GAP-11 | 409 conflict message says "This template was saved elsewhere" even when editing a component | Confusing copy |
| GAP-12 | Studio e2e coverage is one spec (compose/style/save/restore) — most editor features (DnD variants, binding UI, undo/redo, guards, mobile) manual-only | Regression risk in largest surface |

## 7. Automated test traceability

| Spec | Covers (checklist IDs) |
|---|---|
| int/api.int.spec.ts | Payload REST contract basics |
| int/blocks-content-model.int.spec.ts | PAGE-006/007, CMP-004, BLK-002/003, REN-002, SEC-010 |
| int/designer-library.int.spec.ts | CMP-001/002 |
| int/phase-1-design-system.int.spec.ts | TOKA-001…004/006, TOK-001/002, SEC-007 |
| int/phase-2-composition.int.spec.ts | Composition schema + primitive registry (REN-014 partial) |
| int/studio-canvas-styling.int.spec.ts | REN-007 (safelist ↔ resolver alignment) |
| int/studio-compositions-route.int.spec.ts | API-003/005/007 |
| int/studio-save-revision-loop.int.spec.ts *(new, uncommitted)* | API-004 |
| e2e/admin.e2e.spec.ts | Admin navigation smoke |
| e2e/frontend.e2e.spec.ts | REN-001 (homepage) |
| e2e/bridge-designer-public.e2e.spec.ts | REN-001/002 (designer→public bridge) |
| e2e/pages-region-block-fields.e2e.spec.ts | PAGE-003/004 |
| e2e/studio-phase3.e2e.spec.ts | STU-015/034 (compose/style/save/restore loop), SEC-001 (implicit) |

## 8. Revision history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-07-09 | Initial inventory from full codebase sweep at `fadd4fb` (4 parallel area sweeps: admin, studio, rendering/tokens, API/auth/tests). All sections complete. |
