// app/api/search/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { product } = await req.json();

    if (!product || typeof product !== "string") {
      return NextResponse.json({ error: "Invalid product input" }, { status: 400 });
    }

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Serper API key" }, { status: 500 });
    }

    // Google-like search via Serper
    const query = `${product} site:openbeautyfacts.org ingredients`;
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query }),
    });

    const data = await res.json();
    const link =
      data?.organic?.[0]?.link ||
      data?.organic?.find((r: any) => r.link?.includes("openbeautyfacts"))?.link;

    if (!link) {
      return NextResponse.json({ ingredients: [], source: null });
    }

    const page = await fetch(link);
    const html = await page.text();

    // Extract ingredients
    const regex = /INGREDIENTS?[:\s]*([\w\s,;()\-.'%]+)/i;
    const match = html.match(regex);
    const ingredients = match
      ? match[1]
          .split(/[;,]/)
          .map((i) => i.trim())
          .filter((i) => i.length > 1)
      : [];

    return NextResponse.json({
      product,
      source: link,
      ingredients,
    });
  } catch (err) {
    console.error("Search API error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}