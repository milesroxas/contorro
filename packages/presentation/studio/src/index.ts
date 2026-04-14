export { StudioApp } from "./app/StudioApp.js";
export { DesignSystemEditor } from "./features/design-system/DesignSystemEditor.js";
export {
  createFetchStudioAuthoringClient,
  getDefaultStudioAuthoringClient,
  type FetchStudioAuthoringClientOptions,
} from "./lib/fetch-studio-authoring-client.js";
export { prepareForSave } from "./lib/persist.js";
export type { StudioAuthoringClient } from "@repo/contracts-zod";
