import { type AsyncResult, err, ok } from "@repo/kernel";

export type PublishPageError =
  | "PAGE_NOT_FOUND"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR";

export async function publishPageCommand(
  deps: {
    tryPublish: (
      pageId: string,
      actor: unknown,
    ) => Promise<{ ok: true } | { ok: false; error: PublishPageError }>;
  },
  args: { pageId: string; actor: unknown },
): AsyncResult<{ published: true }, PublishPageError> {
  const r = await deps.tryPublish(args.pageId, args.actor);
  if (r.ok) {
    return ok({ published: true });
  }
  return err(r.error);
}
