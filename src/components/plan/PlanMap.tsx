"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  Polyline,
} from "@vis.gl/react-google-maps";
import type { JournalStop, LatLng } from "@/lib/types";
import { formatDistance } from "@/lib/route";
import { formatWalkDuration } from "@/lib/health-route";
import { RouteStopMarker } from "@/components/maps/RouteStopMarker";
import { FitRouteBounds } from "@/components/plan/FitRouteBounds";

type PlanMapProps = {
  stops: JournalStop[];
  routePath: LatLng[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string) => void;
  totalDistanceMeters?: number;
  estimatedDurationMinutes?: number;
};

export function PlanMap({
  stops,
  routePath,
  selectedStopId,
  onSelectStop,
  totalDistanceMeters,
  estimatedDurationMinutes,
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
  const stopCount = stops.length;
  const boundsPath = routePath.length > 0 ? routePath : stops;

  return (
    <div className="relative h-full min-h-[320px] w-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: center.lat, lng: center.lng }}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI
          mapId="wander-plan-map"
          className="h-full w-full border border-border"
        >
          <FitRouteBounds path={boundsPath} />

          {routePath.length > 1 && (
            <Polyline
              path={routePath}
              strokeColor="#4285F4"
              strokeOpacity={0.9}
              strokeWeight={5}
            />
          )}

          {stops.map((stop, index) => (
            <AdvancedMarker
              key={stop.id}
              position={{ lat: stop.lat, lng: stop.lng }}
            >
              <RouteStopMarker
                index={index}
                name={stop.name}
                selected={selectedStopId === stop.id}
                isDestination={stop.type === "destination"}
                onSelect={() => onSelectStop(stop.id)}
              />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>

      {totalDistanceMeters !== undefined && stopCount > 0 && (
        <div className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-lg border border-border bg-background/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <p className="text-sm font-medium text-foreground">
            {estimatedDurationMinutes !== undefined
              ? formatWalkDuration(estimatedDurationMinutes)
              : "Walking route"}
          </p>
          <p className="text-xs text-muted">
            {formatDistance(totalDistanceMeters)} · {stopCount} stops
          </p>
        </div>
      )}
    </div>
  );
}
