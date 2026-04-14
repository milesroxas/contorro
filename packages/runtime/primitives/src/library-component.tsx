import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

/**
 * Fallback when a `primitive.libraryComponent` node was not expanded at render
 * (e.g. missing definition). Expanded trees never hit this component.
 */
export function LibraryComponent({
  node,
  className,
  style,
}: RuntimePrimitiveProps) {
  const key =
    typeof node.propValues?.componentKey === "string"
      ? node.propValues.componentKey
      : "";
  return (
    <div className={className} style={style}>
      <div className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
        {key ? (
          <>
            <span className="font-medium text-foreground">Component</span>
            <div className="mt-1 font-mono text-xs">{key}</div>
          </>
        ) : (
          "Component"
        )}
      </div>
    </div>
  );
}
