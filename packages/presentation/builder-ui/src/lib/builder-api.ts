import type { PageComposition } from "@repo/contracts-zod";

const base = "/api/gateway/builder";
const studioBuilder = "/api/builder";

export type GatewayCompositionResponse = {
  data: {
    composition: PageComposition;
    updatedAt: string;
  };
};

export type GatewaySaveResponse = {
  data: { updatedAt: string };
};

export async function fetchComposition(
  compositionId: string,
): Promise<GatewayCompositionResponse["data"]> {
  const res = await fetch(`${base}/compositions/${compositionId}`, {
    credentials: "include",
  });
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
  const res = await fetch(`${studioBuilder}/compositions/${compositionId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
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

export async function postAddNode(
  compositionId: string,
  parentId: string,
  definitionKey: string,
): Promise<string> {
  const res = await fetch(`${base}/compositions/${compositionId}/nodes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parentId, definitionKey }),
  });
  if (!res.ok) {
    throw new Error(`add node failed: ${res.status}`);
  }
  const json = (await res.json()) as GatewaySaveResponse;
  return json.data.updatedAt;
}

export async function patchNodeProps(
  compositionId: string,
  nodeId: string,
  propValues: Record<string, unknown>,
): Promise<string> {
  const res = await fetch(
    `${base}/compositions/${compositionId}/nodes/${nodeId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propValues }),
    },
  );
  if (!res.ok) {
    throw new Error(`update props failed: ${res.status}`);
  }
  const json = (await res.json()) as GatewaySaveResponse;
  return json.data.updatedAt;
}

export async function patchNodeStyle(
  compositionId: string,
  nodeId: string,
  property: string,
  token: string,
): Promise<string> {
  const res = await fetch(
    `${base}/compositions/${compositionId}/nodes/${nodeId}/style`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property, token }),
    },
  );
  if (!res.ok) {
    throw new Error(`update style failed: ${res.status}`);
  }
  const json = (await res.json()) as GatewaySaveResponse;
  return json.data.updatedAt;
}
