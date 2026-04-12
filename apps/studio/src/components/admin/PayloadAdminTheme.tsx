/**
 * Registered in `payload.config.ts` → `admin.components.providers`.
 * Pulls the Tailwind + shadcn theme (`globals.css`) into the admin React tree so utilities
 * and CSS variables apply to custom admin fields (same stylesheet as the app shell layout).
 */
import "@/app/globals.css";
import type { ReactNode } from "react";

export default function PayloadAdminTheme({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
