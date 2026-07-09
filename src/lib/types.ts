export type HealthGoal = "gentle" | "moderate" | "active";

export type HistoryInterest =
  | "museums"
  | "landmarks"
  | "churches"
  | "art_galleries"
  | "historic_sites"
  | "libraries";

export type FoodInterest =
  | "restaurants"
  | "cafes"
  | "bakeries"
  | "bars"
  | "dessert"
  | "quick_bites";

export type Interest = HistoryInterest | FoodInterest;

export type OutingStyle = "scenic" | "direct" | "explorer";

export type OnboardingDetails = {
  outingStyle?: OutingStyle;
};

export type UserPreferences = {
  healthGoal: HealthGoal;
  interests: Interest[];
  details?: OnboardingDetails;
};

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  distanceMeters?: number;
  googleMapsUri?: string;
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type GeocodedDestination = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export type JournalStopType = "start" | "recommendation" | "destination";

export type JournalStop = {
  id: string;
  type: JournalStopType;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  rating?: number;
  googleMapsUri?: string;
  distanceFromPreviousMeters?: number;
};

export type TripPlan = {
  id: string;
  createdAt: string;
  destinationQuery: string;
  destination: GeocodedDestination;
  start: LatLng & { name?: string };
  stops: JournalStop[];
  routePath: LatLng[];
  totalDistanceMeters: number;
};
