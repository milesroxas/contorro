import { getPayload, type Payload } from "payload";
import config from "../../src/payload.config.js";

let cached: Payload | null = null;

/**
 * Returns the Payload singleton for E2E seed/cleanup helpers.
 * Reuses the same instance across calls within a single worker.
 */
export async function getTestPayload(): Promise<Payload> {
  if (!cached) {
    cached = await getPayload({ config });
  }
  return cached;
}

/**
 * Closes the Payload database pool so the worker process can exit.
 * Call this in the final `afterAll` of every spec file.
 *
 * The Payload Postgres adapter acquires a monitoring client in
 * `connectWithReconnect` that is never released, so `pool.end()`
 * blocks forever waiting for it. We race against a short timeout
 * to prevent the afterAll hook from timing out.
 *
 * `getPayload()` caches instances on `global._payload` (key `default`). After
 * `pool.end()`, that singleton is unusable — the next `getPayload()` would
 * still return it and hang. Drop the cache entry so the next seed re-inits.
 */
export async function closeTestPayload(): Promise<void> {
  if (cached) {
    try {
      await Promise.race([
        cached.db.pool.end(),
        new Promise((resolve) => setTimeout(resolve, 3_000)),
      ]);
    } catch {
      // pool already ended — safe to ignore
    }
    cached = null;
  }
  const g = globalThis as typeof globalThis & {
    _payload?: Map<string, unknown>;
  };
  g._payload?.delete("default");
}
