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
  /** When set, Payload uses the Resend adapter (`payload.config` `email`). */
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  RESEND_FROM_NAME: z.string().min(1).optional(),
});

export type StudioEnv = z.infer<typeof studioEnvSchema>;

/** Prefer SITE_URL; on Vercel builds, VERCEL_URL is set when SITE_URL is not configured. */
function resolveSiteUrl(env: NodeJS.ProcessEnv): string | undefined {
  if (env.SITE_URL) return env.SITE_URL;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return undefined;
}

export function parseStudioEnv(env: NodeJS.ProcessEnv): StudioEnv {
  return studioEnvSchema.parse({
    NODE_ENV: env.NODE_ENV,
    POSTGRES_URL: env.POSTGRES_URL,
    POSTGRES_URL_DIRECT: env.POSTGRES_URL_DIRECT,
    PAYLOAD_SECRET: env.PAYLOAD_SECRET,
    BLOB_READ_WRITE_TOKEN: env.BLOB_READ_WRITE_TOKEN,
    SITE_URL: resolveSiteUrl(env),
    PREVIEW_SECRET: env.PREVIEW_SECRET,
    RESEND_API_KEY: env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: env.RESEND_FROM_NAME,
  });
}
