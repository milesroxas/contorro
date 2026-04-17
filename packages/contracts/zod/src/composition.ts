import { z } from "zod";

import { EditorFieldSpecSchema } from "./editor-fields.js";
import { StyleBindingSchema } from "./style-binding.js";

const ContentBindingInnerSchema = z.object({
  source: z.enum(["inline", "field", "global", "editor", "collection"]),
  key: z.string(),
  editorField: EditorFieldSpecSchema.optional(),
});

export const ContentBindingSchema = ContentBindingInnerSchema;

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
