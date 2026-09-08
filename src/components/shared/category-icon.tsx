"use client";

import { useData } from "@/context/data-provider";
import { getCategoryColor } from "@/lib/colors";
import { getCategoryIcon } from "@/lib/icon-map";
import { cn } from "@/lib/cn";

export function CategoryIcon({
  icon,
  colorIndex,
  size = "md",
  className,
}: {
  icon: string;
  colorIndex: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { resolvedTheme } = useData();
  const Icon = getCategoryIcon(icon);
  const color = getCategoryColor(colorIndex, resolvedTheme);
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };
  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full", sizeClasses[size], className)}
      style={{ backgroundColor: `${color}1f` }}
    >
      {/* eslint-disable-next-line react-hooks/static-components -- icon is chosen from a fixed, stable lookup table by category */}
      <Icon className={iconSizes[size]} style={{ color }} aria-hidden />
    </span>
  );
}
