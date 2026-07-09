import type { HealthGoal, Interest, UserPreferences } from "./types";

export const PREFERENCES_STORAGE_KEY = "wander-preferences";

const RADIUS_METERS: Record<HealthGoal, number> = {
  gentle: 800,
  moderate: 2000,
  active: 5000,
};

export function getRadiusMeters(healthGoal: HealthGoal): number {
  return RADIUS_METERS[healthGoal];
}

export function getPreferences(): UserPreferences | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as UserPreferences;
    if (!parsed.healthGoal || !Array.isArray(parsed.interests)) return null;
    if (parsed.interests.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePreferences(preferences: UserPreferences): void {
  window.localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
}

export function clearPreferences(): void {
  window.localStorage.removeItem(PREFERENCES_STORAGE_KEY);
}

export const HEALTH_GOAL_OPTIONS: {
  value: HealthGoal;
  label: string;
  description: string;
  radiusLabel: string;
}[] = [
  {
    value: "gentle",
    label: "Gentle stroll",
    description: "Short, easy walks — about 10 minutes between stops.",
    radiusLabel: "800 m radius",
  },
  {
    value: "moderate",
    label: "Moderate walk",
    description: "A comfortable pace — around 25 minutes between stops.",
    radiusLabel: "2 km radius",
  },
  {
    value: "active",
    label: "Active explorer",
    description: "Ready to roam — up to an hour between stops.",
    radiusLabel: "5 km radius",
  },
];

export const INTEREST_OPTIONS: {
  value: Interest;
  label: string;
  description: string;
}[] = [
  {
    value: "history",
    label: "History",
    description: "Museums, landmarks, and cultural sites.",
  },
  {
    value: "food",
    label: "Food",
    description: "Restaurants, cafés, and bakeries.",
  },
];
