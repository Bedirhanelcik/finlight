"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Wallet2 } from "lucide-react";
import { useAuth } from "@/context/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/register");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-11 w-11 animate-pulse items-center justify-center rounded-xl bg-primary text-primary-foreground motion-reduce:animate-none">
            <Wallet2 className="h-5 w-5" strokeWidth={2.25} />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
