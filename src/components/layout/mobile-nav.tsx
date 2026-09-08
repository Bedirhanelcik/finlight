"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Wallet2, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { MOBILE_TAB_ITEMS, NAV_ITEMS } from "./nav-items";

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentLabel =
    NAV_ITEMS.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
    )?.label ?? "Finlight";

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet2 className="h-3.5 w-3.5" />
          </div>
          <span className="text-[15px] font-semibold text-foreground">{currentLabel}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-surface-hover"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {open && <MobileDrawer onClose={() => setOpen(false)} />}
    </>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="animate-fade-in absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="animate-slide-in-right absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col bg-surface-raised shadow-xl"
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-subtle hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors",
                  isActive
                    ? "bg-surface-hover text-foreground"
                    : "text-muted hover:bg-surface-hover hover:text-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-accent" : "text-subtle")} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>,
    document.body,
  );
}

export function MobileTabBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex h-16 items-stretch border-t border-border bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        {MOBILE_TAB_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                isActive ? "text-accent" : "text-subtle",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-subtle",
          )}
          aria-label="More navigation options"
        >
          <Menu className="h-5 w-5" aria-hidden />
          More
        </button>
      </nav>
      {open && <MobileDrawer onClose={() => setOpen(false)} />}
    </>
  );
}
