"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog.js";
import { Button } from "../../components/ui/button.js";

function shouldInterceptAnchorClick(
  anchor: HTMLAnchorElement,
  event: MouseEvent,
): boolean {
  if (event.defaultPrevented) {
    return false;
  }
  if (event.button !== 0) {
    return false;
  }
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }
  const raw = anchor.getAttribute("href");
  if (raw === null) {
    return false;
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith("#")) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("javascript:")
  ) {
    return false;
  }
  return true;
}

function toAppRouterHref(absoluteUrl: string): string {
  const next = new URL(absoluteUrl);
  return `${next.pathname}${next.search}${next.hash}`;
}

export function StudioUnsavedChangesGuard({
  dirty,
  saving,
  trySaveDraft,
}: {
  dirty: boolean;
  saving: boolean;
  trySaveDraft: () => Promise<boolean>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const navigateToPending = useCallback(() => {
    if (pendingHref === null) {
      return;
    }
    const url = new URL(pendingHref, window.location.href);
    if (url.origin === window.location.origin) {
      router.push(toAppRouterHref(url.href));
    } else {
      window.location.assign(url.href);
    }
  }, [pendingHref, router]);

  useEffect(() => {
    if (!dirty || typeof window === "undefined") {
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty]);

  useEffect(() => {
    if (!dirty || typeof document === "undefined") {
      return;
    }
    const onDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      const anchor = event.target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (!shouldInterceptAnchorClick(anchor, event)) {
        return;
      }
      let absolute: string;
      try {
        absolute = new URL(anchor.href, window.location.href).href;
      } catch {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(absolute);
      setOpen(true);
    };
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [dirty]);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setPendingHref(null);
    }
  };

  const onDiscard = () => {
    navigateToPending();
  };

  const onSaveAndLeave = async () => {
    if (pendingHref === null) {
      return;
    }
    const ok = await trySaveDraft();
    if (!ok) {
      return;
    }
    navigateToPending();
  };

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this canvas?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Save and leave to keep your edits, or
            discard changes to leave without saving.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving} type="button">
            Stay on page
          </AlertDialogCancel>
          <Button
            disabled={saving}
            onClick={onDiscard}
            type="button"
            variant="destructive"
          >
            Discard changes
          </Button>
          <Button
            disabled={saving}
            onClick={() => void onSaveAndLeave()}
            type="button"
          >
            Save and leave
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
