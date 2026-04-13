/**
 * Single token entry in a {@link DesignTokenSet}.
 * Keys are immutable after the set is first published (enforced by aggregate rules).
 */
export type DesignToken = {
  key: string;
  mode?: "light" | "dark";
  category: string;
  /** Canonical CSS-ready value (e.g. hex color, length with unit). */
  resolvedValue: string;
};
