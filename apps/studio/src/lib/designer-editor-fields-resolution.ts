import type { FormState } from "payload";
import { getSiblingData } from "payload/shared";

export function siblingPathForComponentDefinition(
  editorFieldValuesPath: string,
): string {
  if (!editorFieldValuesPath.endsWith("editorFieldValues")) {
    return editorFieldValuesPath;
  }
  const cut = "editorFieldValues".length;
  return `${editorFieldValuesPath.slice(0, -cut)}componentDefinition`;
}

export function normalizeEditorFieldValuesPath(path: string): string {
  if (path.endsWith(".editorFieldValues")) {
    return path;
  }
  if (/^.*\.blocks\.\d+$/.test(path)) {
    return `${path}.editorFieldValues`;
  }
  return path;
}

function isPresentRelationshipValue(v: unknown): boolean {
  return v !== undefined && v !== null && v !== "";
}

/**
 * Paths to try with {@link getSiblingData} (same helper Payload uses for row data). Include the
 * block row path (`…blocks.N`) as well as `….editorFieldValues` — both resolve to the same row prefix.
 */
export function collectBlockPathsForSiblingLookup(
  pathProp: string,
  hookPath: string | undefined,
  ctxPath: string | undefined,
): string[] {
  /**
   * Payload can leave `path` prop stale right after adding array rows. Prefer live context path
   * first, then `useField` hook path, then the prop fallback.
   */
  const raw = [ctxPath, hookPath, pathProp].filter(
    (x): x is string => typeof x === "string" && x.length > 0,
  );
  const extra: string[] = [];
  for (const p of raw) {
    if (/^.*\.blocks\.\d+$/.test(p)) {
      extra.push(`${p}.editorFieldValues`);
    }
    if (p.endsWith(".editorFieldValues")) {
      extra.push(p.replace(/\.editorFieldValues$/, ""));
    }
    const m = /^(.*\.blocks\.\d+)\.editorFieldValues$/.exec(p);
    if (m) {
      extra.push(m[1]);
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of [...raw, ...extra]) {
    if (seen.has(p)) {
      continue;
    }
    seen.add(p);
    out.push(p);
  }
  return out;
}

export function componentDefinitionFromGetSiblingData(
  fields: FormState,
  paths: string[],
): unknown {
  for (const p of paths) {
    try {
      const sd = getSiblingData(
        fields as Parameters<typeof getSiblingData>[0],
        p,
      );
      if (sd && typeof sd === "object" && !Array.isArray(sd)) {
        const cd = (sd as { componentDefinition?: unknown })
          .componentDefinition;
        if (isPresentRelationshipValue(cd)) {
          return cd;
        }
      }
    } catch {
      /* invalid path */
    }
  }
  return undefined;
}

/** Reads `….componentDefinition` form keys directly (not filtered by `disableFormData`). */
export function componentDefinitionFromDirectFieldKeys(
  fields: FormState,
  paths: string[],
): unknown {
  const keys = new Set<string>();
  for (const p of paths) {
    if (p.includes("editorFieldValues")) {
      keys.add(siblingPathForComponentDefinition(p));
    }
    const stripped = p.replace(/\.editorFieldValues$/, "");
    const m = /^(.*\.blocks\.\d+)$/.exec(stripped);
    if (m) {
      keys.add(`${m[1]}.componentDefinition`);
    }
  }
  for (const k of keys) {
    const v = fields[k]?.value as unknown;
    if (isPresentRelationshipValue(v)) {
      return v;
    }
  }
  return undefined;
}

function componentDefinitionFieldPairsEditorFieldValuesPath(
  componentDefinitionFieldKey: string,
  editorFieldValuesPath: string,
): boolean {
  const expectedSlotPath =
    componentDefinitionFieldKey === "componentDefinition"
      ? "editorFieldValues"
      : componentDefinitionFieldKey.replace(
          /\.componentDefinition$/,
          ".editorFieldValues",
        );
  if (expectedSlotPath === editorFieldValuesPath) {
    return true;
  }
  const mTop = /^contentSlots\.(\d+)\.blocks\.(\d+)\.editorFieldValues$/.exec(
    editorFieldValuesPath,
  );
  if (
    mTop &&
    componentDefinitionFieldKey ===
      `version.contentSlots.${mTop[1]}.blocks.${mTop[2]}.componentDefinition`
  ) {
    return true;
  }
  const mVer =
    /^version\.contentSlots\.(\d+)\.blocks\.(\d+)\.editorFieldValues$/.exec(
      editorFieldValuesPath,
    );
  if (
    mVer &&
    componentDefinitionFieldKey ===
      `contentSlots.${mVer[1]}.blocks.${mVer[2]}.componentDefinition`
  ) {
    return true;
  }
  return false;
}

function componentDefinitionValueFromFormState(
  editorFieldValuesPath: string,
  fields: FormState,
): unknown {
  const expectedKey = siblingPathForComponentDefinition(editorFieldValuesPath);
  const direct = fields[expectedKey]?.value as unknown;
  if (isPresentRelationshipValue(direct)) {
    return direct;
  }
  const keys = Object.keys(fields).filter(
    (k) => k === "componentDefinition" || k.endsWith(".componentDefinition"),
  );
  keys.sort((a, b) => {
    const rank = (x: string) => (x.startsWith("version.") ? 0 : 1);
    return rank(a) - rank(b);
  });
  for (const key of keys) {
    if (
      !componentDefinitionFieldPairsEditorFieldValuesPath(
        key,
        editorFieldValuesPath,
      )
    ) {
      continue;
    }
    const v = fields[key]?.value as unknown;
    if (isPresentRelationshipValue(v)) {
      return v;
    }
  }
  return undefined;
}

function componentDefinitionFromGetDataByPath(
  ctx:
    | {
        getDataByPath?: (path: string) => unknown;
        getSiblingData?: (path: string) => unknown;
      }
    | undefined,
  editorFieldValuesPath: string,
): unknown {
  if (!ctx?.getDataByPath) {
    return undefined;
  }
  const tryPaths: string[] = [
    siblingPathForComponentDefinition(editorFieldValuesPath),
  ];
  const mTop = /^contentSlots\.(\d+)\.blocks\.(\d+)\.editorFieldValues$/.exec(
    editorFieldValuesPath,
  );
  if (mTop) {
    tryPaths.push(
      `version.contentSlots.${mTop[1]}.blocks.${mTop[2]}.componentDefinition`,
    );
  }
  const mVer =
    /^version\.contentSlots\.(\d+)\.blocks\.(\d+)\.editorFieldValues$/.exec(
      editorFieldValuesPath,
    );
  if (mVer) {
    tryPaths.push(
      `contentSlots.${mVer[1]}.blocks.${mVer[2]}.componentDefinition`,
    );
  }
  for (const p of tryPaths) {
    try {
      const v = ctx.getDataByPath(p);
      if (isPresentRelationshipValue(v)) {
        return v;
      }
    } catch {
      /* invalid path */
    }
  }
  return undefined;
}

function componentDefinitionFromFormGetSiblingData(
  ctx:
    | {
        getDataByPath?: (path: string) => unknown;
        getSiblingData?: (path: string) => unknown;
      }
    | undefined,
  paths: string[],
): unknown {
  if (!ctx?.getSiblingData) {
    return undefined;
  }
  for (const p of paths) {
    try {
      const sd = ctx.getSiblingData(p);
      if (sd && typeof sd === "object" && !Array.isArray(sd)) {
        const cd = (sd as { componentDefinition?: unknown })
          .componentDefinition;
        if (isPresentRelationshipValue(cd)) {
          return cd;
        }
      }
    } catch {
      /* invalid path */
    }
  }
  return undefined;
}

function componentDefinitionFromDocumentData(
  data: unknown,
  editorFieldValuesPath: string,
): unknown {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const m =
    /^(?:version\.)?contentSlots\.(\d+)\.blocks\.(\d+)\.editorFieldValues$/.exec(
      editorFieldValuesPath,
    );
  if (!m) {
    return undefined;
  }
  const si = Number.parseInt(m[1], 10);
  const bi = Number.parseInt(m[2], 10);
  const row = data as {
    contentSlots?: unknown[];
    version?: { contentSlots?: unknown[] };
  };

  function componentDefinitionFromBlock(block: unknown): unknown {
    if (block && typeof block === "object" && block !== null) {
      const cd = (block as { componentDefinition?: unknown })
        .componentDefinition;
      if (isPresentRelationshipValue(cd)) {
        return cd;
      }
    }
    return undefined;
  }

  function blockAtIndexes(slots: unknown[] | undefined | null): unknown {
    const slotRow = Array.isArray(slots) ? slots[si] : undefined;
    return slotRow &&
      typeof slotRow === "object" &&
      !Array.isArray(slotRow) &&
      Array.isArray((slotRow as { blocks?: unknown }).blocks)
      ? (slotRow as { blocks: unknown[] }).blocks[bi]
      : undefined;
  }

  const underVersion = editorFieldValuesPath.startsWith("version.");
  const slotArrays = underVersion
    ? [row.version?.contentSlots, row.contentSlots]
    : [row.contentSlots, row.version?.contentSlots];

  for (const slots of slotArrays) {
    const cd = componentDefinitionFromBlock(blockAtIndexes(slots));
    if (cd !== undefined) {
      return cd;
    }
  }
  return undefined;
}

export function resolveComponentDefinitionRef(args: {
  editorFieldValuesPath: string;
  siblingLookupPaths: string[];
  fields: FormState;
  documentForm:
    | {
        getDataByPath?: (path: string) => unknown;
        getSiblingData?: (path: string) => unknown;
      }
    | undefined;
  form:
    | {
        getDataByPath?: (path: string) => unknown;
        getSiblingData?: (path: string) => unknown;
      }
    | undefined;
  getData: (() => unknown) | undefined;
  savedDocumentData: unknown;
}): unknown {
  const {
    editorFieldValuesPath: rawEditorFieldValuesPath,
    siblingLookupPaths,
    fields,
    documentForm,
    form,
    getData,
    savedDocumentData,
  } = args;
  const editorFieldValuesPath = normalizeEditorFieldValuesPath(
    rawEditorFieldValuesPath,
  );
  const candidateEditorPaths = [
    editorFieldValuesPath,
    ...siblingLookupPaths.map(normalizeEditorFieldValuesPath),
    ...siblingLookupPaths,
  ].filter((x, i, arr) => arr.indexOf(x) === i);
  let raw = componentDefinitionFromGetSiblingData(fields, siblingLookupPaths);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = componentDefinitionFromDirectFieldKeys(fields, siblingLookupPaths);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = componentDefinitionValueFromFormState(editorFieldValuesPath, fields);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = componentDefinitionFromGetDataByPath(
    documentForm,
    editorFieldValuesPath,
  );
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = componentDefinitionFromFormGetSiblingData(
    documentForm,
    candidateEditorPaths,
  );
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = componentDefinitionFromGetDataByPath(form, editorFieldValuesPath);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  raw = componentDefinitionFromFormGetSiblingData(form, candidateEditorPaths);
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  if (typeof getData === "function") {
    raw = componentDefinitionFromDocumentData(getData(), editorFieldValuesPath);
    if (isPresentRelationshipValue(raw)) {
      return raw;
    }
  }
  raw = componentDefinitionFromDocumentData(
    savedDocumentData,
    editorFieldValuesPath,
  );
  if (isPresentRelationshipValue(raw)) {
    return raw;
  }
  return undefined;
}

export function extractDefinitionId(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return Number.parseInt(raw, 10);
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    if ("id" in raw) {
      const id = (raw as { id: unknown }).id;
      if (typeof id === "number" && Number.isFinite(id)) {
        return id;
      }
      if (typeof id === "string" && /^\d+$/.test(id)) {
        return Number.parseInt(id, 10);
      }
    }
    if ("value" in raw) {
      return extractDefinitionId((raw as { value: unknown }).value);
    }
  }
  return undefined;
}
