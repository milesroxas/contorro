import { z } from "zod";

/** Hono gateway process — shared DB with studio (architecture spec §8.1). */
export const gatewayEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  POSTGRES_URL: z.string().min(1),
  PAYLOAD_SECRET: z.string().min(32),
  PORT: z.coerce.number().optional(),
});

export type GatewayEnv = z.infer<typeof gatewayEnvSchema>;

export function parseGatewayEnv(env: NodeJS.ProcessEnv): GatewayEnv {
  return gatewayEnvSchema.parse({
    NODE_ENV: env.NODE_ENV,
    POSTGRES_URL: env.POSTGRES_URL,
    PAYLOAD_SECRET: env.PAYLOAD_SECRET,
    PORT: env.PORT,
  });
}
