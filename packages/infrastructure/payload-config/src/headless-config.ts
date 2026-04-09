import type { Config } from "payload";
import { type BaseConfigArgs, buildBaseConfig } from "./base-config.js";

/** Headless variant for gateway: no admin surface, no UI-only plugin wiring (composed by `apps/gateway`). */
export function buildHeadlessConfig(args: BaseConfigArgs): Config {
  return buildBaseConfig(args);
}
