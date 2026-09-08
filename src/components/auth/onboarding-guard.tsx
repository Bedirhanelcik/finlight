"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useData } from "@/context/data-provider";

/** Safety net: if a user lands back on the app before finishing the
 * one-time welcome flow (e.g. they closed the tab mid-onboarding), send
 * them back to it instead of showing an empty dashboard with no context. */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { status, settings } = useData();
  const router = useRouter();

  useEffect(() => {
    if (status === "ready" && !settings.onboardingCompleted) {
      router.replace("/welcome");
    }
  }, [status, settings.onboardingCompleted, router]);

  if (status === "ready" && !settings.onboardingCompleted) return null;

  return <>{children}</>;
}
