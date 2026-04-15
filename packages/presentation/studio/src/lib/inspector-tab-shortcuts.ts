/** Right inspector Styles / Settings tabs — digit shortcuts when focus is outside inputs. */
export type StudioInspectorTab = "styles" | "settings";

export function resolveInspectorTabShortcut(
  key: string,
): StudioInspectorTab | undefined {
  if (key === "4") {
    return "styles";
  }
  if (key === "5") {
    return "settings";
  }
  return undefined;
}
