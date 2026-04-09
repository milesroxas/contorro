import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const gatewayRoot = path.resolve(dirname, "..");
const studioEnv = path.resolve(gatewayRoot, "../studio/.env");
const gatewayEnv = path.resolve(gatewayRoot, ".env");

config({ path: studioEnv });
config({ path: gatewayEnv });
