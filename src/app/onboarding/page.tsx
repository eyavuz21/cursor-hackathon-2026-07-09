"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HealthGoal, JourneyMode, SocialVibe, TimeBudget } from "@/lib/types";
import { getOnboardingSteps, isStepComplete, type OnboardingStepId } from "@/lib/onboarding";
import { derivePreferencesFromMode } from "@/lib/mode-preferences";
import { savePreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { ModeStep } from "@/components/onboarding/ModeStep";
import { ModeFollowUpStep } from "@/components/onboarding/ModeFollowUpStep";
import { LaunchStep } from "@/components/onboarding/LaunchStep";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { StepTransition } from "@/components/onboarding/StepTransition";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";

export default function OnboardingPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [journeyMode, setJourneyMode] = useState<JourneyMode | null>(null);
  const [healthGoal, setHealthGoal] = useState<HealthGoal | null>(null);
  const [socialVibes, setSocialVibes] = useState<SocialVibe[]>([]);
  const [timeBudget, setTimeBudget] = useState<TimeBudget | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = useMemo(() => getOnboardingSteps(), []);
  const effectiveStepIndex = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const currentStep = steps[effectiveStepIndex] ?? steps[0];
  const isLaunch = currentStep === "launch";

  const stepState = useMemo(
    () => ({ journeyMode, healthGoal, socialVibes, timeBudget }),
    [journeyMode, healthGoal, socialVibes, timeBudget],
  );

  const canContinue = isStepComplete(currentStep, stepState);

  function goToStep(nextIndex: number, nextDirection: "forward" | "back") {
    setDirection(nextDirection);
    setStepIndex(nextIndex);
    setError(null);
  }

  function handleModeSelect(mode: JourneyMode) {
    setJourneyMode(mode);
    setHealthGoal(null);
    setSocialVibes([]);
    setTimeBudget(null);

    if (effectiveStepIndex === steps.indexOf("mode")) {
      goToStep(effectiveStepIndex + 1, "forward");
    }
  }

  const handleLaunchComplete = useCallback(async () => {
    if (!journeyMode || saving) return;

    setSaving(true);
    setError(null);

    try {
      const preferences = derivePreferencesFromMode({
        journeyMode,
        healthGoal,
        socialVibes,
        timeBudget: timeBudget ?? undefined,
      });

      await savePreferences(preferences);
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
  }, [healthGoal, journeyMode, router, saving, socialVibes, steps.length, timeBudget]);

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
      case "mode":
        return <ModeStep value={journeyMode} onChange={handleModeSelect} />;
      case "mode-followup":
        return journeyMode ? (
          <ModeFollowUpStep
            journeyMode={journeyMode}
            healthGoal={healthGoal}
            socialVibes={socialVibes}
            timeBudget={timeBudget}
            onHealthGoalChange={setHealthGoal}
            onSocialVibesChange={setSocialVibes}
            onTimeBudgetChange={setTimeBudget}
          />
        ) : null;
      case "launch":
        return journeyMode ? (
          <LaunchStep
            journeyMode={journeyMode}
            healthGoal={healthGoal}
            socialVibes={socialVibes}
            timeBudget={timeBudget}
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
    progressSteps.indexOf(currentStep === "welcome" ? "mode" : currentStep),
  );

  return (
    <OnboardingShell>
      {currentStep !== "welcome" && !isLaunch && (
        <div className="onboarding-animate-fade-in flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-2 bg-highlight" />
            <span className="brand-label">Wander</span>
          </div>
          <p className="brand-label">
            Step {progressIndex + 1} of {progressSteps.length}
          </p>
          <div className="flex gap-1">
            {progressSteps.map((step, index) => (
              <div
                key={step}
                className={`h-0.5 flex-1 transition-colors duration-500 ${
                  index <= progressIndex ? "bg-foreground" : "bg-border"
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
        <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
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
              className="brand-button-secondary disabled:opacity-40"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue || saving}
            className="brand-button-primary flex-1"
          >
            {effectiveStepIndex === steps.length - 2 ? "Craft my wander" : "Continue"}
          </button>
        </div>
      )}
    </OnboardingShell>
  );
}
