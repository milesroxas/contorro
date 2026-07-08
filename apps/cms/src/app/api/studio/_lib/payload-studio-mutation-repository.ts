import { err, ok } from "@repo/contracts-zod";
import {
  componentIdFromStudioRowId,
  defaultEmptyPageComposition,
  defaultPageTemplateComposition,
  studioRowIdForComponent,
} from "@repo/domains-composition";
import type { Payload } from "payload";
import type { StudioMutationRepository } from "@/lib/studio-commands";

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
        const result = await payload.update({
          collection,
          where: {
            and: [
              { id: { equals: id } },
              { updatedAt: { equals: ifMatchUpdatedAt } },
            ],
          },
          data,
          draft: intent === "draft",
          user,
          overrideAccess: false,
        });

        const updated = result.docs[0];
        if (!updated) {
          const exists = await findRevision(collection, id);
          return err(exists ? "COMPOSITION_CONFLICT" : "COMPOSITION_NOT_FOUND");
        }
        return ok({
          updatedAt: normalizeUpdatedAt(updated.updatedAt),
          _status: publicationStatusFromDoc(updated),
        });
      } catch {
        return err("PERSISTENCE_ERROR");
      }
    },

    async renameTemplate(compositionId, name, intent) {
      const { collection, id } = resolveTarget(compositionId);
      const isDraft = intent === "draft";
      const titleField = collection === "components" ? "displayName" : "title";

      try {
        const updated = await payload.update({
          collection,
          id,
          data: {
            [titleField]: name,
            ...(!isDraft ? { _status: "published" as const } : {}),
          },
          draft: isDraft,
          user,
          overrideAccess: false,
        });
        const value = updated as unknown as Record<string, unknown>;
        return ok({
          name: String(value[titleField] ?? name),
          updatedAt: normalizeUpdatedAt(updated.updatedAt),
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
