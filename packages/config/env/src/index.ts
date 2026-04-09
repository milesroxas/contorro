import { z } from "zod";

export const rootEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

export type RootEnv = z.infer<typeof rootEnvSchema>;
