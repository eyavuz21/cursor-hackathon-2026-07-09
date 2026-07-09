"use client";

import type { ReactNode } from "react";

type OnboardingShellProps = {
  children: ReactNode;
};

export function OnboardingShell({ children }: OnboardingShellProps) {
  return (
    <div className="relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-background px-6 py-12 font-sans">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <main className="relative z-10 flex w-full max-w-xl flex-col gap-8 border border-border bg-surface p-8 shadow-[0_1px_0_0_var(--border)]">
        {children}
      </main>
    </div>
  );
}
