import type { Config } from "payload";
import { type BaseConfigArgs, buildBaseConfig } from "./base-config.js";

export type StudioConfigArgs = BaseConfigArgs & {
  serverURL?: string;
};

/** Extends base with admin-enabled defaults; apps add Lexical, import map, and UI wiring. */
export function buildStudioConfig(args: StudioConfigArgs): Config {
  const base = buildBaseConfig(args);
  return {
    ...base,
    serverURL: args.serverURL,
  };
}
