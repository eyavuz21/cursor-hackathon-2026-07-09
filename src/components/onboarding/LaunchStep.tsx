"use client";

import { useEffect } from "react";
import { getLaunchSummary } from "@/lib/onboarding";
import type { HealthGoal, Interest, OnboardingDetails } from "@/lib/types";

type LaunchStepProps = {
  healthGoal: HealthGoal;
  interests: Interest[];
  details: OnboardingDetails;
  onComplete: () => void;
};

export function LaunchStep({
  healthGoal,
  interests,
  details,
  onComplete,
}: LaunchStepProps) {
  const summary = getLaunchSummary({ healthGoal, interests, details });

  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center gap-8 py-4 text-center">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-emerald-500/20"
          style={{ animation: "onboarding-pulse-ring 1.8s ease-out infinite" }}
        />
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/40"
          style={{ animation: "onboarding-fade-up 0.5s ease both" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2
          className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          style={{
            background:
              "linear-gradient(90deg, #059669, #14b8a6, #059669)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "onboarding-shimmer 2.5s linear infinite",
          }}
        >
          Crafting your wander...
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Mapping nearby spots to your vibe
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {summary.map((line, index) => (
          <span
            key={line}
            className="onboarding-animate-fade-up rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
            style={{ animationDelay: `${0.15 + index * 0.1}s` }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
