import { createCompositionEntryCommand } from "@repo/application-builder";
import { getPayload } from "payload";

import { payloadBuilderMutationRepository } from "@/app/api/builder/_lib/payload-builder-mutation-repository";
import config from "@/payload.config";

type CreateBody = {
  kind?: unknown;
  title?: unknown;
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
  const unsafeTitle = typeof body.title === "string" ? body.title.trim() : "";
  const title =
    unsafeTitle === ""
      ? kind === "component"
        ? "Untitled component"
        : "Untitled page template"
      : unsafeTitle;
  const repo = payloadBuilderMutationRepository(payload, user);
  const created = await createCompositionEntryCommand(repo, {
    kind,
    title,
    actor: user,
  });
  if (!created.ok) {
    const status = created.error === "VALIDATION_ERROR" ? 400 : 500;
    return Response.json(
      {
        error: {
          code:
            created.error === "VALIDATION_ERROR"
              ? ("VALIDATION_ERROR" as const)
              : ("CREATE_FAILED" as const),
        },
      },
      { status },
    );
  }

  return Response.json({
    data: {
      id: created.value.compositionId,
    },
  });
}
