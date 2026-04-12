"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

export type TemplateLayoutSlotsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; slotIds: string[]; compositionId: number | undefined };

const TemplateLayoutSlotsContext = createContext<TemplateLayoutSlotsState>({
  status: "idle",
});

export function TemplateLayoutSlotsProvider({
  value,
  children,
}: {
  value: TemplateLayoutSlotsState;
  children: ReactNode;
}) {
  return (
    <TemplateLayoutSlotsContext.Provider value={value}>
      {children}
    </TemplateLayoutSlotsContext.Provider>
  );
}

export function useTemplateLayoutSlots(): TemplateLayoutSlotsState {
  return useContext(TemplateLayoutSlotsContext);
}
