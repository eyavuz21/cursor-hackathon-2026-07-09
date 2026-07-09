"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import type { PlaceResult } from "@/lib/types";

type LatLng = {
  lat: number;
  lng: number;
};

type PlaceMapProps = {
  userLocation: LatLng;
  places: PlaceResult[];
  selectedId?: string | null;
  onSelectPlace?: (placeId: string) => void;
};

export function PlaceMap({
  userLocation,
  places,
  selectedId,
  onSelectPlace,
}: PlaceMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-100 px-6 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Add <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{" "}
          to show the map.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={userLocation}
        defaultZoom={14}
        gestureHandling="greedy"
        disableDefaultUI
        className="h-full min-h-[280px] w-full rounded-2xl"
      >
        <Marker position={userLocation} title="You are here" />
        {places.map((place, index) => (
          <Marker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            label={{
              text: String(index + 1),
              color: selectedId === place.id ? "#ffffff" : "#052e16",
            }}
            onClick={() => onSelectPlace?.(place.id)}
            title={place.name}
          />
        ))}
      </Map>
    </APIProvider>
  );
}
