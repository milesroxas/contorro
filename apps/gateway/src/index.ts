import { serve } from "@hono/node-server";
import { ok } from "@repo/kernel";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.json(ok({ status: "ok" as const }));
});

const port = Number(process.env.PORT) || 3001;
serve({ fetch: app.fetch, port });
