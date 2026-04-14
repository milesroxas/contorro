"use client";

import { Button, useAuth, useDocumentInfo } from "@payloadcms/ui";
import { studioRowIdForComponent } from "@repo/domains-composition";

/**
 * Opens Studio for this component (composition id is namespaced so it does not
 * collide with page template ids in the Studio composition DB).
 */
export default function ComponentOpenStudio() {
  const { user } = useAuth();
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

  const compositionParam = studioRowIdForComponent(String(id));
  const url = `/studio?composition=${encodeURIComponent(compositionParam)}`;

  return (
    <Button
      buttonId="open-visual-studio-component"
      buttonStyle="secondary"
      el="link"
      margin={false}
      size="small"
      url={url}
    >
      Open in Studio
    </Button>
  );
}
