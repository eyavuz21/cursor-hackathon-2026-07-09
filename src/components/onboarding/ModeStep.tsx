"use client";

import type {
  HealthGoal,
  JourneyMode,
  SocialVibe,
  TimeBudget,
} from "@/lib/types";
import { JOURNEY_MODE_OPTIONS } from "@/lib/modes";
import { HEALTH_GOAL_OPTIONS } from "@/lib/preferences";
import {
  SOCIAL_VIBE_OPTIONS,
  TIME_BUDGET_OPTIONS,
} from "@/lib/mode-preferences";
import { SubOptionChips } from "./SubOptionChips";

type ModeStepProps = {
  journeyMode: JourneyMode | null;
  healthGoal: HealthGoal | null;
  socialVibes: SocialVibe[];
  timeBudget: TimeBudget | null;
  onModeChange: (mode: JourneyMode) => void;
  onHealthGoalChange: (value: HealthGoal) => void;
  onSocialVibesChange: (value: SocialVibe[]) => void;
  onTimeBudgetChange: (value: TimeBudget) => void;
};

function SelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? "border-foreground" : "border-muted"
      }`}
    >
      {selected ? (
        <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
      ) : null}
    </span>
  );
}

export function ModeStep({
  journeyMode,
  healthGoal,
  socialVibes,
  timeBudget,
  onModeChange,
  onHealthGoalChange,
  onSocialVibesChange,
  onTimeBudgetChange,
}: ModeStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="onboarding-animate-fade-up flex flex-col gap-2">
        <p className="brand-label">Your vibe</p>
        <h2 className="brand-heading">How do you want to wander?</h2>
        <p className="text-muted">
          Pick a mode, then fine-tune the details below before continuing.
        </p>
      </div>

      <div
        className="flex flex-col gap-3"
        role="radiogroup"
        aria-label="Journey mode"
      >
        {JOURNEY_MODE_OPTIONS.map((option, index) => {
          const selected = journeyMode === option.value;

          return (
            <div
              key={option.value}
              className={`onboarding-animate-fade-up brand-card overflow-hidden ${
                selected ? "brand-card-selected" : ""
              }`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onModeChange(option.value)}
                className="brand-card-interactive w-full p-5 text-left"
              >
                <div className="flex items-start gap-4">
                  <SelectionIndicator selected={selected} />

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-base font-medium leading-snug text-foreground">
                        {option.label}
                      </span>
                      <span className="brand-option-badge">{option.context}</span>
                    </div>
                    <span className="text-sm leading-relaxed text-muted">
                      {option.description}
                    </span>
                  </div>
                </div>
              </button>

              {selected ? (
                <div className="border-t border-border bg-surface/60 px-5 pb-5 pt-4">
                  {option.value === "mindfulness" && (
                    <SubOptionChips
                      label="Walking distance"
                      hint="How far do you like to walk?"
                      options={HEALTH_GOAL_OPTIONS.map((goal) => ({
                        value: goal.value,
                        label: goal.label,
                        description: goal.description,
                      }))}
                      selected={healthGoal ? [healthGoal] : []}
                      onChange={(values) =>
                        onHealthGoalChange(values[0] as HealthGoal)
                      }
                    />
                  )}

                  {option.value === "social" && (
                    <SubOptionChips
                      label="What are you in the mood for?"
                      hint="Pick one or more — we'll find spots that match."
                      options={SOCIAL_VIBE_OPTIONS.map((vibe) => ({
                        value: vibe.value,
                        label: vibe.label,
                        description: vibe.description,
                      }))}
                      selected={socialVibes}
                      onChange={(values) =>
                        onSocialVibesChange(values as SocialVibe[])
                      }
                      selectionType="multiple"
                    />
                  )}

                  {option.value === "health_optimised" && (
                    <SubOptionChips
                      label="Time budget"
                      hint="How long have you got for extra walking?"
                      options={TIME_BUDGET_OPTIONS.map((budget) => ({
                        value: budget.value,
                        label: budget.label,
                        description: budget.description,
                      }))}
                      selected={timeBudget ? [timeBudget] : []}
                      onChange={(values) =>
                        onTimeBudgetChange(values[0] as TimeBudget)
                      }
                    />
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
