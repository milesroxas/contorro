"use client";

import type {
  StudioAuthoringClient,
  StudioDesignTokenEntry,
  StudioDesignTokenSetDoc,
} from "@repo/contracts-zod";
import {
  IconDeviceDesktop,
  IconRefresh,
  IconTypography,
} from "@tabler/icons-react";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ScrollArea } from "../../components/scroll-area.js";
import { StudioRoot } from "../../components/studio-root.js";
import { Button } from "../../components/ui/button.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.js";
import { Input } from "../../components/ui/input.js";
import { Separator } from "../../components/ui/separator.js";
import { cn } from "../../lib/cn.js";
import { getDefaultStudioAuthoringClient } from "../../lib/fetch-studio-authoring-client.js";

type TokenCategory =
  | "color"
  | "space"
  | "size"
  | "radius"
  | "typography"
  | "shadow"
  | "border"
  | "zIndex"
  | "opacity"
  | "transition"
  | "breakpoint"
  | "container";
type TokenMode = "light" | "dark";

type DesignToken = StudioDesignTokenEntry & { category: TokenCategory };
type ActiveTab = "colors" | "typography" | "other";

type DesignSystemColorSection = {
  readonly id: string;
  readonly label: string;
  readonly fields: readonly { readonly key: string; readonly label: string }[];
};

const COLOR_SECTIONS = [
  {
    id: "primary",
    label: "Primary",
    fields: [
      { key: "color.primary", label: "Background" },
      { key: "color.primary.foreground", label: "Foreground" },
    ],
  },
  {
    id: "secondary",
    label: "Secondary",
    fields: [
      { key: "color.secondary", label: "Background" },
      { key: "color.secondary.foreground", label: "Foreground" },
    ],
  },
  {
    id: "accent",
    label: "Accent",
    fields: [
      { key: "color.accent", label: "Background" },
      { key: "color.accent.foreground", label: "Foreground" },
    ],
  },
  {
    id: "base",
    label: "Base",
    fields: [
      { key: "color.background", label: "Background" },
      { key: "color.foreground", label: "Foreground" },
    ],
  },
  {
    id: "card",
    label: "Card",
    fields: [
      { key: "color.card", label: "Background" },
      { key: "color.card.foreground", label: "Foreground" },
    ],
  },
  {
    id: "popover",
    label: "Popover",
    fields: [
      { key: "color.popover", label: "Background" },
      { key: "color.popover.foreground", label: "Foreground" },
    ],
  },
  {
    id: "muted",
    label: "Muted",
    fields: [
      { key: "color.muted", label: "Background" },
      { key: "color.muted.foreground", label: "Foreground" },
    ],
  },
  {
    id: "destructive",
    label: "Destructive",
    fields: [{ key: "color.destructive", label: "Background" }],
  },
  {
    id: "border-input",
    label: "Border & input",
    fields: [
      { key: "color.border", label: "Border" },
      { key: "color.input", label: "Input" },
      { key: "color.ring", label: "Ring" },
    ],
  },
  {
    id: "chart",
    label: "Chart",
    fields: [
      { key: "color.chart.1", label: "Chart 1" },
      { key: "color.chart.2", label: "Chart 2" },
      { key: "color.chart.3", label: "Chart 3" },
      { key: "color.chart.4", label: "Chart 4" },
      { key: "color.chart.5", label: "Chart 5" },
    ],
  },
] as const;

const TYPOGRAPHY_FIELDS = [
  { key: "typography.font.sans", label: "Font sans" },
  { key: "typography.font.heading", label: "Font heading" },
  { key: "typography.font.mono", label: "Font mono" },
] as const;

const OTHER_FIELDS = [
  { key: "radius.base", label: "Radius" },
  { key: "color.sidebar", label: "Sidebar background" },
  { key: "color.sidebar.foreground", label: "Sidebar foreground" },
  { key: "color.sidebar.primary", label: "Sidebar primary" },
  {
    key: "color.sidebar.primary.foreground",
    label: "Sidebar primary foreground",
  },
  { key: "color.sidebar.accent", label: "Sidebar accent" },
  {
    key: "color.sidebar.accent.foreground",
    label: "Sidebar accent foreground",
  },
  { key: "color.sidebar.border", label: "Sidebar border" },
  { key: "color.sidebar.ring", label: "Sidebar ring" },
] as const;

