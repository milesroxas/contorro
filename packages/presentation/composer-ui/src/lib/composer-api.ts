import type { PageComposition } from "@repo/contracts-zod";

const base = "/api/gateway/composer";
const catalogBase = "/api/gateway/catalog";

export type ComposerPageBundle = {
  id: string;
  title: string;
  slug: string;
  compositionDocumentId: string;
  composition: PageComposition;
  updatedAt: string;
};

export type ComposerTemplateSummary = {
  id: string;
  title: string;
  slug: string;
};

export type ComposerCatalogItem = {
  id: string;
  key: string;
  displayName: string;
};

export async function fetchComposerPage(
  pageId: string,
): Promise<ComposerPageBundle> {
  const res = await fetch(`${base}/pages/${encodeURIComponent(pageId)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`load failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: ComposerPageBundle };
  return json.data;
}

export async function fetchComposerTemplates(): Promise<
  ComposerTemplateSummary[]
> {
  const res = await fetch(`${base}/templates`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`templates failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    data: { templates: ComposerTemplateSummary[] };
  };
  return json.data.templates;
}

export async function fetchComponentCatalog(): Promise<ComposerCatalogItem[]> {
  const res = await fetch(`${catalogBase}/components`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`catalog failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: { items: ComposerCatalogItem[] } };
  return json.data.items;
}

export async function createComposerPage(
  body:
    | { mode: "blank"; title: string; slug: string }
    | {
        mode: "template";
        title: string;
        slug: string;
        templateId: string;
      },
): Promise<{ pageId: string; compositionId: string }> {
  const res = await fetch(`${base}/pages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`create page failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    data: { pageId: string; compositionId: string };
  };
  return json.data;
}

export async function postComposerDraft(
  compositionId: string,
  body: {
    composition: PageComposition;
    ifMatchUpdatedAt?: string | null;
  },
): Promise<string> {
  const res = await fetch(
    `${base}/compositions/${encodeURIComponent(compositionId)}/draft`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    throw new Error(`save failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: { updatedAt: string } };
  return json.data.updatedAt;
}

export async function postPublishPage(pageId: string): Promise<void> {
  const res = await fetch(
    `${base}/pages/${encodeURIComponent(pageId)}/publish`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  if (!res.ok) {
    throw new Error(`publish failed: ${res.status}`);
  }
}
