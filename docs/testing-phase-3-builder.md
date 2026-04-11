# What you can test after Phase 3 (Builder MVP)

This describes **what works today** and **how to verify it** step by step. It assumes the repo matches Phase 3 in `docs/architecture-spec.md` (builder UI, gateway routes, draft save, five primitives, single breakpoint).

---

## Prerequisites

1. **Postgres** running locally (see architecture spec local dev / `docker-compose.yml`).
2. **`apps/studio/.env`** copied from `apps/studio/.env.example` and filled (at minimum `POSTGRES_URL`, `PAYLOAD_SECRET`, `SITE_URL`).
3. **Migrations applied** from the studio app (Payload owns migrations):

   ```bash
   pnpm db:up
   pnpm migrate
   ```

4. **Dependencies installed** at repo root: `pnpm install`.

---

## 1. Start the apps

From the repo root, run the dev script (or start studio and gateway separately if you prefer):

```bash
pnpm dev
```

- **Studio (Next.js + Payload admin):** [http://localhost:3000](http://localhost:3000)  
- **Gateway (standalone process, if you run it):** often [http://localhost:3002](http://localhost:3002) — builder traffic from the browser normally goes to **`/api/gateway/*` inside Next**, same origin as studio.

Wait until both servers are up with no startup errors.

---

## 2. Smoke: gateway health (optional)

With studio on port 3000:

```bash
curl -s http://localhost:3000/api/gateway/health
```

You should see JSON with a success shape and a reachable DB indicator (per your gateway implementation).

---

## 3. Payload admin and roles

1. Open [http://localhost:3000/admin](http://localhost:3000/admin).
2. Log in with a user whose role is **`admin`** or **`designer`** (only these roles can use the builder surface per the capability matrix).
3. Confirm the dashboard loads.

**Sidebar:** You should see a **Builder** link (designer/admin only). It points to `/admin/builder` without a composition id.

---

## 4. Create or pick a Page composition

The builder needs a **`page-compositions`** document id (it loads draft composition JSON).

1. In the admin sidebar, open **Collections → Page compositions** (or your localized label).
2. **Create** a new document (or open an existing one):
   - Set **title** and **slug** (required).
   - Ensure the **composition** JSON is valid (minimum: a root node, e.g. a `primitive.stack` root with empty `childIds`, matching your Phase 2 schema). If creation fails validation, fix the JSON or use a template your team provides.
3. **Save** (draft is fine).
4. Copy the document **ID** from the URL or the document header (you will use it as `composition=<id>`).

---

## 5. Open the visual builder

1. Go to:

   ```text
   http://localhost:3000/admin/builder?composition=<PASTE_ID_HERE>
   ```

2. You should see:
   - **Primitives** palette (Box, Text, Stack, Grid, Image).
   - A **canvas** preview area (drop root).
   - A **tree** of nodes.
   - An **inspector** when a node is selected.
   - **Save draft** (enabled when there are unsaved local changes).

If you open `/admin/builder` **without** `?composition=`, you should see a short message telling you to add a composition id.

---

## 6. Manual scenario (matches the Phase 3 intent)

Do this in order:

1. **Drag “box”** from the palette onto the **canvas drop root** (stack root).  
   - A **Box** node should appear in the tree; a **“Drop into box”** strip should appear for that box.

2. **Drag “text”** from the palette onto the **box drop strip** (not only the root).  
   - A **Text** node should appear under that box in the tree.

3. In the **tree**, click the **text** node.  
   - In the **inspector**, set **Content** to `Hello`.

4. Click the **box** node in the tree.  
   - In the **inspector**, set **Background token** to `color.surface.primary` (or another token key that exists in your published token setup).

5. Click **Save draft**.  
   - The UI should reflect a saved state (no “unsaved” indication after success).

6. **Refresh the page** (full reload).  
   - The canvas preview should still show **Hello**; tree and inspector should match persisted data.

**Scope limits (by design):** five primitives only, single breakpoint, no asset library, no repeaters, no collaborative locking.

---

## 7. What is intentionally limited or stubbed

- **`POST /api/gateway/builder/compositions/:id/submit`** (submit for catalog) may return **501 Not implemented** until a later publishing phase; the route exists for API parity with the spec.
- **Conflict handling:** draft save can return **409** if `ifMatchUpdatedAt` does not match the server’s `updatedAt` (optimistic concurrency). Retrying after reload is the expected recovery.

---

## 8. Automated tests you can run

**Integration / unit (Vitest, no browser):**

```bash
pnpm test
```

(from repo root; runs studio’s `test:int` per `package.json`)

**Playwright (needs studio reachable, e.g. `pnpm dev`, and a working DB):**

```bash
pnpm test:e2e
```

Or only the Phase 3 builder spec:

```bash
pnpm --filter @repo/studio exec playwright test tests/e2e/builder-phase3.e2e.spec.ts
```

The Playwright test seeds a **designer** user and a **page composition**, then exercises drag → edit → save → reload. If it fails, check that port **3000** matches `playwright.config.ts` and that Postgres and migrations are applied.

---

## 9. Quick troubleshooting

| Issue | Things to check |
|--------|------------------|
| `/admin/builder` blank or errors | `pnpm` dev logs; `composition` id valid; user role designer/admin. |
| Save fails | Network tab on `POST /api/gateway/builder/compositions/:id/draft`; DB up; Payload hooks validation errors in server logs. |
| No “Builder” link | Logged-in user must be **designer** or **admin**. |
| Health check fails | `POSTGRES_URL`, migrations, Payload secret. |

---

## Summary

You can **test end-to-end authoring**: open a composition in the builder, manipulate the five primitives with drag-and-drop and the inspector, **save a draft** through the gateway, and **reload** to confirm persistence. Use **automated tests** for regression; use **manual steps** above to explore UX and token styling.
