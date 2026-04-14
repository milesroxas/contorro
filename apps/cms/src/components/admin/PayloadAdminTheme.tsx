/**
 * Registered in `payload.config.ts` → `admin.components.providers`.
 * Payload admin CSS is loaded by `(payload)/layout.tsx` (`payload-admin.css` after `@payloadcms/next/css`);
 * Studio loads `studio.css` from `StudioView`.
 */
import type { ReactNode } from "react";

export default function PayloadAdminTheme({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
