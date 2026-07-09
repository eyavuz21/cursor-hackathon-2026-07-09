"use client";

import {
  APIProvider,
  AdvancedMarker,
  Map,
  Pin,
} from "@vis.gl/react-google-maps";
import type { PlaceResult } from "@/lib/types";
import { SearchRadiusCircle } from "@/components/explore/SearchRadiusCircle";
import { MapPlaceLink } from "@/components/maps/MapPlaceLink";

type PlaceMapProps = {
  userLat: number;
  userLng: number;
  searchRadiusMeters: number;
  places: PlaceResult[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
};

export function PlaceMap({
  userLat,
  userLng,
  searchRadiusMeters,
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
        <SearchRadiusCircle
          lat={userLat}
          lng={userLng}
          radiusMeters={searchRadiusMeters}
        />

        <AdvancedMarker position={{ lat: userLat, lng: userLng }}>
          <Pin
            background="#0a0a0a"
            borderColor="#262626"
            glyphColor="#fafaf9"
          />
        </AdvancedMarker>

        {places.map((place) => (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
          >
            <MapPlaceLink
              name={place.name}
              lat={place.lat}
              lng={place.lng}
              googleMapsUri={place.googleMapsUri}
              selected={selectedPlaceId === place.id}
              onSelect={() => onSelectPlace(place.id)}
            />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
