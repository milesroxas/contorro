import { z } from "zod";

/** Studio / Next + Payload — validated at boot (architecture spec §14.3). */
export const studioEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  POSTGRES_URL: z.string().min(1),
  /** Direct (non-pooler) URL for migration tooling only (spec §18.3). */
  POSTGRES_URL_DIRECT: z.string().min(1).optional(),
  PAYLOAD_SECRET: z.string().min(32),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  SITE_URL: z.string().url(),
  PREVIEW_SECRET: z.string().min(32),
});

export type StudioEnv = z.infer<typeof studioEnvSchema>;

export function parseStudioEnv(env: NodeJS.ProcessEnv): StudioEnv {
  return studioEnvSchema.parse({
    NODE_ENV: env.NODE_ENV,
    POSTGRES_URL: env.POSTGRES_URL,
    POSTGRES_URL_DIRECT: env.POSTGRES_URL_DIRECT,
    PAYLOAD_SECRET: env.PAYLOAD_SECRET,
    BLOB_READ_WRITE_TOKEN: env.BLOB_READ_WRITE_TOKEN,
    SITE_URL: env.SITE_URL,
    PREVIEW_SECRET: env.PREVIEW_SECRET,
  });
}
