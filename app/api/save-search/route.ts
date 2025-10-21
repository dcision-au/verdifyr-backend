// File: app/api/save-search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Create Supabase client once (using service key for insert privileges)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📦 Incoming session payload:", body);

    // ✅ Handle flexible JSON parsing
    const safeFinalCheck =
      typeof body.final_check === "string"
        ? JSON.parse(body.final_check)
        : body.final_check ?? null;

    const safeVerdict =
      typeof body.verdict === "string"
        ? JSON.parse(body.verdict)
        : body.verdict ?? null;

    // ✅ Construct clean insert payload
    const record = {
      anon_id: body.anon_id ?? null,
      user_id: body.user_id ?? null,
      normalized_ingredients: body.normalized_ingredients ?? [],
      final_check: safeFinalCheck,
      verdict: safeVerdict,
      app_version: body.app_version ?? "unknown",
      created_at: body.created_at ?? new Date().toISOString(),
    };

    console.log("🧾 Prepared record for insert:", record);

    // ✅ Insert into search_logs table
    const { data, error } = await supabase.from("search_logs").insert([record]);

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("✅ Search log saved successfully:", data);
    return NextResponse.json({ success: true, inserted: data }, { status: 200 });
  } catch (err: any) {
    console.error("❌ save-search route error:", err);
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }
}