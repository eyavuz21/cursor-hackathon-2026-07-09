import { NextResponse } from "next/server";
import { geocodeDestination } from "@/lib/google-places";
import { fetchLiveParkingPrices, isLinkUpConfigured } from "@/lib/linkup-prices";
import { findParkingAlongCorridor } from "@/lib/osm-parking";
import { buildParkingPlan, type ParkingMode } from "@/lib/parking";
import { getSearchRadiusMeters } from "@/lib/places";
import { sampleCorridorPoints } from "@/lib/shopping";
import type { HealthGoal, OnboardingDetails } from "@/lib/types";

type ParkingPlanRequest = {
  mode?: ParkingMode;
  startLat?: number;
  startLng?: number;
  destinationQuery?: string;
  healthGoal?: HealthGoal;
  details?: OnboardingDetails;
};

const HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];
const PARKING_MODES: ParkingMode[] = ["cheapest", "nearest"];

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as ParkingPlanRequest;
  const mode = body.mode ?? "cheapest";

  if (
    typeof body.startLat !== "number" ||
    typeof body.startLng !== "number" ||
    !HEALTH_GOALS.includes(body.healthGoal ?? "moderate")
  ) {
    return NextResponse.json(
      { error: "Provide start coordinates and a valid health goal." },
      { status: 400 },
    );
  }

  if (!PARKING_MODES.includes(mode)) {
    return NextResponse.json(
      { error: "Mode must be cheapest or nearest." },
      { status: 400 },
    );
  }

  const start = { lat: body.startLat, lng: body.startLng };
  const healthGoal = body.healthGoal ?? "moderate";
  const searchRadius = Math.min(
    getSearchRadiusMeters(healthGoal, body.details),
    1_500,
  );

  try {
    let destination:
      | { name: string; address: string; lat: number; lng: number }
      | undefined;

    const trimmedDestination = body.destinationQuery?.trim();
    if (trimmedDestination) {
      const geocoded = await geocodeDestination(
        apiKey,
        trimmedDestination,
        start,
      );

      if (!geocoded) {
        return NextResponse.json(
          { error: "Could not find that destination." },
          { status: 404 },
        );
      }

      destination = geocoded;
    }

    const corridorPoints = sampleCorridorPoints(start, destination);
    const searchPoints = destination
      ? [
          { lat: destination.lat, lng: destination.lng },
          ...corridorPoints.slice(-2),
        ]
      : corridorPoints;

    const lots = await findParkingAlongCorridor(searchPoints, searchRadius);

    const livePrices = isLinkUpConfigured()
      ? await fetchLiveParkingPrices({
          lots,
          lat: destination?.lat ?? start.lat,
          lng: destination?.lng ?? start.lng,
          destinationLabel: destination?.name ?? destination?.address,
        })
      : null;

    const plan = buildParkingPlan({
      mode,
      lots,
      start,
      destination,
      livePrices,
    });

    const priceNote =
      plan.priceSource === "linkup"
        ? "Live web parking prices via LinkUp."
        : isLinkUpConfigured()
          ? "Could not fetch live parking prices right now — ranking by distance."
          : "Add LINKUP_API_KEY to Vercel for live car park prices (app.linkup.so).";

    return NextResponse.json({
      plan,
      destination,
      lotCount: lots.length,
      dataSource: plan.priceSource === "linkup" ? "openstreetmap+linkup" : "openstreetmap",
      priceNote,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not find parking near your journey.",
      },
      { status: 500 },
    );
  }
}
