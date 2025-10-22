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
You are an EU cosmetics safety expert with deep knowledge of Regulation (EC) No 1223/2009
and the COSING database (Annexes II–VI).

Re-evaluate the provided ingredients and reclassify them correctly:

1️⃣ **Forbidden (Annex II)** — substances prohibited from use in cosmetics.
    - Check for direct or equivalent matches (e.g. "animal fat" ≈ Entry 419).
    - Include an annex reference number or short justification if possible.

2️⃣ **Restricted (Annex III, IV, V, VI)** — ingredients allowed only under specific limits, 
    concentrations, or product types. 
    - Identify if something could belong to these annexes (e.g., colorants, UV filters, preservatives).

3️⃣ **Passed (Safe)** — ingredients that appear to have no known restriction or risk 
    under the Cosmetics Regulation.

4️⃣ **Unknown** — substances or trade ingredients not found in Annex II–VI 
    but possibly outside standard EU cosmetic nomenclature 
    (e.g. new molecules, plant blends, proprietary materials).

Use your general EU regulatory understanding and chemical reasoning.
If you see animal-derived, hormonal, antibiotic, or pharmacological substances, 
cross-check them carefully against Annex II and related entries.

Return strictly valid JSON:
{
  "forbidden": [{"ingredient": "string", "annex_reference": "string or null", "reason": "string"}],
  "restricted": [{"ingredient": "string", "annex_reference": "string or null", "reason_for_caution": "string"}],
  "passed": ["string"],
  "unknown": [{"ingredient": "string", "potential_risk": "string"}]
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