import { type AsyncResult, err, ok } from "@repo/kernel";

export type SubmitRevisionError =
  | "REVISION_NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATE"
  | "PERSISTENCE_ERROR";

export async function submitComponentRevisionCommand(
  deps: {
    trySubmit: (
      revisionId: string,
      actor: unknown,
    ) => Promise<{ ok: true } | { ok: false; error: SubmitRevisionError }>;
  },
  args: { revisionId: string; actor: unknown },
): AsyncResult<{ submitted: true }, SubmitRevisionError> {
  const r = await deps.trySubmit(args.revisionId, args.actor);
  return r.ok ? ok({ submitted: true }) : err(r.error);
}

export type PromoteDefinitionError =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR";

export async function promoteComponentDefinitionCommand(
  deps: {
    tryPromote: (
      definitionId: string,
      actor: unknown,
    ) => Promise<{ ok: true } | { ok: false; error: PromoteDefinitionError }>;
  },
  args: { definitionId: string; actor: unknown },
): AsyncResult<{ promoted: true }, PromoteDefinitionError> {
  const r = await deps.tryPromote(args.definitionId, args.actor);
  return r.ok ? ok({ promoted: true }) : err(r.error);
}

export type ApproveRevisionError =
  | "REVISION_NOT_FOUND"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR";

export async function approveComponentRevisionCommand(
  deps: {
    tryApprove: (
      revisionId: string,
      actor: unknown,
    ) => Promise<
      | { ok: true; status: "approved" }
      | { ok: false; error: ApproveRevisionError }
    >;
  },
  args: { revisionId: string; actor: unknown },
): AsyncResult<{ approved: true; status: "approved" }, ApproveRevisionError> {
  const r = await deps.tryApprove(args.revisionId, args.actor);
  return r.ok ? ok({ approved: true, status: r.status }) : err(r.error);
}

export type PublishRevisionError =
  | "REVISION_NOT_FOUND"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR"
  | "INVALID_STATE"
  | "BREAKING_CHANGE_NOT_ACKNOWLEDGED";

export async function publishRevisionToDefinitionCommand(
  deps: {
    tryPublish: (
      revisionId: string,
      actor: unknown,
    ) => Promise<{ ok: true } | { ok: false; error: PublishRevisionError }>;
  },
  args: { revisionId: string; actor: unknown },
): AsyncResult<{ published: true }, PublishRevisionError> {
  const r = await deps.tryPublish(args.revisionId, args.actor);
  return r.ok ? ok({ published: true }) : err(r.error);
}

export type RollbackDefinitionError =
  | "REVISION_NOT_FOUND"
  | "FORBIDDEN"
  | "PERSISTENCE_ERROR";

export async function rollbackDefinitionFromRevisionCommand(
  deps: {
    tryRollback: (
      revisionId: string,
      actor: unknown,
    ) => Promise<{ ok: true } | { ok: false; error: RollbackDefinitionError }>;
  },
  args: { revisionId: string; actor: unknown },
): AsyncResult<{ rolledBack: true }, RollbackDefinitionError> {
  const r = await deps.tryRollback(args.revisionId, args.actor);
  return r.ok ? ok({ rolledBack: true }) : err(r.error);
}
