import { createClient } from '@supabase/supabase-js';

// Get env vars - these MUST be set in .env or Vercel environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY must be set');
}

// Validate format to ensure no invalid characters
if (!supabaseUrl.startsWith('https://') || !supabaseKey.startsWith('eyJ')) {
  throw new Error('Invalid Supabase credentials format');
}

// Create client with minimal configuration to troubleshoot fetch error
export const supabase = createClient(supabaseUrl, supabaseKey);