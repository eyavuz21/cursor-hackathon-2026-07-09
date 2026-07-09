"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPreferences } from "@/lib/preferences";

export function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const preferences = getPreferences();
    router.replace(preferences ? "/explore" : "/onboarding");
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-3">
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
      </main>
    </div>
  );
}
