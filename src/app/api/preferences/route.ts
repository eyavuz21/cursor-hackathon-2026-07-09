import { NextResponse } from "next/server";
import { ensureServerSession } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isInterest, normalizeInterests } from "@/lib/interests";
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

function isValidPreferences(body: unknown): body is UserPreferences {
  if (!body || typeof body !== "object") return false;

  const { healthGoal, interests, details } = body as UserPreferences;

  return (
    HEALTH_GOALS.includes(healthGoal) &&
    Array.isArray(interests) &&
    interests.length > 0 &&
    interests.every((interest) => isInterest(interest)) &&
    isValidDetails(details)
  );
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

  if (!isValidPreferences(body)) {
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
        health_goal: body.healthGoal,
        interests: body.interests,
        profile_details: body.details ?? {},
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
