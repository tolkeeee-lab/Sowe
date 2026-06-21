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
    let sanitizedUrl = supabaseUrl.trim();
    try {
      // Nettoie l'URL pour ne garder que l'origine (ex: https://xxx.supabase.co)
      // même si l'utilisateur a collé un sous-chemin comme /rest/v1 ou autre dans Vercel
      const parsed = new URL(sanitizedUrl);
      sanitizedUrl = parsed.origin;
    } catch (e) {
      if (sanitizedUrl.endsWith('/')) {
        sanitizedUrl = sanitizedUrl.slice(0, -1);
      }
    }
    const sanitizedKey = supabaseAnonKey.trim();

    supabaseInstance = createClient(sanitizedUrl, sanitizedKey);
  }

  return supabaseInstance;
};

export const supabase = getSupabase();
