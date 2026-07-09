import { NextResponse } from "next/server";
import { getRadiusMeters } from "@/lib/preferences";
import { getIncludedTypes, normalizePlace } from "@/lib/places";
import type { HealthGoal, Interest } from "@/lib/types";

type PlacesRequestBody = {
  lat?: number;
  lng?: number;
  healthGoal?: HealthGoal;
  interests?: Interest[];
};

const VALID_HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];
const VALID_INTERESTS: Interest[] = ["history", "food"];

function isValidRequest(body: PlacesRequestBody) {
  return (
    typeof body.lat === "number" &&
    typeof body.lng === "number" &&
    body.healthGoal !== undefined &&
    VALID_HEALTH_GOALS.includes(body.healthGoal) &&
    Array.isArray(body.interests) &&
    body.interests.length > 0 &&
    body.interests.every((interest) => VALID_INTERESTS.includes(interest))
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

  let body: PlacesRequestBody;

  try {
    body = (await request.json()) as PlacesRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidRequest(body)) {
    return NextResponse.json(
      { error: "lat, lng, healthGoal, and interests are required." },
      { status: 400 },
    );
  }

  const { lat, lng, healthGoal, interests } = body;
  const radius = getRadiusMeters(healthGoal!);
  const includedTypes = getIncludedTypes(interests!);

  try {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places API error:", errorText);
      return NextResponse.json(
        { error: "Could not fetch nearby places." },
        { status: response.status },
      );
    }

    const data = (await response.json()) as { places?: unknown[] };
    const places = (data.places ?? [])
      .map((place) => normalizePlace(place as Parameters<typeof normalizePlace>[0]))
      .filter((place): place is NonNullable<typeof place> => place !== null);

    return NextResponse.json({ places });
  } catch (error) {
    console.error("Places route error:", error);
    return NextResponse.json(
      { error: "Could not fetch nearby places." },
      { status: 500 },
    );
  }
}