function inferCategoryForKey(key: string): TokenCategory {
  if (key.startsWith("color.")) return "color";
  if (key.startsWith("typography.")) return "typography";
  if (key.startsWith("radius.")) return "radius";
  if (key.startsWith("shadow.")) return "shadow";
  if (key.startsWith("border.")) return "border";
  if (key.startsWith("space.")) return "space";
  if (key.startsWith("size.")) return "size";
  if (key.startsWith("transition.")) return "transition";
  if (key.startsWith("opacity.")) return "opacity";
  if (key.startsWith("breakpoint.")) return "breakpoint";
  if (key.startsWith("container.")) return "container";
  return "zIndex";
}

function normalizeTokens(tokens: StudioDesignTokenEntry[]): DesignToken[] {
  return tokens
    .map((token) => {
      const mode: TokenMode = token.mode === "dark" ? "dark" : "light";
      const category =
        typeof token.category === "string" && token.category.length > 0
          ? (token.category as TokenCategory)
          : inferCategoryForKey(token.key);
      return {
        ...token,
        key: token.key.trim(),
        mode,
        resolvedValue: token.resolvedValue.trim(),
        category,
      };
    })
    .filter((token) => token.key.length > 0 && token.resolvedValue.length > 0);
}

function stableTokenSnapshot(tokens: StudioDesignTokenEntry[]): string {
  return JSON.stringify(
    [...tokens]
      .map((token) => ({
        key: token.key,
        mode: token.mode === "dark" ? "dark" : "light",
        category: token.category,
        resolvedValue: token.resolvedValue,
      }))
      .sort((a, b) => a.key.localeCompare(b.key)),
  );
}

function ColorSwatch({ value }: { value: string }) {
  const isColor = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
    value.trim(),
  );
  return (
    <span
      className={cn(
        "size-7 shrink-0 rounded-md border border-border",
        !isColor && "bg-muted",
      )}
      style={isColor ? { backgroundColor: value.trim() } : undefined}
      title={isColor ? value : "Non-hex color token"}
    />
  );
}

