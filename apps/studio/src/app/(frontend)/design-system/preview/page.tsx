import Link from "next/link";
import { getPayload } from "payload";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadDesignSystemRuntimeForPreview } from "@/lib/load-published-token-set";
import config from "@/payload.config";
import { compileTokenSet } from "@repo/config-tailwind";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Design token preview",
  description:
    "Compiled @theme output from the published default (or first published) token set.",
};

export default async function DesignSystemPreviewPage() {
  const payloadConfig = await config;
  const payload = await getPayload({ config: payloadConfig });
  const runtime = await loadDesignSystemRuntimeForPreview(payload);
  const doc = runtime.tokenSet;

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl p-8 font-sans">
        <h1 className="mb-4 font-heading text-2xl font-semibold tracking-tight">
          Design token preview
        </h1>
        <p className="mb-6 text-muted-foreground">
          No published token set found. Publish a{" "}
          <strong className="text-foreground">Design Token Set</strong> and
          optionally set{" "}
          <strong className="text-foreground">
            Globals → Design system → Default token set
          </strong>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={payloadConfig.routes.admin}>Admin</a>
          </Button>
        </div>
      </div>
    );
  }

  const tokens = doc.tokens.map((t) => {
    const mode: "light" | "dark" = t.mode === "dark" ? "dark" : "light";
    return {
      key: t.key,
      mode,
      category: t.category,
      resolvedValue: t.resolvedValue,
    };
  });

  const compiled = compileTokenSet({ tokens });
  const primarySurface = tokens.find((t) => t.key === "color.surface.primary");

  return (
    <div
      className={`mx-auto max-w-4xl space-y-8 p-8 font-sans ${runtime.activeColorMode === "dark" ? "dark" : ""}`}
    >
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Design token preview
        </h1>
        <p className="mt-2 text-muted-foreground">
          Source: <strong className="text-foreground">{doc.title}</strong> (
          {doc.scopeKey}) — compiled with{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">
            @repo/config-tailwind
          </code>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Active mode:{" "}
          <strong className="text-foreground">{runtime.activeColorMode}</strong>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={payloadConfig.routes.admin}>Admin</a>
          </Button>
        </div>
      </div>

      <style>{compiled.cssVariables}</style>

      <Card>
        <CardHeader>
          <CardTitle>Sample (CSS variables)</CardTitle>
          <CardDescription>
            If you use a{" "}
            <code className="text-foreground">color.surface.primary</code>{" "}
            token, the swatch uses{" "}
            <code className="text-foreground">
              var(--color-surface-primary)
            </code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {primarySurface ? (
              <div
                className="size-16 rounded-lg border border-border"
                style={{
                  background: "var(--color-surface-primary)",
                }}
                title="color.surface.primary"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No{" "}
                <code className="text-foreground">color.surface.primary</code>{" "}
                token — add one to see the swatch.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compiled @theme block</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-none bg-foreground p-4 text-xs text-background ring-1 ring-border">
            {compiled.cssVariables}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token metadata (resolver)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-none border border-border bg-card p-4 font-mono text-xs text-card-foreground">
            {JSON.stringify(compiled.tokenMetadata, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
