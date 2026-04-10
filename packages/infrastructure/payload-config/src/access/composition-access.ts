import type { Access } from "payload";

function roleOf(user: unknown): string | undefined {
  if (typeof user !== "object" || user === null || !("role" in user)) {
    return undefined;
  }
  return (user as { role?: string }).role;
}

/** §5.2 — compose pages: admin, designer, contentEditor */
export const composerAuthoringAccess: Access = ({ req: { user } }) => {
  const r = roleOf(user);
  return r === "admin" || r === "designer" || r === "contentEditor";
};

/** §5.2 — author components (definitions): admin, designer */
export const componentAuthoringAccess: Access = ({ req: { user } }) => {
  const r = roleOf(user);
  return r === "admin" || r === "designer";
};