function DesignSystemEditorColorsTab({
  colorSearch,
  filteredColorSections,
  getTokenValue,
  setColorSearch,
  setTokenValue,
}: {
  colorSearch: string;
  filteredColorSections: readonly DesignSystemColorSection[];
  getTokenValue: (key: string) => string;
  setColorSearch: (value: string) => void;
  setTokenValue: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          onChange={(event) => setColorSearch(event.target.value)}
          placeholder="Search colors..."
          type="search"
          value={colorSearch}
        />
      </div>
      {filteredColorSections.map((section) => (
        <details
          className="rounded-lg border border-border bg-card px-3 py-2"
          key={section.id}
          open
        >
          <summary className="cursor-pointer text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {section.label}
          </summary>
          <div className="mt-3 space-y-3">
            {section.fields.map((field) => {
              const value = getTokenValue(field.key);
              return (
                <div
                  className="grid grid-cols-[auto_1fr] items-center gap-2"
                  key={field.key}
                >
                  <ColorSwatch value={value} />
                  <div className="space-y-1">
                    <span className="block text-xs text-muted-foreground">
                      {field.label}
                    </span>
                    <Input
                      onChange={(event) => {
                        setTokenValue(field.key, event.target.value);
                      }}
                      placeholder="oklch(...) or #hex"
                      value={value}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}

function DesignSystemEditorTypographyTab({
  getTokenValue,
  setTokenValue,
}: {
  getTokenValue: (key: string) => string;
  setTokenValue: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconTypography className="size-4" aria-hidden />
        Typography tokens
      </p>
      {TYPOGRAPHY_FIELDS.map((field) => (
        <div className="space-y-1" key={field.key}>
          <span className="text-xs text-muted-foreground">{field.label}</span>
          <Input
            onChange={(event) => {
              setTokenValue(field.key, event.target.value);
            }}
            placeholder="Token value"
            value={getTokenValue(field.key)}
          />
        </div>
      ))}
    </div>
  );
}

function DesignSystemEditorOtherTab({
  getTokenValue,
  setTokenValue,
}: {
  getTokenValue: (key: string) => string;
  setTokenValue: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-3">
      {OTHER_FIELDS.map((field) => (
        <div className="space-y-1" key={field.key}>
          <span className="text-xs text-muted-foreground">{field.label}</span>
          <Input
            onChange={(event) => {
              setTokenValue(field.key, event.target.value);
            }}
            placeholder="Token value"
            value={getTokenValue(field.key)}
          />
        </div>
      ))}
    </div>
  );
}

function DesignSystemEditorTokenScrollBody({
  activeTab,
  colorSearch,
  filteredColorSections,
  getTokenValue,
  loadState,
  setColorSearch,
  setTokenValue,
  tokenSets,
}: {
  activeTab: ActiveTab;
  colorSearch: string;
  filteredColorSections: readonly DesignSystemColorSection[];
  getTokenValue: (key: string) => string;
  loadState: "idle" | "loading" | "error";
  setColorSearch: (value: string) => void;
  setTokenValue: (key: string, value: string) => void;
  tokenSets: StudioDesignTokenSetDoc[];
}) {
  if (loadState === "loading") {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (tokenSets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No token set found. Create one in collection:{" "}
        <code>design-token-sets</code>.
      </p>
    );
  }
  if (activeTab === "colors") {
    return (
      <DesignSystemEditorColorsTab
        colorSearch={colorSearch}
        filteredColorSections={filteredColorSections}
        getTokenValue={getTokenValue}
        setColorSearch={setColorSearch}
        setTokenValue={setTokenValue}
      />
    );
  }
  if (activeTab === "typography") {
    return (
      <DesignSystemEditorTypographyTab
        getTokenValue={getTokenValue}
        setTokenValue={setTokenValue}
      />
    );
  }
  if (activeTab === "other") {
    return (
      <DesignSystemEditorOtherTab
        getTokenValue={getTokenValue}
        setTokenValue={setTokenValue}
      />
    );
  }
  return null;
}

function DesignSystemEditorPreviewCard({
  isDirty,
  previewKey,
  previewPath,
  previewUrl,
  selectedSetTitle,
  setPreviewKey,
  setPreviewPath,
}: {
  isDirty: boolean;
  previewKey: number;
  previewPath: string;
  previewUrl: string;
  selectedSetTitle: string;
  setPreviewKey: Dispatch<SetStateAction<number>>;
  setPreviewPath: Dispatch<SetStateAction<string>>;
}) {
  return (
    <Card className="min-h-0 overflow-hidden">
      <CardHeader className="space-y-3 border-b border-border/70 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconDeviceDesktop className="size-4" aria-hidden />
            Preview
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Uses live page route in iframe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="min-w-[220px] flex-1"
            onChange={(event) => setPreviewPath(event.target.value)}
            placeholder="/"
            value={previewPath}
          />
          <Button
            className="gap-2"
            onClick={() => setPreviewKey((value) => value + 1)}
            type="button"
            variant="outline"
          >
            <IconRefresh className="size-4" aria-hidden />
            Reload
          </Button>
        </div>
        <Separator />
        <div className="text-xs text-muted-foreground">
          Active set:{" "}
          <span className="font-medium text-foreground">
            {selectedSetTitle}
          </span>
          {isDirty ? " · Unsaved changes" : ""}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 p-2">
        <div className="h-[calc(100dvh-12rem)] overflow-hidden rounded-md border border-border">
          <iframe
            className="h-full w-full bg-white"
            key={`${previewUrl}-${previewKey}`}
            src={previewUrl}
            title="Design system preview"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function DesignSystemEditor({
  canAccess,
  authoringClient = getDefaultStudioAuthoringClient(),
}: {
  canAccess: boolean;
  authoringClient?: StudioAuthoringClient;
}) {
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    "loading",
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">(
    "idle",
  );
  const [tokenSets, setTokenSets] = useState<StudioDesignTokenSetDoc[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [draftTokens, setDraftTokens] = useState<DesignToken[]>([]);
  const [activeMode, setActiveMode] = useState<TokenMode>("light");
  const [activeTab, setActiveTab] = useState<ActiveTab>("colors");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [previewPath, setPreviewPath] = useState("/");
  const [previewKey, setPreviewKey] = useState(0);
  const [colorSearch, setColorSearch] = useState("");

  const fetchTokenSets = useCallback(
    async (signal: AbortSignal) => {
      setLoadState("loading");
      setStatusMessage("");
      try {
        const [docs, globalJson] = await Promise.all([
          authoringClient.listDesignTokenSets(signal),
          authoringClient.getDesignSystemSettings(signal),
        ]);
        setTokenSets(docs);
        if (docs.length === 0) {
          setSelectedSetId("");
          setDraftTokens([]);
          setLoadState("idle");
          return;
        }

        const defaultId =
          globalJson.defaultTokenSet !== undefined &&
          globalJson.defaultTokenSet !== null
            ? String(globalJson.defaultTokenSet)
            : "";
        const selected =
          docs.find((doc) => String(doc.id) === defaultId) ??
          docs.find((doc) => doc._status === "published") ??
          docs[0];
        const selectedId = String(selected.id);

        setSelectedSetId(selectedId);
        setDraftTokens(normalizeTokens(selected.tokens ?? []));
        setActiveMode(globalJson.activeColorMode === "dark" ? "dark" : "light");
        setLoadState("idle");
      } catch {
        if (signal.aborted) return;
        setLoadState("error");
        setStatusMessage("Could not load design token sets.");
      }
    },
    [authoringClient],
  );

  useEffect(() => {
    const ac = new AbortController();
    void fetchTokenSets(ac.signal);
    return () => ac.abort();
  }, [fetchTokenSets]);

  const selectedSet = useMemo(
    () => tokenSets.find((doc) => String(doc.id) === selectedSetId) ?? null,
    [selectedSetId, tokenSets],
  );

  const isDirty = useMemo(() => {
    if (!selectedSet) return false;
    return (
      stableTokenSnapshot(selectedSet.tokens ?? []) !==
      stableTokenSnapshot(draftTokens)
    );
  }, [draftTokens, selectedSet]);

  const previewUrl = useMemo(() => {
    const value = previewPath.trim();
    if (!value) return "/";
    if (/^https?:\/\//i.test(value)) return value;
    return value.startsWith("/") ? value : `/${value}`;
  }, [previewPath]);

  const getTokenValue = useCallback(
    (key: string): string => {
      const found = draftTokens.find(
        (token) =>
          token.key === key &&
          (token.mode === "dark" ? "dark" : "light") === activeMode,
      );
      return found?.resolvedValue ?? "";
    },
    [activeMode, draftTokens],
  );

  const setTokenValue = useCallback(
    (key: string, resolvedValue: string) => {
      setDraftTokens((current) => {
        const idx = current.findIndex(
          (token) =>
            token.key === key &&
            (token.mode === "dark" ? "dark" : "light") === activeMode,
        );
        if (idx >= 0) {
          const next = [...current];
          next[idx] = { ...next[idx], resolvedValue };
          return next;
        }
        return [
          ...current,
          {
            key,
            mode: activeMode,
            category: inferCategoryForKey(key),
            resolvedValue,
          },
        ];
      });
    },
    [activeMode],
  );

  const persistTokens = useCallback(
    async (status: "draft" | "published") => {
      if (!selectedSetId) return;
      setSaveState("saving");
      setStatusMessage("");
      try {
        const json = await authoringClient.patchDesignTokenSet(selectedSetId, {
          tokens: normalizeTokens(draftTokens),
          _status: status,
        });
        const nextDoc = json.doc;
        const resolvedDoc = nextDoc ?? selectedSet;
        if (nextDoc) {
          setTokenSets((current) =>
            current.map((doc) =>
              String(doc.id) === String(nextDoc.id) ? nextDoc : doc,
            ),
          );
          setDraftTokens(normalizeTokens(nextDoc.tokens ?? []));
        } else {
          setDraftTokens(normalizeTokens(draftTokens));
        }
        if (status === "published" && resolvedDoc) {
          try {
            await authoringClient.postDesignSystemSettings({
              defaultTokenSet: Number(selectedSetId),
              activeBrandKey: resolvedDoc.scopeKey,
              activeColorMode: activeMode,
            });
          } catch {
            setSaveState("error");
            setStatusMessage(
              "Published tokens, but failed to update active design system.",
            );
            return;
          }
        }
        setSaveState("idle");
        setStatusMessage(
          status === "published"
            ? "Published design system tokens."
            : "Saved draft design system tokens.",
        );
      } catch {
        setSaveState("error");
        setStatusMessage(
          status === "published"
            ? "Publish failed. Try again."
            : "Save failed. Try again.",
        );
      }
    },
    [activeMode, authoringClient, draftTokens, selectedSet, selectedSetId],
  );

  const filteredColorSections = useMemo(() => {
    const query = colorSearch.trim().toLowerCase();
    if (!query) {
      return COLOR_SECTIONS;
    }
    return COLOR_SECTIONS.map((section) => ({
      ...section,
      fields: section.fields.filter((field) => {
        return (
          section.label.toLowerCase().includes(query) ||
          field.label.toLowerCase().includes(query) ||
          field.key.toLowerCase().includes(query)
        );
      }),
    })).filter((section) => section.fields.length > 0);
  }, [colorSearch]);

  if (!canAccess) {
    return (
      <StudioRoot className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p className="max-w-md text-pretty">
          Design system editor is limited to admin and designer roles.
        </p>
      </StudioRoot>
    );
  }

  return (
    <StudioRoot className="flex min-h-dvh w-full min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 gap-3 p-3 xl:grid-cols-[minmax(340px,420px)_1fr]">
          <Card className="min-h-0 overflow-hidden">
            <CardHeader className="gap-4 border-b border-border/70 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl">Design system editor</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visual token editing for designers. Layout mirrors builder
                  tooling patterns.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Token set
                </p>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={loadState === "loading" || tokenSets.length === 0}
                  value={selectedSetId}
                  onChange={(event) => {
                    const id = event.target.value;
                    setSelectedSetId(id);
                    const selected = tokenSets.find(
                      (doc) => String(doc.id) === id,
                    );
                    setDraftTokens(normalizeTokens(selected?.tokens ?? []));
                  }}
                >
                  {tokenSets.map((doc) => (
                    <option key={doc.id} value={String(doc.id)}>
                      {doc.title} ({doc.scopeKey})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Mode
                </p>
                <div className="grid grid-cols-2 rounded-md border border-input p-1">
                  {(["light", "dark"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={cn(
                        "rounded px-2 py-1 text-xs font-medium capitalize",
                        activeMode === mode
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/60",
                      )}
                      onClick={() => setActiveMode(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="gap-2"
                  disabled={
                    saveState === "saving" || !selectedSetId || !isDirty
                  }
                  type="button"
                  onClick={() => {
                    void persistTokens("draft");
                  }}
                >
                  Save draft
                </Button>
                <Button
                  disabled={saveState === "saving" || !selectedSetId}
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void persistTokens("published");
                  }}
                >
                  Publish
                </Button>
                <Button
                  className="gap-2"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const ac = new AbortController();
                    void fetchTokenSets(ac.signal);
                  }}
                >
                  <IconRefresh className="size-4" aria-hidden />
                  Refresh
                </Button>
              </div>
              {statusMessage ? (
                <p
                  className={cn(
                    "text-xs",
                    saveState === "error" || loadState === "error"
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {statusMessage}
                </p>
              ) : null}
            </CardHeader>
            <CardContent className="min-h-0 p-0">
              <div className="flex h-full min-h-0 flex-col">
                <div className="grid grid-cols-3 border-b border-border/70">
                  {(
                    [
                      ["colors", "Colors"],
                      ["typography", "Typography"],
                      ["other", "Other"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={cn(
                        "border-r border-border/70 px-2 py-2 text-xs font-medium last:border-r-0",
                        activeTab === id
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/70",
                      )}
                      onClick={() => setActiveTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <ScrollArea className="h-[calc(100dvh-18rem)] px-4 py-4">
                  <DesignSystemEditorTokenScrollBody
                    activeTab={activeTab}
                    colorSearch={colorSearch}
                    filteredColorSections={filteredColorSections}
                    getTokenValue={getTokenValue}
                    loadState={loadState}
                    setColorSearch={setColorSearch}
                    setTokenValue={setTokenValue}
                    tokenSets={tokenSets}
                  />
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <DesignSystemEditorPreviewCard
            isDirty={isDirty}
            previewKey={previewKey}
            previewPath={previewPath}
            previewUrl={previewUrl}
            selectedSetTitle={selectedSet?.title ?? "None"}
            setPreviewKey={setPreviewKey}
            setPreviewPath={setPreviewPath}
          />
        </div>
      </div>
    </StudioRoot>
  );
}
