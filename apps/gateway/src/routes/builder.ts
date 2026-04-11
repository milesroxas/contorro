import { designerSessionMiddleware } from "../middleware/designer-session.js";
import { createCompositionMutationRouter } from "./composition-mutations.js";

export const builderRouter = createCompositionMutationRouter(
  designerSessionMiddleware,
);
