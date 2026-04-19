"use client";

import Link from "next/link";
import { Button } from "../components/ui/button.js";
import { cn } from "../lib/cn.js";
import {
  STUDIO_NAV_ITEMS,
  type StudioTopLevelScreen,
} from "./studio-navigation.js";

export function StudioPrimaryNav({
  activeScreen,
  className,
}: {
  activeScreen: StudioTopLevelScreen | null;
  className?: string;
}) {
  return (
    <nav
      aria-label="Studio primary navigation"
      className={cn("flex flex-wrap items-center gap-1", className)}
    >
      {STUDIO_NAV_ITEMS.map(({ id, label, href, Icon }) => {
        const isActive = activeScreen === id;
        return (
          <Button
            asChild
            key={id}
            size="sm"
            variant={isActive ? "secondary" : "ghost"}
          >
            <Link
              aria-current={isActive ? "page" : undefined}
              href={href}
              prefetch={false}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
