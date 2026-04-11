import {
  parsePropSlotContractImport,
  propContractToJsonSchema2020,
  slotContractToJsonSchema2020,
} from "@repo/application-contract-sync";
import { err } from "@repo/kernel";
import { Hono } from "hono";
import type { TypedUser } from "payload";

import { resultToResponse } from "../lib/result-to-response.js";
import { engineerSessionMiddleware } from "../middleware/engineer-session.js";
import { getPayloadInstance } from "../payload.js";

/** §8.2 — /api/gateway/contracts */
export const contractsRouter = new Hono();

contractsRouter.get(
  "/components/:key/schema",
  engineerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const key = decodeURIComponent(c.req.param("key"));

    let doc: Record<string, unknown> | undefined;
    try {
      const found = await payload.find({
        collection: "component-definitions",
        depth: 0,
        limit: 1,
        where: {
          key: { equals: key },
        },
        user: actor,
        overrideAccess: false,
      });
      doc = found.docs[0] as Record<string, unknown> | undefined;
    } catch {
      return resultToResponse(c, err("PERSISTENCE_ERROR"));
    }
    if (!doc) {
      return resultToResponse(c, err("NOT_FOUND"));
    }

    return c.json({
      data: {
        key: typeof doc.key === "string" ? doc.key : key,
        propContract: doc.propContract as unknown,
        slotContract: doc.slotContract as unknown,
        propContractJsonSchema: propContractToJsonSchema2020(),
        slotContractJsonSchema: slotContractToJsonSchema2020(),
      },
    });
  },
);

contractsRouter.post(
  "/components/:key/schema",
  engineerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const key = decodeURIComponent(c.req.param("key"));
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }
    const parsed = parsePropSlotContractImport(raw);
    if (!parsed.ok) {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }

    let doc:
      | { id: string | number; propContract?: unknown; slotContract?: unknown }
      | undefined;
    try {
      const found = await payload.find({
        collection: "component-definitions",
        depth: 0,
        limit: 1,
        where: {
          key: { equals: key },
        },
        user: actor,
        overrideAccess: false,
      });
      doc = found.docs[0] as
        | {
            id: string | number;
            propContract?: unknown;
            slotContract?: unknown;
          }
        | undefined;
    } catch {
      return resultToResponse(c, err("PERSISTENCE_ERROR"));
    }
    if (!doc) {
      return resultToResponse(c, err("NOT_FOUND"));
    }

    const data = {
      propContract:
        parsed.value.propContract !== undefined
          ? parsed.value.propContract
          : doc.propContract,
      slotContract:
        parsed.value.slotContract !== undefined
          ? parsed.value.slotContract
          : doc.slotContract,
    };

    try {
      await payload.update({
        collection: "component-definitions",
        id: doc.id,
        data,
        user: actor,
        overrideAccess: false,
      });
    } catch (e) {
      const name =
        typeof e === "object" && e !== null && "name" in e
          ? String((e as { name: unknown }).name)
          : "";
      if (name === "Forbidden" || name === "ForbiddenError") {
        return resultToResponse(c, err("FORBIDDEN"));
      }
      return resultToResponse(c, err("PERSISTENCE_ERROR"));
    }

    return c.json({ data: { imported: true as const } });
  },
);
