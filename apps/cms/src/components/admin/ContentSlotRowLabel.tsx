"use client";

import { useRowLabel } from "@payloadcms/ui";

type RowData = { slotId?: string | null };

/** Row title for the outer `contentSlots` array (one row per template layout slot). */
export default function ContentSlotRowLabel() {
  const { data } = useRowLabel<RowData>();
  const sid =
    typeof data?.slotId === "string" && data.slotId.trim() !== ""
      ? data.slotId.trim()
      : "slot";
  return (
    <span>
      Region <span className="font-mono">{sid}</span>
    </span>
  );
}
