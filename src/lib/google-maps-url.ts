export function getGoogleMapsUrl(options: {
  googleMapsUri?: string;
  lat: number;
  lng: number;
  name?: string;
}): string {
  if (options.googleMapsUri) {
    return options.googleMapsUri;
  }

  if (options.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(options.name)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${options.lat},${options.lng}`;
}
