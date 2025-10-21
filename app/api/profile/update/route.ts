export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { token, updates } = await req.json();

    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 });

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user via token
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Update user profile
    const { error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Profile update error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}