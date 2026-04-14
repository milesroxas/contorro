import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  hubChoiceTileClass,
  hubTileDescriptionClass,
  hubTileIconWrapClass,
  hubTileTitleClass,
} from "./hub-styles";

function HubTileContent({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <span className="group/tile flex w-full gap-4 text-left md:gap-5">
      <span className={hubTileIconWrapClass}>{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2">
        <span className={hubTileTitleClass}>{title}</span>
        {description ? (
          <span className={hubTileDescriptionClass}>{description}</span>
        ) : null}
      </span>
    </span>
  );
}

type HubChoiceButtonProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
  onClick: () => void;
  disabled?: boolean;
};

export function HubChoiceButton({
  icon,
  title,
  description,
  className,
  onClick,
  disabled,
}: HubChoiceButtonProps) {
  return (
    <button
      type="button"
      className={cn(hubChoiceTileClass, "group/tile", className)}
      data-slot="hub-choice-tile"
      disabled={disabled}
      onClick={onClick}
    >
      <HubTileContent description={description} icon={icon} title={title} />
    </button>
  );
}

type HubChoiceLinkProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
  href: string;
};

export function HubChoiceLink({
  icon,
  title,
  description,
  className,
  href,
}: HubChoiceLinkProps) {
  return (
    <Link
      className={cn(hubChoiceTileClass, "group/tile", className)}
      data-slot="hub-choice-tile"
      href={href}
      prefetch={false}
    >
      <HubTileContent description={description} icon={icon} title={title} />
    </Link>
  );
}
