import { NextResponse } from "next/server";
import { ensureServerSession } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeInterests } from "@/lib/interests";
import type {
  HealthGoal,
  OnboardingDetails,
  OutingStyle,
  UserPreferences,
} from "@/lib/types";

const HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];
const OUTING_STYLES: OutingStyle[] = ["scenic", "direct", "explorer"];

function isValidDetails(details: unknown): details is OnboardingDetails {
  if (!details || typeof details !== "object") return true;

  const value = details as OnboardingDetails;

  if (
    value.outingStyle !== undefined &&
    !OUTING_STYLES.includes(value.outingStyle)
  ) {
    return false;
  }

  return true;
}

function parsePreferencesBody(body: unknown): UserPreferences | null {
  if (!body || typeof body !== "object") return null;

  const { healthGoal, interests, details } = body as UserPreferences;

  if (!HEALTH_GOALS.includes(healthGoal)) return null;
  if (!Array.isArray(interests)) return null;

  const normalizedInterests = normalizeInterests(interests as string[]);
  if (normalizedInterests.length === 0) return null;
  if (!isValidDetails(details)) return null;

  return {
    healthGoal,
    interests: normalizedInterests,
    details: parseDetails(details),
  };
}

function getValidationError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Invalid preferences. Provide healthGoal and interests.";
  }

  const { healthGoal, interests, details } = body as UserPreferences;

  if (!HEALTH_GOALS.includes(healthGoal)) {
    return "Invalid health goal. Choose gentle, moderate, or active.";
  }

  if (!Array.isArray(interests) || interests.length === 0) {
    return "Pick at least one history or food interest.";
  }

  const normalizedInterests = normalizeInterests(interests as string[]);
  if (normalizedInterests.length === 0) {
    return "Selected interests are not recognized. Please re-select your preferences.";
  }

  if (!isValidDetails(details)) {
    return "Invalid outing style selected.";
  }

  return null;
}

function parseDetails(raw: unknown): OnboardingDetails | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const details = raw as OnboardingDetails;
  if (!isValidDetails(details)) return undefined;

  return details.outingStyle ? details : undefined;
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const { supabase, user } = await ensureServerSession();

    const { data, error } = await supabase
      .from("user_preferences")
      .select("health_goal, interests, profile_details")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ preferences: null });
    }

    return NextResponse.json({
      preferences: {
        healthGoal: data.health_goal,
        interests: normalizeInterests(data.interests as string[]),
        details: parseDetails(data.profile_details),
      } satisfies UserPreferences,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load preferences",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 500 },
    );
  }

  const body: unknown = await request.json();
  const validationError = getValidationError(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const preferences = parsePreferencesBody(body);
  if (!preferences) {
    return NextResponse.json(
      { error: "Invalid preferences. Provide healthGoal and interests." },
      { status: 400 },
    );
  }

  try {
    const { supabase, user } = await ensureServerSession();

    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        health_goal: preferences.healthGoal,
        interests: preferences.interests,
        profile_details: preferences.details ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save preferences",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const { supabase, user } = await ensureServerSession();

    const { error } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to clear preferences",
      },
      { status: 500 },
    );
  }
}
