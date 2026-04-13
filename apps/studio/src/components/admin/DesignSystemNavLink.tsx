"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { formatAdminURL } from "payload/shared";

/** Sidebar link to visual design system editor (designer + admin only). */
export default function DesignSystemNavLink() {
  const { user } = useAuth();
  const { config } = useConfig();
  const role =
    user && typeof user === "object" && "role" in user
      ? String((user as { role?: unknown }).role)
      : "";

  if (role !== "admin" && role !== "designer") {
    return null;
  }

  const adminRoute = config.routes?.admin ?? "/admin";
  const href = formatAdminURL({
    adminRoute,
    path: "/design-system-builder",
    relative: true,
  });

  return (
    <Link className="nav__link" href={href}>
      Design system
    </Link>
  );
}
