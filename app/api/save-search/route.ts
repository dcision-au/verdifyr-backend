import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/initSupabase";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) throw new Error("Supabase client not initialized");

    const body = await req.json();
    const {
      anon_id,
      normalized_ingredients = [],
      final_check,
      verdict,
      app_version,
      source = "mobile",
    } = body;

    // Create a new session_id for this batch
    const session_id = randomUUID();

    // Build rows for each ingredient
    const rows = normalized_ingredients.map((name: string) => ({
      raw_name: name,
      raw_cas: null,
      anon_id,
      session_id,
      created_at: new Date().toISOString(),
      app_version,
      final_check,
      verdict,
      source,
      product_type: verdict?.product_type ?? null,
      normalized: true,
    }));

    // Insert all rows in one call
    const { data, error } = await supabase
      .from("user_ingredient_input")
      .insert(rows)
      .select();

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log(`✅ Saved ${rows.length} ingredients under session ${session_id}`);

    return NextResponse.json(
      { success: true, session_id, inserted: data },
      { status: 200 }
    );
  } catch (err) {
    console.error("💥 save-search error:", err);
    return NextResponse.json(
      { error: "Failed to save search log" },
      { status: 500 }
    );
  }
}