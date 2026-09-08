"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftRight, Sparkles, Wallet, Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-provider";
import { getRepository } from "@/lib/repository";

const HINTS = [
  {
    icon: ArrowLeftRight,
    title: "Track income and expenses",
    detail: "Add transactions in seconds and see where your money goes.",
  },
  {
    icon: Wallet,
    title: "Set budgets that matter",
    detail: "Cap monthly spending by category and watch your progress.",
  },
  {
    icon: Sparkles,
    title: "Understand it with Insights",
    detail: "Get automatic, plain-language read-outs of your spending.",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { status } = useAuth();
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/register");
  }, [status, router]);

  async function handleContinue() {
    setFinishing(true);
    try {
      const repo = getRepository();
      await repo.init();
      await repo.updateSettings({ onboardingCompleted: true });
    } catch {
      // Non-fatal: worst case the user sees this screen again next time.
    }
    router.replace("/");
  }

  if (status !== "authenticated") return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Wallet2 className="h-7 w-7" strokeWidth={2.25} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome to Finlight
        </h1>
        <p className="mt-2 text-sm text-muted">Your finances, clearly organized.</p>

        <div className="mt-8 flex flex-col gap-3 text-left">
          {HINTS.map((hint) => (
            <div
              key={hint.title}
              className="animate-fade-in-up flex items-start gap-3 rounded-lg border border-border bg-surface p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <hint.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{hint.title}</p>
                <p className="mt-0.5 text-sm text-muted">{hint.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          size="lg"
          className="mt-8 w-full justify-center"
          onClick={handleContinue}
          loading={finishing}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
