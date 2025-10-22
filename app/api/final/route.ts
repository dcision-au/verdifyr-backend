import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passed, restricted, forbidden, nonPassJSON } = body;

    if (!nonPassJSON) {
      return NextResponse.json({ error: "Missing nonPassJSON" }, { status: 400 });
    }

    // Load your normalized INCI list from Resources/ingredients.json
    const resourcePath = path.join(process.cwd(), "app/Resources/ingredients.json");
    let knownIngredients: string[] = [];
    if (fs.existsSync(resourcePath)) {
      knownIngredients = JSON.parse(fs.readFileSync(resourcePath, "utf8"));
    }

    // 🧩 Pre-filter forbidden and restricted from the incoming data
    const nonPassArray = Array.isArray(nonPassJSON)
      ? nonPassJSON
      : typeof nonPassJSON === "string"
      ? JSON.parse(nonPassJSON)
      : [];

    const forbiddenItems = nonPassArray.filter(
      (i: any) => i.verdict?.toUpperCase() === "FORBIDDEN"
    );
    const restrictedItems = nonPassArray.filter(
      (i: any) => i.verdict?.toUpperCase() === "RESTRICTED"
    );

    // Prepare the model prompt
    const nonPassPretty =
      typeof nonPassJSON === "string"
        ? nonPassJSON
        : JSON.stringify(nonPassJSON, null, 2);

    const knownListSample = knownIngredients.slice(0, 1000).join(", "); // partial sample for context

    const prompt = `
You are an EU cosmetics regulation and INCI name expert.

Input JSON of non-passed ingredients:
${nonPassPretty}

Explicitly forbidden (Annex II):
${JSON.stringify(forbiddenItems, null, 2)}

Reference vocabulary (official INCI-style names):
${knownListSample}

Goals:
1. Review all FORBIDDEN ingredients.
   - Explain briefly why they are prohibited.
   - Output them as { ingredient, annex, reason }.
   - Assume these are banned for all cosmetic use (Annex II).
2. Review all RESTRICTED ingredients.
   - Explain briefly *why* they are regulated (based on Annex III category).
   - Output them as { ingredient, annex, reason, note }.
   - Assume they are used within limits ("restricted but permitted").
   - No speculation about actual concentration.
3. Review all UNKNOWN or "Likely Safe" ingredients.
   - Try to normalize each to a likely INCI name by matching against the provided vocabulary list.
   - If confident match found, include in "passed" with the corrected name.
   - If not confidently found, include in "unknown" with { ingredient, reason } stating why it might not match (e.g., plant extract, compound blend, or trade name).
4. Return structured JSON, no explanations or commentary:

{
  "passed": ["string"],
  "restricted": [
    {"ingredient": "string", "annex": "string", "reason": "string", "note": "string"}
  ],
  "forbidden": [
    {"ingredient": "string", "annex": "string", "reason": "string"}
  ],
  "unknown": [
    {"ingredient": "string", "reason": "string"}
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an EU cosmetics compliance expert returning structured JSON only."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message?.content;
    if (!content)
      return NextResponse.json({ error: "No response from model" }, { status: 500 });

    // 🧠 Parse and ensure forbidden list is preserved even if model omits it
    const result = JSON.parse(content);
    if (!result.forbidden || result.forbidden.length === 0) {
      result.forbidden = forbiddenItems.map((f: any) => ({
        ingredient: f.input || f.matched_name || "Unknown",
        annex: f.annex || "II",
        reason: "Listed under EU Annex II (forbidden for cosmetic use)."
      }));
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("❌ /api/final error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}