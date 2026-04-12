import { z } from "zod";

/** CMS-editable field bound from the composition tree (not layout “slots” for components). */
export const EditorFieldSpecSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case field name"),
  type: z.enum(["text", "richText", "image", "link", "number", "boolean"]),
  required: z.boolean(),
  label: z.string().min(1),
  description: z.string().optional(),
  defaultValue: z.unknown().optional(),
});

export type EditorFieldSpec = z.infer<typeof EditorFieldSpecSchema>;

/** Values allowed for `EditorFieldSpec.type` — drives Payload control choice. */
export const EDITOR_FIELD_TYPES = [
  "text",
  "richText",
  "image",
  "link",
  "number",
  "boolean",
] as const satisfies ReadonlyArray<EditorFieldSpec["type"]>;

/** Published manifest of CMS fields for a component or page template. */
export const EditorFieldsContractSchema = z.object({
  editorFields: z.array(EditorFieldSpecSchema).superRefine((fields, ctx) => {
    const seen = new Set<string>();
    for (const f of fields) {
      if (seen.has(f.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate editor field name: ${f.name}`,
        });
        return;
      }
      seen.add(f.name);
    }
  }),
});

export type EditorFieldsContract = z.infer<typeof EditorFieldsContractSchema>;
