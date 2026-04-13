# Endpoint map

## Studio-owned endpoints

- `/api/builder/compositions/:id` (GET/POST): canonical composition persistence API.
- `/api/builder/compositions` (POST): create template/component and open in builder.
- `/api/gateway/*`: same-origin forwarding to Hono gateway app with JWT bridging.

## Gateway-owned endpoints (behind forwarder)

- `/api/gateway/health`
- `/api/gateway/contracts/components/:key/schema` (GET/POST)
- `/api/gateway/builder/compositions/:id` currently returns `NOT_IMPLEMENTED`.

Rule: do not re-enable gateway composition mutations unless architecture explicitly changes.
