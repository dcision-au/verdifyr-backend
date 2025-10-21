// File: app/api/save-search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Insert into search_logs table
    const { data, error } = await supabase.from("search_logs").insert([
      {
        anon_id: body.anon_id,
        user_id: body.user_id ?? null,
        normalized_ingredients: body.normalized_ingredients ?? [],
        final_check: body.final_check ? JSON.parse(body.final_check) : null,
        verdict: body.verdict ? JSON.parse(body.verdict) : null,
        app_version: body.app_version ?? "unknown",
        created_at: body.created_at ?? new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("❌ Supabase insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, inserted: data }, { status: 200 });
  } catch (err: any) {
    console.error("❌ save-search error:", err);
    return NextResponse.json({ error: "Failed to save search" }, { status: 500 });
  }
}