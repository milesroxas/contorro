import type {
  BlockCatalogEntry,
  BlockFieldSpec,
  CompositionNode,
  PageComposition,
} from "@repo/contracts-zod";

/**
 * Typed value injection for the blocks content model: patches a block design
 * composition with the block instance's field values at nodes bound via
 * `contentBinding.source === "editor"` (binding names = catalog field names).
 *
 * A node is only patched when a value for its field actually exists — missing
 * values never blank authored design content (audit §1.3).
 */

type LexicalNodeLike = {
  type?: unknown;
  text?: unknown;
  children?: unknown;
};

function collectLexicalText(node: LexicalNodeLike, out: string[]): void {
  if (typeof node.text === "string" && node.text !== "") {
    out.push(node.text);
  }
  if (Array.isArray(node.children)) {
    const parts: string[] = [];
    for (const child of node.children) {
      if (child && typeof child === "object") {
        collectLexicalText(child as LexicalNodeLike, parts);
      }
    }
    if (parts.length > 0) {
      out.push(parts.join(""));
    }
  }
}

/** Plain text from a Payload Lexical rich-text value (paragraphs joined by newlines). */
export function plainTextFromLexical(value: unknown): string | null {
  if (
    !value ||
    typeof value !== "object" ||
    !("root" in value) ||
    typeof (value as { root?: unknown }).root !== "object" ||
    (value as { root: unknown }).root === null
  ) {
    return null;
  }
  const root = (value as { root: LexicalNodeLike }).root;
  if (!Array.isArray(root.children)) {
    return null;
  }
  const blocks: string[] = [];
  for (const child of root.children) {
    if (!child || typeof child !== "object") {
      continue;
    }
    const parts: string[] = [];
    collectLexicalText(child as LexicalNodeLike, parts);
    const text = parts.join("");
    if (text !== "") {
      blocks.push(text);
    }
  }
  return blocks.length > 0 ? blocks.join("\n") : null;
}

function populatedDocFromRelation(
  value: unknown,
): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function textPatch(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string" && value.trim() !== "") {
    return { content: value };
  }
  return null;
}

function richTextPatch(value: unknown): Record<string, unknown> | null {
  const text = plainTextFromLexical(value);
  return text !== null ? { content: text } : null;
}

function imagePatch(value: unknown): Record<string, unknown> | null {
  // Populated media doc only (depth ≥ 1); an unpopulated id never blanks src.
  const media = populatedDocFromRelation(value);
  if (!media || typeof media.url !== "string" || media.url === "") {
    return null;
  }
  const patch: Record<string, unknown> = {
    src: media.url,
    imageSource: "media",
    mediaUrl: media.url,
  };
  if (typeof media.alt === "string" && media.alt !== "") {
    patch.alt = media.alt;
  }
  return patch;
}

function buttonHref(button: Record<string, unknown>): string | null {
  if (button.linkType === "page") {
    const page = populatedDocFromRelation(button.page);
    const slug = page && typeof page.slug === "string" ? page.slug : "";
    return slug !== "" ? `/${slug}` : null;
  }
  return typeof button.url === "string" && button.url.trim() !== ""
    ? button.url.trim()
    : null;
}

function buttonPatch(value: unknown): Record<string, unknown> | null {
  const button = populatedDocFromRelation(value);
  if (!button) {
    return null;
  }
  const patch: Record<string, unknown> = {};
  if (typeof button.label === "string" && button.label.trim() !== "") {
    patch.label = button.label;
  }
  const href = buttonHref(button);
  if (href !== null) {
    patch.href = href;
    patch.linkType = "url";
  }
  if (typeof button.openInNewTab === "boolean") {
    patch.openInNewTab = button.openInNewTab;
  }
  return Object.keys(patch).length > 0 ? patch : null;
}

function numberPatch(value: unknown): Record<string, unknown> | null {
  return typeof value === "number" && Number.isFinite(value)
    ? { content: String(value) }
    : null;
}

function checkboxPatch(value: unknown): Record<string, unknown> | null {
  return typeof value === "boolean" ? { checked: value } : null;
}

function propValuesPatchForField(
  field: BlockFieldSpec,
  value: unknown,
): Record<string, unknown> | null {
  switch (field.type) {
    case "text":
      return textPatch(value);
    case "richText":
      return richTextPatch(value);
    case "image":
      return imagePatch(value);
    case "button":
      return buttonPatch(value);
    case "number":
      return numberPatch(value);
    case "checkbox":
      return checkboxPatch(value);
  }
}

function boundFieldName(node: CompositionNode): string | null {
  const cb = node.contentBinding;
  if (cb?.source !== "editor") {
    return null;
  }
  return cb.editorField?.name ?? cb.key;
}

/**
 * Injects a block instance's typed values into its design composition.
 * `values` is the native Payload block row (field values keyed by catalog
 * field names, relations populated). Nodes bound to fields without a value
 * keep their authored `propValues` untouched.
 */
export function injectBlockValues(
  design: PageComposition,
  values: Record<string, unknown>,
  entry: BlockCatalogEntry,
): PageComposition {
  const fieldsByName = new Map(entry.fields.map((f) => [f.name, f]));
  const nextNodes: PageComposition["nodes"] = { ...design.nodes };
  let changed = false;

  for (const [id, node] of Object.entries(design.nodes)) {
    const name = boundFieldName(node);
    if (name === null) {
      continue;
    }
    const field = fieldsByName.get(name);
    if (!field) {
      continue;
    }
    const value = values[name];
    if (value === undefined || value === null) {
      continue;
    }
    const patch = propValuesPatchForField(field, value);
    if (patch === null) {
      continue;
    }
    nextNodes[id] = {
      ...node,
      propValues: { ...node.propValues, ...patch },
    };
    changed = true;
  }

  return changed ? { ...design, nodes: nextNodes } : design;
}
