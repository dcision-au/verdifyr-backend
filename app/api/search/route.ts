import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { product } = await req.json();

    if (!product || typeof product !== "string") {
      return NextResponse.json({ error: "Invalid product input" }, { status: 400 });
    }

    let productDetails: any = null;

    // ✅ If barcode detected (only digits, 8–14 long)
    if (/^\d{8,14}$/.test(product.trim())) {
      const detailUrl = `https://world.openbeautyfacts.org/api/v2/product/${product}.json`;
      const detailRes = await fetch(detailUrl);
      const detailData = await detailRes.json();
      productDetails = detailData.product || null;
    } else {
      // 🔍 Otherwise search by name
      const searchUrl = `https://world.openbeautyfacts.org/api/v2/search?search_terms=${encodeURIComponent(
        product
      )}&page_size=1`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const first = searchData?.products?.[0];
      if (first?.code) {
        const detailUrl = `https://world.openbeautyfacts.org/api/v2/product/${first.code}.json`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();
        productDetails = detailData.product || first;
      }
    }

    if (!productDetails) {
      return NextResponse.json({ product, source: null, ingredients: [] });
    }

    const ingredientsRaw = productDetails.ingredients_text || "";
    const ingredients = ingredientsRaw
      ? ingredientsRaw
          .split(/[;,]/)
          .map((i: string) => i.trim())
          .filter((i: string) => i.length > 1)
      : [];

    return NextResponse.json({
      product: productDetails.product_name || product,
      source: productDetails.url || `https://world.openbeautyfacts.org/product/${productDetails.code}`,
      ingredients,
    });
  } catch (err) {
    console.error("Open Beauty Facts error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}