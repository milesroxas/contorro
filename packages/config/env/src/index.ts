import { z } from "zod";

export {
  gatewayEnvSchema,
  parseGatewayEnv,
  type GatewayEnv,
} from "./gateway.js";
export { parseStudioEnv, studioEnvSchema, type StudioEnv } from "./studio.js";

export const rootEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type RootEnv = z.infer<typeof rootEnvSchema>;
