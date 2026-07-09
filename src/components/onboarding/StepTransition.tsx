"use client";

import type { ReactNode } from "react";

type StepTransitionProps = {
  stepKey: string;
  direction: "forward" | "back";
  children: ReactNode;
};

export function StepTransition({
  stepKey,
  direction,
  children,
}: StepTransitionProps) {
  const animationClass =
    direction === "forward"
      ? "onboarding-animate-slide-in-right"
      : "onboarding-animate-slide-in-left";

  return (
    <div key={stepKey} className={animationClass}>
      {children}
    </div>
  );
}
