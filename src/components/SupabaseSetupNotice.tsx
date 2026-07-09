export function SupabaseSetupNotice() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background px-6 py-12 font-sans">
      <main className="brand-card flex max-w-md flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="inline-block h-2 w-2 bg-highlight" />
          <span className="brand-label">Setup required</span>
        </div>
        <h1 className="text-xl font-medium tracking-tight text-foreground">
          Supabase is not configured
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          Copy <code className="border border-border bg-accent-subtle px-1.5 py-0.5 text-xs">.env.example</code> to{" "}
          <code className="border border-border bg-accent-subtle px-1.5 py-0.5 text-xs">.env.local</code>, add your
          Supabase URL and anon key, then run{" "}
          <code className="border border-border bg-accent-subtle px-1.5 py-0.5 text-xs">supabase/schema.sql</code> in
          the SQL Editor with anonymous sign-ins enabled.
        </p>
      </main>
    </div>
  );
}
