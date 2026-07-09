import { redirect } from "next/navigation";

export default function ShopPage() {
  redirect("/journey?errands=1");
}
