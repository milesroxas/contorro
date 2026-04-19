import { err, ok } from "@repo/kernel";
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { resultToResponse } from "./result-to-response.js";

describe("resultToResponse", () => {
  it("returns wrapped data with 200 for ok results", async () => {
    const app = new Hono();
    app.get("/t", (c) => resultToResponse(c, ok({ x: 1 })));
    const res = await app.request("http://local/t");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { x: 1 } });
  });

  it("maps kernel error codes to JSON error bodies and HTTP statuses", async () => {
    const app = new Hono();
    app.get("/n", (c) => resultToResponse(c, err("NOT_FOUND")));
    app.get("/v", (c) => resultToResponse(c, err("VALIDATION_ERROR")));
    app.get("/u", (c) => resultToResponse(c, err("UNAUTHORIZED")));

    const n = await app.request("http://local/n");
    expect(n.status).toBe(404);
    expect(JSON.parse(await n.text())).toEqual({
      error: { code: "NOT_FOUND" },
    });

    const v = await app.request("http://local/v");
    expect(v.status).toBe(422);
    expect(JSON.parse(await v.text())).toEqual({
      error: { code: "VALIDATION_ERROR" },
    });

    const u = await app.request("http://local/u");
    expect(u.status).toBe(401);
  });
});
