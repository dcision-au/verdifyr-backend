// app/api/verify/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { ingredient } = await req.json();

    if (!ingredient || typeof ingredient !== 'string') {
      return NextResponse.json({ error: 'Invalid ingredient input' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
    }

    const url = `${supabaseUrl}/rest/v1/rpc/verify_ingredient_exact`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: ingredient }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[verify] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}