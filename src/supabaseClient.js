import { createClient } from '@supabase/supabase-js';

// Fallback to hardcoded values if env vars not available
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ywrilkhrghegkvqmyzdq.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cmlsa2hyZ2hlZ2t2cW15emRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDc0NzUsImV4cCI6MjA3NTY4MzQ3NX0.eUx1qB_cpTQnsfZqsCDAWzrXQVL2z6GsULT8pEh0ee0';

// Debug logging
console.log('Supabase Config:', {
  url: supabaseUrl,
  keyPresent: !!supabaseKey,
  usingEnvVars: !!process.env.REACT_APP_SUPABASE_URL
});

export const supabase = createClient(supabaseUrl, supabaseKey);