import type { PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";

function parsePreviewResponse(raw: unknown): PageComposition | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const comp = (raw as { data?: { composition?: unknown } }).data?.composition;
  const parsed = PageCompositionSchema.safeParse(comp);
  return parsed.success ? parsed.data : null;
}

export async function fetchExpandedLibraryComposition(
  componentKey: string,
): Promise<PageComposition | null> {
  try {
    const res = await fetch(
      `/api/studio/library-components/preview?key=${encodeURIComponent(componentKey)}`,
      { credentials: "include" },
    );
    if (!res.ok) {
      return null;
    }
    const json: unknown = await res.json();
    return parsePreviewResponse(json);
  } catch {
    return null;
  }
}
