import {
  parsePropSlotContractImport,
  propContractToJsonSchema2020,
  slotContractToJsonSchema2020,
} from "@repo/application-contract-sync";
import { resolveEditorSlotContractForDefinition } from "@repo/domains-composition";
import { err } from "@repo/kernel";
import { Hono } from "hono";

import { resultToResponse } from "../lib/result-to-response.js";
import { engineerSessionMiddleware } from "../middleware/engineer-session.js";
import { pool } from "../runtime/db.js";

/** §8.2 — /api/gateway/contracts */
export const contractsRouter = new Hono();

contractsRouter.get(
  "/components/:key/schema",
  engineerSessionMiddleware,
  async (c) => {
    const key = decodeURIComponent(c.req.param("key"));

    let doc: Record<string, unknown> | undefined;
    try {
      const found = await pool.query<Record<string, unknown>>(
        `select id, key, prop_contract as "propContract", slot_contract as "slotContract",
                composition as "composition"
         from component_definitions where key = $1 limit 1`,
        [key],
      );
      doc = found.rows[0];
    } catch {
      return resultToResponse(c, err("PERSISTENCE_ERROR"));
    }
    if (!doc) {
      return resultToResponse(c, err("NOT_FOUND"));
    }

    const slotResolved = resolveEditorSlotContractForDefinition({
      composition: doc.composition,
      slotContract: doc.slotContract,
    });

    return c.json({
      data: {
        key: typeof doc.key === "string" ? doc.key : key,
        propContract: doc.propContract as unknown,
        slotContract: slotResolved.ok
          ? slotResolved.contract
          : doc.slotContract,
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
      | { id: number; propContract?: unknown; slotContract?: unknown }
      | undefined;
    try {
      const found = await pool.query<{
        id: number;
        prop_contract: unknown;
        slot_contract: unknown;
      }>(
        "select id, prop_contract, slot_contract from component_definitions where key = $1 limit 1",
        [key],
      );
      const row = found.rows[0];
      if (row) {
        doc = {
          id: row.id,
          propContract: row.prop_contract,
          slotContract: row.slot_contract,
        };
      }
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
      await pool.query(
        "update component_definitions set prop_contract = $1::jsonb, slot_contract = $2::jsonb, updated_at = now() where id = $3",
        [
          JSON.stringify(data.propContract),
          JSON.stringify(data.slotContract),
          doc.id,
        ],
      );
    } catch {
      return resultToResponse(c, err("PERSISTENCE_ERROR"));
    }

    return c.json({ data: { imported: true as const } });
  },
);
