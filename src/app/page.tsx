import Storefront from "@/components/Storefront";
import { getActiveProducts } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getActiveProducts();
  return <Storefront products={products} />;
}
