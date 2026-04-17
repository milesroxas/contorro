import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { parseStudioEnv } from "@repo/config-env/studio";
import {
  buildStudioConfig,
  createPostgresAdapter,
  Users,
} from "@repo/infrastructure-payload-config";
import type { Config } from "payload";
import { buildConfig } from "payload";
import sharp from "sharp";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const env = parseStudioEnv(process.env);

const db = createPostgresAdapter({
  connectionString: env.POSTGRES_URL,
  migrationDir: path.resolve(dirname, "migrations"),
});

const studioBase = buildStudioConfig({
  db,
  secret: env.PAYLOAD_SECRET,
  serverURL: env.SITE_URL,
});

const email =
  env.RESEND_API_KEY !== undefined
    ? resendAdapter({
        apiKey: env.RESEND_API_KEY,
        defaultFromAddress: env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
        defaultFromName: env.RESEND_FROM_NAME ?? "Contorro",
      })
    : undefined;

const collectionsWithStudioAdmin = (studioBase.collections ?? []).map(
  (collection) => {
    if (collection.slug === "page-compositions") {
      return {
        ...collection,
        admin: {
          ...collection.admin,
          components: {
            ...collection.admin?.components,
            edit: {
              ...collection.admin?.components?.edit,
              beforeDocumentControls: [
                "/components/admin/PageCompositionOpenStudio",
              ],
            },
          },
        },
      };
    }
    if (collection.slug === "components") {
      return {
        ...collection,
        admin: {
          ...collection.admin,
          components: {
            ...collection.admin?.components,
            edit: {
              ...collection.admin?.components?.edit,
              beforeDocumentControls: ["/components/admin/ComponentOpenStudio"],
            },
          },
        },
      };
    }
    return collection;
  },
);

export default buildConfig({
  ...studioBase,
  ...(email !== undefined ? { email } : {}),
  folders: {
    browseByFolder: true,
    collectionSpecific: true,
  },
  collections: collectionsWithStudioAdmin,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      providers: ["/components/admin/PayloadAdminTheme"],
      afterNavLinks: ["/components/admin/StudioNavLink"],
      actions: ["/components/admin/ThemeModeNavToggle"],
      beforeDashboard: [
        "/components/admin/DesignSystemPreviewCallout",
        "/components/admin/PageCompositionOpenStudio",
      ],
    },
  },
  editor: lexicalEditor(),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  sharp: sharp as unknown as NonNullable<Config["sharp"]>,
  plugins: [
    vercelBlobStorage({
      collections: {
        media: true,
      },
      token: env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
});
