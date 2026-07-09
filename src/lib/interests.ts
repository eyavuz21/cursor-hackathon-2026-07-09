import type { FoodInterest, HistoryInterest, Interest } from "./types";

export type InterestOption = {
  value: Interest;
  label: string;
  description: string;
};

export const HISTORY_INTEREST_OPTIONS: InterestOption[] = [
  {
    value: "museums",
    label: "Museums",
    description: "Art, science, and cultural collections.",
  },
  {
    value: "landmarks",
    label: "Landmarks",
    description: "Famous sights and points of interest.",
  },
  {
    value: "churches",
    label: "Churches & temples",
    description: "Historic places of worship.",
  },
  {
    value: "art_galleries",
    label: "Art galleries",
    description: "Exhibitions and contemporary art.",
  },
  {
    value: "historic_sites",
    label: "Historic sites",
    description: "Monuments and heritage locations.",
  },
  {
    value: "libraries",
    label: "Libraries",
    description: "Historic and notable libraries.",
  },
];

export const FOOD_INTEREST_OPTIONS: InterestOption[] = [
  {
    value: "restaurants",
    label: "Restaurants",
    description: "Sit-down meals and local cuisine.",
  },
  {
    value: "cafes",
    label: "Cafés",
    description: "Coffee shops and relaxed spots.",
  },
  {
    value: "bakeries",
    label: "Bakeries",
    description: "Fresh bread, pastries, and treats.",
  },
  {
    value: "bars",
    label: "Bars & pubs",
    description: "Drinks and evening hangouts.",
  },
  {
    value: "dessert",
    label: "Dessert",
    description: "Ice cream, sweets, and indulgences.",
  },
  {
    value: "quick_bites",
    label: "Quick bites",
    description: "Takeaway and casual food.",
  },
];

export const ALL_INTERESTS: Interest[] = [
  ...HISTORY_INTEREST_OPTIONS.map((option) => option.value),
  ...FOOD_INTEREST_OPTIONS.map((option) => option.value),
];

const INTEREST_LABELS = Object.fromEntries(
  [...HISTORY_INTEREST_OPTIONS, ...FOOD_INTEREST_OPTIONS].map((option) => [
    option.value,
    option.label,
  ]),
) as Record<Interest, string>;

/** @deprecated Legacy onboarding values saved before granular interests */
const LEGACY_INTEREST_EXPANSION: Record<string, Interest[]> = {
  history: ["museums", "landmarks", "churches", "art_galleries"],
  food: ["restaurants", "cafes", "bakeries"],
};

export function isInterest(value: string): value is Interest {
  return ALL_INTERESTS.includes(value as Interest);
}

export function normalizeInterests(raw: string[]): Interest[] {
  const normalized = new Set<Interest>();

  for (const item of raw) {
    if (isInterest(item)) {
      normalized.add(item);
      continue;
    }

    const legacy = LEGACY_INTEREST_EXPANSION[item];
    if (legacy) {
      legacy.forEach((interest) => normalized.add(interest));
    }
  }

  return Array.from(normalized);
}

export function getInterestLabel(interest: Interest): string {
  return INTEREST_LABELS[interest];
}

export function getInterestLabels(interests: Interest[]): string[] {
  return interests.map(getInterestLabel);
}

export function isHistoryInterest(
  interest: Interest,
): interest is HistoryInterest {
  return HISTORY_INTEREST_OPTIONS.some((option) => option.value === interest);
}

export function isFoodInterest(interest: Interest): interest is FoodInterest {
  return FOOD_INTEREST_OPTIONS.some((option) => option.value === interest);
}
