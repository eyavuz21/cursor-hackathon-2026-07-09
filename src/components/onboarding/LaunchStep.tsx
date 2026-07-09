"use client";

import { useEffect } from "react";
import { WanderLoader } from "@/components/loading/WanderLoader";
import { getLaunchSummary } from "@/lib/onboarding";
import type {
  HealthGoal,
  JourneyMode,
  OnboardingDetails,
  SocialVibe,
  TimeBudget,
} from "@/lib/types";

type LaunchStepProps = {
  journeyMode: JourneyMode;
  healthGoal: HealthGoal | null;
  socialVibes: SocialVibe[];
  timeBudget: TimeBudget | null;
  onComplete: () => void;
};

export function LaunchStep({
  journeyMode,
  healthGoal,
  socialVibes,
  timeBudget,
  onComplete,
}: LaunchStepProps) {
  const details: OnboardingDetails = { journeyMode };
  const summary = getLaunchSummary({
    journeyMode,
    healthGoal,
    socialVibes,
    timeBudget,
    details,
  });

  useEffect(() => {
    const timer = window.setTimeout(onComplete, 2200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-start gap-8 py-4">
      <div className="flex flex-col gap-3">
        <p className="brand-label">Preparing your guide</p>
        <div className="flex items-center gap-3">
          <WanderLoader size="sm" />
          <h2 className="brand-heading">Crafting your wander...</h2>
        </div>
        <p className="text-sm text-muted">Mapping nearby spots to your vibe</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {summary.map((line, index) => (
          <span
            key={`${line}-${index}`}
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
