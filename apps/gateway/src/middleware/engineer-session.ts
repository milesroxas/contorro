import { sessionByRole } from "./session-by-role.js";

/** Contract export/import — §5.2 engineer role plus admin. */
export const engineerSessionMiddleware = sessionByRole(["admin", "engineer"]);
