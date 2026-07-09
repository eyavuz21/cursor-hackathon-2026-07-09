"use client";

import type {
  HealthGoal,
  JourneyMode,
  SocialVibe,
  TimeBudget,
} from "@/lib/types";
import { HEALTH_GOAL_OPTIONS } from "@/lib/preferences";
import {
  getModeFollowUpPrompt,
  SOCIAL_VIBE_OPTIONS,
  TIME_BUDGET_OPTIONS,
} from "@/lib/onboarding";

type ModeFollowUpStepProps = {
  journeyMode: JourneyMode;
  healthGoal: HealthGoal | null;
  socialVibes: SocialVibe[];
  timeBudget: TimeBudget | null;
  onHealthGoalChange: (value: HealthGoal) => void;
  onSocialVibesChange: (value: SocialVibe[]) => void;
  onTimeBudgetChange: (value: TimeBudget) => void;
};

export function ModeFollowUpStep({
  journeyMode,
  healthGoal,
  socialVibes,
  timeBudget,
  onHealthGoalChange,
  onSocialVibesChange,
  onTimeBudgetChange,
}: ModeFollowUpStepProps) {
  const { title, subtitle } = getModeFollowUpPrompt(journeyMode);

  function toggleSocialVibe(vibe: SocialVibe) {
    if (socialVibes.includes(vibe)) {
      onSocialVibesChange(socialVibes.filter((item) => item !== vibe));
      return;
    }

    if (socialVibes.length >= 2) {
      onSocialVibesChange([socialVibes[1], vibe]);
      return;
    }

    onSocialVibesChange([...socialVibes, vibe]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="brand-label">One more thing</p>
        <h2 className="brand-heading">{title}</h2>
        <p className="text-muted">{subtitle}</p>
      </div>

      {journeyMode === "mindfulness" && (
        <div className="flex flex-col gap-3">
          {HEALTH_GOAL_OPTIONS.map((option, index) => {
            const selected = healthGoal === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onHealthGoalChange(option.value)}
                className={`onboarding-animate-fade-up brand-card p-4 text-left ${
                  selected ? "brand-card-selected" : "hover:border-muted"
                }`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="text-sm text-muted">
                      {option.description}
                    </span>
                  </div>
                  <span className="shrink-0 border border-border px-2.5 py-1 text-xs uppercase tracking-wider text-muted">
                    {option.radiusLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {journeyMode === "social" && (
        <div className="flex flex-col gap-3">
          {SOCIAL_VIBE_OPTIONS.map((option, index) => {
            const selected = socialVibes.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleSocialVibe(option.value)}
                className={`onboarding-animate-fade-up brand-card p-4 text-left ${
                  selected ? "brand-card-selected" : "hover:border-muted"
                }`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="text-sm text-muted">{option.description}</span>
                </div>
              </button>
            );
          })}
          <p className="text-xs text-muted">Pick one or two.</p>
        </div>
      )}

      {journeyMode === "health_optimised" && (
        <div className="flex flex-col gap-3">
          {TIME_BUDGET_OPTIONS.map((option, index) => {
            const selected = timeBudget === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onTimeBudgetChange(option.value)}
                className={`onboarding-animate-fade-up brand-card p-4 text-left ${
                  selected ? "brand-card-selected" : "hover:border-muted"
                }`}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground">
                    {option.label}
                  </span>
                  <span className="text-sm text-muted">{option.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
