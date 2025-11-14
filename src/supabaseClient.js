import { createClient } from '@supabase/supabase-js';

// TEMPORARY HARDCODED CREDENTIALS - Vercel env vars not working
// TODO: Fix Vercel environment variable configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim() || 'https://ywrilkhrghegkvqmyzdq.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cmlsa2hyZ2hlZ2t2cW15emRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDc0NzUsImV4cCI6MjA3NTY4MzQ3NX0.eUx1qB_cpTQnsfZqsCDAWzrXQVL2z6GsULT8pEh0ee0';

// Create client with minimal configuration
export const supabase = createClient(supabaseUrl, supabaseKey);