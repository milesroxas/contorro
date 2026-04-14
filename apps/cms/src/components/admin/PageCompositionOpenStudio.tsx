"use client";

import { Button, useAuth, useDocumentInfo } from "@payloadcms/ui";

/**
 * Opens Studio for the current page composition (Payload admin only;
 * designer + admin roles).
 */
export default function PageCompositionOpenStudio() {
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

  const url = `/studio?composition=${encodeURIComponent(String(id))}`;

  return (
    <Button
      buttonId="open-visual-studio"
      buttonStyle="secondary"
      el="link"
      margin={false}
      size="small"
      url={url}
    >
      Open Studio
    </Button>
  );
}
