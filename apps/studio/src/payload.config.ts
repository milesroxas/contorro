import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { parseStudioEnv } from "@repo/config-env/studio";
import {
  Users,
  buildStudioConfig,
  createPostgresAdapter,
} from "@repo/infrastructure-payload-config";
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
                "/components/admin/PageCompositionOpenBuilder",
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
              beforeDocumentControls: [
                "/components/admin/ComponentOpenBuilder",
              ],
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
      afterNavLinks: ["/components/admin/BuilderNavLink"],
      actions: ["/components/admin/ThemeModeNavToggle"],
      beforeDashboard: [
        "/components/admin/DesignSystemPreviewCallout",
        "/components/admin/PageCompositionOpenBuilder",
      ],
      views: {
        builder: {
          Component: "/components/admin/BuilderView",
          path: "/builder",
        },
      },
    },
  },
  editor: lexicalEditor(),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  sharp,
  plugins: [],
});
