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
      <div className="brand-card flex h-full min-h-[280px] items-center justify-center p-6 text-center text-sm text-muted">
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
        className="h-full min-h-[280px] w-full border border-border"
      >
        <AdvancedMarker position={{ lat: userLat, lng: userLng }}>
          <Pin
            background="#0a0a0a"
            borderColor="#262626"
            glyphColor="#fafaf9"
          />
        </AdvancedMarker>

        {places.map((place, index) => (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            onClick={() => onSelectPlace(place.id)}
          >
            <div
              className={`flex h-7 w-7 items-center justify-center border-2 text-xs font-medium shadow-md ${
                selectedPlaceId === place.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-white bg-foreground text-background"
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
