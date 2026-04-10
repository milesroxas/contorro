import type { Access } from "payload";

function roleOf(user: unknown): string | undefined {
  if (typeof user !== "object" || user === null || !("role" in user)) {
    return undefined;
  }
  return (user as { role?: string }).role;
}

/** Spec §5.2 — manage tokens: admin + designer. */
export const designerOrAdminAccess: Access = ({ req: { user } }) => {
  const r = roleOf(user);
  return r === "admin" || r === "designer";
};

export const authenticatedAccess: Access = ({ req: { user } }) => Boolean(user);
