import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/initSupabase";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const server = getSupabaseServerClient();
    if (!server) throw new Error("Supabase client not initialized");

    const body = await req.json();
    const authHeader = req.headers.get("authorization");
    let user_id: string | null = null;
    let anon_id = body.anon_id;

    // 🧠 Verify the token if provided
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }
      );

      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        user_id = user.id;
      }
    }

    // 🔄 Fallback to anon if not authenticated
    if (!user_id) {
      if (!anon_id || anon_id.length < 30) anon_id = randomUUID();
    }

    const {
      normalized_ingredients = [],
      final_check,
      verdict,
      app_version,
      source = "mobile",
    } = body;

    const session_id = randomUUID();

    const rows = normalized_ingredients.map((name: string) => ({
      raw_name: name,
      raw_cas: null,
      anon_id,
      user_id,
      session_id,
      created_at: new Date().toISOString(),
      app_version,
      final_check,
      verdict,
      source,
      product_type: verdict?.product_type ?? null,
      normalized: true,
    }));

    const { data, error } = await server
      .from("user_ingredient_input")
      .insert(rows)
      .select();

    if (error) throw error;

    return NextResponse.json(
      { success: true, session_id, inserted: data },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("💥 save-search error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}