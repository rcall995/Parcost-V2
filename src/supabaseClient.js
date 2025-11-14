import { createClient } from '@supabase/supabase-js';

// Get env vars - these MUST be set in .env or Vercel environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY must be set');
}

// Create client with minimal configuration to troubleshoot fetch error
export const supabase = createClient(supabaseUrl, supabaseKey);