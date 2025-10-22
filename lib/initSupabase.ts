import { createClient } from "@supabase/supabase-js";

export const getSupabaseServerClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("⚠️ Missing Supabase env vars during server init");
    return null;
  }

  return createClient(url, key);
};