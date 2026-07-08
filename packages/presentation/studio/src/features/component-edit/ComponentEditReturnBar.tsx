"use client";

import { isStudioComponentRowId } from "@repo/domains-composition";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "../../components/ui/button.js";
import {
  STUDIO_RETURN_COMPOSITION_PARAM,
  STUDIO_RETURN_NODE_PARAM,
  studioHrefReturnToPageTemplate,
} from "../../shell/studio-navigation.js";

/**
 * When Component studio is opened from a page template (“Edit component”),
 * primary control to return without losing place.
 */
export function ComponentEditReturnBar({
  currentCompositionId,
}: {
  currentCompositionId: string;
}) {
  const sp = useSearchParams();
  const returnComposition = sp.get(STUDIO_RETURN_COMPOSITION_PARAM);
  const returnNode = sp.get(STUDIO_RETURN_NODE_PARAM);

  if (!isStudioComponentRowId(currentCompositionId)) {
    return null;
  }
  if (
    returnComposition === null ||
    returnComposition === undefined ||
    returnComposition.trim() === ""
  ) {
    return null;
  }

  const backHref = studioHrefReturnToPageTemplate(returnComposition.trim(), {
    selectNodeId: returnNode?.trim() || undefined,
  });

  return (
    <div
      className="flex min-h-0 shrink-0 flex-col items-center justify-center border-b border-border/70 bg-muted/30 px-3 py-3 dark:bg-muted/15"
      data-testid="component-edit-return-bar"
    >
      <Button asChild size="default" variant="secondary">
        <Link href={backHref}>
          <IconArrowLeft aria-hidden className="mr-2 size-3.5" stroke={2} />
          Back to page template
        </Link>
      </Button>
    </div>
  );
}
