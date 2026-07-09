import { studioRowIdForComponent } from "@repo/domains-composition";
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

const {
  GET: getComposition,
  PATCH: patchComposition,
  POST: postComposition,
} = await import("../../src/app/api/studio/compositions/[id]/route.js");
const { closeTestPayload, getTestPayload } = await import(
  "../helpers/getTestPayload.js"
);

const routeUser = {
  email: `route-int-${Date.now()}@local.test`,
  password: "route-int-password",
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

describe("studio compositions route — blockType PATCH and save errors", () => {
  let payload: Payload;
  let userId: number;
  const createdComponents: number[] = [];
  const createdTemplates: number[] = [];

  beforeAll(async () => {
    payload = await getTestPayload();
    const user = await payload.create({
      collection: "users",
      data: { ...routeUser, role: "admin" },
      overrideAccess: true,
    });
    userId = user.id as number;
    authState.payload = payload;
    authState.user = { ...user, collection: "users" };
  });

  afterAll(async () => {
    for (const id of createdComponents) {
      await payload.delete({
        collection: "components",
        id,
        overrideAccess: true,
      });
    }
    for (const id of createdTemplates) {
      await payload.delete({
        collection: "page-compositions",
        id,
        overrideAccess: true,
      });
    }
    await payload.delete({
      collection: "users",
      id: userId,
      overrideAccess: true,
    });
    await closeTestPayload();
  });

  async function createDraftComponent(): Promise<number> {
    const created = await payload.create({
      collection: "components",
      draft: true,
      data: {
        displayName: `Route int component ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        composition: minimalComposition(),
      },
      overrideAccess: true,
    });
    const id = created.id as number;
    createdComponents.push(id);
    return id;
  }

  it("PATCH sets and clears blockType on a component", async () => {
    const componentId = await createDraftComponent();
    const rowId = studioRowIdForComponent(String(componentId));

    const setRes = await patchComposition(
      ...requestFor(rowId, {
        method: "PATCH",
        body: { blockType: "hero", intent: "draft" },
      }),
    );
    expect(setRes.status).toBe(200);
    const setJson = (await setRes.json()) as {
      data: { blockType?: string | null };
    };
    expect(setJson.data.blockType).toBe("hero");

    const clearRes = await patchComposition(
      ...requestFor(rowId, {
        method: "PATCH",
        body: { blockType: null, intent: "draft" },
      }),
    );
    expect(clearRes.status).toBe(200);
    const clearJson = (await clearRes.json()) as {
      data: { blockType?: string | null };
    };
    expect(clearJson.data.blockType).toBeNull();

    const getRes = await getComposition(...requestFor(rowId));
    expect(getRes.status).toBe(200);
    const getJson = (await getRes.json()) as {
      data: { blockType?: string | null };
    };
    expect(getJson.data.blockType).toBeNull();
  });

  it("PATCH rejects unknown block types with a message", async () => {
    const componentId = await createDraftComponent();
    const rowId = studioRowIdForComponent(String(componentId));

    const res = await patchComposition(
      ...requestFor(rowId, {
        method: "PATCH",
        body: { blockType: "not-a-block", intent: "draft" },
      }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      error: { code: string; message?: string };
    };
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toMatch(/block type/i);
  });

  it("PATCH rejects blockType on page compositions", async () => {
    const created = await payload.create({
      collection: "page-compositions",
      draft: true,
      data: {
        title: `Route int template ${Date.now()}`,
        slug: `route-int-template-${Date.now()}`,
      },
      overrideAccess: true,
    });
    createdTemplates.push(created.id as number);

    const res = await patchComposition(
      ...requestFor(String(created.id), {
        method: "PATCH",
        body: { blockType: "hero", intent: "draft" },
      }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: { message?: string } };
    expect(json.error.message).toMatch(/components only/);
  });

  it("PATCH rejects a body with neither name nor blockType", async () => {
    const componentId = await createDraftComponent();
    const rowId = studioRowIdForComponent(String(componentId));

    const res = await patchComposition(
      ...requestFor(rowId, {
        method: "PATCH",
        body: { intent: "draft" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST publish surfaces the blockType binding gate message", async () => {
    const componentId = await createDraftComponent();
    const rowId = studioRowIdForComponent(String(componentId));

    const typed = await patchComposition(
      ...requestFor(rowId, {
        method: "PATCH",
        body: { blockType: "hero", intent: "draft" },
      }),
    );
    expect(typed.status).toBe(200);

    // Hero requires a bound "heading"; the minimal composition binds nothing.
    const res = await postComposition(
      ...requestFor(rowId, {
        method: "POST",
        body: {
          composition: minimalComposition(),
          ifMatchUpdatedAt: null,
          intent: "publish",
        },
      }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      error: { code: string; message?: string };
    };
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toMatch(/required field "heading" is not bound/);
  });

  it("POST rejects unknown style tokens and lists the offenders", async () => {
    const componentId = await createDraftComponent();
    const rowId = studioRowIdForComponent(String(componentId));

    const composition = {
      ...minimalComposition(),
      nodes: {
        root: {
          ...minimalComposition().nodes.root,
          styleBindingId: "sb-root",
        },
      },
      styleBindings: {
        "sb-root": {
          id: "sb-root",
          nodeId: "root",
          properties: [
            {
              type: "token" as const,
              property: "background" as const,
              token: "no.such.token",
            },
          ],
        },
      },
    };

    const res = await postComposition(
      ...requestFor(rowId, {
        method: "POST",
        body: { composition, ifMatchUpdatedAt: null, intent: "draft" },
      }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as {
      error: { code: string; message?: string; issues?: unknown[] };
    };
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.message).toContain("no.such.token");
    expect(json.error.issues).toEqual([
      { bindingId: "sb-root", property: "background", token: "no.such.token" },
    ]);
  });

  it("POST surfaces graph invariant messages", async () => {
    const componentId = await createDraftComponent();
    const rowId = studioRowIdForComponent(String(componentId));

    const composition = {
      rootId: "root",
      nodes: {
        root: {
          id: "root",
          kind: "primitive" as const,
          definitionKey: "primitive.section",
          parentId: null,
          childIds: ["missing-child"],
        },
      },
      styleBindings: {},
    };

    const res = await postComposition(
      ...requestFor(rowId, {
        method: "POST",
        body: { composition, ifMatchUpdatedAt: null, intent: "draft" },
      }),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: { message?: string } };
    expect(json.error.message).toMatch(/missing child/);
  });
});
