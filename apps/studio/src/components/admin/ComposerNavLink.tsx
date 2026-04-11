"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import Link from "next/link";
import { formatAdminURL } from "payload/shared";

/**
 * Sidebar link to the page composer (§5.2 — compose pages: admin, designer, contentEditor).
 */
export default function ComposerNavLink() {
  const { user } = useAuth();
  const { config } = useConfig();
  const role =
    user && typeof user === "object" && "role" in user
      ? String((user as { role?: unknown }).role)
      : "";
  if (role !== "admin" && role !== "designer" && role !== "contentEditor") {
    return null;
  }
  const adminRoute = config.routes?.admin ?? "/admin";
  const href = formatAdminURL({
    adminRoute,
    path: "/composer",
    relative: true,
  });
  return (
    <Link className="nav__link" href={href}>
      Composer
    </Link>
  );
}
