import type { Config } from "payload";
import { collections } from "./collections/index.js";
import type { DatabaseAdapter } from "./db.js";
import { globals } from "./globals/index.js";

export type BaseConfigArgs = {
  db: DatabaseAdapter;
  secret: string;
};

export function buildBaseConfig(args: BaseConfigArgs): Config {
  return {
    db: args.db,
    secret: args.secret,
    collections,
    globals,
  };
}
