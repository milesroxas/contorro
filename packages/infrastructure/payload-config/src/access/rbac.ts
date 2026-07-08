import type { Access } from "payload";

import { roleFromRequest } from "./jwt-user-role.js";

/**
 * Payload collection/global `access` functions (architecture §5.2 roles).
 * Uses `req.user` token data (`saveToJWT` on Users.role) — see Payload token-data docs.
 */

export const authenticatedAccess: Access = ({ req: { user } }) => Boolean(user);

/**
 * Public read scoped to published docs; full read for authenticated users.
 * Required so anonymous page rendering can populate relationships with
 * `overrideAccess: false` (draft-enabled collections consumed at render time).
 */
export const publishedOrAuthenticatedReadAccess: Access = ({
  req: { user },
}) => {
  if (user) {
    return true;
  }
  return { _status: { equals: "published" } };
};

/** Design tokens, globals, destructive template ops: admin + designer. */
export const designerOrAdminAccess: Access = ({ req }) => {
  const r = roleFromRequest(req);
  return r === "admin" || r === "designer";
};

/** Page compositions, pages, presence: admin + designer + content editor. */
export const composerAuthoringAccess: Access = ({ req }) => {
  const r = roleFromRequest(req);
  return r === "admin" || r === "designer" || r === "contentEditor";
};

/** Component definitions and publish jobs: admin + designer. */
export const componentAuthoringAccess: Access = ({ req }) => {
  const r = roleFromRequest(req);
  return r === "admin" || r === "designer";
};
