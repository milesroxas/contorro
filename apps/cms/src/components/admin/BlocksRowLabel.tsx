"use client";

import { useRowLabel } from "@payloadcms/ui";

type RowData = {
  componentDefinition?:
    | number
    | { id?: number; displayName?: string }
    | null
    | undefined;
};

/** Array row title: prefers populated `displayName`, otherwise the definition id. */
export default function BlocksRowLabel() {
  const { data, rowNumber } = useRowLabel<RowData>();
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

  return <span>{label}</span>;
}
