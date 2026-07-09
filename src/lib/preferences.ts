import type { HealthGoal, Interest, UserPreferences } from "./types";
import { createClient } from "./supabase/client";

const RADIUS_METERS: Record<HealthGoal, number> = {
  gentle: 800,
  moderate: 2000,
  active: 5000,
};

type PreferencesRow = {
  health_goal: HealthGoal;
  interests: Interest[];
};

export function getRadiusMeters(healthGoal: HealthGoal): number {
  return RADIUS_METERS[healthGoal];
}

async function ensureSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }

  return supabase;
}

function parsePreferencesRow(row: PreferencesRow): UserPreferences | null {
  if (!row.health_goal || !Array.isArray(row.interests)) return null;
  if (row.interests.length === 0) return null;

  return {
    healthGoal: row.health_goal,
    interests: row.interests,
  };
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const supabase = await ensureSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("health_goal, interests")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  return parsePreferencesRow(data as PreferencesRow);
}

export async function savePreferences(
  preferences: UserPreferences,
): Promise<void> {
  const supabase = await ensureSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user");
  }

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      health_goal: preferences.healthGoal,
      interests: preferences.interests,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
}

export async function clearPreferences(): Promise<void> {
  const supabase = await ensureSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("user_preferences")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
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
