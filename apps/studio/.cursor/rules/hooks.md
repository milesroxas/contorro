# Hooks rules (repo-specific)

Hooks live in `packages/infrastructure/payload-config/src/hooks` and `collection-hooks`.

Required patterns:

- Pass `req` into nested Local API calls.
- Use context flags to prevent recursive writes.
- Keep heavy business logic out of hooks; call application/domain services where needed.

When modifying hooks, verify behavior with studio integration tests (`tests/int`).
