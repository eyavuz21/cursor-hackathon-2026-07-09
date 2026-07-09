import type {
  FoodStyle,
  HealthGoal,
  HistoryStyle,
  Interest,
  OnboardingDetails,
  OutingStyle,
} from "./types";

export type OnboardingStepId =
  | "welcome"
  | "health"
  | "health-followup"
  | "interests"
  | "history-followup"
  | "food-followup"
  | "launch";

export function getOnboardingSteps(interests: Interest[]): OnboardingStepId[] {
  const steps: OnboardingStepId[] = [
    "welcome",
    "health",
    "health-followup",
    "interests",
  ];

  if (interests.includes("history")) {
    steps.push("history-followup");
  }

  if (interests.includes("food")) {
    steps.push("food-followup");
  }

  steps.push("launch");
  return steps;
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
  value: OutingStyle;
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

export const HISTORY_STYLE_OPTIONS: {
  value: HistoryStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "museums",
    label: "Museums & galleries",
    description: "Curated collections and indoor cultural stops.",
  },
  {
    value: "landmarks",
    label: "Iconic landmarks",
    description: "Famous sights, monuments, and must-see architecture.",
  },
  {
    value: "local",
    label: "Local stories",
    description: "Churches, heritage sites, and neighborhood history.",
  },
];

export const FOOD_STYLE_OPTIONS: {
  value: FoodStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "coffee",
    label: "Coffee & pastry",
    description: "Cafés, bakeries, and a cozy pause.",
  },
  {
    value: "quick",
    label: "Quick bite",
    description: "Casual spots when you're on the move.",
  },
  {
    value: "dining",
    label: "Sit-down meal",
    description: "Restaurants worth lingering at.",
  },
];

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
    case "history-followup":
      return Boolean(state.details.historyStyle);
    case "food-followup":
      return Boolean(state.details.foodStyle);
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

  if (state.interests.includes("history") && state.details.historyStyle) {
    const style = HISTORY_STYLE_OPTIONS.find(
      (option) => option.value === state.details.historyStyle,
    );
    if (style) lines.push(style.label);
  }

  if (state.interests.includes("food") && state.details.foodStyle) {
    const style = FOOD_STYLE_OPTIONS.find(
      (option) => option.value === state.details.foodStyle,
    );
    if (style) lines.push(style.label);
  }

  return lines;
}
