import type { TripPlan } from "@/lib/types";

const JOURNAL_STORAGE_KEY = "wander-journal-plans";
const MAX_SAVED_PLANS = 10;

export function getSavedPlans(): TripPlan[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as TripPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePlan(plan: TripPlan): void {
  const existing = getSavedPlans().filter((entry) => entry.id !== plan.id);
  const next = [plan, ...existing].slice(0, MAX_SAVED_PLANS);
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next));
}

export function deletePlan(planId: string): void {
  const next = getSavedPlans().filter((plan) => plan.id !== planId);
  window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(next));
}
