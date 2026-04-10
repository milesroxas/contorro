import type { AsyncResult } from "@repo/kernel";
import type { DesignTokenSet } from "../aggregates/design-token-set.js";

export interface DesignTokenSetRepository {
  findById(id: string): Promise<DesignTokenSet | null>;
  save(aggregate: DesignTokenSet): AsyncResult<void, "PERSISTENCE_ERROR">;
}
