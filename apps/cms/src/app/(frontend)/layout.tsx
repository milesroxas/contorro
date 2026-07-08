import type React from "react";

import { loadFrontendDesignSystemBundle } from "@/lib/load-frontend-design-system-bundle";

import "../globals.css";
import "./styles.css";

export const metadata = {
  description: "Contorro",
  title: "Contorro",
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;
  const { runtime } = await loadFrontendDesignSystemBundle();
  const tokenSetVersion = runtime.tokenSet?.updatedAt ?? "";
  const compiledCssHref = tokenSetVersion
    ? `/api/design-system/compiled-css?v=${encodeURIComponent(tokenSetVersion)}`
    : "/api/design-system/compiled-css";

  return (
    <html
      className={runtime.activeColorMode === "dark" ? "dark" : undefined}
      lang="en"
    >
      {/*
       * Rendered in `<head>` after Next's built stylesheets (globals.css) so the
       * published token variables win the cascade over theme.css defaults.
       */}
      <head>
        <link href={compiledCssHref} rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
