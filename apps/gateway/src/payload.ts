import "./load-env.js";
import { parseGatewayEnv } from "@repo/config-env/gateway";
import {
  buildHeadlessConfig,
  createPostgresAdapter,
} from "@repo/infrastructure-payload-config";
import { buildConfig, getPayload } from "payload";
import sharp from "sharp";

const env = parseGatewayEnv(process.env);

const db = createPostgresAdapter({
  connectionString: env.POSTGRES_URL,
});

export const headlessPayloadConfig = buildConfig({
  ...buildHeadlessConfig({ db, secret: env.PAYLOAD_SECRET }),
  sharp,
});

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>;

let cached: PayloadInstance | null = null;

export async function getPayloadInstance(): Promise<PayloadInstance> {
  if (!cached) {
    cached = await getPayload({ config: headlessPayloadConfig });
  }
  return cached;
}
