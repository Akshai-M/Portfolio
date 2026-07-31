import type { PortfolioCustomization } from "./types";

export type AccentSwatch = {
  name: string;
  hex: string;
};

/** Templates that support the shared accent picker in v1. */
export const ACCENT_SUPPORTED_TEMPLATES = [
  "pulse",
  "maximalist",
  "developer",
] as const;

export type AccentSupportedTemplateId =
  (typeof ACCENT_SUPPORTED_TEMPLATES)[number];

export function isAccentSupportedTemplate(
  templateId: string,
): templateId is AccentSupportedTemplateId {
  return (ACCENT_SUPPORTED_TEMPLATES as readonly string[]).includes(templateId);
}

/** Shared swatch set shown in the Design tab accent picker. */
export const ACCENT_SWATCHES: AccentSwatch[] = [
  { name: "Blue", hex: "#3b82f6" },
  { name: "Green", hex: "#22c55e" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Orange", hex: "#f97316" },
  { name: "Pink", hex: "#ec4899" },
];

const TEMPLATE_DEFAULT_ACCENTS: Record<AccentSupportedTemplateId, string> = {
  pulse: "#3b82f6",
  maximalist: "#3b82f6",
  developer: "#22c55e",
};

const FALLBACK_ACCENT = "#3b82f6";

export function getTemplateDefaultAccent(templateId: string): string {
  if (isAccentSupportedTemplate(templateId)) {
    return TEMPLATE_DEFAULT_ACCENTS[templateId];
  }
  return FALLBACK_ACCENT;
}

export function resolveAccentColor(
  templateId: string,
  customization?: PortfolioCustomization | null,
): string {
  const saved = customization?.primaryColor;
  if (typeof saved === "string" && /^#[0-9a-fA-F]{6}$/.test(saved)) {
    return saved;
  }
  return getTemplateDefaultAccent(templateId);
}
