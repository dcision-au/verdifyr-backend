import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🧩 CASE 1: Basic ingredient lookup (Supabase check)
    // If the request only includes a single ingredient, skip GPT verification.
    if (body.ingredient && !body.nonPassJSON) {
      return NextResponse.json({
        skip: true,
        note: "Basic ingredient check — bypassing GPT verification",
      });
    }

    // 🧩 CASE 2: Final check (full JSON summary)
    const { passed, restricted, forbidden, nonPassJSON } = body;

    if (!nonPassJSON) {
      return NextResponse.json(
        { error: "Missing summary or nonPass data" },
        { status: 400 }
      );
    }

    const prompt = `
I have some cosmetic ingredients with these results:
✅ ${passed ?? 0} Passed, ⚠️ ${restricted ?? 0} Restricted, ⛔️ ${forbidden ?? 0} Forbidden.

Below is the JSON output for the non-passed or uncertain ingredients:
${nonPassJSON}

Please:
1. Verify whether these assumptions are correct (safe, restricted, or potentially unsafe under EU Cosmetic Regulation).
2. Summarize key notes or exceptions in plain English.
3. Keep it under 8 lines, concise and factual.
Respond strictly as a JSON object:
{
  "summary": "...",
  "notes": ["...", "..."]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const responseText = completion.choices[0].message?.content?.trim() ?? "{}";

    // Safe parse — prevent crash if model ever outputs invalid JSON
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { summary: responseText, notes: [] };
    }

    return NextResponse.json(parsed, { status: 200 });
  } catch (error: any) {
    console.error("❌ Error in /api/verify:", error);
    return NextResponse.json(
      { error: error.message || "Unknown server error" },
      { status: 500 }
    );
  }
}