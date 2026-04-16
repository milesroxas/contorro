#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const envFiles = {
  prod: "apps/cms/.env.vercel.production.local",
  production: "apps/cms/.env.vercel.production.local",
  preview: "apps/cms/.env.vercel.preview.local",
};

const seedCmd = [
  "pnpm",
  "--filter",
  "@repo/cms",
  "exec",
  "payload",
  "run",
  "src/seeds/seed-design-system.ts",
];

function runDefault() {
  execFileSync("pnpm", ["run", "build"], { stdio: "inherit", cwd: root });
  execFileSync("pnpm", seedCmd, { stdio: "inherit", cwd: root });
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
    ["exec", "dotenv", "-e", abs, "--", ...seedCmd],
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
    `Unknown seed target "${target}".\nUsage: pnpm seed:design-system [prod|production|preview]\n  (omit the argument to use apps/cms/.env for local Postgres)`,
  );
  process.exit(1);
}
