import type { CompositionNode } from "@repo/contracts-zod";
import type { CSSProperties, ComponentType, ReactNode } from "react";

/** §5.7 — binding strategy for engineer-registered components (Phase 2 skeleton). */
export type BindingStrategy = "static" | "lazy" | "remote";

export type RuntimePrimitiveProps = {
  node: CompositionNode;
  children?: ReactNode;
  /** Repeated subtree for `primitive.collection` (set by the composition renderer). */
  collectionTemplate?: ReactNode;
  /** Merged from {@link resolveStyleBinding} at the renderer shell. */
  className?: string;
  style?: CSSProperties;
};

/** Map `definitionKey` (e.g. `primitive.stack`) to a React primitive implementation. */
export type RuntimeRegistry = Record<
  string,
  ComponentType<RuntimePrimitiveProps>
>;
