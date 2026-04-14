# Access control baseline

## Core rules

- Local API defaults to bypass access. Use `overrideAccess: false` when acting as user.
- Route handlers should authenticate first, then rely on collection access rules where possible.
- Keep role definitions and access functions in infrastructure payload-config package.

## Current role gate in composition API

`apps/cms/src/app/api/studio/compositions/[id]/route.ts` and
`apps/cms/src/app/api/studio/compositions/route.ts` restrict to `admin` or `designer`.
