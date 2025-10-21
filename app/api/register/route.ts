export const runtime = "nodejs"; // ✅ Ensure Node.js runtime (not Edge)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error("Missing SUPABASE environment variables");
    }

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

    // 1️⃣ Create Supabase user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw new Error("Supabase signup error: " + error.message);

    const user = data.user;
    const token = data.session?.access_token ?? null;

    // 2️⃣ Create profile record
    if (user?.id) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([{ user_id: user.id }]);

      if (profileError)
        throw new Error("Profile insert error: " + profileError.message);
    }

    // 3️⃣ Respond with success
    return NextResponse.json({
      message: "Registration successful",
      access_token: token,
      user,
    });
  } catch (err: any) {
    console.error("❌ Register route error:", err.message);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}