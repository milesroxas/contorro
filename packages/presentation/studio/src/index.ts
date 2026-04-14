export { StudioApp } from "./app/StudioApp.js";
export { StudioRoot } from "./components/studio-root.js";
export { StudioCanvas } from "./features/canvas/StudioCanvas.js";
export { DesignSystemEditor } from "./features/design-system/DesignSystemEditor.js";
export {
  createFetchStudioAuthoringClient,
  getDefaultStudioAuthoringClient,
  type FetchStudioAuthoringClientOptions,
} from "./lib/fetch-studio-authoring-client.js";
export { prepareForSave } from "./lib/persist.js";
export { StudioShell } from "./shell/StudioShell.js";
export type { StudioShellProps } from "./shell/StudioShell.js";
export { default as StudioDashboard } from "./shell/StudioDashboard.js";
export type { StudioDashboardProps } from "./shell/StudioDashboard.js";
export type { StudioAuthoringClient } from "@repo/contracts-zod";
