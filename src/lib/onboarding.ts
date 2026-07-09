import type {
  HealthGoal,
  JourneyMode,
  OnboardingDetails,
  SocialVibe,
  TimeBudget,
} from "./types";
import { getJourneyModeLabel } from "./modes";
import {
  healthGoalFromTimeBudget,
  getModeFollowUpPrompt,
  SOCIAL_VIBE_OPTIONS,
  TIME_BUDGET_OPTIONS,
} from "./mode-preferences";
import { HEALTH_GOAL_OPTIONS } from "./preferences";

export type OnboardingStepId = "welcome" | "mode" | "mode-followup" | "launch";

export function getOnboardingSteps(): OnboardingStepId[] {
  return ["welcome", "mode", "mode-followup", "launch"];
}

export function isStepComplete(
  step: OnboardingStepId,
  state: {
    journeyMode: JourneyMode | null;
    healthGoal: HealthGoal | null;
    socialVibes: SocialVibe[];
    timeBudget: TimeBudget | null;
  },
): boolean {
  switch (step) {
    case "welcome":
      return true;
    case "mode":
      return state.journeyMode !== null;
    case "mode-followup":
      if (!state.journeyMode) return false;
      if (state.journeyMode === "mindfulness") return state.healthGoal !== null;
      if (state.journeyMode === "social") return state.socialVibes.length > 0;
      return state.timeBudget !== null;
    case "launch":
      return true;
  }
}

export function getLaunchSummary(state: {
  journeyMode: JourneyMode | null;
  healthGoal: HealthGoal | null;
  socialVibes: SocialVibe[];
  timeBudget: TimeBudget | null;
  details: OnboardingDetails;
}): string[] {
  const lines: string[] = [];

  if (state.journeyMode) {
    lines.push(getJourneyModeLabel(state.journeyMode));
  }

  if (state.journeyMode === "mindfulness" && state.healthGoal) {
    const goal = HEALTH_GOAL_OPTIONS.find((option) => option.value === state.healthGoal);
    if (goal) lines.push(goal.label);
  }

  if (state.journeyMode === "social" && state.socialVibes.length > 0) {
    lines.push(
      ...state.socialVibes.map(
        (vibe) =>
          SOCIAL_VIBE_OPTIONS.find((option) => option.value === vibe)?.label ?? vibe,
      ),
    );
  }

  if (state.journeyMode === "health_optimised" && state.timeBudget) {
    const budget = TIME_BUDGET_OPTIONS.find(
      (option) => option.value === state.timeBudget,
    );
    if (budget) lines.push(budget.label);
  }

  return lines;
}

export {
  SOCIAL_VIBE_OPTIONS,
  TIME_BUDGET_OPTIONS,
  healthGoalFromTimeBudget,
  getModeFollowUpPrompt,
};
