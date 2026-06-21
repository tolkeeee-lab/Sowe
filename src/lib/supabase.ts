import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl || 
    supabaseUrl === 'undefined' || 
    supabaseUrl.includes('your-') ||
    !supabaseAnonKey || 
    supabaseAnonKey === 'undefined' ||
    supabaseAnonKey.includes('your-')
  ) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
};

export const supabase = getSupabase();
