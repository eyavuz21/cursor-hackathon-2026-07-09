"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPreferences } from "@/lib/preferences";

export function HomeRedirect() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function redirect() {
      try {
        const preferences = await getPreferences();
        router.replace(preferences ? "/explore" : "/onboarding");
      } catch {
        setError("Could not load your preferences. Please try again.");
      }
    }

    redirect();
  }, [router]);

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
        <main className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Retry
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-3">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
      </main>
    </div>
  );
}
