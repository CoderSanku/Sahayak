// src/lib/supabase.js
// Supabase client for the admin panel.
// Uses the same anon key as the main frontend.
// For a production admin panel you would use the SERVICE key and
// protect this app behind server-side auth — but for this project
// the anon key with Supabase Row Level Security is fine.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
