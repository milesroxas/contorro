import net from "node:net";

/**
 * Fail fast when Postgres is down — homepage and seeds block on DB otherwise
 * and Playwright appears "stuck" on the first navigation.
 */
export default async function globalSetup(): Promise<void> {
  const postgresUrl = process.env.POSTGRES_URL;
  if (!postgresUrl) {
    throw new Error(
      "E2E requires POSTGRES_URL (see apps/cms/.env.example). Copy to .env and run pnpm db:up from repo root.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(postgresUrl.replace(/^postgresql:/, "http:"));
  } catch {
    throw new Error("POSTGRES_URL is not a valid URL");
  }

  const host = parsed.hostname;
  const port = Number(parsed.port || "5432");
  const ms = 5_000;

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.end();
      resolve();
    });
    socket.setTimeout(ms);
    socket.on("timeout", () => {
      socket.destroy();
      reject(
        new Error(
          `Postgres not reachable at ${host}:${port} within ${ms}ms — start the database (e.g. pnpm db:up from repo root).`,
        ),
      );
    });
    socket.on("error", (err: NodeJS.ErrnoException) => {
      reject(
        new Error(
          `Cannot connect to Postgres at ${host}:${port}: ${err.message}`,
        ),
      );
    });
  });
}
