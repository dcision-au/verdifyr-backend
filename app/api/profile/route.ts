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

    console.log("🔑 Authorization header:", authHeader);
    console.log("🔑 Extracted token:", token);

    // 🧱 Guest mode — skip Supabase lookup
    if (!token || token === "guest") {
      console.warn("⚠️ Guest token detected, returning fallback guest profile");
      return NextResponse.json({
        id: "guest",
        user_id: null,
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
      error: authError,
    } = await supabase.auth.getUser(token);

    console.log("👤 Supabase user:", user);
    console.log("❌ Supabase getUser error:", authError);

    if (authError || !user) {
      console.error("⚠️ Invalid or expired token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Fetch user profile from table
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    console.log("📄 Supabase profile:", profile);
    console.log("❌ Supabase profile error:", profileError);

    // ⚠️ No profile found — return fallback but keep structure consistent
    if (profileError || !profile) {
      console.warn("⚠️ No user profile found, returning fallback profile object");
      return NextResponse.json({
        id: null,
        user_id: user.id,
        email: user.email,
        mode: "User",
        skinType: null,
        preferences: [],
        isEditable: true,
      });
    }

    // ✅ Merge and return profile with editable flag
    return NextResponse.json({
      id: profile.id,
      user_id: profile.user_id,
      email: user.email,
      mode: profile.trust_mode ?? "User",
      skinType: profile.skin_type ?? null,
      preferences: profile.preferences ?? [],
      isEditable: true,
    });
  } catch (err: any) {
    console.error("❌ Profile API error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}