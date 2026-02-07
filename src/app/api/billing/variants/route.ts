import { NextResponse } from "next/server";
import { listProducts, listStores, listVariants } from "@/services/billing/lemon-squeezy";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production." }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId") || undefined;

  try {
    const [stores, products, variants] = await Promise.all([
      listStores(),
      listProducts(),
      listVariants(productId),
    ]);

    return NextResponse.json({
      stores: stores.data,
      products: products.data,
      variants: variants.data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load Lemon Squeezy data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
