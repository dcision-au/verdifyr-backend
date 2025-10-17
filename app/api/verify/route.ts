// app/api/verify/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { summary, nonPass } = body;

    if (!summary || !nonPass) {
      return NextResponse.json({ error: "Missing summary or nonPass data" }, { status: 400 });
    }

    const { passed, restricted, forbidden } = summary;
    const nonPassJSON = JSON.stringify(nonPass, null, 2);

    const prompt = `
You are an EU cosmetic safety assistant. Analyze the following data.

Summary:
✅ ${passed} Passed, ⚠️ ${restricted} Restricted, ⛔️ ${forbidden} Forbidden.

Below is the JSON output for the non-passed or uncertain ingredients:
${nonPassJSON}

Return your response **strictly in JSON format** like this:
{
  "summary": {
    "likely_safe": [ "ingredient1", "ingredient2" ],
    "restricted": [ "ingredient3" ],
    "potentially_unsafe": [ "ingredient4" ]
  },
  "commentary": "Short 4–6 line factual summary explaining the overall safety and main concerns under EU Cosmetics Regulation."
}

Do not include any extra commentary outside the JSON.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const json = JSON.parse(text);

    return NextResponse.json(json, { status: 200 });
  } catch (err: any) {
    console.error("Error in /api/verify:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}