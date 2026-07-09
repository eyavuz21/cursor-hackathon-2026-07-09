import { NextResponse } from "next/server";
import {
  dedupePlaces,
  getIncludedTypes,
  getSearchRadiusMeters,
  normalizePlace,
} from "@/lib/places";
import type { HealthGoal, Interest, OnboardingDetails } from "@/lib/types";

type PlacesRequest = {
  lat: number;
  lng: number;
  healthGoal: HealthGoal;
  interests: Interest[];
  details?: OnboardingDetails;
};

const HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];
const INTERESTS: Interest[] = ["history", "food"];

function isValidRequest(body: unknown): body is PlacesRequest {
  if (!body || typeof body !== "object") return false;

  const { lat, lng, healthGoal, interests } = body as PlacesRequest;

  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    HEALTH_GOALS.includes(healthGoal) &&
    Array.isArray(interests) &&
    interests.length > 0 &&
    interests.every((interest) => INTERESTS.includes(interest))
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
  const radius = getSearchRadiusMeters(healthGoal, details);
  const includedTypes = getIncludedTypes(interests, details);

  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.rating",
      },
      body: JSON.stringify({
        includedTypes,
        maxResultCount: 10,
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
      }),
    },
  );

  const data = (await response.json()) as {
    places?: unknown[];
    error?: { message?: string };
  };

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? "Failed to fetch nearby places." },
      { status: response.status },
    );
  }

  const places = dedupePlaces(
    (data.places ?? [])
      .map((place) => normalizePlace(place as Parameters<typeof normalizePlace>[0]))
      .filter((place): place is NonNullable<typeof place> => place !== null),
  );

  return NextResponse.json({ places });
}
