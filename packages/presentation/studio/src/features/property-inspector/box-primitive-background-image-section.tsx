"use client";

import type { CompositionNode } from "@repo/contracts-zod";
import { useId, useState } from "react";

import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { Switch } from "../../components/ui/switch.js";
import { BoxBackgroundImageStyleFields } from "./box-background-image-style-fields.js";
import {
  BOX_BACKGROUND_IMAGE_MEDIA_KEYS,
  ImageSourcePayloadInspectorFields,
} from "./image-source-payload-inspector.js";
import { SettingsFieldRow } from "./property-control-label.js";

export function BoxPrimitiveBackgroundImageSection({
  node,
  patchNodeProps,
  resetNodePropKey,
}: {
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
}) {
  const baseId = useId();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const enabled = node.propValues?.backgroundImageEnabled === true;
  const alt =
    typeof node.propValues?.backgroundImageAlt === "string"
      ? node.propValues.backgroundImageAlt
      : "";

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      <div className="flex items-center justify-between gap-3">
        <Label
          className="text-xs font-medium text-muted-foreground"
          htmlFor={`${baseId}-bg-img-enabled`}
        >
          Background image
        </Label>
        <Switch
          checked={enabled}
          id={`${baseId}-bg-img-enabled`}
          onCheckedChange={(next) => {
            patchNodeProps({
              backgroundImageEnabled: next,
            });
          }}
        />
      </div>
      {enabled ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 bg-muted/15 p-3">
            <p className="mb-3 text-[11px] font-medium text-foreground">
              Image source
            </p>
            <div className="space-y-5">
              <ImageSourcePayloadInspectorFields
                altForUpload={alt}
                altValueKey="backgroundImageAlt"
                baseId={`${baseId}-bg`}
                definitionKey={node.definitionKey}
                keys={BOX_BACKGROUND_IMAGE_MEDIA_KEYS}
                node={node}
                patchNodeProps={patchNodeProps}
                resetNodePropKey={resetNodePropKey}
                setError={setUploadError}
                urlFieldLabel="Background image URL"
              />
              <SettingsFieldRow
                definitionKey={node.definitionKey}
                htmlFor={`${baseId}-bg-alt`}
                label="Alt text"
                onResetProp={resetNodePropKey}
                propKey="backgroundImageAlt"
                propValues={node.propValues}
              >
                <Input
                  id={`${baseId}-bg-alt`}
                  onChange={(e) =>
                    patchNodeProps({ backgroundImageAlt: e.target.value })
                  }
                  type="text"
                  value={alt}
                />
              </SettingsFieldRow>
            </div>
          </div>
          <BoxBackgroundImageStyleFields
            baseId={`${baseId}-style`}
            definitionKey={node.definitionKey}
            node={node}
            patchNodeProps={patchNodeProps}
            resetNodePropKey={resetNodePropKey}
          />
          {uploadError ? (
            <p className="text-sm text-destructive" role="alert">
              {uploadError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
