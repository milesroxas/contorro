import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

const VALID_HEADING_LEVELS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

export function Heading({ node, className, style }: RuntimePrimitiveProps) {
  const levelRaw = node.propValues?.level;
  const level =
    typeof levelRaw === "string" && VALID_HEADING_LEVELS.has(levelRaw)
      ? levelRaw
      : "h2";
  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";

  return (
    <div
      className={className}
      data-definition={node.definitionKey}
      style={style}
    >
      {level === "h1" ? <h1>{content}</h1> : null}
      {level === "h2" ? <h2>{content}</h2> : null}
      {level === "h3" ? <h3>{content}</h3> : null}
      {level === "h4" ? <h4>{content}</h4> : null}
      {level === "h5" ? <h5>{content}</h5> : null}
      {level === "h6" ? <h6>{content}</h6> : null}
    </div>
  );
}
