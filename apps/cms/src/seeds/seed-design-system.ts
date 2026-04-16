import { getPayload } from "payload";

import config from "../payload.config.js";
import { seedDesignSystemTokens } from "./design-system-seed-shared.js";

async function run(): Promise<void> {
  const payload = await getPayload({ config });

  try {
    const { seededScopeKey, tokenSetId } =
      await seedDesignSystemTokens(payload);

    console.log("\n[seed:design-system] Done.\n");
    console.log(`  Token set id:    ${String(tokenSetId)}`);
    console.log(`  Active brand:    ${seededScopeKey}`);
    console.log(
      "  Global:          design-system-settings (default set + light mode)\n",
    );
  } finally {
    await payload.destroy();
  }
}

await run();
