import { type AsyncResult, err, ok } from "@repo/kernel";

export type RollbackPageError =
  | "PAGE_NOT_FOUND"
  | "SNAPSHOT_NOT_FOUND"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR";

export async function rollbackPageFromSnapshotCommand(
  deps: {
    tryRollback: (
      pageId: string,
      releaseSnapshotId: string,
      actor: unknown,
    ) => Promise<{ ok: true } | { ok: false; error: RollbackPageError }>;
  },
  args: {
    pageId: string;
    releaseSnapshotId: string;
    actor: unknown;
  },
): AsyncResult<{ rolledBack: true }, RollbackPageError> {
  const r = await deps.tryRollback(
    args.pageId,
    args.releaseSnapshotId,
    args.actor,
  );
  return r.ok ? ok({ rolledBack: true }) : err(r.error);
}
