"use client";

type WelcomeStepProps = {
  onStart: () => void;
};

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-start gap-8">
      <div className="flex flex-col gap-4">
        <p className="onboarding-animate-fade-up onboarding-delay-1 brand-label">
          Travel Guide
        </p>
        <h1 className="onboarding-animate-fade-up onboarding-delay-2 brand-heading text-4xl">
          Let&apos;s plan your perfect wander
        </h1>
        <p className="onboarding-animate-fade-up onboarding-delay-3 max-w-md text-base leading-relaxed text-muted">
          Pick your vibe, answer one quick question, and we&apos;ll surface nearby
          spots made for you.
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="onboarding-animate-fade-up onboarding-delay-4 brand-button-primary w-full"
      >
        Let&apos;s go
      </button>
    </div>
  );
}
