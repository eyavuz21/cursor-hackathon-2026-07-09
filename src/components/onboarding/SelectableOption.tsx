"use client";

import type { ReactNode } from "react";

type SelectableOptionProps = {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description?: string;
  badge?: string;
  selectionType?: "single" | "multiple";
  animationDelay?: string;
  children?: ReactNode;
};

function SelectionIndicator({
  selected,
  selectionType,
}: {
  selected: boolean;
  selectionType: "single" | "multiple";
}) {
  if (selectionType === "multiple") {
    return (
      <span
        aria-hidden
        className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors ${
          selected
            ? "border-foreground bg-foreground text-background"
            : "border-muted bg-surface"
        }`}
      >
        {selected ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? "border-foreground" : "border-muted"
      }`}
    >
      {selected ? (
        <span className="h-2.5 w-2.5 rounded-full bg-foreground" />
      ) : null}
    </span>
  );
}

export function SelectableOption({
  selected,
  onSelect,
  title,
  description,
  badge,
  selectionType = "single",
  animationDelay,
  children,
}: SelectableOptionProps) {
  return (
    <button
      type="button"
      role={selectionType === "single" ? "radio" : "checkbox"}
      aria-checked={selected}
      onClick={onSelect}
      className={`onboarding-animate-fade-up brand-card brand-card-interactive w-full p-5 text-left ${
        selected ? "brand-card-selected" : ""
      }`}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <div className="flex items-start gap-4">
        <SelectionIndicator
          selected={selected}
          selectionType={selectionType}
        />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-base font-medium leading-snug text-foreground">
            {title}
          </span>
          {badge ? (
            <span className="brand-option-badge w-fit">{badge}</span>
          ) : null}

          {description ? (
            <span className="w-full text-sm leading-relaxed text-muted">
              {description}
            </span>
          ) : null}

          {children}
        </div>
      </div>
    </button>
  );
}
