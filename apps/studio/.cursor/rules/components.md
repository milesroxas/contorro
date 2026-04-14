# Admin and app components

Payload admin component wiring is declared in `apps/studio/src/payload.config.ts`:

- Admin providers: `/components/admin/PayloadAdminTheme`
- Nav link: `/components/admin/BuilderNavLink` (sidebar label: **Studio**)
- Dashboard callouts/openers
- Custom admin view: `/builder` (embeds `@repo/presentation-studio`)

## Rules

- Keep component path references compatible with Payload import map generation.
- Run `payload generate:importmap` after adding or changing admin component entries.

## Custom UI vs Payload’s stylesheet

`@payloadcms/next/css` loads **after** `globals.css`. Payload’s link/button rules can override Tailwind/CVA colors on `<a>` (e.g. `Button` + `asChild` + Next `Link`).

- Put a root on every custom admin surface: `data-contorro-admin-ui` (see `BuilderView` and `(payload)/custom.scss`).
- Scoped repairs use `data-slot="button"` and `data-variant` from `src/components/ui/button.tsx`. For new shadcn surfaces **outside** the `/builder` custom view, wrap the tree with the same attribute or extend `custom.scss` under that scope only.
