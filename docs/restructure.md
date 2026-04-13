# Restructure notes

## H.5 Same-origin gateway + admin auth bridging

`apps/studio/src/app/api/gateway/[[...route]]/route.ts` forwards requests to `gatewayApp` in-process and injects `Authorization: JWT ...` from Payload cookie when header is missing.

Purpose:

- Preserve same-origin fetch ergonomics in admin/studio.
- Keep gateway auth checks compatible with Payload JWT cookie sessions.
