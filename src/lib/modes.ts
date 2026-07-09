import type { JourneyMode, OnboardingDetails } from "./types";

export const JOURNEY_MODE_OPTIONS: {
  value: JourneyMode;
  label: string;
  shortLabel: string;
  description: string;
  context: string;
}[] = [
  {
    value: "mindfulness",
    label: "Health / Mindfulness",
    shortLabel: "Mindfulness",
    description: "Quiet, low-stress walking paths to mentally prepare for the day.",
    context: "Morning commute",
  },
  {
    value: "social",
    label: "Social / Discovery",
    shortLabel: "Social",
    description: "Interesting independent shops and meet-up spots along the way.",
    context: "Weekend stroll",
  },
];

export function getJourneyMode(details?: OnboardingDetails): JourneyMode {
  return details?.journeyMode === "social" ? "social" : "mindfulness";
}

export function getJourneyModeLabel(mode: JourneyMode): string {
  return (
    JOURNEY_MODE_OPTIONS.find((option) => option.value === mode)?.shortLabel ??
    mode
  );
}

const MODE_RADIUS_MULTIPLIER: Record<JourneyMode, number> = {
  mindfulness: 0.85,
  social: 1.15,
};

const MODE_MAX_RESULTS_MULTIPLIER: Record<JourneyMode, number> = {
  mindfulness: 0.75,
  social: 1.2,
};

const MODE_ROUTE_STOPS_OFFSET: Record<JourneyMode, number> = {
  mindfulness: -2,
  social: 2,
};

const MODE_DETOUR_MULTIPLIER: Record<JourneyMode, number> = {
  mindfulness: 0.55,
  social: 1.1,
};

export type ModePlaceSearch = {
  includedType: string;
  textQuery: string;
  label: string;
};

export const MODE_EXTRA_SEARCHES: Record<JourneyMode, ModePlaceSearch[]> = {
  mindfulness: [
    { includedType: "park", textQuery: "quiet park", label: "Parks" },
    { includedType: "library", textQuery: "public library", label: "Libraries" },
  ],
  social: [
    {
      includedType: "book_store",
      textQuery: "independent bookshop",
      label: "Bookshops",
    },
    {
      includedType: "market",
      textQuery: "local market",
      label: "Markets",
    },
    { includedType: "cafe", textQuery: "coffee meetup cafe", label: "Cafés" },
  ],
};

const SOCIAL_BOOST_TYPES = new Set([
  "bar",
  "cafe",
  "restaurant",
  "bakery",
  "book_store",
  "market",
  "store",
  "clothing_store",
]);

const MINDFULNESS_BOOST_TYPES = new Set([
  "park",
  "library",
  "church",
  "museum",
  "art_gallery",
]);

export function getModeRadiusMultiplier(mode: JourneyMode): number {
  return MODE_RADIUS_MULTIPLIER[mode];
}

export function getModeMaxResultsMultiplier(mode: JourneyMode): number {
  return MODE_MAX_RESULTS_MULTIPLIER[mode];
}

export function getModeRouteStopsOffset(mode: JourneyMode): number {
  return MODE_ROUTE_STOPS_OFFSET[mode];
}

export function getModeDetourMultiplier(mode: JourneyMode): number {
  return MODE_DETOUR_MULTIPLIER[mode];
}

export function scorePlaceForMode(
  place: { rating?: number; distanceMeters?: number; primaryType?: string; types?: string[] },
  mode: JourneyMode,
): number {
  const rating = place.rating ?? 0;
  const distance = place.distanceMeters ?? 0;
  const types = new Set([
    place.primaryType,
    ...(place.types ?? []),
  ].filter(Boolean));

  let typeBoost = 0;
  if (mode === "social") {
    if ([...types].some((type) => SOCIAL_BOOST_TYPES.has(type!))) typeBoost += 0.5;
  } else if ([...types].some((type) => MINDFULNESS_BOOST_TYPES.has(type!))) {
    typeBoost += 0.5;
  }

  if (mode === "mindfulness") {
    // Prefer closer, calmer stops on direct paths.
    const distanceScore = Math.max(0, 1 - distance / 3000);
    return distanceScore * 2 + rating * 0.3 + typeBoost;
  }

  // Social: prefer highly rated, discovery-friendly spots.
  return rating + typeBoost - distance / 5000;
}
