"use client";

import { useAuth } from "@payloadcms/ui";
import Link from "next/link";

/** Sidebar link to Studio (templates, components, design system) — admin + designer only. */
export default function StudioNavLink() {
  const { user } = useAuth();
  const role =
    user && typeof user === "object" && "role" in user
      ? String((user as { role?: unknown }).role)
      : "";
  if (role !== "admin" && role !== "designer") {
    return null;
  }
  return (
    <Link className="nav__link" href="/studio">
      Studio
    </Link>
  );
}
