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

    // Use service key for privileged actions
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // ✅ use service key, not anon
    );

    // 1️⃣ Create the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Supabase signup error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;
    const token = data.session?.access_token ?? null;

    // 2️⃣ Create a linked profile row
    if (user?.id) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([{ user_id: user.id }]);

      if (profileError) {
        console.error("Profile insert error:", profileError.message);
      }
    }

    // 3️⃣ Return the access token if available (instant login)
    return NextResponse.json({
      message: "Registration successful",
      access_token: token,
      user,
    });
  } catch (err) {
    console.error("Register route error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}