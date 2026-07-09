"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  HealthGoal,
  Interest,
  OnboardingDetails,
  OutingStyle,
} from "@/lib/types";
import {
  getOnboardingSteps,
  isStepComplete,
  OUTING_STYLE_OPTIONS,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { savePreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { HealthStep } from "@/components/onboarding/HealthStep";
import { InterestsStep } from "@/components/onboarding/InterestsStep";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { HealthFollowUpStep } from "@/components/onboarding/HealthFollowUpStep";
import { LaunchStep } from "@/components/onboarding/LaunchStep";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepTransition } from "@/components/onboarding/StepTransition";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [healthGoal, setHealthGoal] = useState<HealthGoal | null>(null);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [details, setDetails] = useState<OnboardingDetails>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(() => getOnboardingSteps(), []);
  const effectiveStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[effectiveStepIndex] ?? steps[0];
  const isLaunch = currentStep === "launch";

  const stepState = useMemo(
    () => ({ healthGoal, interests, details }),
    [healthGoal, interests, details],
  );

  const canContinue = isStepComplete(currentStep, stepState);

  function goToStep(nextIndex: number, nextDirection: "forward" | "back") {
    setDirection(nextDirection);
    setStepIndex(nextIndex);
    setError(null);
  }

  function handleHealthGoalChange(goal: HealthGoal) {
    setHealthGoal(goal);
    setDetails((current) => ({
      ...current,
      outingStyle: undefined,
    }));
  }

  function handleInterestsChange(nextInterests: Interest[]) {
    setInterests(nextInterests);
  }

  const handleLaunchComplete = useCallback(async () => {
    if (!healthGoal || saving) return;

    setSaving(true);
    setError(null);

    try {
      await savePreferences({ healthGoal, interests, details });
      router.push("/explore");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save your preferences. Please try again.",
      );
      setSaving(false);
      setStepIndex(Math.max(0, steps.length - 2));
      setDirection("back");
    }
  }, [details, healthGoal, interests, router, saving, steps.length]);

  function handleNext() {
    if (!canContinue || saving) return;

    if (currentStep === "launch") return;

    const nextIndex = effectiveStepIndex + 1;
    if (nextIndex < steps.length) {
      goToStep(nextIndex, "forward");
    }
  }

  function handleBack() {
    if (effectiveStepIndex > 0 && !isLaunch) {
      goToStep(effectiveStepIndex - 1, "back");
    }
  }

  function renderStep(step: OnboardingStepId) {
    switch (step) {
      case "welcome":
        return <WelcomeStep onStart={handleNext} />;
      case "health":
        return (
          <HealthStep value={healthGoal} onChange={handleHealthGoalChange} />
        );
      case "health-followup":
        return healthGoal ? (
          <HealthFollowUpStep
            healthGoal={healthGoal}
            value={details.outingStyle}
            onChange={(outingStyle: OutingStyle) =>
              setDetails((current) => ({ ...current, outingStyle }))
            }
          />
        ) : null;
      case "interests":
        return (
          <InterestsStep value={interests} onChange={handleInterestsChange} />
        );
      case "launch":
        return healthGoal ? (
          <LaunchStep
            healthGoal={healthGoal}
            interests={interests}
            details={details}
            onComplete={handleLaunchComplete}
          />
        ) : null;
    }
  }

  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  const progressSteps = steps.filter((step) => step !== "welcome");
  const progressIndex = Math.max(
    0,
    progressSteps.indexOf(currentStep === "welcome" ? "health" : currentStep),
  );

  return (
    <OnboardingShell>
      {currentStep !== "welcome" && !isLaunch && (
        <div className="onboarding-animate-fade-in flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Wander
            </span>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Step {progressIndex + 1} of {progressSteps.length}
          </p>
          <div className="flex gap-2">
            {progressSteps.map((step, index) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                  index <= progressIndex
                    ? "bg-emerald-500"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <StepTransition stepKey={currentStep} direction={direction}>
        {renderStep(currentStep)}
      </StepTransition>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {currentStep !== "welcome" && !isLaunch && (
        <div className="onboarding-animate-fade-up flex gap-3">
          {effectiveStepIndex > 0 && (
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
            {effectiveStepIndex === steps.length - 2 ? "Craft my wander" : "Continue"}
          </button>
        </div>
      )}
    </OnboardingShell>
  );
}
