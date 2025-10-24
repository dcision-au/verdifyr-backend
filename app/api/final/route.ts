import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface NormalizedIngredient {
  normalizedVerdict?: string;
  annex?: string;
  verdict?: string;
  input?: string;
  matched_name?: string;
  [key: string]: any;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passed, restricted, forbidden, nonPassJSON, passedNames } = body;

    if (!nonPassJSON) {
      return NextResponse.json({ error: "Missing nonPassJSON" }, { status: 400 });
    }

    // Load normalized INCI vocabulary
    const resourcePath = path.join(process.cwd(), "app/Resources/ingredients.json");
    let knownIngredients: string[] = [];
    if (fs.existsSync(resourcePath)) {
      knownIngredients = JSON.parse(fs.readFileSync(resourcePath, "utf8"));
    }

    // 🧩 Parse input
    const nonPassArray: any[] = Array.isArray(nonPassJSON)
      ? nonPassJSON
      : typeof nonPassJSON === "string"
      ? JSON.parse(nonPassJSON)
      : [];

    // 🧠 Normalize annex → category
    const normalizeVerdict = (v: any): string => {
      if (!v) return "UNKNOWN";
      const annex = (v.annex || "").toUpperCase();
      const verdict = (v.verdict || "").toUpperCase();
      if (verdict === "PRESERVATIVE" || annex === "V") return "PRESERVATIVE";
      if (verdict === "UV FILTER" || annex === "VI") return "UV FILTER";
      if (verdict === "COLOURANT" || annex === "IV") return "COLOURANT";
      if (verdict === "FORBIDDEN" || annex === "II") return "FORBIDDEN";
      if (verdict === "RESTRICTED" || annex === "III") return "RESTRICTED";
      if (["PASS", "SAFE", "COMPLIANT"].includes(verdict)) return "PASSED";
      return "UNKNOWN";
    };

    const normalizedArray: NormalizedIngredient[] = nonPassArray.map((item: any) => ({
      ...item,
      normalizedVerdict: normalizeVerdict(item),
    }));

    // Explicit typing to satisfy TypeScript
    const forbiddenItems = normalizedArray.filter(
      (i: NormalizedIngredient) => i.normalizedVerdict === "FORBIDDEN"
    );
    const restrictedItems = normalizedArray.filter(
      (i: NormalizedIngredient) => i.normalizedVerdict === "RESTRICTED"
    );
    const preservativeItems = normalizedArray.filter(
      (i: NormalizedIngredient) => i.normalizedVerdict === "PRESERVATIVE"
    );
    const uvFilterItems = normalizedArray.filter(
      (i: NormalizedIngredient) => i.normalizedVerdict === "UV FILTER"
    );
    const colourantItems = normalizedArray.filter(
      (i: NormalizedIngredient) => i.normalizedVerdict === "COLOURANT"
    );

    // Prepare GPT prompt
    const nonPassPretty =
      typeof nonPassJSON === "string"
        ? nonPassJSON
        : JSON.stringify(nonPassJSON, null, 2);

    const knownListSample = knownIngredients.slice(0, 1000).join(", ");

    const prompt = `
You are an EU cosmetics regulation and INCI name expert.

Input JSON of non-passed ingredients:
${nonPassPretty}

Explicitly forbidden (Annex II):
${JSON.stringify(forbiddenItems, null, 2)}

Reference vocabulary (official INCI-style names):
${knownListSample}

Goals:
1. Explain forbidden (Annex II) entries briefly.
2. Explain restricted (Annex III) entries.
3. Normalize unknowns, matching to INCI vocabulary if possible.
4. Output structured JSON only:

{
  "passed": ["string"],
  "restricted": [{"ingredient": "string", "annex": "string", "reason": "string", "note": "string"}],
  "forbidden": [{"ingredient": "string", "annex": "string", "reason": "string"}],
  "unknown": [{"ingredient": "string", "reason": "string"}]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are an EU cosmetics compliance expert returning structured JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message?.content;
    if (!content)
      return NextResponse.json({ error: "No response from model" }, { status: 500 });

    const result = JSON.parse(content);

    // 🩵 Re-append passed ingredients
    if (passedNames && Array.isArray(passedNames)) {
      if (!result.passed) result.passed = [];
      result.passed = [...new Set([...result.passed, ...passedNames])];
    }

    // 🧠 Ensure forbidden list preserved
    if (!result.forbidden || result.forbidden.length === 0) {
      result.forbidden = forbiddenItems.map((f: NormalizedIngredient) => ({
        ingredient: f.input || f.matched_name || "Unknown",
        annex: f.annex || "II",
        reason: "Listed under EU Annex II (forbidden for cosmetic use).",
      }));
    }

    // 🧩 Add regulated-safe categories
    result.restricted = [
      ...(result.restricted || []),
      ...preservativeItems.map((i: NormalizedIngredient) => ({
        ingredient: i.input || i.matched_name,
        annex: "V",
        reason: "Approved preservative (Annex V)",
        note: "Permitted within EU concentration limits.",
      })),
      ...uvFilterItems.map((i: NormalizedIngredient) => ({
        ingredient: i.input || i.matched_name,
        annex: "VI",
        reason: "Approved UV filter (Annex VI)",
        note: "Permitted within EU concentration limits.",
      })),
      ...colourantItems.map((i: NormalizedIngredient) => ({
        ingredient: i.input || i.matched_name,
        annex: "IV",
        reason: "Approved colourant (Annex IV)",
        note: "Permitted within EU concentration limits.",
      })),
    ];

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("❌ /api/final error:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}