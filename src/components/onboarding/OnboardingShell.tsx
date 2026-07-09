"use client";

import type { ReactNode } from "react";

type OnboardingShellProps = {
  children: ReactNode;
};

export function OnboardingShell({ children }: OnboardingShellProps) {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.14),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.1),transparent_45%)]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-[12%] top-[18%] h-3 w-3 rounded-full bg-emerald-400/70"
        style={{ animation: "onboarding-float 5.5s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[16%] top-[28%] h-2 w-2 rounded-full bg-teal-400/60"
        style={{ animation: "onboarding-float-delayed 6.2s ease-in-out infinite" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[22%] left-[20%] h-2.5 w-2.5 rounded-full bg-emerald-500/50"
        style={{ animation: "onboarding-float 7s ease-in-out infinite 0.8s" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute right-[22%] bottom-[30%] text-emerald-500/40"
        style={{ animation: "onboarding-pin-drop 0.9s ease both 0.3s" }}
      >
        <svg width="20" height="26" viewBox="0 0 20 26" fill="currentColor">
          <path d="M10 0C5.58 0 2 3.58 2 8c0 5.25 8 18 8 18s8-12.75 8-18c0-4.42-3.58-8-8-8zm0 11a3 3 0 110-6 3 3 0 010 6z" />
        </svg>
      </div>

      <main className="relative z-10 flex w-full max-w-xl flex-col gap-8">
        {children}
      </main>
    </div>
  );
}
