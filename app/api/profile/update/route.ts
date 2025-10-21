import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    console.log("🔑 Authorization header:", authHeader);
    console.log("🔑 Extracted token:", token);

    if (!token || token === "guest") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    console.log("👤 Supabase user:", user);
    console.log("❌ Supabase getUser error:", authError);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const updatePayload = {
      skin_type: body.skinType ?? null,
      preferences: body.preferences ?? [],
      trust_mode: body.mode ?? "User",
    };

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(updatePayload)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("❌ Failed to update profile:", updateError.message);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Profile update API error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}