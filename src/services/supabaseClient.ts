import { createClient, SupabaseClient } from "@supabase/supabase-js";


const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key must be provided in environment variables.")
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)