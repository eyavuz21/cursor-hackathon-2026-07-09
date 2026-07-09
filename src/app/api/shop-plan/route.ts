import { NextResponse } from "next/server";
import { geocodeDestination } from "@/lib/google-places";
import { fetchLiveBasketPrices, isLinkUpConfigured } from "@/lib/linkup-prices";
import { findSupermarketsAlongCorridor } from "@/lib/osm-shops";
import {
  buildShopPlan,
  parseShoppingList,
  sampleCorridorPoints,
  type ShoppingMode,
} from "@/lib/shopping";
import { getSearchRadiusMeters } from "@/lib/places";
import type { HealthGoal, OnboardingDetails } from "@/lib/types";

type ShopPlanRequest = {
  list?: string;
  mode?: ShoppingMode;
  startLat?: number;
  startLng?: number;
  destinationQuery?: string;
  healthGoal?: HealthGoal;
  details?: OnboardingDetails;
};

const HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];
const SHOPPING_MODES: ShoppingMode[] = ["scavenger", "efficiency"];

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as ShopPlanRequest;
  const items = parseShoppingList(body.list ?? "");
  const mode = body.mode ?? "efficiency";

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Add at least one item to your shopping list." },
      { status: 400 },
    );
  }

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

  if (!SHOPPING_MODES.includes(mode)) {
    return NextResponse.json(
      { error: "Mode must be scavenger or efficiency." },
      { status: 400 },
    );
  }

  const start = { lat: body.startLat, lng: body.startLng };
  const healthGoal = body.healthGoal ?? "moderate";
  const searchRadius = Math.min(
    getSearchRadiusMeters(healthGoal, body.details),
    2_500,
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
    const shops = await findSupermarketsAlongCorridor(
      corridorPoints,
      searchRadius,
    );

    const livePrices = isLinkUpConfigured()
      ? await fetchLiveBasketPrices({
          items,
          shops,
          lat: start.lat,
          lng: start.lng,
        })
      : null;

    const plan = buildShopPlan({
      mode,
      items,
      shops,
      start,
      destination,
      livePrices: livePrices
        ? {
            quotes: livePrices.quotes,
            basketWinnerShopId: livePrices.basketWinnerShopId,
            basketWinnerShopName: livePrices.basketWinnerShopName,
            summary: livePrices.summary,
            sources: livePrices.sources,
          }
        : null,
    });

    const priceNote = plan.priceSource === "linkup"
      ? "Live web prices via LinkUp (ParkAndSave integration)."
      : isLinkUpConfigured()
        ? "Could not fetch live prices right now — using route-based supermarket matching."
        : "Add LINKUP_API_KEY for live grocery prices (ParkAndSave / LinkUp integration).";

    return NextResponse.json({
      plan,
      destination,
      shopCount: shops.length,
      dataSource: plan.priceSource === "linkup" ? "openstreetmap+linkup" : "openstreetmap",
      priceNote,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not build your shopping route.",
      },
      { status: 500 },
    );
  }
}
