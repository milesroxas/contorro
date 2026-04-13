"use client";

import { useTheme } from "@payloadcms/ui";

const OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
] as const;

export default function ThemeModeNavToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div className="mr-2 flex items-center rounded-md bg-muted p-1">
      <div className="flex">
        {OPTIONS.map((option) => {
          const selected = theme === option.value;
          return (
            <button
              className={
                selected
                  ? "h-7 rounded-sm bg-background px-3 text-xs font-medium text-foreground shadow-sm"
                  : "h-7 rounded-sm px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
              }
              key={option.value}
              onClick={() => setTheme(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
