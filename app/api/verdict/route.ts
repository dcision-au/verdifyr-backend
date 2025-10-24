import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { passed, restricted, unknown, finalAnalysis } = body;

    if (finalAnalysis) {
      try {
        const parsed = JSON.parse(finalAnalysis);
        passed = parsed.passed;
        restricted = parsed.restricted;
        unknown = parsed.unknown;
      } catch (err) {
        console.error("⚠️ Failed to parse finalAnalysis:", err);
        return NextResponse.json({ error: "Invalid finalAnalysis JSON" }, { status: 400 });
      }
    }

    if ((!passed?.length && !restricted?.length && !unknown?.length) && body.input) {
      console.log("🩹 Fallback — using input as unknown:", body.input);
      passed = [];
      restricted = [];
      unknown = [body.input];
    }

    // Merge any extra regulated-safe categories
    restricted = [
      ...(restricted || []),
      ...(body.preservatives || []),
      ...(body.uvFilters || []),
      ...(body.colourants || [])
    ];

    if (!passed || !restricted || !unknown) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `
You are an EU cosmetics safety expert with deep knowledge of Regulation (EC) No 1223/2009 and COSING Annexes II–VI.

Reclassify ingredients correctly:
- Annex II → Forbidden
- Annex III → Restricted
- Annex IV → Colourants
- Annex V → Preservatives
- Annex VI → UV Filters
Treat IV–VI as “restricted but safe within limits”.

Return strict JSON:
{
  "forbidden": [{"ingredient": "string", "annex_reference": "string or null", "reason": "string"}],
  "restricted": [{"ingredient": "string", "annex_reference": "string or null", "reason_for_caution": "string"}],
  "passed": ["string"],
  "unknown": [{"ingredient": "string", "potential_risk": "string"}]
}

INPUT:
Passed: ${JSON.stringify(passed, null, 2)}
Restricted: ${JSON.stringify(restricted, null, 2)}
Unknown: ${JSON.stringify(unknown, null, 2)}
`;

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
    if (!content) return NextResponse.json({ error: "No response from model" }, { status: 500 });

    return new NextResponse(content, { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("❌ /api/verdict error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}