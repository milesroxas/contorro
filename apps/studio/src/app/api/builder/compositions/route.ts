import { getPayload } from "payload";

import config from "@/payload.config";

type CreateBody = {
  kind?: unknown;
};

export async function POST(request: Request) {
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED" as const } },
      { status: 401 },
    );
  }
  const role = (user as { role?: string }).role;
  if (role !== "admin" && role !== "designer") {
    return Response.json(
      { error: { code: "FORBIDDEN" as const } },
      { status: 403 },
    );
  }

  let raw: unknown = {};
  const text = await request.text();
  if (text.trim() !== "") {
    try {
      raw = JSON.parse(text) as CreateBody;
    } catch {
      return Response.json(
        { error: { code: "INVALID_JSON" as const } },
        { status: 400 },
      );
    }
  }
  const body = raw && typeof raw === "object" ? (raw as CreateBody) : {};
  const unsafeKind = typeof body.kind === "string" ? body.kind.trim() : "";
  const kind = unsafeKind === "component" ? "component" : "template";
  const tempId = `new:${kind}:${crypto.randomUUID()}`;

  return Response.json({
    data: {
      id: tempId,
    },
  });
}
