import { haversineMeters } from "@/lib/route";
import type { ParkingLot } from "@/lib/osm-parking";
import type { LatLng } from "@/lib/types";

export type ParkingMode = "cheapest" | "nearest";

export type ParkingPriceQuote = {
  lotId: string | null;
  lotName: string;
  priceGbpPerHour: number;
  note?: string;
};

export type LiveParkingPriceInput = {
  quotes: ParkingPriceQuote[];
  cheapestLotId: string | null;
  cheapestLotName: string | null;
  summary: string | null;
  sources: Array<{ name: string; url: string }>;
};

export type ParkingOption = {
  lot: ParkingLot;
  detourMeters: number;
  priceGbpPerHour?: number;
  priceNote?: string;
};

export type ParkingPlan = {
  mode: ParkingMode;
  options: ParkingOption[];
  recommendedLotId: string | null;
  priceSource?: "linkup" | "distance";
  priceSummary?: string | null;
  priceSources?: Array<{ name: string; url: string }>;
};

export function formatPriceGbp(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDetour(meters: number): string {
  if (meters < 60) return "minimal detour";
  if (meters < 1000) return `+${meters} m detour`;
  return `+${(meters / 1000).toFixed(1)} km detour`;
}

function detourMeters(
  lot: ParkingLot,
  start: LatLng,
  destination?: LatLng,
): number {
  if (!destination) {
    return lot.distanceMeters;
  }

  const direct = haversineMeters(start, destination);
  const viaLot =
    haversineMeters(start, lot) + haversineMeters(lot, destination);

  return Math.max(0, viaLot - direct);
}

export function buildParkingPlan(input: {
  mode: ParkingMode;
  lots: ParkingLot[];
  start: LatLng;
  destination?: LatLng;
  livePrices?: LiveParkingPriceInput | null;
  limit?: number;
}): ParkingPlan {
  const limit = input.limit ?? 6;
  const priceByLotId = new Map<string, ParkingPriceQuote>();

  for (const quote of input.livePrices?.quotes ?? []) {
    if (quote.lotId) {
      priceByLotId.set(quote.lotId, quote);
    }
  }

  const options: ParkingOption[] = input.lots.slice(0, limit).map((lot) => {
    const matchedQuote =
      priceByLotId.get(lot.id) ??
      (input.livePrices?.quotes ?? []).find(
        (quote) =>
          quote.lotName.toLowerCase() === lot.name.toLowerCase() ||
          lot.name.toLowerCase().includes(quote.lotName.toLowerCase()) ||
          quote.lotName.toLowerCase().includes(lot.name.toLowerCase()),
      );

    return {
      lot,
      detourMeters: detourMeters(lot, input.start, input.destination),
      priceGbpPerHour: matchedQuote?.priceGbpPerHour,
      priceNote: matchedQuote?.note,
    };
  });

  const ranked =
    input.mode === "cheapest" && input.livePrices
      ? [...options].sort((a, b) => {
          const priceA = a.priceGbpPerHour ?? Number.POSITIVE_INFINITY;
          const priceB = b.priceGbpPerHour ?? Number.POSITIVE_INFINITY;
          if (priceA !== priceB) return priceA - priceB;
          return a.detourMeters - b.detourMeters;
        })
      : [...options].sort((a, b) => {
          const destDistance = input.destination
            ? haversineMeters(a.lot, input.destination) -
              haversineMeters(b.lot, input.destination)
            : a.lot.distanceMeters - b.lot.distanceMeters;
          if (destDistance !== 0) return destDistance;
          return a.detourMeters - b.detourMeters;
        });

  const recommended =
    ranked.find((option) => option.priceGbpPerHour != null) ?? ranked[0] ?? null;

  return {
    mode: input.mode,
    options: ranked,
    recommendedLotId: recommended?.lot.id ?? null,
    priceSource: input.livePrices?.quotes.length ? "linkup" : "distance",
    priceSummary: input.livePrices?.summary ?? null,
    priceSources: input.livePrices?.sources ?? [],
  };
}
