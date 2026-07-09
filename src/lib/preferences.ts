import type { HealthGoal, Interest, UserPreferences } from "./types";

const RADIUS_METERS: Record<HealthGoal, number> = {
  gentle: 800,
  moderate: 2000,
  active: 5000,
};

export function getRadiusMeters(healthGoal: HealthGoal): number {
  return RADIUS_METERS[healthGoal];
}

export function getRadiusLabel(healthGoal: HealthGoal): string {
  return (
    HEALTH_GOAL_OPTIONS.find((option) => option.value === healthGoal)
      ?.radiusLabel ?? ""
  );
}

async function parseResponse(response: Response): Promise<never> {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  throw new Error(data.error ?? "Request failed");
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const response = await fetch("/api/preferences", { credentials: "include" });

  if (!response.ok) {
    await parseResponse(response);
  }

  const data = (await response.json()) as { preferences: UserPreferences | null };
  return data.preferences;
}

export async function savePreferences(
  preferences: UserPreferences,
): Promise<void> {
  const payload = {
    healthGoal: preferences.healthGoal,
    interests: preferences.interests,
    details: preferences.details?.outingStyle
      ? { outingStyle: preferences.details.outingStyle }
      : undefined,
  };

  const response = await fetch("/api/preferences", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseResponse(response);
  }
}

export async function clearPreferences(): Promise<void> {
  const response = await fetch("/api/preferences", {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    await parseResponse(response);
  }
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
