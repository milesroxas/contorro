import type { EditorFieldSpec } from "@repo/contracts-zod";
import { EditorFieldSpecSchema } from "@repo/contracts-zod";

export function kebabEditorFieldNameSuffixFromNodeId(nodeId: string): string {
  const suffix = nodeId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return suffix.length > 0 ? suffix : "field";
}

export function editorFieldSpecForPrimitiveButton(
  nodeId: string,
  propValues: Record<string, unknown> | undefined,
): EditorFieldSpec {
  const name = `button-${kebabEditorFieldNameSuffixFromNodeId(nodeId)}`;
  const label =
    typeof propValues?.label === "string" ? propValues.label : "Button";
  const href = typeof propValues?.href === "string" ? propValues.href : "";
  const openInNewTab = Boolean(propValues?.openInNewTab);
  return EditorFieldSpecSchema.parse({
    name,
    type: "button",
    required: false,
    label: "Button",
    defaultValue: { label, href, openInNewTab },
  });
}
