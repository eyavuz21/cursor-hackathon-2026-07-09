import { getJourneyMode, scorePlaceForMode } from "@/lib/modes";
import type { OnboardingDetails, PlaceResult, UserPreferences } from "@/lib/types";

/** Higher = better. Rating-first, with onboarding mode fit and review volume. */
export function scorePlaceForJourney(
  place: PlaceResult,
  details?: OnboardingDetails,
): number {
  const mode = getJourneyMode(details);
  const rating = place.rating ?? 0;
  const reviewCount = place.userRatingCount ?? 0;
  const reviewConfidence = Math.min(Math.log10(reviewCount + 1), 3) * 0.25;
  const modeFit = scorePlaceForMode(place, mode);

  return rating * 2.5 + reviewConfidence + modeFit * 0.6;
}

export function rankPlacesForJourney(
  places: PlaceResult[],
  details?: OnboardingDetails,
): PlaceResult[] {
  return [...places].sort(
    (a, b) => scorePlaceForJourney(b, details) - scorePlaceForJourney(a, details),
  );
}

export function getTopRatedPlaces(
  places: PlaceResult[],
  limit: number,
  details?: OnboardingDetails,
): PlaceResult[] {
  if (limit <= 0) return [];
  return rankPlacesForJourney(places, details).slice(0, limit);
}

export function rankPlacesForPreferences(
  places: PlaceResult[],
  preferences: UserPreferences,
): PlaceResult[] {
  return rankPlacesForJourney(places, preferences.details);
}
