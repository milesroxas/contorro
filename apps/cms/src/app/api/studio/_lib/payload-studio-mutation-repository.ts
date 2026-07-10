import { err, ok } from "@repo/contracts-zod";
import {
  componentIdFromStudioRowId,
  defaultEmptyPageComposition,
  defaultPageTemplateComposition,
  studioRowIdForComponent,
} from "@repo/domains-composition";
import { APIError, type Payload } from "payload";
import type { StudioMutationRepository } from "@/lib/studio-commands";

/**
 * Payload hook/validation failures (e.g. the components publish gate for
 * blockType bindings) are 4xx `APIError`s — surface their message instead of
 * collapsing everything to PERSISTENCE_ERROR.
 */
function saveFailureFromThrown(e: unknown): {
  code: "VALIDATION_ERROR" | "PERSISTENCE_ERROR";
  message?: string;
} {
  if (e instanceof APIError && e.status < 500) {
    return { code: "VALIDATION_ERROR", message: e.message };
  }
  return { code: "PERSISTENCE_ERROR" };
}

/** Bulk (`where`) updates report per-doc hook errors instead of throwing. */
function firstBulkUpdateErrorMessage(result: {
  errors?: Array<{ message?: unknown }>;
}): string | null {
  const message = result.errors?.[0]?.message;
  return typeof message === "string" && message.trim() !== "" ? message : null;
}

function normalizeUpdatedAt(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

export function publicationStatusFromDoc(doc: {
  _status?: unknown;
}): "draft" | "published" | null {
  const s = doc._status;
  if (s === "draft" || s === "published") {
    return s;
  }
  return null;
}

type CompositionCollection = "components" | "page-compositions";

function metaUpdateData(
  titleField: "displayName" | "title",
  patch: { name?: string; blockType?: string | null },
  isDraft: boolean,
): Record<string, unknown> {
  return {
    ...(patch.name !== undefined ? { [titleField]: patch.name } : {}),
    ...(patch.blockType !== undefined ? { blockType: patch.blockType } : {}),
    ...(!isDraft ? { _status: "published" as const } : {}),
  };
}

function resolveTarget(compositionId: string): {
  collection: CompositionCollection;
  id: string;
} {
  const componentId = componentIdFromStudioRowId(compositionId);
  return componentId
    ? { collection: "components", id: componentId }
    : { collection: "page-compositions", id: compositionId };
}

export function payloadStudioMutationRepository(
  payload: Payload,
  user: unknown,
): StudioMutationRepository {
  async function findRevision(
    collection: CompositionCollection,
    id: string,
  ): Promise<{ updatedAt: string } | null> {
    try {
      const existing = await payload.findByID({
        collection,
        id,
        depth: 0,
        draft: true,
        user,
        overrideAccess: false,
      });
      if (!existing) {
        return null;
      }
      return { updatedAt: normalizeUpdatedAt(existing.updatedAt) };
    } catch {
      return null;
    }
  }

  return {
    async loadRevision(compositionId) {
      const { collection, id } = resolveTarget(compositionId);
      return findRevision(collection, id);
    },

    async save(compositionId, composition, intent, ifMatchUpdatedAt) {
      const { collection, id } = resolveTarget(compositionId);
      const data =
        intent === "publish"
          ? { composition, _status: "published" as const }
          : { composition };

      try {
        if (ifMatchUpdatedAt === null || ifMatchUpdatedAt === "") {
          const updated = await payload.update({
            collection,
            id,
            data,
            draft: intent === "draft",
            user,
            overrideAccess: false,
          });
          return ok({
            updatedAt: normalizeUpdatedAt(updated.updatedAt),
            _status: publicationStatusFromDoc(updated),
          });
        }

        // Conditional write: check and update in one operation so two
        // concurrent saves cannot both pass a separate pre-read check.
        //
        // `draft: true` even for publish: the revision token the client holds
        // comes from draft-aware reads (`findByID({ draft: true })` returns the
        // latest version's timestamp), so the `where` must be evaluated against
        // the version timeline too — Payload only routes bulk updates through
        // `queryDrafts` when `draft` is set. With `draft: false` the match runs
        // against the parent row's `updatedAt`, which draft saves never touch,
        // so every publish after a draft save would false-conflict. The
        // `_status: "published"` in `data` still performs a real publish:
        // Payload treats `draft && data._status === "published"` as a publish
        // per document.
        const result = await payload.update({
          collection,
          where: {
            and: [
              { id: { equals: id } },
              { updatedAt: { equals: ifMatchUpdatedAt } },
            ],
          },
          data,
          draft: true,
          user,
          overrideAccess: false,
        });

        const updated = result.docs[0];
        if (!updated) {
          // Hook/validation failures surface in `errors` for bulk updates —
          // distinguish them from a genuine revision conflict.
          const hookMessage = firstBulkUpdateErrorMessage(result);
          if (hookMessage !== null) {
            return err({
              code: "VALIDATION_ERROR" as const,
              message: hookMessage,
            });
          }
          const exists = await findRevision(collection, id);
          return err({
            code: exists
              ? ("COMPOSITION_CONFLICT" as const)
              : ("COMPOSITION_NOT_FOUND" as const),
          });
        }
        return ok({
          updatedAt: normalizeUpdatedAt(updated.updatedAt),
          _status: publicationStatusFromDoc(updated),
        });
      } catch (e) {
        return err(saveFailureFromThrown(e));
      }
    },

    async updateMeta(compositionId, patch, intent) {
      const { collection, id } = resolveTarget(compositionId);
      const isDraft = intent === "draft";
      const titleField = collection === "components" ? "displayName" : "title";

      try {
        const updated = await payload.update({
          collection,
          id,
          data: metaUpdateData(titleField, patch, isDraft),
          draft: isDraft,
          user,
          overrideAccess: false,
        });
        const value = updated as unknown as Record<string, unknown>;
        const blockType = value.blockType;
        return ok({
          name: String(value[titleField] ?? patch.name ?? ""),
          updatedAt: normalizeUpdatedAt(updated.updatedAt),
          ...(collection === "components"
            ? { blockType: typeof blockType === "string" ? blockType : null }
            : {}),
          _status: publicationStatusFromDoc(updated),
        });
      } catch {
        return err("PERSISTENCE_ERROR");
      }
    },

    async createTemplate(title) {
      const slug = `template-${crypto.randomUUID().slice(0, 12)}`;
      try {
        const created = await payload.create({
          collection: "page-compositions",
          data: {
            title,
            slug,
            composition: defaultPageTemplateComposition(),
          },
          draft: true,
          user,
          overrideAccess: false,
        });
        return ok({ compositionId: String(created.id) });
      } catch {
        return err("PERSISTENCE_ERROR");
      }
    },

    async createComponent(title) {
      try {
        const created = await payload.create({
          collection: "components",
          data: {
            displayName: title,
            composition: defaultEmptyPageComposition(),
          },
          draft: true,
          user,
          overrideAccess: false,
        });
        return ok({
          compositionId: studioRowIdForComponent(String(created.id)),
        });
      } catch {
        return err("PERSISTENCE_ERROR");
      }
    },
  };
}
