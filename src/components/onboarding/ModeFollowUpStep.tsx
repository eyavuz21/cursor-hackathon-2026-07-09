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
import { SelectableOption } from "./SelectableOption";

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
        <div
          className="flex flex-col gap-3"
          role="radiogroup"
          aria-label="Walking distance"
        >
          {HEALTH_GOAL_OPTIONS.map((option, index) => (
            <SelectableOption
              key={option.value}
              selected={healthGoal === option.value}
              onSelect={() => onHealthGoalChange(option.value)}
              title={option.label}
              description={option.description}
              badge={option.radiusLabel}
              animationDelay={`${index * 0.08}s`}
            />
          ))}
        </div>
      )}

      {journeyMode === "social" && (
        <div className="flex flex-col gap-3">
          <div
            className="flex flex-col gap-3"
            role="group"
            aria-label="Social vibe"
          >
            {SOCIAL_VIBE_OPTIONS.map((option, index) => (
              <SelectableOption
                key={option.value}
                selected={socialVibes.includes(option.value)}
                onSelect={() => toggleSocialVibe(option.value)}
                title={option.label}
                description={option.description}
                selectionType="multiple"
                animationDelay={`${index * 0.08}s`}
              />
            ))}
          </div>
          <p className="text-xs text-muted">Pick one or two.</p>
        </div>
      )}

      {journeyMode === "health_optimised" && (
        <div
          className="flex flex-col gap-3"
          role="radiogroup"
          aria-label="Time budget"
        >
          {TIME_BUDGET_OPTIONS.map((option, index) => (
            <SelectableOption
              key={option.value}
              selected={timeBudget === option.value}
              onSelect={() => onTimeBudgetChange(option.value)}
              title={option.label}
              description={option.description}
              animationDelay={`${index * 0.08}s`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
