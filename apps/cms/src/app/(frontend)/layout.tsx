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

  return (
    <html
      className={runtime.activeColorMode === "dark" ? "dark" : undefined}
      lang="en"
    >
      <head>
        <link href="/api/design-system/compiled-css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
