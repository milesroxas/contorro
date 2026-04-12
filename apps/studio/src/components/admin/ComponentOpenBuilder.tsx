"use client";

import { Button, useAuth, useConfig, useDocumentInfo } from "@payloadcms/ui";
import { builderRowIdForComponent } from "@repo/infrastructure-payload-config/builder-row-id";
import { formatAdminURL } from "payload/shared";

/**
 * Opens the visual builder for this component (composition id is namespaced so it does not
 * collide with page template ids in the builder DB).
 */
export default function ComponentOpenBuilder() {
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
  const compositionParam = builderRowIdForComponent(String(id));
  const url = formatAdminURL({
    adminRoute,
    path: `/builder?composition=${encodeURIComponent(compositionParam)}`,
    relative: true,
  });

  return (
    <Button
      buttonId="open-visual-builder-component"
      buttonStyle="secondary"
      el="link"
      margin={false}
      size="small"
      url={url}
    >
      Open in builder
    </Button>
  );
}
