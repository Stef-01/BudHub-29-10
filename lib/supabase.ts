import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghctyzaazxrnfdhakbix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoY3R5emFhenhybmZkaGFrYml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MjAyNzQsImV4cCI6MjA3ODI5NjI3NH0.De_dqFToKVutIkPCNzFNlnuaHCYUd6c0EQa2zTGKsVI';

export const supabase = createClient(supabaseUrl, supabaseKey);
