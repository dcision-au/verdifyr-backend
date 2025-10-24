import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ingredient, full_ingredient_list, classified } = body;

    if (!ingredient || !full_ingredient_list || !classified) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const systemPrompt = `
You are Verdifyr, a regulatory assistant specialized in EU cosmetics compliance.
You know the structure of COSING Annexes II–VI:
- Annex II → Forbidden
- Annex III → Restricted
- Annex IV → Colourants
- Annex V → Preservatives
- Annex VI → UV Filters
Treat IV–VI as “restricted but safe within limits”.
Explain reasoning in plain English.

Output JSON:
{
  "ingredient": "...",
  "classification": "Passed | Restricted | Forbidden | Unknown",
  "verified_correct": true | false,
  "corrected_classification": "string or null",
  "explanation": "short explanation"
}
`;

    const userPrompt = `
Ingredient: ${ingredient}

Full ingredient list:
${JSON.stringify(full_ingredient_list, null, 2)}

Current classification:
${JSON.stringify(classified, null, 2)}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();
    let parsed;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      parsed = { raw_response: raw };
    }

    return NextResponse.json({ success: true, result: parsed, raw }, { status: 200 });
  } catch (err: any) {
    console.error("❌ /api/ask error:", err);
    return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
  }
}