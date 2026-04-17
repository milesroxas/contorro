import { studioNewCompositionSessionId } from "@repo/domains-composition";

import { requireStudioDesigner } from "@/app/api/studio/_lib/studio-auth";

type CreateBody = {
  kind?: unknown;
};

export async function POST(request: Request) {
  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
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
  const tempId = studioNewCompositionSessionId(kind);

  return Response.json({
    data: {
      id: tempId,
    },
  });
}
