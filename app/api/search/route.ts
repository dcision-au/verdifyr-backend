// app/api/search/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { product } = await req.json();

    if (!product || typeof product !== "string") {
      return NextResponse.json({ error: "Invalid product input" }, { status: 400 });
    }

    // 🔍 Query Open Beauty Facts directly
    const apiUrl = `https://world.openbeautyfacts.org/api/v2/search?search_terms=${encodeURIComponent(
      product
    )}&page_size=1`;

    const obfRes = await fetch(apiUrl);
    if (!obfRes.ok) {
      throw new Error(`Open Beauty Facts API failed: ${obfRes.status}`);
    }

    const obfData = await obfRes.json();
    const first = obfData?.products?.[0];

    // 🧴 Extract relevant fields
    const productName =
      first?.product_name ||
      first?.generic_name ||
      first?._keywords?.join(" ") ||
      product;

    const ingredientsRaw = first?.ingredients_text || "";
    const ingredients = ingredientsRaw
      ? ingredientsRaw
          .split(/[;,]/)
          .map((i: string) => i.trim())
          .filter((i: string) => i.length > 1)
      : [];

    const source =
      first?.url ||
      (first?._id
        ? `https://world.openbeautyfacts.org/product/${first._id}`
        : null);

    return NextResponse.json({
      product: productName,
      source,
      ingredients,
    });
  } catch (err) {
    console.error("Open Beauty Facts API error:", err);
    return NextResponse.json(
      { error: "Search failed or no product found" },
      { status: 500 }
    );
  }
}