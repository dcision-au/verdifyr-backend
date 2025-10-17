import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { passed, restricted, forbidden, nonPassJSON } = await req.json();

    if (!nonPassJSON) {
      return NextResponse.json({ error: "Missing summary or nonPass data" }, { status: 400 });
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
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "{}";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { summary: text, notes: [] };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("❌ Error in /api/verify:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}