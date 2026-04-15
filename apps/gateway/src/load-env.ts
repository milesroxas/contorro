import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const gatewayRoot = path.resolve(dirname, "..");
/** Same file as the CMS app (`apps/cms/.env`); keeps DB + Payload secrets in one place. */
const cmsEnv = path.resolve(gatewayRoot, "../cms/.env");

config({ path: cmsEnv });
