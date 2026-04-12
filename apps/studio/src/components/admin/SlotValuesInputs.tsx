"use client";

import type { SlotDefinition } from "@repo/contracts-zod";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  slots: SlotDefinition[];
  current: Record<string, unknown>;
  patchSlot: (name: string, next: unknown) => void;
  /** Form processing / initializing — matches Payload field disabled state. */
  disabled?: boolean;
};

function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      {" "}
      *
    </span>
  );
}

/** Shared slot editors for designer block contracts and page-template composition slots. */
export function SlotValuesInputs({
  slots,
  current,
  patchSlot,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-4">
      {slots.map((slot) => {
        const id = `slot-${slot.name}`;
        const v = current[slot.name];
        const label = slot.label || slot.name;
        const desc = slot.description;

        if (slot.type === "boolean") {
          const checked = Boolean(v);
          return (
            <div
              className={cn(
                "flex items-start gap-2.5 rounded-none border border-border/60 bg-muted/20 px-3 py-2.5",
                disabled && "opacity-60",
              )}
              key={slot.name}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                id={id}
                onCheckedChange={(state) => {
                  patchSlot(slot.name, state === true);
                }}
              />
              <div className="grid min-w-0 gap-1 pt-0.5 leading-none">
                <Label
                  className="cursor-pointer font-normal leading-snug"
                  htmlFor={id}
                >
                  {label}
                  {slot.required ? <RequiredMark /> : null}
                </Label>
                {desc ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                ) : null}
              </div>
            </div>
          );
        }

        if (slot.type === "number") {
          const n = typeof v === "number" ? v : v === "" ? 0 : Number(v);
          return (
            <div className="space-y-1.5" key={slot.name}>
              <Label htmlFor={id}>
                {label}
                {slot.required ? <RequiredMark /> : null}
              </Label>
              {desc ? (
                <p className="text-xs text-muted-foreground">{desc}</p>
              ) : null}
              <Input
                disabled={disabled}
                id={id}
                inputMode="decimal"
                onChange={(e) => {
                  const num = Number(e.target.value);
                  patchSlot(
                    slot.name,
                    e.target.value === "" || Number.isNaN(num) ? "" : num,
                  );
                }}
                type="number"
                value={Number.isFinite(n) ? n : ""}
              />
            </div>
          );
        }

        if (slot.type === "image") {
          const mediaId =
            typeof v === "number"
              ? v
              : typeof v === "string" && /^\d+$/.test(v)
                ? Number.parseInt(v, 10)
                : "";
          return (
            <div className="space-y-1.5" key={slot.name}>
              <Label htmlFor={id}>
                {label}
                {slot.required ? <RequiredMark /> : null}
              </Label>
              {desc ? (
                <p className="text-xs text-muted-foreground">{desc}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Choose a file in Media, then enter its numeric ID.
              </p>
              <Input
                disabled={disabled}
                id={id}
                inputMode="numeric"
                onChange={(e) => {
                  const t = e.target.value.trim();
                  if (t === "") {
                    patchSlot(slot.name, "");
                    return;
                  }
                  const parsed = Number.parseInt(t, 10);
                  patchSlot(slot.name, Number.isFinite(parsed) ? parsed : t);
                }}
                type="text"
                value={mediaId === "" ? "" : String(mediaId)}
              />
            </div>
          );
        }

        if (slot.type === "richText") {
          const text = typeof v === "string" ? v : v != null ? String(v) : "";
          return (
            <div className="space-y-1.5" key={slot.name}>
              <Label htmlFor={id}>
                {label}
                {slot.required ? <RequiredMark /> : null}
              </Label>
              {desc ? (
                <p className="text-xs text-muted-foreground">{desc}</p>
              ) : null}
              <Textarea
                disabled={disabled}
                id={id}
                onChange={(e) => patchSlot(slot.name, e.target.value)}
                rows={5}
                value={text}
              />
            </div>
          );
        }

        if (slot.type === "link") {
          const href = typeof v === "string" ? v : v != null ? String(v) : "";
          return (
            <div className="space-y-1.5" key={slot.name}>
              <Label htmlFor={id}>
                {label}
                {slot.required ? <RequiredMark /> : null}
              </Label>
              {desc ? (
                <p className="text-xs text-muted-foreground">{desc}</p>
              ) : null}
              <Input
                autoComplete="url"
                disabled={disabled}
                id={id}
                onChange={(e) => patchSlot(slot.name, e.target.value)}
                placeholder="https://"
                type="url"
                value={href}
              />
            </div>
          );
        }

        const str = typeof v === "string" ? v : v != null ? String(v) : "";
        return (
          <div className="space-y-1.5" key={slot.name}>
            <Label htmlFor={id}>
              {label}
              {slot.required ? <RequiredMark /> : null}
            </Label>
            {desc ? (
              <p className="text-xs text-muted-foreground">{desc}</p>
            ) : null}
            <Input
              disabled={disabled}
              id={id}
              onChange={(e) => patchSlot(slot.name, e.target.value)}
              type="text"
              value={str}
            />
          </div>
        );
      })}
    </div>
  );
}
