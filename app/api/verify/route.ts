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
I have some cosmetic ingredients with these results:
✅ ${passed} Passed, ⚠️ ${restricted} Restricted, ⛔️ ${forbidden} Forbidden.

Below is the JSON output for the non-passed or uncertain ingredients:
${nonPassJSON}

Please:
1. Verify whether the assumptions appear correct (i.e., which are likely safe, restricted, or potentially unsafe under EU Cosmetic Regulation).
2. Summarize any key notes or exceptions in plain English.
3. Keep it under 8 lines, concise and factual.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "No response.";
    return new NextResponse(text, { status: 200 });
  } catch (err: any) {
    console.error("Error in /api/verify:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}