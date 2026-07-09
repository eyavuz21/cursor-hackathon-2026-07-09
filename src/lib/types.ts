export type HealthGoal = "gentle" | "moderate" | "active";
export type Interest = "history" | "food";

export type UserPreferences = {
  healthGoal: HealthGoal;
  interests: Interest[];
};

export type PlaceResult = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  googleMapsUri?: string;
};
