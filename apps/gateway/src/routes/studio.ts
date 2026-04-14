import { designerSessionMiddleware } from "../middleware/designer-session.js";
import { createCompositionMutationRouter } from "./composition-mutations.js";

/** Deprecated: composition writes are handled by CMS `/api/studio` (Payload). */
export const studioRouter = createCompositionMutationRouter(
  designerSessionMiddleware,
);
