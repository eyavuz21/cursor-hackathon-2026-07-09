import { redirect } from "next/navigation";

type PlanPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params?.create === "1") {
    query.set("create", "1");
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`/journey${suffix}`);
}
