"use client";

import type { CompositionNode } from "@repo/contracts-zod";
import { isPrimitivePropValueModified } from "@repo/domains-composition";
import { IconRestore } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { Button } from "../../components/ui/button.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { Label } from "../../components/ui/label.js";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip.js";

export function PropertyControlLabel({
  htmlFor,
  label,
  showModified,
  onReset,
}: {
  htmlFor?: string;
  label: string;
  showModified: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Label
        className="mb-0 flex min-w-0 flex-1 items-center gap-2 text-xs font-medium text-muted-foreground"
        htmlFor={htmlFor}
      >
        <span className="min-w-0 truncate">{label}</span>
        {showModified ? (
          <span
            aria-hidden
            className="inline-flex size-1.5 shrink-0 rounded-full bg-primary"
            title="Changed from default"
          />
        ) : null}
      </Label>
      {showModified && onReset ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Reset to default"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                onReset();
              }}
              type="button"
              variant="ghost"
            >
              <IconRestore className="size-3.5" stroke={1.6} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset to default</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function BorderPropertyRowLabel({
  children,
  showModified,
  onReset,
}: {
  children: string;
  showModified: boolean;
  onReset?: () => void;
}) {
  return (
    <div className="flex min-h-9 items-center gap-1">
      <span className="inline-flex w-[52px] shrink-0 items-center justify-center rounded border border-primary/35 bg-primary/12 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
        {children}
      </span>
      {showModified ? (
        <span
          aria-hidden
          className="inline-flex size-1.5 shrink-0 rounded-full bg-primary"
          title="Changed from default"
        />
      ) : null}
      {showModified && onReset ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Reset to default"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                onReset();
              }}
              type="button"
              variant="ghost"
            >
              <IconRestore className="size-3.5" stroke={1.6} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Reset to default</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}

export function SettingsFieldRow({
  definitionKey,
  propKey,
  propValues,
  onResetProp,
  htmlFor,
  label,
  children,
}: {
  definitionKey: string;
  propKey: string;
  propValues: CompositionNode["propValues"];
  onResetProp: (key: string) => void;
  htmlFor?: string;
  label: string;
  children: ReactNode;
}) {
  const showModified = isPrimitivePropValueModified(
    definitionKey,
    propKey,
    propValues,
  );
  return (
    <div className="min-w-0 space-y-3">
      <PropertyControlLabel
        htmlFor={htmlFor}
        label={label}
        onReset={showModified ? () => onResetProp(propKey) : undefined}
        showModified={showModified}
      />
      <div className="min-w-0 max-w-full">{children}</div>
    </div>
  );
}

export function SettingsCheckboxFieldRow({
  checkboxId,
  checkboxLabel = "Enabled",
  checked,
  definitionKey,
  disabled,
  label,
  onCheckedChange,
  onResetProp,
  propKey,
  propValues,
}: {
  checkboxId: string;
  checkboxLabel?: string;
  checked: boolean;
  definitionKey: string;
  disabled?: boolean;
  label: string;
  onCheckedChange: (next: boolean) => void;
  onResetProp: (key: string) => void;
  propKey: string;
  propValues: CompositionNode["propValues"];
}) {
  return (
    <SettingsFieldRow
      definitionKey={definitionKey}
      htmlFor={checkboxId}
      label={label}
      onResetProp={onResetProp}
      propKey={propKey}
      propValues={propValues}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Checkbox
          checked={checked}
          disabled={disabled}
          id={checkboxId}
          onCheckedChange={(v) => onCheckedChange(v === true)}
        />
        <Label className="min-w-0 text-sm font-normal" htmlFor={checkboxId}>
          {checkboxLabel}
        </Label>
      </div>
    </SettingsFieldRow>
  );
}
