"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useData } from "@/context/data-provider";
import { formatCurrency } from "@/lib/currency";
import type { Category, Transaction } from "@/lib/types";
import { cn } from "@/lib/cn";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  });
}

interface TransactionRowProps {
  transaction: Transaction;
  category: Category | undefined;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  compact?: boolean;
}

export function TransactionRow({
  transaction,
  category,
  onEdit,
  onDelete,
  compact = false,
}: TransactionRowProps) {
  const { settings } = useData();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="group flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-surface-hover">
      <CategoryIcon
        icon={category?.icon ?? "more-horizontal"}
        colorIndex={category?.colorIndex ?? 0}
        size={compact ? "sm" : "md"}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {transaction.description}
        </p>
        <p className="truncate text-xs text-muted">
          {category?.name ?? "Uncategorized"}
          {transaction.merchant ? ` · ${transaction.merchant}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            transaction.type === "income" ? "text-positive" : "text-foreground",
          )}
        >
          {transaction.type === "income" ? "+" : "−"}
          {formatCurrency(transaction.amount, settings.currency)}
        </span>
        <span className="text-xs text-subtle">{formatDate(transaction.date)}</span>
      </div>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={`Actions for ${transaction.description}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-8 w-8 items-center justify-center rounded-md text-subtle opacity-0 transition-opacity hover:bg-surface hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 data-[open=true]:opacity-100"
          data-open={menuOpen}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="animate-scale-in absolute right-0 z-10 mt-1 w-36 origin-top-right rounded-md border border-border bg-surface-raised py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onEdit(transaction);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-surface-hover"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete(transaction);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-negative hover:bg-negative-bg"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
