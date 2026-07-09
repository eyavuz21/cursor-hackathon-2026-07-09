"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPreferences } from "@/lib/preferences";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { LoadingScreen } from "@/components/loading/LoadingScreen";

export function HomeRedirect() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("Starting Wander");
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;

    async function redirect() {
      try {
        setMessage("Loading your profile");
        const preferences = await getPreferences();
        router.replace(preferences ? "/explore" : "/onboarding");
      } catch {
        setError("Could not load your preferences. Please try again.");
      }
    }

    redirect();
  }, [router, configured]);

  if (!configured) {
    return <SupabaseSetupNotice />;
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-6 font-sans">
        <main className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="brand-button-primary"
          >
            Retry
          </button>
        </main>
      </div>
    );
  }

  return (
    <LoadingScreen
      title={message}
      subtitle="Personalising your city walk"
      currentStep={1}
      totalSteps={1}
      stepLabels={["Getting ready"]}
    />
  );
}
