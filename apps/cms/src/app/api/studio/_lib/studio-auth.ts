import type { Payload } from "payload";
import { getPayload } from "payload";

import {
  isStudioDesignerOrAdminRole,
  resolveUserRole,
} from "@/lib/resolve-payload-user-role";
import config from "@/payload.config";

export async function requireStudioDesigner(
  request: Request,
): Promise<Response | { payload: Payload; user: unknown }> {
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED" as const } },
      { status: 401 },
    );
  }
  const role = resolveUserRole(user);
  if (!isStudioDesignerOrAdminRole(role)) {
    return Response.json(
      { error: { code: "FORBIDDEN" as const } },
      { status: 403 },
    );
  }
  return { payload, user };
}
