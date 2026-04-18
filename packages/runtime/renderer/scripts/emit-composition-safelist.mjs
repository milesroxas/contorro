import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "../../../..");
const { listCompositionUtilitySafelistClasses } = await import(
  join(scriptDir, "../dist/index.js")
);

const classes = listCompositionUtilitySafelistClasses().join(" ");
const header = `/* Generated: pnpm --filter @repo/runtime-renderer build && node packages/runtime/renderer/scripts/emit-composition-safelist.mjs */

`;
const line = `@source inline("${classes.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}");\n`;

writeFileSync(
  join(
    repoRoot,
    "apps/cms/src/app/_tailwind-safelist-composition-generated.css",
  ),
  `${header}${line}`,
);
