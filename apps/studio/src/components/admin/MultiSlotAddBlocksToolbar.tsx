"use client";

/**
 * Per-slot “Add block” actions for multi–layout-slot templates.
 * Delegates to Payload’s `addFieldRow` (same API as `ArrayField` / `forms/Form`).
 *
 * Import `useWatchForm` / `useDocumentForm` / `useForm` from `@payloadcms/ui` so they bind to the same
 * Form context as `ArrayField` (avoids duplicate-context issues from split import paths).
 */
import { Button, useDocumentForm, useForm, useWatchForm } from "@payloadcms/ui";
import { useCallback, useMemo } from "react";

import type { FormState } from "payload";

import { useTemplateLayoutSlots } from "./template-layout-slots-context.js";

type FormContextApi = ReturnType<typeof useWatchForm>;

function pickFormForRowAdds(
  watch: FormContextApi,
  doc: FormContextApi,
  local: FormContextApi,
): FormContextApi | null {
  for (const c of [watch, doc, local]) {
    if (c && typeof c.addFieldRow === "function") {
      return c;
    }
  }
  return null;
}

function layoutSlotFieldState(slotId: string) {
  return {
    value: slotId,
    initialValue: slotId,
    valid: true,
    passesCondition: true,
  };
}

export function MultiSlotAddBlocksToolbar({
  path,
  schemaPath,
}: {
  path: string;
  schemaPath: string;
}) {
  const slotCtx = useTemplateLayoutSlots();
  const watch = useWatchForm();
  const documentForm = useDocumentForm();
  const localForm = useForm();

  const form = useMemo(
    () => pickFormForRowAdds(watch, documentForm, localForm),
    [watch, documentForm, localForm],
  );

  const addForSlot = useCallback(
    (slotId: string) => {
      if (!form?.addFieldRow) {
        return;
      }
      form.addFieldRow({
        path,
        schemaPath,
        subFieldState: {
          layoutSlotId: layoutSlotFieldState(slotId),
        } as FormState,
      });
    },
    [form, path, schemaPath],
  );

  if (slotCtx.status !== "ready" || slotCtx.slotIds.length <= 1) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="mb-2 text-xs font-medium text-foreground">
        Add a block to a layout region
      </p>
      <div className="flex flex-wrap gap-2">
        {slotCtx.slotIds.map((slotId) => (
          <Button
            buttonStyle="secondary"
            key={slotId}
            onClick={() => addForSlot(slotId)}
            type="button"
          >
            Add to <span className="font-mono">{slotId}</span>
          </Button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        You can still use the main add control on the block list below; set{" "}
        <span className="font-medium">Layout slot</span> on the row if needed.
      </p>
    </div>
  );
}
