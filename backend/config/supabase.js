import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  // We log a warning instead of throwing, so that if tests or offline runs don't configure Supabase,
  // the app doesn't crash completely on boot, but fails on db access.
  console.warn("⚠️ Supabase credentials not fully configured in environment variables.");
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseSecretKey || "placeholder-key");
