import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/** Text node uses `propValues.content` or `contentBinding` key for display (§5.4). */
export function Text({ node, className, style }: RuntimePrimitiveProps) {
  const fromProps =
    typeof node.propValues?.content === "string"
      ? node.propValues.content
      : undefined;
  const cb = node.contentBinding;
  let fallback = "";
  if (cb?.source === "slot" && cb.slot) {
    fallback =
      typeof cb.slot.defaultValue === "string"
        ? cb.slot.defaultValue
        : `[${cb.key}]`;
  } else if (cb) {
    fallback = `[${cb.key}]`;
  }
  const text = fromProps ?? fallback;

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
