import type { HealthGoal, Interest, OnboardingDetails } from "./types";
import { getInterestLabels } from "./interests";

export type OnboardingStepId =
  | "welcome"
  | "health"
  | "health-followup"
  | "interests"
  | "launch";

export function getOnboardingSteps(): OnboardingStepId[] {
  return ["welcome", "health", "health-followup", "interests", "launch"];
}

export function getHealthFollowUpPrompt(healthGoal: HealthGoal): {
  title: string;
  subtitle: string;
} {
  switch (healthGoal) {
    case "gentle":
      return {
        title: "What makes a gentle walk feel right?",
        subtitle: "We'll shape your route around how you like to move.",
      };
    case "moderate":
      return {
        title: "How do you like to spend a moderate outing?",
        subtitle: "This helps us balance walking with what you want to see.",
      };
    case "active":
      return {
        title: "How adventurous should we get?",
        subtitle: "Active explorers get extra-tailored suggestions.",
      };
  }
}

export const OUTING_STYLE_OPTIONS: {
  value: import("./types").OutingStyle;
  label: string;
  description: string;
  forGoals: HealthGoal[];
}[] = [
  {
    value: "scenic",
    label: "Scenic meanders",
    description: "Beautiful paths between stops — the journey matters.",
    forGoals: ["gentle", "moderate", "active"],
  },
  {
    value: "direct",
    label: "Straight to the highlights",
    description: "Efficient routes that get you to the good stuff faster.",
    forGoals: ["gentle", "moderate"],
  },
  {
    value: "explorer",
    label: "Off the beaten path",
    description: "Hidden gems and local favorites over the obvious picks.",
    forGoals: ["moderate", "active"],
  },
];

export function getOutingOptionsForGoal(healthGoal: HealthGoal) {
  return OUTING_STYLE_OPTIONS.filter((option) =>
    option.forGoals.includes(healthGoal),
  );
}

export function isStepComplete(
  step: OnboardingStepId,
  state: {
    healthGoal: HealthGoal | null;
    interests: Interest[];
    details: OnboardingDetails;
  },
): boolean {
  switch (step) {
    case "welcome":
      return true;
    case "health":
      return state.healthGoal !== null;
    case "health-followup":
      return Boolean(state.details.outingStyle);
    case "interests":
      return state.interests.length > 0;
    case "launch":
      return true;
  }
}

export function getLaunchSummary(state: {
  healthGoal: HealthGoal | null;
  interests: Interest[];
  details: OnboardingDetails;
}): string[] {
  const lines: string[] = [];

  if (state.healthGoal) {
    const goalLabel =
      state.healthGoal === "gentle"
        ? "Gentle stroll"
        : state.healthGoal === "moderate"
          ? "Moderate walk"
          : "Active explorer";
    lines.push(goalLabel);
  }

  if (state.details.outingStyle) {
    const style = OUTING_STYLE_OPTIONS.find(
      (option) => option.value === state.details.outingStyle,
    );
    if (style) lines.push(style.label);
  }

  if (state.interests.length > 0) {
    lines.push(...getInterestLabels(state.interests).slice(0, 4));
    if (state.interests.length > 4) {
      lines.push(`+${state.interests.length - 4} more`);
    }
  }

  return lines;
}
