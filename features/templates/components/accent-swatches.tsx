"use client";

import { cn } from "@/lib/utils";
import { ACCENT_SWATCHES } from "@/features/templates/template-accent-palettes";

type AccentSwatchesProps = {
  value: string;
  onChange: (hex: string) => void;
  className?: string;
  label?: string;
};

export function AccentSwatches({
  value,
  onChange,
  className,
  label = "Accent",
}: AccentSwatchesProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-surface-sunken px-2.5 py-1.5",
        className,
      )}
    >
      <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-text-muted sm:inline">
        {label}
      </span>
      <div className="flex gap-1.5">
        {ACCENT_SWATCHES.map((color) => {
          const selected = value.toLowerCase() === color.hex.toLowerCase();
          return (
            <button
              key={color.hex}
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
