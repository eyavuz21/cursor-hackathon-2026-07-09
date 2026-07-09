import { NextResponse } from "next/server";
import { isInterest, normalizeInterests } from "@/lib/interests";
import { geocodeDestination } from "@/lib/google-places";
import { buildTripPlan } from "@/lib/route";
import type { HealthGoal, Interest, OnboardingDetails } from "@/lib/types";

type PlanRequest = {
  destinationQuery?: string;
  startLat?: number;
  startLng?: number;
  startName?: string;
  healthGoal?: HealthGoal;
  interests?: Interest[];
  details?: OnboardingDetails;
  healthOptimisedRoute?: boolean;
};

const HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];

function isValidRequest(body: unknown): body is PlanRequest {
  if (!body || typeof body !== "object") return false;

  const value = body as PlanRequest;
  const normalizedInterests = Array.isArray(value.interests)
    ? normalizeInterests(value.interests as string[])
    : [];

  return (
    typeof value.destinationQuery === "string" &&
    value.destinationQuery.trim().length > 0 &&
    typeof value.startLat === "number" &&
    typeof value.startLng === "number" &&
    value.healthGoal !== undefined &&
    HEALTH_GOALS.includes(value.healthGoal) &&
    normalizedInterests.length > 0 &&
    (value.interests as string[]).every(
      (interest) =>
        isInterest(interest) || interest === "history" || interest === "food",
    )
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
          "Invalid request. Provide destination, start coordinates, healthGoal, and interests.",
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
    healthOptimisedRoute,
  } = body;

  const query = destinationQuery!.trim();
  const normalizedInterests = normalizeInterests(interests as string[]);

  try {
    const destination = await geocodeDestination(
      apiKey,
      query,
      { lat: startLat!, lng: startLng! },
    );

    if (!destination) {
      return NextResponse.json(
        { error: "Could not find that destination. Try a city or landmark name." },
        { status: 404 },
      );
    }

    const plan = await buildTripPlan(
      apiKey,
      query,
      { lat: startLat!, lng: startLng!, name: startName },
      destination,
      {
        healthGoal: healthGoal!,
        interests: normalizedInterests,
        details,
      },
      { healthOptimisedRoute: healthOptimisedRoute === true },
    );

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not build your trip plan.",
      },
      { status: 500 },
    );
  }
}
