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
  const hasSource = src.trim().length > 0;

  if (!hasSource) {
    return (
      <div
        aria-label={alt || "Image placeholder"}
        className={className}
        data-definition={node.definitionKey}
        style={{
          alignItems: "center",
          aspectRatio: "16 / 9",
          background:
            "linear-gradient(135deg, color-mix(in oklab, CanvasText 8%, Canvas) 0%, color-mix(in oklab, CanvasText 4%, Canvas) 100%)",
          border: "1px dashed color-mix(in oklab, CanvasText 22%, Canvas)",
          color: "color-mix(in oklab, CanvasText 55%, Canvas)",
          display: "flex",
          justifyContent: "center",
          margin: "auto",
          minHeight: "8rem",
          width: "100%",
          ...style,
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Image
        </div>
      </div>
    );
  }

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
