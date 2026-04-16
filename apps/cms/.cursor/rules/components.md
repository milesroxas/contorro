# Admin and app components

Payload admin component wiring is declared in `apps/cms/src/payload.config.ts`:

- Admin providers: `/components/admin/PayloadAdminTheme`
- Nav link: `/components/admin/StudioNavLink` (sidebar label: **Studio**)
- Dashboard callouts/openers
- Studio UI: first-class route **`/studio`** (`app/(studio)/studio/page.tsx`; embeds `@repo/presentation-studio`), linked from admin via `StudioNavLink`

## Rules

- Keep component path references compatible with Payload import map generation.
- Run `pnpm --filter @repo/cms run generate:importmap` after adding or changing admin component entries.

## Custom UI vs Payload’s stylesheet

Studio at **`/studio`** uses `app/(studio)/layout.tsx` and does **not** load Payload admin CSS.

For **custom field / admin components** still rendered inside Payload (`(payload)/layout.tsx`), `@payloadcms/next/css` can override Tailwind/CVA on links and buttons. Prefer `data-slot="button"` and `data-variant` from `src/components/ui/button.tsx`. If you add shadcn-heavy UI in admin and hit specificity issues, scope fixes in `(payload)/custom.css` under a dedicated wrapper attribute.

**Drift:** do not fix styling by adding one-off `className` overrides on shadcn primitives in feature code for radius, borders, or surfaces — follow repo root `AGENTS.md` (shadcn: **variants over call-site overrides**). Extend CVA variants in `components/ui` when a new look is needed.
