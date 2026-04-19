"use client";

import { useAuth } from "@payloadcms/ui";
import { useEffect } from "react";

/**
 * Keep designers inside Studio after admin login by redirecting dashboard
 * visits to the Studio route.
 */
export default function DesignerDashboardRedirect() {
  const { user } = useAuth();
  const role =
    user && typeof user === "object" && "role" in user
      ? String((user as { role?: unknown }).role)
      : "";

  useEffect(() => {
    if (role !== "designer") {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    window.location.replace("/studio");
  }, [role]);

  return null;
}
