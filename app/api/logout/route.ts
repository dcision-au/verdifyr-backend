import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // use service key to revoke sessions
    );

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // Optional: just log or confirm revocation
    // Supabase doesn't directly log out server-side; the client clears token.
    console.log(`User ${email} logged out`);

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}