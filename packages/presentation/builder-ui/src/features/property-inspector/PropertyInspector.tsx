"use client";

import type { TokenMeta } from "@repo/config-tailwind";
import {
  type CompositionNode,
  EDITOR_FIELD_TYPES,
  type EditorFieldSpec,
  EditorFieldSpecSchema,
  type PageComposition,
  type StyleProperty,
  type StylePropertyEntry,
  utilityValuesForStyleProperty,
} from "@repo/contracts-zod";
import {
  type StyleSectionId,
  stylePropertiesBySectionForDefinitionKey,
  stylePropertyLabel,
  styleSectionForProperty,
} from "@repo/domains-composition";
import type { Icon } from "@tabler/icons-react";
import {
  IconBox,
  IconLayoutGrid,
  IconLayoutList,
} from "@tabler/icons-react";
import { useEffect, useId, useState } from "react";

import { Button } from "../../components/ui/button.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs.js";

type MediaRecord = {
  id: number;
  url: string;
  alt: string;
};

type MediaListItem = {
  id: number;
  url: string;
  alt: string;
  filename?: string;
};

type PayloadCollectionEntry = {
  id: string;
  slug: string;
  label: string;
};

function semanticShellTagForNode(
  node: CompositionNode,
): "header" | "main" | "footer" | null {
  if (node.definitionKey !== "primitive.box") {
    return null;
  }
  const tag = node.propValues?.tag;
  return tag === "header" || tag === "main" || tag === "footer" ? tag : null;
}

function readStyleProperty(
  composition: PageComposition,
  node: CompositionNode,
  property: StyleProperty,
): StylePropertyEntry | undefined {
  if (!node.styleBindingId) {
    return undefined;
  }
  const sb = composition.styleBindings[node.styleBindingId];
  if (!sb) {
    return undefined;
  }
  return sb.properties.find((p) => p.property === property);
}

const NONE_SELECT_VALUE = "__none__";

function utilityValueLabel(property: StyleProperty, value: string): string {
  if (property === "display" && value === "hidden") {
    return "hidden (display: none)";
  }
  return value;
}

const SECTION_META: Record<
  StyleSectionId,
  {
    label: "Color" | "Layout" | "Spacing" | "Size";
    Icon: Icon;
  }
> = {
  color: {
    label: "Color",
    Icon: IconBox,
  },
  layout: {
    label: "Layout",
    Icon: IconLayoutList,
  },
  spacing: {
    label: "Spacing",
    Icon: IconLayoutList,
  },
  size: {
    label: "Size",
    Icon: IconLayoutGrid,
  },
};

const STYLE_SECTIONS: readonly {
  id: StyleSectionId;
  label: "Color" | "Layout" | "Spacing" | "Size";
  Icon: Icon;
}[] = [
  { id: "color", ...SECTION_META.color },
  { id: "layout", ...SECTION_META.layout },
  { id: "spacing", ...SECTION_META.spacing },
  { id: "size", ...SECTION_META.size },
];

const COLOR_CATEGORIES = new Set(["color"]);
const SPACE_SIZE_CATEGORIES = new Set([
  "spacing",
  "space",
  "size",
  "sizing",
  "dimension",
  "dimensions",
  "layout",
  "length",
]);

function tokenMatchesProperty(
  token: TokenMeta,
  property: StyleProperty,
): boolean {
  const category = token.category.trim().toLowerCase();
  if (styleSectionForProperty(property) === "color") {
    return COLOR_CATEGORIES.has(category) || token.key.startsWith("color.");
  }
  return (
    SPACE_SIZE_CATEGORIES.has(category) ||
    token.key.startsWith("spacing.") ||
    token.key.startsWith("size.") ||
    token.key.startsWith("sizing.") ||
    token.key.startsWith("dimension.") ||
    token.key.startsWith("layout.")
  );
}

function tokensForStyleProperty(
  tokenMetadata: TokenMeta[],
  property: StyleProperty,
  selectedTokenKey: string | null,
): TokenMeta[] {
  const propertyTokens = tokenMetadata.filter((token) =>
    tokenMatchesProperty(token, property),
  );
  if (!selectedTokenKey) {
    return propertyTokens;
  }
  const selectedToken = tokenMetadata.find((t) => t.key === selectedTokenKey);
  if (!selectedToken) {
    return propertyTokens;
  }
  if (propertyTokens.some((token) => token.key === selectedToken.key)) {
    return propertyTokens;
  }
  return [selectedToken, ...propertyTokens];
}

