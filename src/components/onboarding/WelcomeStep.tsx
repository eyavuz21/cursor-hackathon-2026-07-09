"use client";

type WelcomeStepProps = {
  onStart: () => void;
};

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-emerald-400/40"
          style={{ animation: "onboarding-pulse-ring 2.4s ease-out infinite" }}
        />
        <span
          aria-hidden
          className="absolute inset-3 rounded-full border border-emerald-500/30"
          style={{
            animation: "onboarding-pulse-ring 2.4s ease-out infinite 0.6s",
          }}
        />
        <div
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
          style={{ animation: "onboarding-fade-up 0.6s ease both" }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            style={{ animation: "onboarding-compass-spin 12s linear infinite" }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            <path d="m14.5 9.5-2 5-5 2 2-5 5-2z" fill="currentColor" stroke="none" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="onboarding-animate-fade-up onboarding-delay-1 font-mono text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
          Welcome to Wander
        </p>
        <h1 className="onboarding-animate-fade-up onboarding-delay-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Let&apos;s plan your perfect wander
        </h1>
        <p className="onboarding-animate-fade-up onboarding-delay-3 text-zinc-600 dark:text-zinc-400">
          A few quick questions — we&apos;ll ask follow-ups based on what you pick
          — then surface nearby spots made for you.
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="onboarding-animate-fade-up onboarding-delay-4 w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
      >
        Let&apos;s go
      </button>
    </div>
  );
}
