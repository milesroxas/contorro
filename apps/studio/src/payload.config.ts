import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
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

export default buildConfig({
  ...studioBase,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: ["/components/admin/DesignSystemPreviewCallout"],
    },
  },
  editor: lexicalEditor(),
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  sharp,
  plugins: [],
});
