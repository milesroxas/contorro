"use client";

import { type ReactNode, createContext, useContext } from "react";

const CollectionItemDocContext = createContext<Record<string, unknown> | null>(
  null,
);

export function CollectionItemDocProvider({
  doc,
  children,
}: {
  doc: Record<string, unknown>;
  children: ReactNode;
}) {
  return (
    <CollectionItemDocContext.Provider value={doc}>
      {children}
    </CollectionItemDocContext.Provider>
  );
}

export function useOptionalCollectionItemDoc(): Record<string, unknown> | null {
  return useContext(CollectionItemDocContext);
}
