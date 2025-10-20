import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { raw } = await req.json();
    if (!raw || typeof raw !== "string") {
      return NextResponse.json({ error: "Missing raw text" }, { status: 400 });
    }

const systemPrompt = `
You are an ingredient list normalizer.
Your task: clean messy OCR or user-typed ingredient text and return JSON only.
Output shape:
{
  "normalized": ["Ingredient One", "Ingredient Two", ...],
  "notes": ["what you fixed or clarified"]
}
Rules:
- Preserve ingredient order; don't add or remove items.
- Fix punctuation, OCR typos, spacing, capitalization (INCI style).
- Remove all asterisks (*) and similar footnote symbols.
- Never include any text other than valid JSON.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: raw }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message ?? "OpenAI request failed" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(data.choices[0].message.content || "{}");
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}