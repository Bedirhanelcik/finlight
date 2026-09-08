"use client";

import { AlertTriangle } from "lucide-react";
import { useData } from "@/context/data-provider";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Sidebar } from "./sidebar";
import { MobileTabBar, MobileTopBar } from "./mobile-nav";
import { QuickAddFab } from "@/components/transactions/quick-add-fab";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, errorMessage } = useData();

  if (status === "unavailable" || status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-negative-bg">
            <AlertTriangle className="h-5 w-5 text-negative" />
          </div>
          <h1 className="text-base font-semibold text-foreground">
            {status === "unavailable" ? "Local storage isn't available" : "Couldn't load your data"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {status === "unavailable"
              ? "This browser doesn't support IndexedDB, which Finlight needs for local development storage. Try a different browser, or disable private/incognito mode."
              : (errorMessage ??
                (isSupabaseConfigured()
                  ? "Something went wrong while reaching the server. Check your connection and try refreshing."
                  : "Something went wrong while loading your data."))}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileTopBar />
      <div className="lg:pl-60">
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          {status === "loading" ? <ShellSkeleton /> : children}
        </main>
      </div>
      <MobileTabBar />
      {status === "ready" && <QuickAddFab />}
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-56" />
    </div>
  );
}
