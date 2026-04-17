import type { Payload } from "payload";

function roleFromDoc(user: unknown): string | undefined {
  if (!user || typeof user !== "object" || !("role" in user)) {
    return undefined;
  }
  const r = (user as { role?: unknown }).role;
  if (typeof r !== "string") {
    return undefined;
  }
  const t = r.trim();
  return t === "" ? undefined : t;
}

/** Role from JWT/session first; if missing (legacy token, etc.), load from `users` (same idea as gateway auth). */
export async function resolveUserRole(
  payload: Payload,
  user: unknown,
): Promise<string | undefined> {
  const fromSession = roleFromDoc(user);
  if (fromSession) {
    return fromSession;
  }
  if (!user || typeof user !== "object" || !("id" in user)) {
    return undefined;
  }
  const rawId = (user as { id: unknown }).id;
  if (rawId === undefined || rawId === null) {
    return undefined;
  }
  try {
    const doc = await payload.findByID({
      collection: "users",
      id: rawId as string | number,
      depth: 0,
      user,
      overrideAccess: false,
    });
    return roleFromDoc(doc);
  } catch {
    return undefined;
  }
}

export function isStudioDesignerOrAdminRole(role: string | undefined): boolean {
  return role === "admin" || role === "designer";
}
