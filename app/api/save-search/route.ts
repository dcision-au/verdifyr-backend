import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/initSupabase";

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      throw new Error("Supabase client not initialized");
    }

    const body = await req.json();
    const { anon_id, user_id, normalized_ingredients, final_check, verdict, app_version } = body;

    // Insert log safely
    const { data, error } = await supabase
      .from("search_logs")
      .insert([
        {
          anon_id,
          user_id,
          normalized_ingredients,
          final_check,
          verdict,
          app_version,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, inserted: data }, { status: 200 });
  } catch (err) {
    console.error("💥 save-search error:", err);
    return NextResponse.json(
      { error: "Failed to save search log" },
      { status: 500 }
    );
  }
}