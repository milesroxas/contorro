import type { StudioMutationRepository } from "@repo/application-studio";
import {
  componentIdFromStudioRowId,
  defaultEmptyPageComposition,
  defaultPageTemplateComposition,
  studioRowIdForComponent,
} from "@repo/domains-composition";
import { type AsyncResult, err, ok } from "@repo/kernel";
import type { Payload } from "payload";

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

type RenameTemplateOk = {
  name: string;
  updatedAt: string;
  _status?: "draft" | "published" | null;
};

async function renameComponentDisplayName(
  payload: Payload,
  user: unknown,
  componentId: string,
  name: string,
  isDraft: boolean,
): AsyncResult<RenameTemplateOk, "PERSISTENCE_ERROR"> {
  const existing = await payload.findByID({
    collection: "components",
    id: componentId,
    depth: 0,
    draft: true,
    user,
    overrideAccess: false,
  });
  if (!existing) {
    return err("PERSISTENCE_ERROR");
  }

  const updated = await payload.update({
    collection: "components",
    id: componentId,
    data: {
      displayName: name,
      composition: existing.composition ?? defaultEmptyPageComposition(),
      ...(!isDraft ? { _status: "published" as const } : {}),
    },
    draft: isDraft,
    user,
    overrideAccess: false,
  });
  const value: RenameTemplateOk = {
    name: String(updated.displayName ?? name),
    updatedAt: normalizeUpdatedAt(updated.updatedAt),
    _status: publicationStatusFromDoc(updated),
  };
  return ok(value);
}

async function renamePageCompositionTitle(
  payload: Payload,
  user: unknown,
  compositionId: string,
  name: string,
  isDraft: boolean,
): AsyncResult<RenameTemplateOk, "PERSISTENCE_ERROR"> {
  const existing = await payload.findByID({
    collection: "page-compositions",
    id: compositionId,
    depth: 0,
    draft: true,
    user,
    overrideAccess: false,
  });
  if (!existing) {
    return err("PERSISTENCE_ERROR");
  }

  const updated = await payload.update({
    collection: "page-compositions",
    id: compositionId,
    data: {
      title: name,
      composition: existing.composition ?? defaultPageTemplateComposition(),
      ...(!isDraft ? { _status: "published" as const } : {}),
    },
    draft: isDraft,
    user,
    overrideAccess: false,
  });
  const value: RenameTemplateOk = {
    name: String(updated.title ?? name),
    updatedAt: normalizeUpdatedAt(updated.updatedAt),
    _status: publicationStatusFromDoc(updated),
  };
  return ok(value);
}

export function payloadStudioMutationRepository(
  payload: Payload,
  user: unknown,
): StudioMutationRepository {
  return {
    async loadRevision(compositionId, actor) {
      void actor;
      const componentId = componentIdFromStudioRowId(compositionId);
      try {
        if (componentId) {
          const existing = await payload.findByID({
            collection: "components",
            id: componentId,
            depth: 0,
            draft: true,
            user,
            overrideAccess: false,
          });
          if (!existing) {
            return null;
          }
          return {
            updatedAt: normalizeUpdatedAt(existing.updatedAt),
          };
        }
        const existing = await payload.findByID({
          collection: "page-compositions",
          id: compositionId,
          depth: 0,
          draft: true,
          user,
          overrideAccess: false,
        });
        if (!existing) {
          return null;
        }
        return {
          updatedAt: normalizeUpdatedAt(existing.updatedAt),
        };
      } catch {
        return null;
      }
    },

    async save(compositionId, composition, intent, actor) {
      void actor;
      const componentId = componentIdFromStudioRowId(compositionId);
      try {
        if (componentId) {
          const updated = await payload.update({
            collection: "components",
            id: componentId,
            data:
              intent === "publish"
                ? { composition, _status: "published" as const }
                : { composition },
            draft: intent === "draft",
            user,
            overrideAccess: false,
          });
          return ok({
            updatedAt: normalizeUpdatedAt(updated.updatedAt),
            _status: publicationStatusFromDoc(updated),
          });
        }

        const updated = await payload.update({
          collection: "page-compositions",
          id: compositionId,
          data:
            intent === "publish"
              ? { composition, _status: "published" as const }
              : { composition },
          draft: intent === "draft",
          user,
          overrideAccess: false,
        });
        return ok({
          updatedAt: normalizeUpdatedAt(updated.updatedAt),
          _status: publicationStatusFromDoc(updated),
        });
      } catch {
        return err("PERSISTENCE_ERROR");
      }
    },

    async renameTemplate(compositionId, name, actor, intent) {
      void actor;
      const componentId = componentIdFromStudioRowId(compositionId);
      const isDraft = intent === "draft";
      try {
        if (componentId) {
          return await renameComponentDisplayName(
            payload,
            user,
            componentId,
            name,
            isDraft,
          );
        }
        return await renamePageCompositionTitle(
          payload,
          user,
          compositionId,
          name,
          isDraft,
        );
      } catch {
        return err("PERSISTENCE_ERROR");
      }
    },

    async createTemplate(title, actor) {
      void actor;
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

    async createComponent(title, actor) {
      void actor;
      try {
        const created = await payload.create({
          collection: "components",
          data: {
            displayName: title,
            propContract: { fields: {} },
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
