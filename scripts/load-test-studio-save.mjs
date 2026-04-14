#!/usr/bin/env node
/**
 * Concurrent POSTs to canonical studio builder draft endpoint.
 * Requires STUDIO_ORIGIN (e.g. http://localhost:3001), BUILDER_COOKIE (session), COMPOSITION_ID.
 * Run manually against a dev stack — not part of default CI.
 */
const origin = process.env.STUDIO_ORIGIN ?? "http://127.0.0.1:3001";
const cookie = process.env.BUILDER_COOKIE;
const compositionId = process.env.COMPOSITION_ID;
const concurrent = Number.parseInt(process.env.CONCURRENT ?? "50", 10);

if (!cookie || !compositionId) {
  console.error(
    "Set BUILDER_COOKIE and COMPOSITION_ID (and optionally STUDIO_ORIGIN, CONCURRENT).",
  );
  process.exit(1);
}

const body = JSON.stringify({
  composition: {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        kind: "primitive",
        definitionKey: "primitive.box",
        parentId: null,
        childIds: [],
      },
    },
    styleBindings: {},
  },
  ifMatchUpdatedAt: null,
  intent: "draft",
});

async function one(i) {
  const res = await fetch(
    `${origin}/api/studio/compositions/${encodeURIComponent(compositionId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
      },
      body,
    },
  );
  return { i, status: res.status };
}

const batch = Array.from({ length: concurrent }, (_, i) => one(i));
const results = await Promise.all(batch);
const bad = results.filter((r) => r.status !== 200);
console.log(
  JSON.stringify({
    concurrent,
    ok: bad.length === 0,
    bad,
    sample: results.slice(0, 3),
  }),
);
