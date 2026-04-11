"use client";

import { Button, useAuth, useConfig, useDocumentInfo } from "@payloadcms/ui";
import { formatAdminURL } from "payload/shared";

/**
 * Opens the visual builder for the current page composition (Payload admin only;
 * designer + admin roles). Resolves the admin base path from config so navigation
 * stays inside the admin shell (not the public site).
 */
export default function PageCompositionOpenBuilder() {
  const { user } = useAuth();
  const { config } = useConfig();
  const role =
    user && typeof user === "object" && "role" in user
      ? String((user as { role?: unknown }).role)
      : "";
  const { id } = useDocumentInfo();

  if (role !== "admin" && role !== "designer") {
    return null;
  }
  if (!id) {
    return null;
  }

  const adminRoute = config.routes?.admin ?? "/admin";
  const url = formatAdminURL({
    adminRoute,
    path: `/builder?composition=${encodeURIComponent(String(id))}`,
    relative: true,
  });

  return (
    <Button
      buttonId="open-visual-builder"
      buttonStyle="secondary"
      el="link"
      margin={false}
      size="small"
      url={url}
    >
      Open builder
    </Button>
  );
}
