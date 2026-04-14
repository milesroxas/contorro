#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const envFiles = {
  prod: "apps/studio/.env.vercel.production.local",
  production: "apps/studio/.env.vercel.production.local",
  preview: "apps/studio/.env.vercel.preview.local",
};

function runDefault() {
  execFileSync("pnpm", ["run", "build"], { stdio: "inherit", cwd: root });
  execFileSync(
    "pnpm",
    ["--filter", "@repo/cms", "exec", "payload", "migrate"],
    { stdio: "inherit", cwd: root },
  );
}

function runWithEnvFile(relPath) {
  const abs = path.join(root, relPath);
  if (!fs.existsSync(abs)) {
    console.error(
      `Missing env file: ${relPath}\nRun: pnpm vercel:pull:prod   (or vercel:pull:preview) from the repo root after linking the project (vercel link).`,
    );
    process.exit(1);
  }
  const dotenvArgs = [
    "exec",
    "dotenv",
    "-e",
    abs,
    "--",
    "pnpm",
    "run",
    "build",
  ];
  execFileSync("pnpm", dotenvArgs, { stdio: "inherit", cwd: root });
  execFileSync(
    "pnpm",
    [
      "exec",
      "dotenv",
      "-e",
      abs,
      "--",
      "pnpm",
      "--filter",
      "@repo/cms",
      "exec",
      "payload",
      "migrate",
    ],
    { stdio: "inherit", cwd: root },
  );
}

const target = process.argv[2];

if (!target) {
  runDefault();
} else if (envFiles[target]) {
  runWithEnvFile(envFiles[target]);
} else {
  console.error(
    `Unknown migrate target "${target}".\nUsage: pnpm migrate [prod|production|preview]\n  (omit the argument to use apps/studio/.env for local Postgres)`,
  );
  process.exit(1);
}
