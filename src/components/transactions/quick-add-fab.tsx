"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { TransactionModal } from "./transaction-modal";

export function QuickAddFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add transaction"
        className="fixed right-4 bottom-20 z-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/15 transition-transform hover:scale-105 active:scale-95 lg:right-8 lg:bottom-8"
        style={{ height: 52, width: 52 }}
      >
        <Plus className="h-5 w-5" />
      </button>
      <TransactionModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
