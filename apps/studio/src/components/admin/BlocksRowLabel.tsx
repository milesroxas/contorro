"use client";

import { useRowLabel } from "@payloadcms/ui";

import { useTemplateLayoutSlots } from "./template-layout-slots-context.js";

type RowData = {
  layoutSlotId?: string | null;
  componentDefinition?:
    | number
    | { id?: number; displayName?: string }
    | null
    | undefined;
};

/** Array row title: prefers populated `displayName`, otherwise the definition id. */
export default function BlocksRowLabel() {
  const { data, rowNumber } = useRowLabel<RowData>();
  const slotCtx = useTemplateLayoutSlots();
  const rel = data?.componentDefinition;
  const label =
    typeof rel === "object" &&
    rel !== null &&
    typeof rel.displayName === "string" &&
    rel.displayName.length > 0
      ? rel.displayName
      : typeof rel === "number"
        ? `Block #${rel}`
        : typeof rel === "object" && rel !== null && typeof rel.id === "number"
          ? `Block #${rel.id}`
          : `Block ${String(rowNumber ?? "").padStart(2, "0")}`;

  const sid =
    typeof data?.layoutSlotId === "string" && data.layoutSlotId.trim() !== ""
      ? data.layoutSlotId.trim()
      : "main";
  const showSlot = slotCtx.status === "ready" && slotCtx.slotIds.length > 1;

  return (
    <span>
      {label}
      {showSlot ? (
        <span className="text-muted-foreground">
          {" "}
          · slot <span className="font-mono">{sid}</span>
        </span>
      ) : null}
    </span>
  );
}
