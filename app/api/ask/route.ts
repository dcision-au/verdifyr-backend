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
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 🧠 System prompt: concise, reasoning-aware, EU-focused
    const systemPrompt = `
You are Verdifyr, a regulatory assistant specialized in EU cosmetics compliance.
You are given a cosmetic product ingredient list and its internal classification.
Your job is to verify or correct the classification for the specified ingredient based on EU Regulation (EC) No 1223/2009.
Explain your reasoning clearly, as if talking to a consumer, without quoting raw legislation.

If the classification seems correct, confirm it and explain why.
If incorrect, provide a corrected classification and explain why.
Never guess—if uncertain, say that it requires manual verification.
Output structured JSON, no prose, in this format:

{
  "ingredient": "...",
  "classification": "Passed | Restricted | Forbidden | Unknown",
  "verified_correct": true | false,
  "corrected_classification": "string or null",
  "explanation": "short, plain English summary"
}
    `;

    const userPrompt = `
Ingredient: ${ingredient}

Full ingredient list:
${JSON.stringify(full_ingredient_list, null, 2)}

Current classification:
${JSON.stringify(classified, null, 2)}

Please analyze only the specified ingredient and respond in the required JSON format.
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

    return NextResponse.json(
      { success: true, result: parsed, raw },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("❌ /api/ask error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}