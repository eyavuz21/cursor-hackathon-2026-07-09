"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { HealthGoal, Interest } from "@/lib/types";
import { savePreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { HealthStep } from "@/components/onboarding/HealthStep";
import { InterestsStep } from "@/components/onboarding/InterestsStep";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";

const TOTAL_STEPS = 2;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [healthGoal, setHealthGoal] = useState<HealthGoal | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleNext() {
    if (step === 1 && healthGoal) {
      setStep(2);
      return;
    }

    if (step === 2 && healthGoal && interests.length > 0) {
      setSaving(true);
      setError(null);

      try {
        await savePreferences({ healthGoal, interests });
        router.push("/explore");
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Could not save your preferences. Please try again.",
        );
      } finally {
        setSaving(false);
      }
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  }

  const canContinue =
    (step === 1 && healthGoal !== null) ||
    (step === 2 && interests.length > 0);

  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Wander
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Step {step} of {TOTAL_STEPS}
          </p>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full ${
                  index < step
                    ? "bg-emerald-500"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>

        {step === 1 ? (
          <HealthStep value={healthGoal} onChange={setHealthGoal} />
        ) : (
          <InterestsStep value={interests} onChange={setInterests} />
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={saving}
              className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue || saving}
            className="flex-1 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving
              ? "Saving..."
              : step === TOTAL_STEPS
                ? "Find places"
                : "Continue"}
          </button>
        </div>
      </main>
    </div>
  );
}
