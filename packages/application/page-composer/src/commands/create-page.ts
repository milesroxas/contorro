import type { PageComposition } from "@repo/contracts-zod";
import {
  clonePageCompositionWithNewIds,
  validatePageCompositionInvariants,
} from "@repo/domains-composition";
import { type AsyncResult, err, ok } from "@repo/kernel";

import { BLANK_STACK_PAGE_COMPOSITION } from "../blank-composition.js";

export type CreatePageInput =
  | { mode: "blank"; title: string; slug: string }
  | { mode: "template"; title: string; slug: string; templateId: string };

export type CreatePageError =
  | "VALIDATION_ERROR"
  | "TEMPLATE_NOT_FOUND"
  | "COMPOSITION_INVALID"
  | "PERSISTENCE_ERROR";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 200 && SLUG_RE.test(slug);
}

export type CreatePagePersistence = {
  compositionSlug: (pageSlug: string) => string;
  createComposition: (args: {
    title: string;
    slug: string;
    composition: PageComposition;
  }) => Promise<{ id: string } | null>;
  createPage: (args: {
    title: string;
    slug: string;
    pageCompositionId: string;
  }) => Promise<{ id: string } | null>;
  deleteComposition: (compositionId: string) => Promise<void>;
  loadCompositionForTemplate: (
    templateId: string,
  ) => Promise<PageComposition | null>;
};

export async function createPageCommand(
  deps: CreatePagePersistence,
  input: CreatePageInput,
): AsyncResult<{ pageId: string; compositionId: string }, CreatePageError> {
  if (!assertSlug(input.slug) || input.title.trim().length === 0) {
    return err("VALIDATION_ERROR");
  }

  let composition: PageComposition;

  if (input.mode === "blank") {
    composition = BLANK_STACK_PAGE_COMPOSITION;
  } else {
    const source = await deps.loadCompositionForTemplate(input.templateId);
    if (!source) {
      return err("TEMPLATE_NOT_FOUND");
    }
    try {
      composition = clonePageCompositionWithNewIds(source);
    } catch {
      return err("COMPOSITION_INVALID");
    }
  }

  const inv = validatePageCompositionInvariants(composition);
  if (!inv.ok) {
    return err("COMPOSITION_INVALID");
  }

  const compSlug = deps.compositionSlug(input.slug);

  let compDoc: { id: string };
  try {
    const created = await deps.createComposition({
      title: `${input.title} (composition)`,
      slug: compSlug,
      composition,
    });
    if (!created) {
      return err("PERSISTENCE_ERROR");
    }
    compDoc = created;
  } catch {
    return err("PERSISTENCE_ERROR");
  }

  try {
    const page = await deps.createPage({
      title: input.title.trim(),
      slug: input.slug,
      pageCompositionId: compDoc.id,
    });
    if (!page) {
      await deps.deleteComposition(compDoc.id);
      return err("PERSISTENCE_ERROR");
    }
    return ok({ pageId: page.id, compositionId: compDoc.id });
  } catch {
    await deps.deleteComposition(compDoc.id);
    return err("PERSISTENCE_ERROR");
  }
}
