/**
 * VDLV Site Tracker — Supabase Client
 * Initializes the Supabase client singleton used across all modules.
 */

const SUPABASE_URL = 'https://xrvxqqinvmnwjkzrzkak.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_G2yk8h4AjZ_XFHuaxPaldA_0IlWpOkx';

// supabase global is provided by the CDN script in index.html
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
