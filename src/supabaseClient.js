import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywrilkhrghegkvqmyzdq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3cmlsa2hyZ2hlZ2t2cW15emRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDc0NzUsImV4cCI6MjA3NTY4MzQ3NX0.eUx1qB_cpTQnsfZqsCDAWzrXQVL2z6GsULT8pEh0ee0';
export const supabase = createClient(supabaseUrl, supabaseKey);