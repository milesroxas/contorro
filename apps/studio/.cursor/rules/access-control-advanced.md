# Advanced access control notes

Auth role checks in the **composition API** currently allow `admin` and `designer` roles.

When adding advanced access logic:

- Keep ACL behavior in collection access functions under infrastructure payload-config.
- Keep route-level guards minimal and consistent with collection access.
- For Local API operations with `user`, set `overrideAccess: false`.

Avoid duplicating ACL logic in multiple routes when collection access can own it.
