import { NextResponse } from "next/server";
import { isInterest, normalizeInterests } from "@/lib/interests";
import { getSearchRadiusMeters, searchRecommendations } from "@/lib/places";
import type { HealthGoal, Interest, OnboardingDetails } from "@/lib/types";

type PlacesRequest = {
  lat: number;
  lng: number;
  healthGoal: HealthGoal;
  interests: Interest[];
  details?: OnboardingDetails;
};

const HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];

function isValidRequest(body: unknown): body is PlacesRequest {
  if (!body || typeof body !== "object") return false;

  const { lat, lng, healthGoal, interests } = body as PlacesRequest;
  const normalizedInterests = Array.isArray(interests)
    ? normalizeInterests(interests as string[])
    : [];

  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    HEALTH_GOALS.includes(healthGoal) &&
    normalizedInterests.length > 0 &&
    (interests as string[]).every(
      (interest) =>
        isInterest(interest) || interest === "history" || interest === "food",
    )
  );
}

export async function POST(request: Request) {
  const body: unknown = await request.json();

  if (!isValidRequest(body)) {
    return NextResponse.json(
      { error: "Invalid request. Provide lat, lng, healthGoal, and interests." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured." },
      { status: 500 },
    );
  }

  const { lat, lng, healthGoal, interests, details } = body;
  const normalizedInterests = normalizeInterests(interests as string[]);
  const searchRadiusMeters = getSearchRadiusMeters(healthGoal, details);

  try {
    const places = await searchRecommendations({
      apiKey,
      lat,
      lng,
      healthGoal,
      interests: normalizedInterests,
      details,
    });

    return NextResponse.json({ places, searchRadiusMeters });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch nearby places.",
      },
      { status: 500 },
    );
  }
}
