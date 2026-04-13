import { designerSessionMiddleware } from "../middleware/designer-session.js";
import { createCompositionMutationRouter } from "./composition-mutations.js";

/** Deprecated: composition writes are handled by studio `/api/builder` (Payload). */
export const builderRouter = createCompositionMutationRouter(
  designerSessionMiddleware,
);
