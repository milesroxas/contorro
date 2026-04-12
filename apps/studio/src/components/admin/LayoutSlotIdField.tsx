"use client";

import { useField } from "@payloadcms/ui";
import { DEFAULT_LAYOUT_SLOT_ID } from "@repo/domains-composition";
import type { TextFieldClientComponent } from "payload";
import { useEffect } from "react";

import { Label } from "@/components/ui/label";

import { useTemplateLayoutSlots } from "./template-layout-slots-context.js";

const LayoutSlotIdField: TextFieldClientComponent = (props) => {
  const { path, field } = props;
  const {
    value: raw,
    setValue,
    disabled,
  } = useField<string>({
    path,
    potentiallyStalePath: path,
  });

  const slotCtx = useTemplateLayoutSlots();
  const value = typeof raw === "string" ? raw : raw == null ? "" : String(raw);

  useEffect(() => {
    if (slotCtx.status !== "ready") {
      return;
    }
    if (slotCtx.slotIds.length !== 1) {
      return;
    }
    const only = slotCtx.slotIds[0];
    if (value !== only) {
      setValue(only);
    }
  }, [slotCtx, setValue, value]);

  useEffect(() => {
    if (slotCtx.status !== "ready" || slotCtx.slotIds.length <= 1) {
      return;
    }
    const first = slotCtx.slotIds[0];
    if (
      first !== undefined &&
      value !== "" &&
      !slotCtx.slotIds.includes(value)
    ) {
      setValue(first);
    }
  }, [slotCtx, setValue, value]);

  const labelEl = field?.label ? (
    <Label className="text-sm font-medium" htmlFor={path}>
      {String(field.label)}
    </Label>
  ) : null;

  if (slotCtx.status === "loading") {
    return (
      <div className="field-type text">
        {labelEl}
        <p className="text-xs text-muted-foreground">Loading template…</p>
      </div>
    );
  }

  if (slotCtx.status === "idle") {
    return (
      <div className="field-type text">
        {labelEl}
        <input
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          disabled={disabled}
          id={path}
          onChange={(e) => setValue(e.target.value)}
          placeholder={DEFAULT_LAYOUT_SLOT_ID}
          type="text"
          value={value}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Select a page template above to pick slots automatically, or enter a
          slot id if you know it.
        </p>
      </div>
    );
  }

  if (slotCtx.slotIds.length <= 1) {
    return null;
  }

  return (
    <div className="field-type text">
      {labelEl ?? (
        <Label className="text-sm font-medium" htmlFor={path}>
          Layout slot
        </Label>
      )}
      <select
        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        id={path}
        onChange={(e) => setValue(e.target.value)}
        value={
          slotCtx.slotIds.includes(value) ? value : (slotCtx.slotIds[0] ?? "")
        }
      >
        {slotCtx.slotIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      {field?.admin?.description ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {String(field.admin.description)}
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Choose which region of the page template this block fills.
        </p>
      )}
    </div>
  );
};

export default LayoutSlotIdField;
