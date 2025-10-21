import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    // 🧱 Guest mode — skip Supabase lookup
    if (!token || token === "guest") {
      return NextResponse.json({
        id: "guest",
        email: "guest@local",
        mode: "Guest",
        skinType: null,
        preferences: [],
        isEditable: false,
      });
    }

    // ✅ Verify Supabase JWT
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("⚠️ Invalid or expired token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch user profile from table
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.warn("⚠️ No user profile found, returning fallback");
      return NextResponse.json({
        id: user.id,
        email: user.email,
        mode: "User",
        skinType: null,
        preferences: [],
        isEditable: true,
      });
    }

    // ✅ Merge and return with editable flag
    return NextResponse.json({
      ...profile,
      isEditable: true,
    });
  } catch (err: any) {
    console.error("❌ Profile API error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}