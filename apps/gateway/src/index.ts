import "./load-env.js";
import { serve } from "@hono/node-server";
import { parseGatewayEnv } from "@repo/config-env/gateway";
import { gatewayApp } from "./app.js";

const env = parseGatewayEnv(process.env);
/** Default avoids Next.js dev fallback (3001) when root `pnpm dev` runs both apps. */
const port = env.PORT ?? 3002;

serve({ fetch: gatewayApp.fetch, port });
