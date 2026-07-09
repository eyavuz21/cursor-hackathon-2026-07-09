import { redirect } from "next/navigation";

type PlanPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.set(key, value);
    } else if (Array.isArray(value) && value[0]) {
      query.set(key, value[0]);
    }
  }

  const suffix = query.toString();
  redirect(suffix ? `/explore?${suffix}` : "/explore");
}
