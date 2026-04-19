import type { Payload } from "payload";
import { APIError } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeTestPayload, getTestPayload } from "../helpers/getTestPayload.js";

describe("API — Payload users collection and query errors", () => {
  let payload: Payload;

  beforeAll(async () => {
    payload = await getTestPayload();
  });

  afterAll(async () => {
    await closeTestPayload();
  });

  it("returns a paginated users result with a stable contract", async () => {
    const limit = 5;
    const users = await payload.find({
      collection: "users",
      limit,
    });

    expect(Array.isArray(users.docs)).toBe(true);
    expect(typeof users.totalDocs).toBe("number");
    expect(users.totalDocs).toBeGreaterThanOrEqual(0);
    expect(typeof users.hasNextPage).toBe("boolean");
    expect(users.limit).toBe(limit);
    expect(typeof users.page).toBe("number");

    for (const doc of users.docs) {
      expect(doc).toMatchObject({ id: expect.anything() });
    }
  });

  it("rejects find on an unknown collection with APIError", async () => {
    await expect(
      payload.find({
        // Intentionally invalid slug — runtime validation should fail.
        collection: "___not_a_collection___" as "users",
        limit: 1,
      }),
    ).rejects.toBeInstanceOf(APIError);
  });
});
