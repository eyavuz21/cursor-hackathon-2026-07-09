import { redirect } from "next/navigation";

type ExplorePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params?.create === "1") {
    query.set("create", "1");
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`/journey${suffix}`);
}
