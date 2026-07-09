"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/lib/types";

type FitRouteBoundsProps = {
  path: LatLng[];
  padding?: number;
};

export function FitRouteBounds({ path, padding = 56 }: FitRouteBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || path.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    for (const point of path) {
      bounds.extend(point);
    }

    map.fitBounds(bounds, {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding,
    });
  }, [map, path, padding]);

  return null;
}
