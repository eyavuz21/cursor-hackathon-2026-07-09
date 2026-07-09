export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Live · 2026 July 09
          </span>
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50">
            Cursor Hackathon
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Fresh scaffold, deployed and ready to build. Edit{" "}
            <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              src/app/page.tsx
            </code>{" "}
            and ship.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
          <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">
            Next.js 16
          </span>
          <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">
            TypeScript
          </span>
          <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">
            Tailwind CSS
          </span>
          <span className="rounded-full border border-zinc-300 px-3 py-1 dark:border-zinc-700">
            Vercel
          </span>
        </div>
      </main>
    </div>
  );
}
