"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  Polyline,
} from "@vis.gl/react-google-maps";
import type { JournalStop, LatLng } from "@/lib/types";
import { MapPlaceLink } from "@/components/maps/MapPlaceLink";

type PlanMapProps = {
  stops: JournalStop[];
  routePath: LatLng[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
};

export function PlanMap({
  stops,
  routePath,
  selectedStopId,
  onSelectStop,
}: PlanMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="brand-card flex h-full min-h-[280px] items-center justify-center p-6 text-center text-sm text-muted">
        Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
      </div>
    );
  }

  const center = stops[0] ?? { lat: 0, lng: 0 };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={{ lat: center.lat, lng: center.lng }}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="wander-plan-map"
        className="h-full min-h-[320px] w-full border border-border"
      >
        <Polyline
          path={routePath}
          strokeColor="#0a0a0a"
          strokeOpacity={0.85}
          strokeWeight={3}
        />

        {stops.map((stop) => (
          <AdvancedMarker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
          >
            {stop.type === "start" ? (
              <Pin
                background="#0a0a0a"
                borderColor="#262626"
                glyphColor="#fafaf9"
              />
            ) : (
              <MapPlaceLink
                name={stop.name}
                lat={stop.lat}
                lng={stop.lng}
                googleMapsUri={stop.googleMapsUri}
                selected={selectedStopId === stop.id}
                onSelect={() => onSelectStop(stop.id)}
              />
            )}
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
