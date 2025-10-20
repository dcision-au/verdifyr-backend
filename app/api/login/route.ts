import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🧠 Load env vars safely
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// 🚦 Lazy init guard (so build won’t fail if envs missing)
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function POST(req: Request) {
  if (!supabase) {
    console.error("❌ Supabase client not initialized. Check environment variables.");
    return NextResponse.json(
      { error: "Supabase not initialized" },
      { status: 500 }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("❌ Login error:", error.message);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!data.session?.access_token) {
      return NextResponse.json(
        { error: "No token returned" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "✅ Login successful",
      access_token: data.session.access_token,
      user: data.user,
    });
  } catch (err) {
    console.error("💥 Unexpected login error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}