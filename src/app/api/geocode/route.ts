import { NextResponse } from "next/server";
import { geocodeDestination } from "@/lib/google-places";

type GeocodeRequest = {
  query?: string;
  biasLat?: number;
  biasLng?: number;
};

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Maps API key is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as GeocodeRequest;
  const query = body.query?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Please enter a destination." },
      { status: 400 },
    );
  }

  const bias =
    typeof body.biasLat === "number" && typeof body.biasLng === "number"
      ? { lat: body.biasLat, lng: body.biasLng }
      : undefined;

  try {
    const destination = await geocodeDestination(apiKey, query, bias);

    if (!destination) {
      return NextResponse.json(
        { error: "Could not find that destination. Try a city or landmark name." },
        { status: 404 },
      );
    }

    return NextResponse.json({ destination });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not find that destination.",
      },
      { status: 500 },
    );
  }
}
