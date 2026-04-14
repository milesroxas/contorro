"use client";

import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  createContext,
  useContext,
  useState,
} from "react";

import { cn } from "../lib/cn.js";

const StudioPortalRootContext = createContext<HTMLElement | null>(null);

export function useStudioPortalRoot(): HTMLElement | null {
  return useContext(StudioPortalRootContext);
}

export function StudioRoot({
  children,
  className,
  ...props
}: Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children: ReactNode;
}) {
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  return (
    <StudioPortalRootContext.Provider value={portalRoot}>
      <div {...props} className={cn("studio-root relative", className)}>
        {children}
        <div
          ref={setPortalRoot}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2147483000] min-h-0 min-w-0 overflow-visible [&>*]:pointer-events-auto"
        />
      </div>
    </StudioPortalRootContext.Provider>
  );
}
