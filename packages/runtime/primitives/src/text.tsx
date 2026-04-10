import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/** Text node uses `propValues.content` or `contentBinding` key for display (§5.4). */
export function Text({ node, className, style }: RuntimePrimitiveProps) {
  const fromProps =
    typeof node.propValues?.content === "string"
      ? node.propValues.content
      : undefined;
  const text =
    fromProps ?? (node.contentBinding ? `[${node.contentBinding.key}]` : "");

  return (
    <span
      className={className}
      data-definition={node.definitionKey}
      style={style}
    >
      {text}
    </span>
  );
}
