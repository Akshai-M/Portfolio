"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ACCENT_SWATCHES } from "@/features/templates/template-accent-palettes";

type AccentSwatchesProps = {
  value: string;
  onChange: (hex: string) => void;
  /** Template stock default — always kept in the palette so you can return to it. */
  defaultHex: string;
  className?: string;
  label?: string;
};

export function AccentSwatches({
  value,
  onChange,
  defaultHex,
  className,
  label = "Accent",
}: AccentSwatchesProps) {
  const swatches = useMemo(() => {
    const seen = new Set<string>();
    const list: { name: string; hex: string }[] = [];

    const push = (name: string, hex: string) => {
      const key = hex.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ name, hex });
    };

    const defaultKey = defaultHex.toLowerCase();
    const defaultInShared = ACCENT_SWATCHES.some(
      (swatch) => swatch.hex.toLowerCase() === defaultKey,
    );
    // Keep the template default permanently when it isn't already a shared swatch
    // (e.g. Minimal grey, Paper ink, Monochrome grey).
    if (!defaultInShared) {
      push("Default", defaultHex);
    }
    for (const swatch of ACCENT_SWATCHES) {
      push(swatch.name, swatch.hex);
    }
    // Preserve any other active value so it stays selectable.
    push("Current", value);

    return list;
  }, [defaultHex, value]);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-2.5 py-1.5",
        className,
      )}
    >
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-text-muted sm:inline">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {swatches.map((color) => {
          const selected = value.toLowerCase() === color.hex.toLowerCase();
          return (
            <button
              key={color.hex.toLowerCase()}
              type="button"
              title={color.name}
              aria-label={`${color.name} accent`}
              aria-pressed={selected}
              onClick={() => onChange(color.hex)}
              className={cn(
                "h-4 w-4 rounded-full border transition-all",
                selected
                  ? "scale-110 border-text-primary ring-2 ring-brand-primary/35"
                  : "border-border-strong hover:scale-105",
              )}
              style={{ backgroundColor: color.hex }}
            />
          );
        })}
      </div>
    </div>
  );
}
