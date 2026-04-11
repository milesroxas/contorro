import {
  addNodeCommand,
  getCompositionQuery,
  removeNodeCommand,
  saveDraftCommand,
  submitForCatalogCommand,
  updateNodePropsCommand,
  updateNodeStyleCommand,
} from "@repo/application-builder";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { PayloadCompositionRepository } from "@repo/infrastructure-persistence";
import { err } from "@repo/kernel";
import { Hono } from "hono";
import { z } from "zod";

import { resultToResponse } from "../lib/result-to-response.js";
import { designerSessionMiddleware } from "../middleware/designer-session.js";
import { getPayloadInstance } from "../payload.js";

const addNodeBody = z.object({
  parentId: z.string(),
  definitionKey: z.string(),
});

const updatePropsBody = z.object({
  propValues: z.record(z.string(), z.unknown()),
});

const updateStyleBody = z.object({
  property: z.string(),
  token: z.string(),
});

const saveDraftBody = z.object({
  composition: PageCompositionSchema,
  ifMatchUpdatedAt: z.string().nullable().optional(),
});

export const builderRouter = new Hono();

builderRouter.use(designerSessionMiddleware);

builderRouter.get("/compositions/:id", async (c) => {
  const payload = await getPayloadInstance();
  const repo = new PayloadCompositionRepository(payload);
  const id = c.req.param("id");
  const actor = c.get("actor");
  const loaded = await getCompositionQuery(repo, {
    compositionId: id,
    actor,
  });
  if (!loaded) {
    return resultToResponse(c, err("COMPOSITION_NOT_FOUND"));
  }
  return c.json({
    data: {
      composition: loaded.composition,
      updatedAt: loaded.updatedAt,
    },
  });
});

builderRouter.post("/compositions/:id/nodes", async (c) => {
  const raw = await c.req.json();
  const body = addNodeBody.safeParse(raw);
  if (!body.success) {
    return resultToResponse(c, err("VALIDATION_ERROR"));
  }
  const payload = await getPayloadInstance();
  const repo = new PayloadCompositionRepository(payload);
  const id = c.req.param("id");
  const result = await addNodeCommand(repo, {
    compositionId: id,
    parentId: body.data.parentId,
    definitionKey: body.data.definitionKey,
    actor: c.get("actor"),
  });
  return resultToResponse(c, result);
});

builderRouter.delete("/compositions/:id/nodes/:nodeId", async (c) => {
  const payload = await getPayloadInstance();
  const repo = new PayloadCompositionRepository(payload);
  const result = await removeNodeCommand(repo, {
    compositionId: c.req.param("id"),
    nodeId: c.req.param("nodeId"),
    actor: c.get("actor"),
  });
  return resultToResponse(c, result);
});

builderRouter.patch("/compositions/:id/nodes/:nodeId", async (c) => {
  const raw = await c.req.json();
  const body = updatePropsBody.safeParse(raw);
  if (!body.success) {
    return resultToResponse(c, err("VALIDATION_ERROR"));
  }
  const payload = await getPayloadInstance();
  const repo = new PayloadCompositionRepository(payload);
  const result = await updateNodePropsCommand(repo, {
    compositionId: c.req.param("id"),
    nodeId: c.req.param("nodeId"),
    patch: body.data.propValues,
    actor: c.get("actor"),
  });
  return resultToResponse(c, result);
});

builderRouter.patch("/compositions/:id/nodes/:nodeId/style", async (c) => {
  const raw = await c.req.json();
  const body = updateStyleBody.safeParse(raw);
  if (!body.success) {
    return resultToResponse(c, err("VALIDATION_ERROR"));
  }
  const payload = await getPayloadInstance();
  const repo = new PayloadCompositionRepository(payload);
  const result = await updateNodeStyleCommand(repo, {
    compositionId: c.req.param("id"),
    nodeId: c.req.param("nodeId"),
    property: body.data.property,
    token: body.data.token,
    actor: c.get("actor"),
  });
  return resultToResponse(c, result);
});

builderRouter.post("/compositions/:id/draft", async (c) => {
  const raw = await c.req.json();
  const body = saveDraftBody.safeParse(raw);
  if (!body.success) {
    return resultToResponse(c, err("VALIDATION_ERROR"));
  }
  const payload = await getPayloadInstance();
  const repo = new PayloadCompositionRepository(payload);
  const result = await saveDraftCommand(repo, {
    compositionId: c.req.param("id"),
    composition: body.data.composition,
    ifMatchUpdatedAt: body.data.ifMatchUpdatedAt,
    actor: c.get("actor"),
  });
  return resultToResponse(c, result);
});

builderRouter.post("/compositions/:id/submit", async (c) => {
  const result = await submitForCatalogCommand({
    compositionId: c.req.param("id"),
    actor: c.get("actor"),
  });
  return resultToResponse(c, result);
});
