import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/** Image: src, alt, width, height, objectFit */
export function Image({ node, className, style }: RuntimePrimitiveProps) {
  const src =
    (node.propValues?.src as string | undefined) ??
    (node.propValues?.mediaUrl as string | undefined) ??
    "";
  const alt = (node.propValues?.alt as string | undefined) ?? "";
  const width = node.propValues?.width as string | number | undefined;
  const height = node.propValues?.height as string | number | undefined;
  const objectFit =
    (node.propValues?.objectFit as string | undefined) ?? "cover";

  return (
    <img
      alt={alt}
      className={className}
      data-definition={node.definitionKey}
      height={typeof height === "number" ? height : undefined}
      src={src || undefined}
      style={{
        objectFit: objectFit as "cover" | "contain" | "fill" | "none",
        ...style,
      }}
      width={typeof width === "number" ? width : undefined}
    />
  );
}
