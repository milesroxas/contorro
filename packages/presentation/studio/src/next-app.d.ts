/** Minimal typings so `@repo/presentation-studio` typechecks; runtime resolves via the CMS Next.js app. */

declare module "next/link" {
  import type { AnchorHTMLAttributes, ComponentType, ReactNode } from "react";

  export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    prefetch?: boolean;
    children?: ReactNode;
  };

  const Link: ComponentType<LinkProps>;
  export default Link;
}

declare module "next/navigation" {
  export function useRouter(): {
    push(href: string): void;
    refresh(): void;
    replace(href: string): void;
  };

  export function useSearchParams(): {
    get(name: string): string | null;
  };
}
