"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

type SearchRadiusCircleProps = {
  lat: number;
  lng: number;
  radiusMeters: number;
};

export function SearchRadiusCircle({
  lat,
  lng,
  radiusMeters,
}: SearchRadiusCircleProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || radiusMeters <= 0) return;

    const center = { lat, lng };
    const circle = new google.maps.Circle({
      map,
      center,
      radius: radiusMeters,
      fillColor: "#10b981",
      fillOpacity: 0.12,
      strokeColor: "#059669",
      strokeOpacity: 0.7,
      strokeWeight: 2,
      clickable: false,
    });

    const bounds = circle.getBounds();
    if (bounds) {
      map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    }

    return () => {
      circle.setMap(null);
    };
  }, [map, lat, lng, radiusMeters]);

  return null;
}
