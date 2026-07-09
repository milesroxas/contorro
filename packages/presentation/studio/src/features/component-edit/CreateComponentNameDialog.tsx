"use client";

import { useEffect, useId, useState } from "react";

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
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";

const DEFAULT_COMPONENT_NAME = "New component";

/**
 * Names a new library component extracted from a layer (replaces the old
 * `window.prompt` flow). Controlled by the presence of `nodeId`.
 */
export function CreateComponentNameDialog({
  nodeId,
  onCancel,
  onSubmit,
}: {
  /** Node being extracted; `null` closes the dialog. */
  nodeId: string | null;
  onCancel: () => void;
  onSubmit: (nodeId: string, name: string) => void;
}) {
  const inputId = useId();
  const [name, setName] = useState(DEFAULT_COMPONENT_NAME);
  const open = nodeId !== null;

  useEffect(() => {
    if (open) {
      setName(DEFAULT_COMPONENT_NAME);
    }
  }, [open]);

  const trimmed = name.trim();

  const submit = () => {
    if (nodeId === null || trimmed === "") {
      return;
    }
    onSubmit(nodeId, trimmed);
  };

  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (!next) {
          onCancel();
        }
      }}
      open={open}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Create component</AlertDialogTitle>
          <AlertDialogDescription>
            Saves this layer to the component library and replaces it with a
            reusable reference.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={inputId}>Component name</Label>
          <Input
            autoFocus
            data-testid="create-component-name"
            id={inputId}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            type="text"
            value={name}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            data-testid="create-component-confirm"
            disabled={trimmed === ""}
            onClick={submit}
            type="button"
          >
            Create component
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
