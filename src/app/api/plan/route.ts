import { NextResponse } from "next/server";
import { isInterest, normalizeInterests } from "@/lib/interests";
import { buildTripPlan } from "@/lib/route";
import type { HealthGoal, Interest, OnboardingDetails, PlaceResult } from "@/lib/types";

type PlanRequest = {
  destinationQuery?: string;
  startLat?: number;
  startLng?: number;
  startName?: string;
  healthGoal?: HealthGoal;
  interests?: Interest[];
  details?: OnboardingDetails;
  recommendedPlaces?: PlaceResult[];
  healthOptimisedRoute?: boolean;
};

const HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];

function isPlaceResult(value: unknown): value is PlaceResult {
  if (!value || typeof value !== "object") return false;

  const place = value as PlaceResult;
  return (
    typeof place.id === "string" &&
    typeof place.name === "string" &&
    typeof place.address === "string" &&
    typeof place.lat === "number" &&
    typeof place.lng === "number"
  );
}

function isValidRequest(body: unknown): body is PlanRequest {
  if (!body || typeof body !== "object") return false;

  const value = body as PlanRequest;
  const normalizedInterests = Array.isArray(value.interests)
    ? normalizeInterests(value.interests as string[])
    : [];
  const hasDestination =
    typeof value.destinationQuery === "string" &&
    value.destinationQuery.trim().length > 0;
  const hasRecommendations =
    Array.isArray(value.recommendedPlaces) &&
    value.recommendedPlaces.length > 0 &&
    value.recommendedPlaces.every(isPlaceResult);

  return (
    (hasDestination || hasRecommendations) &&
    typeof value.startLat === "number" &&
    typeof value.startLng === "number" &&
    value.healthGoal !== undefined &&
    HEALTH_GOALS.includes(value.healthGoal) &&
    normalizedInterests.length > 0 &&
    (value.interests as string[]).every(
      (interest) =>
        isInterest(interest) || interest === "history" || interest === "food",
    ) &&
    (value.recommendedPlaces === undefined ||
      (Array.isArray(value.recommendedPlaces) &&
        value.recommendedPlaces.every(isPlaceResult)))
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured." },
      { status: 500 },
    );
  }

  const body: unknown = await request.json();

  if (!isValidRequest(body)) {
    return NextResponse.json(
      {
        error:
          "Invalid request. Provide start coordinates, healthGoal, interests, and either Explore recommendations or a destination.",
      },
      { status: 400 },
    );
  }

  const {
    destinationQuery,
    startLat,
    startLng,
    startName,
    healthGoal,
    interests,
    details,
    recommendedPlaces,
    healthOptimisedRoute,
  } = body;

  const normalizedInterests = normalizeInterests(interests as string[]);

  try {
    const plan = await buildTripPlan(
      apiKey,
      destinationQuery,
      { lat: startLat!, lng: startLng!, name: startName },
      {
        healthGoal: healthGoal!,
        interests: normalizedInterests,
        details,
      },
      {
        healthOptimisedRoute: healthOptimisedRoute === true,
        recommendedPlaces,
      },
    );

    return NextResponse.json({ plan });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not build your trip plan.";

    if (message.includes("Could not find that destination")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
