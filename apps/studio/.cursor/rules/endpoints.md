# Endpoint map

## CMS-app-owned endpoints (canonical for Studio UI)

- `/api/builder/compositions/:id` (GET/POST/PATCH): composition load, save (draft/publish), rename — **canonical** for `@repo/presentation-studio`.
- `/api/builder/compositions` (POST): create template/component session and open in Studio.
- Payload REST for collections/globals (e.g. design token sets, globals) as used by **`StudioAuthoringClient`** (`resourceApiBase`, default `/api`).
- `/api/gateway/*`: same-origin forwarding to the Hono gateway app with JWT bridging.

**Rule:** composition route handlers orchestrate only; mutation logic goes through `@repo/application-builder` commands and the repository adapter.

## Gateway-owned endpoints (behind forwarder)

- `/api/gateway/health`
- `/api/gateway/contracts/components/:key/schema` (GET/POST)
- `/api/gateway/builder/compositions/:id` currently returns **`NOT_IMPLEMENTED`** (use CMS app `/api/builder/*` instead).

Do not re-enable gateway composition mutations unless architecture explicitly changes.
