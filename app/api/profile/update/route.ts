import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // ✅ use service key to allow updates
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, updates } = body;

    console.log("🧾 Incoming profile update:", updates);

    if (!token || token === "guest") {
      console.warn("⚠️ Missing or guest token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Verify Supabase JWT
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    console.log("👤 Supabase user:", user);
    if (authError || !user) {
      console.error("❌ Invalid or expired token:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Prepare payload safely
    const updatePayload = {
      display_name: updates.display_name ?? null,
      skin_type: updates.skin_type ?? null,
      preferences: updates.preferences ?? [],
      allergies: updates.allergies ?? [],
      trust_mode: updates.trust_mode ?? "anonymous",
      updated_at: new Date().toISOString(),
    };

    console.log("📦 Update payload:", updatePayload);

    // ✅ Apply update
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(updatePayload)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("❌ Failed to update profile:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    console.log("✅ Profile successfully updated for user:", user.email);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Profile update API error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}