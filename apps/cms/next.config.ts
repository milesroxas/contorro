import path from "node:path";
import { fileURLToPath } from "node:url";
import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);
/** pnpm workspace root — required for Turbopack in this monorepo (Next `turbopack.root`). */
const workspaceRoot = path.resolve(dirname, "../..");

const nextConfig: NextConfig = {
  transpilePackages: [
    "@repo/gateway",
    "@repo/application-studio",
    "@repo/application-publish-flow",
    "@repo/config-env",
    "@repo/config-tailwind",
    "@repo/contracts-json-schema",
    "@repo/contracts-zod",
    "@repo/domains-composition",
    "@repo/domains-design-system",
    "@repo/domains-publishing",
    "@repo/domains-runtime-catalog",
    "@repo/infrastructure-blob-storage",
    "@repo/infrastructure-event-bus",
    "@repo/infrastructure-payload-config",
    "@repo/infrastructure-telemetry",
    "@repo/kernel",
    "@repo/presentation-admin-extensions",
    "@repo/presentation-studio",
    "@repo/presentation-preview-ui",
    "@repo/presentation-shared",
    "@repo/runtime-code-components",
    "@repo/runtime-primitives",
    "@repo/runtime-renderer",
  ],
  images: {
    localPatterns: [
      {
        pathname: "/api/media/file/**",
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };

    return webpackConfig;
  },
  turbopack: {
    root: workspaceRoot,
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
