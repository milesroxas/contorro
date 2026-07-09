import { StudioCreateCompositionRequestSchema } from "@repo/contracts-zod";
import { studioNewCompositionSessionId } from "@repo/domains-composition";

import { requireStudioDesigner } from "@/app/api/studio/_lib/studio-auth";

export async function POST(request: Request) {
  const auth = await requireStudioDesigner(request);
  if (auth instanceof Response) {
    return auth;
  }

  let raw: unknown = {};
  const text = await request.text();
  if (text.trim() !== "") {
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      return Response.json(
        { error: { code: "INVALID_JSON" as const } },
        { status: 400 },
      );
    }
  }
  const parsed = StudioCreateCompositionRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR" as const,
          message: 'kind must be "template" or "component"',
        },
      },
      { status: 400 },
    );
  }
  const kind = parsed.data.kind ?? "template";
  const tempId = studioNewCompositionSessionId(kind);

  return Response.json({
    data: {
      id: tempId,
    },
  });
}
