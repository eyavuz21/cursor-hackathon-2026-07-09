import { NextResponse } from "next/server";
import { findNearbySupermarkets } from "@/lib/osm-shops";

type ShopsRequest = {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ShopsRequest;

  if (typeof body.lat !== "number" || typeof body.lng !== "number") {
    return NextResponse.json(
      { error: "Provide lat and lng for supermarket search." },
      { status: 400 },
    );
  }

  try {
    const shops = await findNearbySupermarkets(
      body.lat,
      body.lng,
      body.radiusMeters ?? 1_500,
    );

    return NextResponse.json({ shops });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to find nearby supermarkets.",
      },
      { status: 500 },
    );
  }
}
