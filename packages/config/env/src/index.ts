import { z } from "zod";

export {
  type GatewayEnv,
  gatewayEnvSchema,
  parseGatewayEnv,
} from "./gateway.js";
export { parseStudioEnv, type StudioEnv, studioEnvSchema } from "./studio.js";

export const rootEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type RootEnv = z.infer<typeof rootEnvSchema>;
