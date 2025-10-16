import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { ingredient } = body;

  if (!ingredient) {
    return NextResponse.json({ error: "No ingredient provided" }, { status: 400 });
  }

  // Example dummy response — replace with real lookup
  return NextResponse.json({
    input: ingredient,
    verdict: "PASS", // or "FAIL"
    reason: "Example only — replace with real logic"
  });
}