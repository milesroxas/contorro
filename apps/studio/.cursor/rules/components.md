# Admin and app components

Studio admin component wiring happens in `apps/studio/src/payload.config.ts`:

- Admin providers: `/components/admin/PayloadAdminTheme`
- Nav link: `/components/admin/BuilderNavLink`
- Dashboard callouts/openers
- Custom admin view: `/builder`

Rule:

- Keep component path references compatible with Payload import map generation.
- Generate import map after adding/changing admin component entries.
