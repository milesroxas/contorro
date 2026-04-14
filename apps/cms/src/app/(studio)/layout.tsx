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
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
