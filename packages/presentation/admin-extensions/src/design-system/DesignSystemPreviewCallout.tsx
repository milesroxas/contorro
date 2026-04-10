import type React from "react";

/** Dashboard callout linking to the studio page that shows compiled token @theme output. */
export default function DesignSystemPreviewCallout(): React.ReactElement {
  return (
    <div
      style={{
        marginBottom: "1.5rem",
        padding: "1rem 1.25rem",
        borderRadius: "4px",
        border: "1px solid var(--theme-elevation-150)",
        background: "var(--theme-elevation-50)",
      }}
    >
      <a
        href="/design-system/preview"
        rel="noopener noreferrer"
        style={{ color: "var(--theme-text)", fontWeight: 600 }}
        target="_blank"
      >
        Design token preview
      </a>
      <p
        style={{
          margin: "0.5rem 0 0",
          fontSize: "0.875rem",
          color: "var(--theme-elevation-800)",
        }}
      >
        Open the compiled <code>@theme</code> block for the published default
        (or first published) token set.
      </p>
    </div>
  );
}
