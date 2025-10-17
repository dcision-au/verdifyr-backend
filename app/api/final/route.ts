import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passed, restricted, forbidden, nonPassJSON } = body;

    if (passed === undefined || restricted === undefined || forbidden === undefined || !nonPassJSON) {
      return NextResponse.json({ error: "Missing summary or nonPass data" }, { status: 400 });
    }

    const prompt = `
You are an EU cosmetics compliance expert.
I have some cosmetic ingredients with these results:
✅ ${passed} Passed, ⚠️ ${restricted} Restricted, ⛔️ ${forbidden} Forbidden.

Below is the JSON output for the non-passed or uncertain ingredients:
${nonPassJSON}

Please:
1. Verify whether the assumptions appear correct (i.e., which are likely safe, restricted, or potentially unsafe under EU Cosmetic Regulation).
2. Summarize any key notes or exceptions in plain English.
3. Keep it under 8 lines, concise and factual.
4. Respond **strictly in JSON** format as:
{
  "summary": "string"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "You are an EU cosmetics regulation expert." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from model" }, { status: 500 });
    }

    return new NextResponse(content, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ /api/final error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}