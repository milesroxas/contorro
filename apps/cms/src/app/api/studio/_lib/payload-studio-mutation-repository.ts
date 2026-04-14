import {
  defaultEmptyPageComposition,
  defaultPageTemplateComposition,
} from "@repo/domains-composition";
import {
  builderRowIdForComponent,
  componentIdFromBuilderRowId,
} from "@repo/infrastructure-payload-config/builder-row-id";
import { err, ok } from "@repo/kernel";
import type { Payload } from "payload";

import type { BuilderMutationRepository } from "@repo/application-builder";

function normalizeUpdatedAt(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
}

export function payloadBuilderMutationRepository(
  payload: Payload,
  user: unknown,
): BuilderMutationRepository {
  return {
    async loadRevision(compositionId, actor) {
      void actor;
      const componentId = componentIdFromBuilderRowId(compositionId);
      try {
        if (componentId) {
          const existing = await payload.findByID({
            collection: "components",
            id: componentId,
            depth: 0,
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
      const componentId = componentIdFromBuilderRowId(compositionId);
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
          return ok({ updatedAt: normalizeUpdatedAt(updated.updatedAt) });
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
        return ok({ updatedAt: normalizeUpdatedAt(updated.updatedAt) });
      } catch {
        return err("PERSISTENCE_ERROR");
      }
    },

    async renameTemplate(compositionId, name, actor) {
      void actor;
      try {
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
            composition:
              existing.composition ?? defaultPageTemplateComposition(),
          },
          draft: true,
          user,
          overrideAccess: false,
        });
        return ok({
          name: String(updated.title ?? name),
          updatedAt: normalizeUpdatedAt(updated.updatedAt),
        });
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
          compositionId: builderRowIdForComponent(String(created.id)),
        });
      } catch {
        return err("PERSISTENCE_ERROR");
      }
    },
  };
}
