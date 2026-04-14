import type { TokenMeta } from "@repo/config-tailwind";
import type { PageComposition } from "@repo/contracts-zod";

const studioBuilder = "/api/builder";

export type GatewayCompositionResponse = {
  data: {
    name: string;
    composition: PageComposition;
    updatedAt: string;
    tokenMetadata: TokenMeta[];
    cssVariables: string;
  };
};

export type GatewaySaveResponse = {
  data: { id?: string; updatedAt: string };
};

export type GatewayRenameResponse = {
  data: {
    name: string;
    updatedAt: string;
  };
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
    name?: string;
  },
): Promise<{ id: string; updatedAt: string }> {
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
  return {
    id: json.data.id ?? compositionId,
    updatedAt: json.data.updatedAt,
  };
}

export async function postDraft(
  compositionId: string,
  body: {
    composition: PageComposition;
    ifMatchUpdatedAt?: string | null;
    name?: string;
  },
): Promise<{ id: string; updatedAt: string }> {
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
    name?: string;
  },
): Promise<{ id: string; updatedAt: string }> {
  return postPersistPageComposition(compositionId, {
    ...body,
    intent: "publish",
  });
}

export async function patchName(
  compositionId: string,
  name: string,
): Promise<GatewayRenameResponse["data"]> {
  const res = await fetch(
    `${studioBuilder}/compositions/${encodeURIComponent(compositionId)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    },
  );
  if (!res.ok) {
    throw new Error(`rename failed: ${res.status}`);
  }
  const json = (await res.json()) as GatewayRenameResponse;
  return json.data;
}