function entrySelectValue(entry: StylePropertyEntry | undefined): string {
  if (!entry) {
    return NONE_SELECT_VALUE;
  }
  if (entry.type === "token") {
    return `token:${entry.token}`;
  }
  return `utility:${entry.value}`;
}

function StyleValueSelect({
  property,
  valueEntry,
  tokenMetadata,
  onNodeStyleEntry,
}: {
  property: StyleProperty;
  valueEntry: StylePropertyEntry | undefined;
  tokenMetadata: TokenMeta[];
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const selectedToken = valueEntry?.type === "token" ? valueEntry.token : null;
  const visibleTokens = tokensForStyleProperty(
    tokenMetadata,
    property,
    selectedToken,
  );
  const utilityValues = utilityValuesForStyleProperty(property);
  const currentValue = entrySelectValue(valueEntry);
  return (
    <div className="block space-y-1.5" key={property}>
      <Label className="text-xs font-medium" htmlFor={`style-${property}`}>
        {stylePropertyLabel(property)}
      </Label>
      <Select
        data-testid={`inspector-style-token-${property}`}
        onValueChange={(next) => {
          if (next === NONE_SELECT_VALUE) {
            onNodeStyleEntry(property, null);
            return;
          }
          if (next.startsWith("utility:")) {
            onNodeStyleEntry(property, {
              type: "utility",
              property,
              value: next.slice("utility:".length),
            });
            return;
          }
          if (next.startsWith("token:")) {
            onNodeStyleEntry(property, {
              type: "token",
              property,
              token: next.slice("token:".length),
            });
          }
        }}
        value={currentValue}
      >
        <SelectTrigger id={`style-${property}`}>
          <SelectValue placeholder="Unset (default)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_SELECT_VALUE}>Unset (default)</SelectItem>
          {utilityValues.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Tailwind values</SelectLabel>
              {utilityValues.map((value) => (
                <SelectItem key={value} value={`utility:${value}`}>
                  {utilityValueLabel(property, value)}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : null}
          {visibleTokens.length > 0 ? (
            <SelectGroup>
              <SelectLabel>Tokens</SelectLabel>
              {visibleTokens.map((token) => (
                <SelectItem key={token.key} value={`token:${token.key}`}>
                  {token.key}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : null}
        </SelectContent>
      </Select>
    </div>
  );
}

async function fetchMediaRecordById(id: number): Promise<MediaRecord> {
  const res = await fetch(`/api/media/${id}?depth=0`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to load media (${res.status})`);
  }
  const json = (await res.json()) as {
    id?: unknown;
    url?: unknown;
    alt?: unknown;
  };
  if (typeof json.id !== "number" || typeof json.url !== "string") {
    throw new Error("Invalid media response");
  }
  return {
    id: json.id,
    url: json.url,
    alt: typeof json.alt === "string" ? json.alt : "",
  };
}

async function fetchMediaRecords(): Promise<MediaListItem[]> {
  const res = await fetch("/api/media?depth=0&limit=50&sort=-updatedAt", {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to load media (${res.status})`);
  }
  const json = (await res.json()) as {
    docs?: Array<{
      id?: unknown;
      url?: unknown;
      alt?: unknown;
      filename?: unknown;
    }>;
  };
  const docs = Array.isArray(json.docs) ? json.docs : [];
  return docs
    .map((doc) => ({
      id: typeof doc.id === "number" ? doc.id : Number.NaN,
      url: typeof doc.url === "string" ? doc.url : "",
      alt: typeof doc.alt === "string" ? doc.alt : "",
      filename: typeof doc.filename === "string" ? doc.filename : "",
    }))
    .filter((doc) => Number.isFinite(doc.id) && doc.url.length > 0);
}

async function fetchCollectionEntries(
  collectionSlug: string,
): Promise<PayloadCollectionEntry[]> {
  const cleanSlug = collectionSlug.trim().replace(/^\/+|\/+$/g, "");
  if (!cleanSlug) {
    return [];
  }
  const res = await fetch(
    `/api/${encodeURIComponent(cleanSlug)}?depth=0&limit=50&sort=-updatedAt`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(`Failed to load ${cleanSlug} entries (${res.status})`);
  }
  const json = (await res.json()) as {
    docs?: Array<{
      id?: unknown;
      slug?: unknown;
      title?: unknown;
      name?: unknown;
      label?: unknown;
    }>;
  };
  const docs = Array.isArray(json.docs) ? json.docs : [];
  return docs
    .map((doc) => {
      const id =
        typeof doc.id === "string" || typeof doc.id === "number"
          ? String(doc.id)
          : "";
      const slug = typeof doc.slug === "string" ? doc.slug : "";
      const labelCandidate =
        typeof doc.title === "string"
          ? doc.title
          : typeof doc.name === "string"
            ? doc.name
            : typeof doc.label === "string"
              ? doc.label
              : slug || id;
      return {
        id,
        slug,
        label: labelCandidate,
      };
    })
    .filter((doc) => doc.slug.length > 0);
}

async function uploadMediaFile(file: File, alt: string): Promise<MediaRecord> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("alt", alt.trim() || file.name);
  const res = await fetch("/api/media", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  const json = (await res.json()) as {
    doc?: { id?: unknown; url?: unknown; alt?: unknown };
    id?: unknown;
    url?: unknown;
    alt?: unknown;
  };
  const doc =
    json.doc && typeof json.doc === "object" && !Array.isArray(json.doc)
      ? json.doc
      : json;
  if (typeof doc.id !== "number" || typeof doc.url !== "string") {
    throw new Error("Invalid upload response");
  }
  return {
    id: doc.id,
    url: doc.url,
    alt: typeof doc.alt === "string" ? doc.alt : "",
  };
}

function TextPrimitiveInspector({
  node,
  content,
  fieldBound,
  exposeToEditors,
  onTextChange,
  setNodeEditorFieldBinding,
}: {
  node: CompositionNode;
  content: string;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  onTextChange: (content: string) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const contentId = `${baseId}-content`;
  const exposeId = `${baseId}-expose`;
  const slotNameId = `${baseId}-slot-name`;
  const slotLabelId = `${baseId}-slot-label`;
  const slotDefaultId = `${baseId}-slot-default`;
  const slotTypeId = `${baseId}-slot-type`;

  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync drafts from committed slot fields only; fieldBound identity changes every parent render
  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      setFieldError(null);
      return;
    }
    if (!fieldBound) {
      return;
    }
    setNameDraft(fieldBound.name);
    setLabelDraft(fieldBound.label);
    setFieldError(null);
  }, [node.id, exposeToEditors, fieldBound?.name, fieldBound?.label]);

  function applyEditorField(next: EditorFieldSpec) {
    const parsed = EditorFieldSpecSchema.safeParse(next);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid editor field";
      setFieldError(msg);
      return;
    }
    setFieldError(null);
    setNodeEditorFieldBinding(parsed.data);
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={contentId}>Content</Label>
        <Input
          data-testid="inspector-text-content"
          id={contentId}
          onChange={(e) => onTextChange(e.target.value)}
          type="text"
          value={content}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={exposeToEditors}
          id={exposeId}
          onChange={(e) => {
            if (e.target.checked) {
              applyEditorField({
                name: "content",
                type: "text",
                required: false,
                label: "Content",
                defaultValue: content,
              });
            } else {
              setFieldError(null);
              setNodeEditorFieldBinding(null);
            }
          }}
        />
        <Label className="text-sm font-normal" htmlFor={exposeId}>
          Expose to CMS editors
        </Label>
      </div>
      {exposeToEditors && fieldBound ? (
        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <div className="space-y-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotNameId}
            >
              Field name (kebab-case)
            </Label>
            <Input
              aria-invalid={Boolean(fieldError)}
              className="h-8"
              data-testid="inspector-slot-name"
              id={slotNameId}
              onBlur={() => {
                if (!fieldBound) {
                  return;
                }
                const trimmed = nameDraft.trim();
                applyEditorField({
                  ...fieldBound,
                  name: trimmed,
                });
              }}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setFieldError(null);
              }}
              placeholder="hero-title"
              spellCheck={false}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotLabelId}
            >
              Label
            </Label>
            <Input
              className="h-8"
              id={slotLabelId}
              onBlur={() => {
                if (!fieldBound) {
                  return;
                }
                const label = labelDraft.trim() || "Content";
                applyEditorField({
                  ...fieldBound,
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => {
                setLabelDraft(e.target.value);
                setFieldError(null);
              }}
              type="text"
              value={labelDraft}
            />
          </div>
          <div className="space-y-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotTypeId}
            >
              Editor field type
            </Label>
            <Select
              onValueChange={(value) => {
                const type = value as EditorFieldSpec["type"];
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  type,
                });
              }}
              value={fieldBound.type}
            >
              <SelectTrigger data-testid="inspector-slot-type" id={slotTypeId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITOR_FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-req`}
              onChange={(e) => {
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  required: e.target.checked,
                });
              }}
            />
            <Label className="text-sm font-normal" htmlFor={`${baseId}-req`}>
              Required
            </Label>
          </div>
          <div className="space-y-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotDefaultId}
            >
              Default value
            </Label>
            <Input
              className="h-8"
              id={slotDefaultId}
              onChange={(e) => {
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  defaultValue: e.target.value,
                });
              }}
              type="text"
              value={
                typeof fieldBound.defaultValue === "string"
                  ? fieldBound.defaultValue
                  : ""
              }
            />
          </div>
          {fieldError ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function HeadingPrimitiveInspector({
  node,
  patchNodeProps,
  fieldBound,
  exposeToEditors,
  setNodeEditorFieldBinding,
}: {
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const level =
    typeof node.propValues?.level === "string" &&
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.propValues.level)
      ? node.propValues.level
      : "h2";
  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync drafts from committed slot fields only; fieldBound identity changes every parent render
  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      setFieldError(null);
      return;
    }
    if (!fieldBound) {
      return;
    }
    setNameDraft(fieldBound.name);
    setLabelDraft(fieldBound.label);
    setFieldError(null);
  }, [node.id, exposeToEditors, fieldBound?.name, fieldBound?.label]);

  function applyEditorField(next: EditorFieldSpec) {
    const parsed = EditorFieldSpecSchema.safeParse(next);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid editor field";
      setFieldError(msg);
      return;
    }
    setFieldError(null);
    setNodeEditorFieldBinding(parsed.data);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${baseId}-heading-content`}>Content</Label>
        <Input
          id={`${baseId}-heading-content`}
          onChange={(e) => patchNodeProps({ content: e.target.value })}
          type="text"
          value={content}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${baseId}-heading-level`}>Heading level</Label>
        <Select
          onValueChange={(value) => patchNodeProps({ level: value })}
          value={level}
        >
          <SelectTrigger id={`${baseId}-heading-level`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1</SelectItem>
            <SelectItem value="h2">H2</SelectItem>
            <SelectItem value="h3">H3</SelectItem>
            <SelectItem value="h4">H4</SelectItem>
            <SelectItem value="h5">H5</SelectItem>
            <SelectItem value="h6">H6</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={exposeToEditors}
          id={`${baseId}-heading-expose`}
          onChange={(e) => {
            if (e.target.checked) {
              applyEditorField({
                name: "heading",
                type: "text",
                required: false,
                label: "Heading",
                defaultValue: content,
              });
              return;
            }
            setFieldError(null);
            setNodeEditorFieldBinding(null);
          }}
        />
        <Label
          className="text-sm font-normal"
          htmlFor={`${baseId}-heading-expose`}
        >
          Expose to CMS editors
        </Label>
      </div>
      {exposeToEditors && fieldBound ? (
        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <div className="space-y-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-name`}
            >
              Field name (kebab-case)
            </Label>
            <Input
              aria-invalid={Boolean(fieldError)}
              className="h-8"
              id={`${baseId}-heading-slot-name`}
              onBlur={() => {
                const trimmed = nameDraft.trim();
                applyEditorField({
                  ...fieldBound,
                  name: trimmed,
                });
              }}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setFieldError(null);
              }}
              placeholder="hero-heading"
              spellCheck={false}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-label`}
            >
              Label
            </Label>
            <Input
              className="h-8"
              id={`${baseId}-heading-slot-label`}
              onBlur={() => {
                const label = labelDraft.trim() || "Heading";
                applyEditorField({
                  ...fieldBound,
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => {
                setLabelDraft(e.target.value);
                setFieldError(null);
              }}
              type="text"
              value={labelDraft}
            />
          </div>
          <div className="space-y-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-type`}
            >
              Editor field type
            </Label>
            <Select
              onValueChange={(value) => {
                const type = value as EditorFieldSpec["type"];
                applyEditorField({
                  ...fieldBound,
                  type,
                });
              }}
              value={fieldBound.type}
            >
              <SelectTrigger
                data-testid="inspector-heading-slot-type"
                id={`${baseId}-heading-slot-type`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITOR_FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-heading-req`}
              onChange={(e) => {
                applyEditorField({
                  ...fieldBound,
                  required: e.target.checked,
                });
              }}
            />
            <Label
              className="text-sm font-normal"
              htmlFor={`${baseId}-heading-req`}
            >
              Required
            </Label>
          </div>
          <div className="space-y-2">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-default`}
            >
              Default value
            </Label>
            <Input
              className="h-8"
              id={`${baseId}-heading-slot-default`}
              onChange={(e) => {
                applyEditorField({
                  ...fieldBound,
                  defaultValue: e.target.value,
                });
              }}
              type="text"
              value={
                typeof fieldBound.defaultValue === "string"
                  ? fieldBound.defaultValue
                  : ""
              }
            />
          </div>
          {fieldError ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ButtonPrimitiveInspector({
  node,
  patchNodeProps,
}: {
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
}) {
  const baseId = useId();
  const label =
    typeof node.propValues?.label === "string" ? node.propValues.label : "";
  const linkType =
    node.propValues?.linkType === "payloadCollection"
      ? "payloadCollection"
      : "url";
  const href =
    typeof node.propValues?.href === "string" ? node.propValues.href : "";
  const collectionSlug =
    typeof node.propValues?.collectionSlug === "string"
      ? node.propValues.collectionSlug
      : "";
  const entrySlug =
    typeof node.propValues?.entrySlug === "string"
      ? node.propValues.entrySlug
      : "";
  const openInNewTab = Boolean(node.propValues?.openInNewTab);
  const [entryPickerOpen, setEntryPickerOpen] = useState(false);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryLoadError, setEntryLoadError] = useState<string | null>(null);
  const [entries, setEntries] = useState<PayloadCollectionEntry[]>([]);

  useEffect(() => {
    if (!entryPickerOpen || !collectionSlug.trim()) {
      return;
    }
    setEntryLoading(true);
    setEntryLoadError(null);
    void fetchCollectionEntries(collectionSlug)
      .then((docs) => {
        setEntries(docs);
      })
      .catch((err) => {
        setEntryLoadError(
          err instanceof Error ? err.message : "Failed to load entries",
        );
      })
      .finally(() => {
        setEntryLoading(false);
      });
  }, [collectionSlug, entryPickerOpen]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${baseId}-button-label`}>Label</Label>
        <Input
          id={`${baseId}-button-label`}
          onChange={(e) => patchNodeProps({ label: e.target.value })}
          type="text"
          value={label}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${baseId}-button-link-type`}>Link source</Label>
        <Select
          onValueChange={(value) =>
            patchNodeProps({
              linkType: value,
            })
          }
          value={linkType}
        >
          <SelectTrigger id={`${baseId}-button-link-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="payloadCollection">
              Payload collection
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {linkType === "url" ? (
        <div className="space-y-2">
          <Label htmlFor={`${baseId}-button-url`}>URL</Label>
          <Input
            id={`${baseId}-button-url`}
            onChange={(e) => patchNodeProps({ href: e.target.value })}
            placeholder="https://"
            type="url"
            value={href}
          />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-button-collection`}>
              Collection slug
            </Label>
            <Input
              id={`${baseId}-button-collection`}
              onChange={(e) =>
                patchNodeProps({
                  collectionSlug: e.target.value,
                })
              }
              placeholder="pages"
              type="text"
              value={collectionSlug}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-button-entry`}>
              Entry slug (optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={`${baseId}-button-entry`}
                onChange={(e) =>
                  patchNodeProps({
                    entrySlug: e.target.value,
                  })
                }
                placeholder="about"
                type="text"
                value={entrySlug}
              />
              <Sheet onOpenChange={setEntryPickerOpen} open={entryPickerOpen}>
                <SheetTrigger asChild>
                  <Button
                    disabled={!collectionSlug.trim()}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Browse
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>
                      Select {collectionSlug || "collection"} entry
                    </SheetTitle>
                    <SheetDescription>
                      Pick an entry and we will set its slug.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-2 overflow-y-auto">
                    {entryLoading ? (
                      <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : entryLoadError ? (
                      <p className="text-sm text-red-500">{entryLoadError}</p>
                    ) : entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No entries found.
                      </p>
                    ) : (
                      entries.map((entry) => (
                        <button
                          className="w-full rounded-md border border-border/60 p-2 text-left hover:bg-accent/50"
                          key={`${entry.id}-${entry.slug}`}
                          onClick={() => {
                            patchNodeProps({
                              collectionSlug: collectionSlug.trim(),
                              entrySlug: entry.slug,
                            });
                            setEntryPickerOpen(false);
                          }}
                          type="button"
                        >
                          <div className="text-sm font-medium">
                            {entry.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.slug}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="pt-3">
                    <SheetClose asChild>
                      <Button size="sm" type="button" variant="ghost">
                        Close
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </>
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={openInNewTab}
          id={`${baseId}-button-new-tab`}
          onChange={(e) => patchNodeProps({ openInNewTab: e.target.checked })}
        />
        <Label
          className="text-sm font-normal"
          htmlFor={`${baseId}-button-new-tab`}
        >
          Open in new tab
        </Label>
      </div>
    </div>
  );
}

function ImagePrimitiveInspector({
  node,
  fieldBound,
  exposeToEditors,
  patchNodeProps,
  setNodeEditorFieldBinding,
}: {
  node: CompositionNode;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const imageSource =
    node.propValues?.imageSource === "media" ? "media" : "url";
  const src =
    typeof node.propValues?.src === "string" ? node.propValues.src : "";
  const alt =
    typeof node.propValues?.alt === "string" ? node.propValues.alt : "";
  const mediaId =
    typeof node.propValues?.mediaId === "number"
      ? node.propValues.mediaId
      : typeof node.propValues?.mediaId === "string" &&
          /^\d+$/.test(node.propValues.mediaId)
        ? Number.parseInt(node.propValues.mediaId, 10)
        : "";
  const [mediaIdDraft, setMediaIdDraft] = useState(
    mediaId === "" ? "" : String(mediaId),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [mediaDocs, setMediaDocs] = useState<MediaListItem[]>([]);
  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");

  useEffect(() => {
    setMediaIdDraft(mediaId === "" ? "" : String(mediaId));
  }, [mediaId]);

  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      return;
    }
    if (!fieldBound) {
      return;
    }
    setNameDraft(fieldBound.name);
    setLabelDraft(fieldBound.label);
  }, [exposeToEditors, fieldBound]);

  useEffect(() => {
    if (!mediaPickerOpen) {
      return;
    }
    setMediaLoading(true);
    setMediaLoadError(null);
    void fetchMediaRecords()
      .then((docs) => {
        setMediaDocs(docs);
      })
      .catch((err) => {
        setMediaLoadError(
          err instanceof Error ? err.message : "Failed to load media entries",
        );
      })
      .finally(() => {
        setMediaLoading(false);
      });
  }, [mediaPickerOpen]);

  function applyEditorField(next: EditorFieldSpec) {
    const parsed = EditorFieldSpecSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid editor field");
      return;
    }
    setError(null);
    setNodeEditorFieldBinding(parsed.data);
  }

  async function syncMediaById(rawId: string) {
    const id = Number.parseInt(rawId, 10);
    if (!Number.isFinite(id)) {
      patchNodeProps({ mediaId: "", src: "", imageSource: "media" });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const media = await fetchMediaRecordById(id);
      patchNodeProps({
        imageSource: "media",
        mediaId: media.id,
        src: media.url,
        mediaUrl: media.url,
        alt: media.alt || alt,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resolve media");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${baseId}-image-source`}>Source</Label>
        <Select
          onValueChange={(value) =>
            patchNodeProps({
              imageSource: value,
            })
          }
          value={imageSource}
        >
          <SelectTrigger id={`${baseId}-image-source`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="media">Payload Media</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {imageSource === "url" ? (
        <div className="space-y-2">
          <Label htmlFor={`${baseId}-image-url`}>Image URL</Label>
          <Input
            id={`${baseId}-image-url`}
            onChange={(e) =>
              patchNodeProps({
                src: e.target.value,
                imageSource: "url",
              })
            }
            placeholder="https://"
            type="url"
            value={src}
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`${baseId}-media-id`}>Media ID</Label>
          <div className="flex items-center gap-2">
            <Input
              id={`${baseId}-media-id`}
              inputMode="numeric"
              onBlur={(e) => {
                void syncMediaById(e.target.value.trim());
              }}
              onChange={(e) => {
                setMediaIdDraft(e.target.value);
                setError(null);
              }}
              placeholder="123"
              type="text"
              value={mediaIdDraft}
            />
            <Sheet onOpenChange={setMediaPickerOpen} open={mediaPickerOpen}>
              <SheetTrigger asChild>
                <Button size="sm" type="button" variant="ghost">
                  Browse
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Select media</SheetTitle>
                  <SheetDescription>
                    Pick an existing Payload media record.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-2 overflow-y-auto">
                  {mediaLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : mediaLoadError ? (
                    <p className="text-sm text-red-500">{mediaLoadError}</p>
                  ) : mediaDocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No media entries found.
                    </p>
                  ) : (
                    mediaDocs.map((media) => (
                      <button
                        className="w-full rounded-md border border-border/60 p-2 text-left hover:bg-accent/50"
                        key={media.id}
                        onClick={() => {
                          patchNodeProps({
                            imageSource: "media",
                            mediaId: media.id,
                            src: media.url,
                            mediaUrl: media.url,
                            alt: media.alt || alt,
                          });
                          setMediaPickerOpen(false);
                        }}
                        type="button"
                      >
                        <div className="text-sm font-medium">
                          {media.alt || media.filename || media.url}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID {media.id}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="pt-3">
                  <SheetClose asChild>
                    <Button size="sm" type="button" variant="ghost">
                      Close
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Label htmlFor={`${baseId}-media-upload`}>Upload new image</Label>
          <Input
            accept="image/*"
            disabled={busy}
            id={`${baseId}-media-upload`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                return;
              }
              setBusy(true);
              setError(null);
              void uploadMediaFile(file, alt)
                .then((media) => {
                  patchNodeProps({
                    imageSource: "media",
                    mediaId: media.id,
                    src: media.url,
                    mediaUrl: media.url,
                    alt: media.alt || alt || file.name,
                  });
                })
                .catch((uploadErr) => {
                  setError(
                    uploadErr instanceof Error
                      ? uploadErr.message
                      : "Upload failed",
                  );
                })
                .finally(() => {
                  setBusy(false);
                  e.target.value = "";
                });
            }}
            type="file"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`${baseId}-image-alt`}>Alt text</Label>
        <Input
          id={`${baseId}-image-alt`}
          onChange={(e) => patchNodeProps({ alt: e.target.value })}
          type="text"
          value={alt}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={exposeToEditors}
          id={`${baseId}-image-expose`}
          onChange={(e) => {
            if (e.target.checked) {
              applyEditorField({
                name: "image",
                type: "image",
                required: false,
                label: "Image",
                defaultValue: mediaId === "" ? "" : mediaId,
              });
              return;
            }
            setNodeEditorFieldBinding(null);
          }}
        />
        <Label
          className="text-sm font-normal"
          htmlFor={`${baseId}-image-expose`}
        >
          Expose to CMS editors
        </Label>
      </div>
      {exposeToEditors && fieldBound ? (
        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-image-slot-name`}>
              Field name (kebab-case)
            </Label>
            <Input
              id={`${baseId}-image-slot-name`}
              onBlur={() => {
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  name: nameDraft.trim(),
                });
              }}
              onChange={(e) => setNameDraft(e.target.value)}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${baseId}-image-slot-label`}>Label</Label>
            <Input
              id={`${baseId}-image-slot-label`}
              onBlur={() => {
                const label = labelDraft.trim() || "Image";
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => setLabelDraft(e.target.value)}
              type="text"
              value={labelDraft}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-image-required`}
              onChange={(e) => {
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  required: e.target.checked,
                });
              }}
            />
            <Label
              className="text-sm font-normal"
              htmlFor={`${baseId}-image-required`}
            >
              Required
            </Label>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PropertyInspector({
  composition,
  node,
  tokenMetadata,
  onTextChange,
  onNodeStyleEntry,
  patchNodeProps,
  setNodeEditorFieldBinding,
}: {
  composition: PageComposition | null;
  node: CompositionNode | null;
  tokenMetadata: TokenMeta[];
  onTextChange: (content: string) => void;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  if (!node || !composition) {
    return (
      <div className="text-sm text-muted-foreground">
        Select an element on the canvas or in layers.
      </div>
    );
  }

  const isText = node.definitionKey === "primitive.text";
  const isHeading = node.definitionKey === "primitive.heading";
  const isButton = node.definitionKey === "primitive.button";
  const isImage = node.definitionKey === "primitive.image";
  const isSlot = node.definitionKey === "primitive.slot";
  const isLibraryComponent =
    node.definitionKey === "primitive.libraryComponent";

  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const fieldBound =
    node.contentBinding?.source === "editor"
      ? node.contentBinding.editorField
      : undefined;
  const semanticShellTag = semanticShellTagForNode(node);
  const exposeToEditors = Boolean(fieldBound);
  const stylePropertiesBySection = stylePropertiesBySectionForDefinitionKey(
    node.definitionKey,
  );
  const hasStyleControls = stylePropertiesBySection.length > 0;

  return (
    <div className="space-y-4 text-sm">
      <div className="font-mono text-xs text-muted-foreground">
        {semanticShellTag ? `<${semanticShellTag}>` : node.definitionKey}
      </div>
      <Tabs className="w-full" defaultValue="styles">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="styles">Styles</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-3" value="styles">
          {hasStyleControls ? (
            <div className="space-y-3">
              {STYLE_SECTIONS.map((section) => {
                const sectionProperties =
                  stylePropertiesBySection.find((s) => s.id === section.id)
                    ?.properties ?? [];
                if (sectionProperties.length === 0) {
                  return null;
                }
                return (
                  <div
                    className="rounded-md border border-border/65 bg-muted/15 p-3"
                    key={section.id}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <section.Icon
                          aria-hidden
                          className="size-3.5 text-muted-foreground"
                          stroke={1.6}
                        />
                        <span>{section.label}</span>
                      </div>
                      <span className="rounded border border-border/70 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {sectionProperties.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                      {sectionProperties.map((property) => {
                        const styleEntry = readStyleProperty(
                          composition,
                          node,
                          property,
                        );
                        return (
                          <StyleValueSelect
                            key={property}
                            onNodeStyleEntry={onNodeStyleEntry}
                            property={property}
                            tokenMetadata={tokenMetadata}
                            valueEntry={styleEntry}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 text-xs leading-snug text-muted-foreground">
              No style controls available for this element.
            </div>
          )}
        </TabsContent>
        <TabsContent className="mt-3 space-y-4" value="settings">
          {isText ? (
            <TextPrimitiveInspector
              content={content}
              exposeToEditors={exposeToEditors}
              fieldBound={fieldBound}
              node={node}
              onTextChange={onTextChange}
              setNodeEditorFieldBinding={setNodeEditorFieldBinding}
            />
          ) : null}
          {isHeading ? (
            <HeadingPrimitiveInspector
              exposeToEditors={exposeToEditors}
              fieldBound={fieldBound}
              node={node}
              patchNodeProps={patchNodeProps}
              setNodeEditorFieldBinding={setNodeEditorFieldBinding}
            />
          ) : null}
          {isButton ? (
            <ButtonPrimitiveInspector
              node={node}
              patchNodeProps={patchNodeProps}
            />
          ) : null}
          {isImage ? (
            <ImagePrimitiveInspector
              exposeToEditors={exposeToEditors}
              fieldBound={fieldBound}
              node={node}
              patchNodeProps={patchNodeProps}
              setNodeEditorFieldBinding={setNodeEditorFieldBinding}
            />
          ) : null}
          {isSlot ? (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <div className="text-xs font-medium text-foreground">Slot id</div>
              <Input
                data-testid="inspector-slot-id"
                onChange={(e) => patchNodeProps({ slotId: e.target.value })}
                placeholder="main"
                type="text"
                value={
                  typeof node.propValues?.slotId === "string"
                    ? node.propValues.slotId
                    : ""
                }
              />
            </div>
          ) : null}
          {isLibraryComponent ? (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <div className="text-xs font-medium text-foreground">
                Component
              </div>
              <div className="rounded-md border border-border bg-muted/30 px-2 py-1.5 font-mono text-xs text-foreground">
                {typeof node.propValues?.componentKey === "string"
                  ? node.propValues.componentKey
                  : "—"}
              </div>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
