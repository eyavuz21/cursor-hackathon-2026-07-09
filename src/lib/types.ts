export type HealthGoal = "gentle" | "moderate" | "active";
export type Interest = "history" | "food";

export type OutingStyle = "scenic" | "direct" | "explorer";
export type HistoryStyle = "museums" | "landmarks" | "local";
export type FoodStyle = "coffee" | "quick" | "dining";

export type OnboardingDetails = {
  outingStyle?: OutingStyle;
  historyStyle?: HistoryStyle;
  foodStyle?: FoodStyle;
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
  googleMapsUri?: string;
};
