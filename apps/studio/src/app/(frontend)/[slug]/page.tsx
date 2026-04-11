import { compileTokenSet } from "@repo/config-tailwind";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import { loadPublishedTokenSetForPreview } from "@/lib/load-published-token-set";
import config from "@/payload.config";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { isEnabled } = await draftMode();
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const found = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    depth: 0,
    limit: 1,
    draft: isEnabled,
    overrideAccess: isEnabled,
  });
  const page = found.docs[0];
  const title =
    page && typeof page === "object" && "title" in page
      ? String((page as { title?: unknown }).title)
      : slug;
  return { title };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const { isEnabled } = await draftMode();

  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });

  const found = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    depth: 1,
    limit: 1,
    draft: isEnabled,
    overrideAccess: isEnabled,
  });

  const page = found.docs[0];
  if (!page) {
    notFound();
  }

  const rel = page.pageComposition;
  const compositionDoc =
    typeof rel === "object" && rel !== null && "composition" in rel
      ? rel
      : null;
  if (!compositionDoc || compositionDoc.composition === undefined) {
    notFound();
  }

  const parsed = PageCompositionSchema.safeParse(compositionDoc.composition);
  if (!parsed.success) {
    notFound();
  }

  const tokenDoc = await loadPublishedTokenSetForPreview(payload);
  const tokens = tokenDoc
    ? tokenDoc.tokens.map((t) => ({
        key: t.key,
        category: t.category,
        resolvedValue: t.resolvedValue,
      }))
    : [];

  const compiled = compileTokenSet({ tokens });

  const tree = renderComposition(
    parsed.data,
    defaultPrimitiveRegistry,
    compiled.tokenMetadata,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{compiled.cssVariables}</style>
      <article className="mx-auto max-w-5xl p-6">{tree}</article>
    </div>
  );
}
