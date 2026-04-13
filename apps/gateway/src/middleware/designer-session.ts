import { sessionByRole } from "./session-by-role.js";

/** Builder surface: admin + designer only (architecture spec §5.2 — author components). */
export const designerSessionMiddleware = sessionByRole(["admin", "designer"]);
