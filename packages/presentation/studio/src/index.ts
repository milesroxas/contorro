export type { StudioAuthoringClient } from "@repo/contracts-zod";
export { StudioApp } from "./app/StudioApp.js";
export { StudioRoot } from "./components/studio-root.js";
export { StudioCanvas } from "./features/canvas/StudioCanvas.js";
export { DesignSystemEditor } from "./features/design-system/DesignSystemEditor.js";
export {
  createFetchStudioAuthoringClient,
  type FetchStudioAuthoringClientOptions,
  getDefaultStudioAuthoringClient,
} from "./lib/fetch-studio-authoring-client.js";
export { prepareForSave } from "./lib/persist.js";
export type { StudioDashboardProps } from "./shell/StudioDashboard.js";
export { default as StudioDashboard } from "./shell/StudioDashboard.js";
export type { StudioShellProps } from "./shell/StudioShell.js";
export { StudioShell } from "./shell/StudioShell.js";
