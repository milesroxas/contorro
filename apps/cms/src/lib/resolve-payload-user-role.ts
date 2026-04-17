import { roleFromJwtUser } from "@repo/infrastructure-payload-config";

/** Role from Payload auth user (JWT token data for `saveToJWT` fields). */
export function resolveUserRole(user: unknown): string | undefined {
  return roleFromJwtUser(user);
}

export function isStudioDesignerOrAdminRole(role: string | undefined): boolean {
  return role === "admin" || role === "designer";
}
