import {
  Banknote,
  Car,
  Clapperboard,
  HeartPulse,
  Home,
  MoreHorizontal,
  Repeat,
  ShoppingBag,
  Utensils,
  Zap,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  home: Home,
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  clapperboard: Clapperboard,
  zap: Zap,
  "heart-pulse": HeartPulse,
  repeat: Repeat,
  "more-horizontal": MoreHorizontal,
  banknote: Banknote,
};

export function getCategoryIcon(icon: string): LucideIcon {
  return ICON_MAP[icon] ?? Wallet;
}
