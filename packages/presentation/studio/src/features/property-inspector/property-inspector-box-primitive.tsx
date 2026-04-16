"use client";

import type { CompositionNode } from "@repo/contracts-zod";
import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import { SettingsFieldRow } from "./property-control-label.js";
import { boxSupportsDivSectionElementSetting } from "./property-inspector-node-meta.js";

export function BoxPrimitiveInspector({
  node,
  patchNodeProps,
  resetNodePropKey,
}: {
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
}) {
  const baseId = useId();
  if (node.definitionKey !== "primitive.box") {
    return null;
  }
  if (!boxSupportsDivSectionElementSetting(node.propValues?.tag)) {
    return null;
  }
  const rawTag = node.propValues?.tag;
  const element = rawTag === "section" ? "section" : "div";

  return (
    <div className="space-y-3 border-t border-border/60 pt-4">
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-box-element`}
        label="Element"
        onResetProp={resetNodePropKey}
        propKey="tag"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) =>
            patchNodeProps({ tag: value === "section" ? "section" : "div" })
          }
          value={element}
        >
          <SelectTrigger id={`${baseId}-box-element`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="div">div</SelectItem>
            <SelectItem value="section">section</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
    </div>
  );
}
