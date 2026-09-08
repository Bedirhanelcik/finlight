export const CATEGORY_PALETTE = [
  { name: "blue", light: "#2a78d6", dark: "#3987e5" },
  { name: "orange", light: "#eb6834", dark: "#d95926" },
  { name: "aqua", light: "#1baf7a", dark: "#199e70" },
  { name: "yellow", light: "#eda100", dark: "#c98500" },
  { name: "magenta", light: "#e87ba4", dark: "#d55181" },
  { name: "green", light: "#008300", dark: "#008300" },
  { name: "violet", light: "#4a3aa7", dark: "#9085e9" },
  { name: "red", light: "#e34948", dark: "#e66767" },
] as const;

export const OTHER_CATEGORY_COLOR = { light: "#8a8781", dark: "#9a9790" };

export type ThemeMode = "light" | "dark";

export function getCategoryColor(colorIndex: number, mode: ThemeMode): string {
  const entry = CATEGORY_PALETTE[colorIndex % CATEGORY_PALETTE.length];
  return mode === "dark" ? entry.dark : entry.light;
}

export const STATUS_COLORS = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  warning: { light: "#b45309", dark: "#fbbf24" },
  critical: { light: "#d03b3b", dark: "#e66767" },
} as const;

export function getStatusColor(
  status: keyof typeof STATUS_COLORS,
  mode: ThemeMode,
): string {
  return STATUS_COLORS[status][mode];
}
