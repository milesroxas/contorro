import { z } from "zod";

/**
 * Reference to a block-catalog content field, stored on a composition node as
 * `contentBinding: { source: "editor", editorField: { name } }`.
 *
 * The catalog (`BLOCK_CATALOG`) owns field types, labels and requiredness;
 * the binding only names the field. Unknown legacy keys (type/label/…) on
 * stored compositions are stripped on parse.
 */
export const EditorFieldSpecSchema = z.object({
  name: z.string().min(1),
});

export type EditorFieldSpec = z.infer<typeof EditorFieldSpecSchema>;
