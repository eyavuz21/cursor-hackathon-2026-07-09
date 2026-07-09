import type {
  HealthGoal,
  Interest,
  OnboardingDetails,
  PlaceResult,
} from "./types";
import { getRadiusMeters } from "./preferences";

const INTEREST_TYPES: Record<Interest, string[]> = {
  museums: ["museum"],
  landmarks: ["tourist_attraction"],
  churches: ["church"],
  art_galleries: ["art_gallery"],
  historic_sites: ["monument", "tourist_attraction"],
  libraries: ["library"],
  restaurants: ["restaurant"],
  cafes: ["cafe"],
  bakeries: ["bakery"],
  bars: ["bar"],
  dessert: ["ice_cream_shop"],
  quick_bites: ["meal_takeaway"],
};

const OUTING_RADIUS_MULTIPLIER: Record<
  NonNullable<OnboardingDetails["outingStyle"]>,
  number
> = {
  scenic: 0.9,
  direct: 1,
  explorer: 1.15,
};

export function getSearchRadiusMeters(
  healthGoal: HealthGoal,
  details?: OnboardingDetails,
): number {
  const base = getRadiusMeters(healthGoal);
  const multiplier = details?.outingStyle
    ? OUTING_RADIUS_MULTIPLIER[details.outingStyle]
    : 1;

  return Math.round(base * multiplier);
}

export function getIncludedTypes(interests: Interest[]): string[] {
  const types = new Set<string>();

  for (const interest of interests) {
    for (const type of INTEREST_TYPES[interest]) {
      types.add(type);
    }
  }

  return Array.from(types);
}

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  googleMapsUri?: string;
};

export function normalizePlace(place: GooglePlace): PlaceResult | null {
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;

  if (!place.id || lat === undefined || lng === undefined) {
    return null;
  }

  return {
    id: place.id,
    name: place.displayName?.text ?? "Unknown place",
    address: place.formattedAddress ?? "",
    lat,
    lng,
    rating: place.rating,
    googleMapsUri: place.googleMapsUri,
  };
}

export function dedupePlaces(places: PlaceResult[]): PlaceResult[] {
  const seen = new Set<string>();

  return places.filter((place) => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}
