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
    <div className="flex flex-col items-start gap-8 py-4">
      <div className="flex flex-col gap-3">
        <p className="brand-label">Preparing your guide</p>
        <h2 className="brand-heading">
          Crafting your wander...
        </h2>
        <p className="text-sm text-muted">
          Mapping nearby spots to your vibe
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.map((line, index) => (
          <span
            key={line}
            className="onboarding-animate-fade-up border border-border bg-accent-subtle px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-foreground"
            style={{ animationDelay: `${0.15 + index * 0.1}s` }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
