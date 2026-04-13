import type { TokenMeta } from "@repo/config-tailwind";
import type { PageComposition } from "@repo/contracts-zod";

const studioBuilder = "/api/builder";

export type GatewayCompositionResponse = {
  data: {
    composition: PageComposition;
    updatedAt: string;
    tokenMetadata: TokenMeta[];
    cssVariables: string;
  };
};

export type GatewaySaveResponse = {
  data: { updatedAt: string };
};

export async function fetchComposition(
  compositionId: string,
): Promise<GatewayCompositionResponse["data"]> {
  const res = await fetch(
    `${studioBuilder}/compositions/${encodeURIComponent(compositionId)}`,
    {
      credentials: "include",
    },
  );
  if (!res.ok) {
    throw new Error(`load failed: ${res.status}`);
  }
  const json = (await res.json()) as GatewayCompositionResponse;
  return json.data;
}

async function postPersistPageComposition(
  compositionId: string,
  body: {
    composition: PageComposition;
    ifMatchUpdatedAt?: string | null;
    intent: "draft" | "publish";
  },
): Promise<string> {
  const res = await fetch(
    `${studioBuilder}/compositions/${encodeURIComponent(compositionId)}`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    let code: string | undefined;
    try {
      const j = (await res.json()) as { error?: { code?: string } };
      code = j.error?.code;
    } catch {
      code = undefined;
    }
    if (res.status === 409 || code === "COMPOSITION_CONFLICT") {
      throw new Error(
        "This template was saved elsewhere. Reload the builder and try again.",
      );
    }
    throw new Error(`save failed: ${res.status}`);
  }
  const json = (await res.json()) as GatewaySaveResponse;
  return json.data.updatedAt;
}

export async function postDraft(
  compositionId: string,
  body: {
    composition: PageComposition;
    ifMatchUpdatedAt?: string | null;
  },
): Promise<string> {
  return postPersistPageComposition(compositionId, {
    ...body,
    intent: "draft",
  });
}

export async function postPublish(
  compositionId: string,
  body: {
    composition: PageComposition;
    ifMatchUpdatedAt?: string | null;
  },
): Promise<string> {
  return postPersistPageComposition(compositionId, {
    ...body,
    intent: "publish",
  });
}
