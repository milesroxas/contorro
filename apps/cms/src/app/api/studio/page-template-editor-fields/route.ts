import { getPayload } from "payload";

import { expandedPageTemplateEditorFieldSpecs } from "@/lib/page-template-editor-fields";
import config from "@/payload.config";

function parseCompositionId(raw: string | null): number | null {
  if (!raw || !/^\d+$/.test(raw)) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(request: Request) {
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: request.headers });
  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED" as const } },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const compositionId = parseCompositionId(
    url.searchParams.get("compositionId"),
  );
  if (compositionId === null) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR" as const } },
      { status: 400 },
    );
  }

  const fields = await expandedPageTemplateEditorFieldSpecs({
    payload,
    user,
    pageComposition: compositionId,
  });
  if (fields === null) {
    return Response.json(
      { error: { code: "NOT_FOUND" as const } },
      { status: 404 },
    );
  }

  return Response.json({ data: { fields } });
}
