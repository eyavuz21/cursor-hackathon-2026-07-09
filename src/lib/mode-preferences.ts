import type {
  HealthGoal,
  Interest,
  JourneyMode,
  OnboardingDetails,
  SocialVibe,
  TimeBudget,
  UserPreferences,
} from "./types";

export const SOCIAL_VIBE_OPTIONS: {
  value: SocialVibe;
  label: string;
  description: string;
}[] = [
  {
    value: "food",
    label: "Food",
    description: "Cafés, restaurants, and bakeries.",
  },
  {
    value: "shops",
    label: "Shops",
    description: "Independent stores, galleries, and markets.",
  },
  {
    value: "drinks",
    label: "Drinks",
    description: "Bars, pubs, and meet-up spots.",
  },
];

export const TIME_BUDGET_OPTIONS: {
  value: TimeBudget;
  label: string;
  description: string;
}[] = [
  {
    value: "45",
    label: "~45 minutes",
    description: "A solid walk with a few extra stops.",
  },
  {
    value: "60",
    label: "~1 hour",
    description: "Maximum walking time for a health-optimised route.",
  },
];

const MINDFULNESS_INTERESTS: Interest[] = [
  "libraries",
  "churches",
  "historic_sites",
];

const HEALTH_OPTIMISED_INTERESTS: Interest[] = [
  "landmarks",
  "cafes",
  "libraries",
  "museums",
];

function interestsForSocial(vibes: SocialVibe[]): Interest[] {
  const interests = new Set<Interest>();

  for (const vibe of vibes) {
    if (vibe === "food") {
      interests.add("restaurants");
      interests.add("cafes");
      interests.add("bakeries");
    }
    if (vibe === "shops") {
      interests.add("art_galleries");
      interests.add("landmarks");
      interests.add("museums");
    }
    if (vibe === "drinks") {
      interests.add("bars");
      interests.add("cafes");
    }
  }

  return Array.from(interests);
}

export function healthGoalFromTimeBudget(budget: TimeBudget): HealthGoal {
  return budget === "45" ? "moderate" : "active";
}

export function derivePreferencesFromMode(input: {
  journeyMode: JourneyMode;
  healthGoal?: HealthGoal | null;
  socialVibes?: SocialVibe[];
  timeBudget?: TimeBudget;
}): UserPreferences {
  const { journeyMode } = input;
  const details: OnboardingDetails = { journeyMode };

  if (journeyMode === "mindfulness") {
    const healthGoal = input.healthGoal ?? "moderate";
    return {
      healthGoal,
      interests: MINDFULNESS_INTERESTS,
      details,
    };
  }

  if (journeyMode === "social") {
    const vibes =
      input.socialVibes && input.socialVibes.length > 0
        ? input.socialVibes
        : (["food", "shops"] as SocialVibe[]);

    details.socialVibes = vibes;

    return {
      healthGoal: input.healthGoal ?? "moderate",
      interests: interestsForSocial(vibes),
      details,
    };
  }

  const timeBudget = input.timeBudget ?? "60";
  details.timeBudget = timeBudget;

  return {
    healthGoal: healthGoalFromTimeBudget(timeBudget),
    interests: HEALTH_OPTIMISED_INTERESTS,
    details,
  };
}

export function isHealthOptimisedMode(details?: OnboardingDetails): boolean {
  return details?.journeyMode === "health_optimised";
}

export function getModeFollowUpPrompt(mode: JourneyMode): {
  title: string;
  subtitle: string;
} {
  switch (mode) {
    case "mindfulness":
      return {
        title: "How far do you like to walk?",
        subtitle: "We'll keep your route calm and within a comfortable distance.",
      };
    case "social":
      return {
        title: "What are you in the mood for?",
        subtitle: "Pick one or more — we'll find spots that match.",
      };
    case "health_optimised":
      return {
        title: "How long have you got?",
        subtitle: "We'll add extra walking while staying within your time.",
      };
  }
}
