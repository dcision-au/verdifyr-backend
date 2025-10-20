import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { passed, restricted, unknown, finalAnalysis } = body;

    // 🧩 If finalAnalysis is present, parse it
    if (finalAnalysis) {
      try {
        const parsed = JSON.parse(finalAnalysis);
        passed = parsed.passed;
        restricted = parsed.restricted;
        unknown = parsed.unknown;
      } catch (err) {
        console.error("⚠️ Failed to parse finalAnalysis:", err);
        return NextResponse.json(
          { error: "Invalid finalAnalysis JSON" },
          { status: 400 }
        );
      }
    }

    // 🧠 Validate structure
    if (!passed || !restricted || !unknown) {
      return NextResponse.json(
        { error: "Missing one or more required fields" },
        { status: 400 }
      );
    }

    // 🧾 Build GPT prompt
    const prompt = `
You are an EU cosmetics safety expert.
Given the following ingredients, provide a factual, structured classification:

1️⃣ Passed (safe ingredients) — simply repeat their names.
2️⃣ Restricted — extract objective reasons why users might need caution
    (e.g. "potential skin irritant", "fragrance allergen", "eye irritant", "UV filter with limits").
    Base it only on EU regulation intent, not personal opinion.
3️⃣ Unknown — determine whether any realistic risk is known
    (e.g. "botanical extract with limited data", "trade ingredient blend", "likely safe").
    If no known risk, mark as "no known risk".

Respond strictly in JSON:
{
  "passed": ["string"],
  "restricted": [{"ingredient":"string","reason_for_caution":"string"}],
  "unknown": [{"ingredient":"string","potential_risk":"string"}]
}

INPUT DATA:
Passed:
${JSON.stringify(passed, null, 2)}

Restricted:
${JSON.stringify(restricted, null, 2)}

Unknown:
${JSON.stringify(unknown, null, 2)}
`;

    // 🧠 Run OpenAI reasoning
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are an EU cosmetics safety analyst returning structured JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from model" },
        { status: 500 }
      );
    }

    return new NextResponse(content, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ /api/verdict error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}