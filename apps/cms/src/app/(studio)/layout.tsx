import type { Metadata } from "next";
import type React from "react";

import "@/app/studio.css";

export const metadata: Metadata = {
  description: "Contorro Studio",
  title: "Studio",
};

export default function StudioGroupLayout(props: {
  children: React.ReactNode;
}) {
  const { children } = props;

  return (
    <html className="h-full" lang="en" suppressHydrationWarning>
      <head>
        <script src="/studio-document-theme-bootstrap.js" />
      </head>
      <body className="min-h-dvh antialiased lg:h-dvh lg:overflow-hidden">
        {children}
      </body>
    </html>
  );
}
