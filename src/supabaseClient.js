import { createClient } from '@supabase/supabase-js';

// Get env vars and trim any whitespace
let supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
let supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Fallback to hardcoded values if env vars not available (temporary for debugging)
if (!supabaseUrl) {
  console.warn('⚠️ REACT_APP_SUPABASE_URL not found, using fallback');
  supabaseUrl = 'https://ywrilkhrghegkvqmyzdq.supabase.co';
}

if (!supabaseKey) {
  console.warn('⚠️ REACT_APP_SUPABASE_ANON_KEY not found, using fallback');
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cmlsa2hyZ2hlZ2t2cW15emRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDc0NzUsImV4cCI6MjA3NTY4MzQ3NX0.eUx1qB_cpTQnsfZqsCDAWzrXQVL2z6GsULT8pEh0ee0';
}

// Trim whitespace and ensure proper string format
supabaseUrl = String(supabaseUrl).trim();
supabaseKey = String(supabaseKey).trim();

// Debug logging
console.log('🔧 Supabase Config:', {
  urlLength: supabaseUrl.length,
  keyLength: supabaseKey.length,
  urlValid: supabaseUrl.startsWith('https://'),
  keyValid: supabaseKey.startsWith('eyJ'),
  url: supabaseUrl
});

export const supabase = createClient(supabaseUrl, supabaseKey);