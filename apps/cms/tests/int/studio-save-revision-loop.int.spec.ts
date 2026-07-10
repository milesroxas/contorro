import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// `payload.login` cannot sign JWTs under jsdom (cross-realm Uint8Array), so
// route specs stub the auth seam; requireStudioDesigner itself is covered by
// access-control tests. The stub still runs Payload ops as a real admin user.
const authState: { payload: Payload | null; user: unknown } = {
  payload: null,
  user: null,
};
vi.mock("@/app/api/studio/_lib/studio-auth", () => ({
  requireStudioDesigner: async () => ({
    payload: authState.payload,
    user: authState.user,
  }),
}));

const { GET: getComposition, POST: postComposition } = await import(
  "../../src/app/api/studio/compositions/[id]/route.js"
);
const { closeTestPayload, getTestPayload } = await import(
  "../helpers/getTestPayload.js"
);

const routeUser = {
  email: `save-loop-int-${Date.now()}@local.test`,
  password: "save-loop-int-password",
};

function minimalComposition() {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        kind: "primitive" as const,
        definitionKey: "primitive.section",
        parentId: null,
        childIds: [],
      },
    },
    styleBindings: {},
  };
}

function requestFor(
  id: string,
  init?: { method?: string; body?: unknown },
): [Request, { params: Promise<{ id: string }> }] {
  const request = new Request(
    `http://localhost/api/studio/compositions/${encodeURIComponent(id)}`,
    {
      method: init?.method ?? "GET",
      headers:
        init?.body !== undefined
          ? { "Content-Type": "application/json" }
          : undefined,
      ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
    },
  );
  return [request, { params: Promise.resolve({ id }) }];
}

async function postSave(
  id: string,
  intent: "draft" | "publish",
  ifMatchUpdatedAt: string,
): Promise<{ status: number; updatedAt: string }> {
  const res = await postComposition(
    ...requestFor(id, {
      method: "POST",
      body: { composition: minimalComposition(), intent, ifMatchUpdatedAt },
    }),
  );
  const body = (await res.json()) as { data?: { updatedAt?: string } };
  return { status: res.status, updatedAt: body.data?.updatedAt ?? "" };
}

/**
 * The studio threads each save response's `updatedAt` into the next save's
 * `ifMatchUpdatedAt`. That token is the draft-aware (version timeline)
 * timestamp, so the conditional update must match draft-aware too — a publish
 * that compared against the parent row's `updatedAt` would false-conflict
 * after every draft save (the "saved elsewhere" bug).
 */
describe("studio save loop — revision token stays valid across intents", () => {
  let payload: Payload;
  let templateId: string;

  beforeAll(async () => {
    payload = await getTestPayload();
    authState.payload = payload;
    const created = await payload.create({
      collection: "users",
      data: { ...routeUser, role: "admin" },
      overrideAccess: true,
    });
    authState.user = { ...created, collection: "users" };

    const template = await payload.create({
      collection: "page-compositions",
      data: {
        title: "Save-loop int template",
        slug: `save-loop-int-${Date.now()}`,
        composition: minimalComposition(),
      },
      draft: true,
      user: authState.user,
      overrideAccess: false,
    });
    templateId = String(template.id);
  });

  afterAll(async () => {
    try {
      await payload.delete({
        collection: "page-compositions",
        id: templateId,
        overrideAccess: true,
      });
      await payload.delete({
        collection: "users",
        where: { email: { equals: routeUser.email } },
        overrideAccess: true,
      });
    } finally {
      await closeTestPayload();
    }
  });

  it("GET → draft → draft → publish → draft succeeds threading updatedAt", async () => {
    const getRes = await getComposition(...requestFor(templateId));
    expect(getRes.status).toBe(200);
    const loaded = (await getRes.json()) as { data: { updatedAt: string } };

    const draft1 = await postSave(templateId, "draft", loaded.data.updatedAt);
    expect(draft1.status).toBe(200);

    const draft2 = await postSave(templateId, "draft", draft1.updatedAt);
    expect(draft2.status).toBe(200);

    const publish = await postSave(templateId, "publish", draft2.updatedAt);
    expect(publish.status).toBe(200);

    // And the loop keeps working after a publish.
    const draft3 = await postSave(templateId, "draft", publish.updatedAt);
    expect(draft3.status).toBe(200);
  });

  it("still conflicts on a genuinely stale revision token", async () => {
    const getRes = await getComposition(...requestFor(templateId));
    const loaded = (await getRes.json()) as { data: { updatedAt: string } };

    const draft = await postSave(templateId, "draft", loaded.data.updatedAt);
    expect(draft.status).toBe(200);

    // Reusing the pre-save token must 409 for both intents.
    const staleDraft = await postSave(
      templateId,
      "draft",
      loaded.data.updatedAt,
    );
    expect(staleDraft.status).toBe(409);

    const stalePublish = await postSave(
      templateId,
      "publish",
      loaded.data.updatedAt,
    );
    expect(stalePublish.status).toBe(409);
  });
});
