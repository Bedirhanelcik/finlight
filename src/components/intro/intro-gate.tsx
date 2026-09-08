"use client";

import { useLayoutEffect, useState } from "react";
import { Wallet2 } from "lucide-react";

const SESSION_KEY = "finlight-intro-shown";

// Module-level (not React state) so the decision survives React Strict
// Mode's dev-only mount -> cleanup -> mount double-invoke within a single
// page load: without this, the second invocation would read back the
// sessionStorage flag the first invocation just wrote and wrongly conclude
// the intro was "already shown" in some earlier visit, while the first
// invocation's timers get torn down by the Strict Mode cleanup - leaving
// the splash stuck on screen forever with nothing left to dismiss it.
let decided = false;
let shouldShowThisPageLoad = false;

function shouldShowIntro(): boolean {
  if (!decided) {
    decided = true;
    try {
      const alreadyShown = window.sessionStorage.getItem(SESSION_KEY) === "1";
      shouldShowThisPageLoad = !alreadyShown;
      if (shouldShowThisPageLoad) {
        window.sessionStorage.setItem(SESSION_KEY, "1");
      }
    } catch {
      shouldShowThisPageLoad = false;
    }
  }
  return shouldShowThisPageLoad;
}

// useLayoutEffect does nothing during SSR (and React warns if it's used
// there), so fall back to useEffect on the server - this component never
// needs the synchronous timing on the server anyway, only in the browser.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : () => {};

type Phase = "cover" | "playing" | "leaving" | "done";

export function IntroGate({ children }: { children: React.ReactNode }) {
  // "cover" is the only state the server and the very first client render
  // can agree on (sessionStorage isn't available during SSR), so it's also
  // the only state in which `children` - which includes the login/register
  // screens and the authenticated app - is withheld. That's what actually
  // prevents the flash: previously `children` rendered unconditionally from
  // the first paint, and only a *separate* overlay was toggled on top of it
  // a tick later, leaving a real gap where the underlying route was visible
  // with nothing covering it.
  const [phase, setPhase] = useState<Phase>("cover");

  // useLayoutEffect (not useEffect) so the fresh-vs-repeat-session decision
  // is applied before the browser paints the hydrated tree, not after -
  // closing the only remaining gap where the cover could be up without the
  // decision having been made yet.
  useIsomorphicLayoutEffect(() => {
    if (!shouldShowIntro()) {
      setPhase("done");
      return;
    }

    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    setPhase("playing");
    const playMs = reducedMotion ? 150 : 2300;
    const leaveMs = reducedMotion ? 100 : 350;

    const toLeaving = window.setTimeout(() => setPhase("leaving"), playMs);
    const toDone = window.setTimeout(() => setPhase("done"), playMs + leaveMs);
    return () => {
      window.clearTimeout(toLeaving);
      window.clearTimeout(toDone);
    };
  }, []);

  const showCover = phase !== "done";
  const leaving = phase === "leaving";

  return (
    <>
      {showCover && (
        <div
          role="presentation"
          aria-hidden="true"
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[#0b0d10] transition-opacity duration-300 motion-reduce:transition-none ${
            leaving ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="animate-intro-logo flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#0b0d10] shadow-2xl motion-reduce:animate-none">
            <Wallet2 className="h-8 w-8" strokeWidth={2.25} />
          </div>
          <span className="animate-intro-wordmark text-lg font-semibold tracking-tight text-white opacity-0 motion-reduce:animate-none motion-reduce:opacity-100">
            Finlight
          </span>
        </div>
      )}
      {phase === "done" && children}
    </>
  );
}
