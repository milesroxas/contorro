import { type AsyncResult, err, ok } from "@repo/kernel";

export type PublishPageError =
  | "PAGE_NOT_FOUND"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR"
  | "CATALOG_NOT_APPROVED";

export async function publishPageCommand(
  deps: {
    tryPublish: (
      pageId: string,
      actor: unknown,
    ) => Promise<
      | { ok: true; alreadyApplied?: boolean }
      | { ok: false; error: PublishPageError }
    >;
  },
  args: { pageId: string; actor: unknown },
): AsyncResult<
  { published: true; alreadyApplied?: boolean },
  PublishPageError
> {
  const r = await deps.tryPublish(args.pageId, args.actor);
  if (r.ok) {
    return ok({ published: true, alreadyApplied: r.alreadyApplied });
  }
  return err(r.error);
}
