export function SupabaseSetupNotice() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
      <main className="flex max-w-md flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Setup required
          </span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Supabase is not configured
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Copy <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-900">.env.example</code> to{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-900">.env.local</code>, add your
          Supabase URL and anon key, then run{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-900">supabase/schema.sql</code> in
          the SQL Editor with anonymous sign-ins enabled.
        </p>
      </main>
    </div>
  );
}
