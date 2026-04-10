import { InProcessEventBus } from "./in-process-event-bus.js";

/** Shared in-process bus for studio + gateway in a single Node process (spec §Phase 1). */
export const defaultInProcessEventBus = new InProcessEventBus();
