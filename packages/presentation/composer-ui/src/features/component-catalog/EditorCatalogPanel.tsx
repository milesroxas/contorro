"use client";

import { useEffect, useState } from "react";

import {
  type ComposerCatalogItem,
  fetchComponentCatalog,
} from "../../lib/composer-api.js";

export function EditorCatalogPanel() {
  const [items, setItems] = useState<ComposerCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await fetchComponentCatalog();
        setItems(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "catalog load failed");
      }
    })();
  }, []);

  if (error) {
    return (
      <p
        className="text-xs text-destructive"
        data-testid="composer-catalog-error"
      >
        {error}
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted/10 p-3">
      <h3 className="text-xs font-medium text-muted-foreground">
        Approved components
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Definitions marked visible in the catalog appear here. Unpublished
        designer work stays hidden until approved.
      </p>
      <ul
        className="mt-2 max-h-40 list-inside list-disc space-y-1 overflow-auto text-sm"
        data-testid="composer-catalog-list"
      >
        {items.length === 0 ? (
          <li className="text-xs text-muted-foreground">None yet</li>
        ) : (
          items.map((it) => (
            <li key={it.id}>
              <span className="font-medium text-foreground">
                {it.displayName}
              </span>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {it.key}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
