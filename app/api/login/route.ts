import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!data.session?.access_token) {
      return NextResponse.json({ error: "No token returned" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Login successful",
      access_token: data.session.access_token,
      user: data.user,
    });
  } catch (err) {
    console.error("Unexpected login error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}