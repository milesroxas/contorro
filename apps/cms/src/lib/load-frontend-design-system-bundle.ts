import config from "@/payload.config";
import {
  type CompiledTokenOutput,
  compileTokenSet,
} from "@repo/config-tailwind";
import { getPayload } from "payload";
import { cache } from "react";

import type { DesignSystemRuntime } from "./load-published-token-set";
import { loadDesignSystemRuntimeForPreview } from "./load-published-token-set";

export type FrontendDesignSystemBundle = {
  runtime: DesignSystemRuntime;
  compiled: CompiledTokenOutput;
};

/**
 * One token compile per request — shared by `(frontend)/layout` (head stylesheet) and pages.
 */
export const loadFrontendDesignSystemBundle = cache(
  async (): Promise<FrontendDesignSystemBundle> => {
    const payloadConfig = await config;
    const payload = await getPayload({ config: payloadConfig });
    const runtime = await loadDesignSystemRuntimeForPreview(payload);
    const tokenDoc = runtime.tokenSet;
    const tokens = tokenDoc
      ? tokenDoc.tokens.map((t) => {
          const mode: "light" | "dark" = t.mode === "dark" ? "dark" : "light";
          return {
            key: t.key,
            mode,
            category: t.category,
            resolvedValue: t.resolvedValue,
          };
        })
      : [];
    const compiled = compileTokenSet({ tokens });
    return { runtime, compiled };
  },
);
