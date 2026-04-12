import { z } from "zod";

/** v0.4 — explicit slot a designer exposes for editor fill-in (restructure committed decisions). */
export const SlotDefinitionSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case slot name"),
  type: z.enum(["text", "richText", "image", "link", "number", "boolean"]),
  required: z.boolean(),
  label: z.string().min(1),
  description: z.string().optional(),
  defaultValue: z.unknown().optional(),
});

export type SlotDefinition = z.infer<typeof SlotDefinitionSchema>;

/** Values allowed for `SlotDefinition.type` — drives editor / Payload control choice. */
export const EDITOR_SLOT_TYPES = [
  "text",
  "richText",
  "image",
  "link",
  "number",
  "boolean",
] as const satisfies ReadonlyArray<SlotDefinition["type"]>;

/** Published component slot contract: unique names within the component. */
export const EditorSlotContractSchema = z.object({
  slots: z.array(SlotDefinitionSchema).superRefine((slots, ctx) => {
    const seen = new Set<string>();
    for (const s of slots) {
      if (seen.has(s.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `duplicate slot name: ${s.name}`,
        });
        return;
      }
      seen.add(s.name);
    }
  }),
});

export type EditorSlotContract = z.infer<typeof EditorSlotContractSchema>;
