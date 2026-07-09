"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
} from "@vis.gl/react-google-maps";
import type { PlaceResult } from "@/lib/types";

type PlaceMapProps = {
  userLat: number;
  userLng: number;
  places: PlaceResult[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
};

export function PlaceMap({
  userLat,
  userLng,
  places,
  selectedPlaceId,
  onSelectPlace,
}: PlaceMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={{ lat: userLat, lng: userLng }}
        defaultZoom={14}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="wander-explore-map"
        className="h-full min-h-[280px] w-full rounded-2xl"
      >
        <AdvancedMarker position={{ lat: userLat, lng: userLng }}>
          <Pin
            background="#3b82f6"
            borderColor="#1d4ed8"
            glyphColor="#ffffff"
          />
        </AdvancedMarker>

        {places.map((place, index) => (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            onClick={() => onSelectPlace(place.id)}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold shadow-md ${
                selectedPlaceId === place.id
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-white bg-zinc-900 text-white"
              }`}
            >
              {index + 1}
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
