// app/api/keys/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure env vars work

export async function GET() {
  return NextResponse.json({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  });
}