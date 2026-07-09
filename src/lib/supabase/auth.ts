import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function ensureServerSession(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { supabase, user };
  }

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { user: newUser },
  } = await supabase.auth.getUser();

  if (!newUser) {
    throw new Error("Failed to create anonymous session");
  }

  return { supabase, user: newUser };
}
