import type { Payload } from "payload";
import type { DesignTokenSet as PayloadDesignTokenSet } from "@/payload-types";

type DesignSystemColorMode = "light" | "dark";

export type DesignSystemRuntime = {
  tokenSet: PayloadDesignTokenSet | null;
  activeColorMode: DesignSystemColorMode;
};

/**
 * Resolves a published token set for the design-system preview: global default, else first published set.
 */
export async function loadPublishedTokenSetForPreview(
  payload: Payload,
): Promise<PayloadDesignTokenSet | null> {
  const runtime = await loadDesignSystemRuntimeForPreview(payload);
  return runtime.tokenSet;
}

export async function loadDesignSystemRuntimeForPreview(
  payload: Payload,
): Promise<DesignSystemRuntime> {
  const global = await payload.findGlobal({
    slug: "design-system-settings",
    depth: 1,
    overrideAccess: true,
  });
  const activeColorMode = global.activeColorMode === "dark" ? "dark" : "light";

  const rel = global.defaultTokenSet;
  if (
    rel &&
    typeof rel === "object" &&
    "tokens" in rel &&
    Array.isArray(rel.tokens)
  ) {
    const doc = rel as PayloadDesignTokenSet;
    if (doc._status === "published" && doc.tokens.length > 0) {
      return {
        tokenSet: doc,
        activeColorMode,
      };
    }
  }

  const found = await payload.find({
    collection: "design-token-sets",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      _status: {
        equals: "published",
      },
    },
  });

  const doc = found.docs[0];
  if (!doc?.tokens?.length) {
    return {
      tokenSet: null,
      activeColorMode,
    };
  }

  return {
    tokenSet: doc as PayloadDesignTokenSet,
    activeColorMode,
  };
}
