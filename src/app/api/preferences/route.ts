import { NextResponse } from "next/server";
import { ensureServerSession } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { HealthGoal, Interest, UserPreferences } from "@/lib/types";

const HEALTH_GOALS: HealthGoal[] = ["gentle", "moderate", "active"];
const INTERESTS: Interest[] = ["history", "food"];

function isValidPreferences(body: unknown): body is UserPreferences {
  if (!body || typeof body !== "object") return false;

  const { healthGoal, interests } = body as UserPreferences;

  return (
    HEALTH_GOALS.includes(healthGoal) &&
    Array.isArray(interests) &&
    interests.length > 0 &&
    interests.every((interest) => INTERESTS.includes(interest))
  );
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
      .select("health_goal, interests")
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
        interests: data.interests,
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
