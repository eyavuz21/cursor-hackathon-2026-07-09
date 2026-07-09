"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  Polyline,
} from "@vis.gl/react-google-maps";
import type { JournalStop, LatLng } from "@/lib/types";

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
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        Map unavailable — set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment.
      </div>
    );
  }

  const center = stops[0] ?? { lat: 0, lng: 0 };
  let recommendationIndex = 0;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={{ lat: center.lat, lng: center.lng }}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI
        mapId="wander-plan-map"
        className="h-full min-h-[320px] w-full rounded-2xl"
      >
        <Polyline
          path={routePath}
          strokeColor="#10b981"
          strokeOpacity={0.85}
          strokeWeight={4}
        />

        {stops.map((stop) => {
          if (stop.type === "recommendation") {
            recommendationIndex += 1;
          }

          const label =
            stop.type === "recommendation" ? String(recommendationIndex) : null;

          return (
            <AdvancedMarker
              key={stop.id}
              position={{ lat: stop.lat, lng: stop.lng }}
              onClick={() => onSelectStop(stop.id)}
            >
              {stop.type === "start" ? (
                <Pin
                  background="#3b82f6"
                  borderColor="#1d4ed8"
                  glyphColor="#ffffff"
                />
              ) : stop.type === "destination" ? (
                <Pin
                  background="#059669"
                  borderColor="#047857"
                  glyphColor="#ffffff"
                />
              ) : (
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold shadow-md ${
                    selectedStopId === stop.id
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-white bg-zinc-900 text-white"
                  }`}
                >
                  {label}
                </div>
              )}
            </AdvancedMarker>
          );
        })}
      </Map>
    </APIProvider>
  );
}
