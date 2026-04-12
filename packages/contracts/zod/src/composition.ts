import { z } from "zod";

import { EditorFieldSpecSchema } from "./editor-fields.js";
import { StyleBindingSchema } from "./style-binding.js";

/** Legacy `contentBinding.source === "slot"` → `"editor"` (CMS fields, not layout slots). */
function migrateContentBinding(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") {
    return raw;
  }
  const r = raw as Record<string, unknown>;
  if (r.source === "slot") {
    return {
      source: "editor",
      key: r.key,
      editorField: r.slot,
    };
  }
  return raw;
}

const ContentBindingInnerSchema = z.object({
  source: z.enum(["inline", "field", "global", "editor"]),
  key: z.string(),
  editorField: EditorFieldSpecSchema.optional(),
});

export const ContentBindingSchema = z.preprocess(
  migrateContentBinding,
  ContentBindingInnerSchema,
);

export type ContentBinding = z.infer<typeof ContentBindingInnerSchema>;

/** §5.4 — composition node kinds */
export const NodeKindSchema = z.enum([
  "primitive",
  "designerComponent",
  "engineerComponent",
  "slot",
  "text",
  "container",
]);

export type NodeKind = z.infer<typeof NodeKindSchema>;

/** §5.4 — single node in the composition tree */
export const CompositionNodeSchema = z.object({
  id: z.string(),
  kind: NodeKindSchema,
  definitionKey: z.string(),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()),
  styleBindingId: z.string().optional(),
  propValues: z.record(z.string(), z.unknown()).optional(),
  /** Layout slots: named regions where child components are placed (node ids). */
  slotValues: z.record(z.string(), z.array(z.string())).optional(),
  /** Inline vs CMS-driven content; `editor` + `editorField` = Payload-managed fields. */
  contentBinding: ContentBindingSchema.optional(),
  visibility: z.object({ hidden: z.boolean() }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CompositionNode = z.infer<typeof CompositionNodeSchema>;

/** Persisted document: root + adjacency maps */
export const PageCompositionSchema = z.object({
  rootId: z.string(),
  nodes: z.record(z.string(), CompositionNodeSchema),
  styleBindings: z.record(z.string(), StyleBindingSchema),
});

export type PageComposition = z.infer<typeof PageCompositionSchema>;

/** §5.3 — primitive/component prop contract (validated JSON on definitions) */
export const PropFieldSpecSchema = z.object({
  valueType: z.enum([
    "string",
    "number",
    "boolean",
    "length",
    "color",
    "unknown",
  ]),
  required: z.boolean().optional(),
});

export const PropContractSchema = z.object({
  fields: z.record(z.string(), PropFieldSpecSchema),
});

export type PropContract = z.infer<typeof PropContractSchema>;

/** §5.4 — pre-v0.4 slot shape (maxNodes per slot id). */
export const LegacySlotContractSchema = z.object({
  slots: z.record(
    z.string(),
    z.object({
      maxNodes: z.number().int().positive().optional(),
    }),
  ),
});

export type LegacySlotContract = z.infer<typeof LegacySlotContractSchema>;

/** @deprecated Prefer `LegacySlotContractSchema` */
export const SlotContractSchema = LegacySlotContractSchema;
/** @deprecated Prefer `LegacySlotContract` */
export type SlotContract = LegacySlotContract;
