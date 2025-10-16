// app/api/search/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { product } = await req.json();

    if (!product || typeof product !== "string") {
      return NextResponse.json({ error: "Invalid product input" }, { status: 400 });
    }

    // Step 1: Search by product name
    const searchUrl = `https://world.openbeautyfacts.org/api/v2/search?search_terms=${encodeURIComponent(
      product
    )}&page_size=1`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const first = searchData?.products?.[0];

    if (!first) {
      return NextResponse.json({ ingredients: [], source: null });
    }

    // Step 2: If barcode/code exists, fetch detailed product info
    let productDetails = first;
    if (first.code) {
      const detailUrl = `https://world.openbeautyfacts.org/api/v2/product/${first.code}.json`;
      const detailRes = await fetch(detailUrl);
      if (detailRes.ok) {
        const detailData = await detailRes.json();
        if (detailData?.product) productDetails = detailData.product;
      }
    }

    // Step 3: Extract clean data
    const productName =
      productDetails.product_name || productDetails.generic_name || product;
    const ingredientsRaw = productDetails.ingredients_text || "";
    const ingredients = ingredientsRaw
      ? ingredientsRaw
          .split(/[;,]/)
          .map((i: string) => i.trim())
          .filter((i: string) => i.length > 1)
      : [];

    const source =
      productDetails.url ||
      `https://world.openbeautyfacts.org/product/${productDetails.code}`;

    return NextResponse.json({
      product: productName,
      source,
      ingredients,
    });
  } catch (err) {
    console.error("Open Beauty Facts fetch error:", err);
    return NextResponse.json(
      { error: "Search failed or no product found" },
      { status: 500 }
    );
  }
}