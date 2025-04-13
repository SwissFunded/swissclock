import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmgfvicqoxldpxcphiew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZ2Z2aWNxb3hsZHB4Y3BoaWV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NTUwMzYsImV4cCI6MjA2MDEzMTAzNn0.9kkltDMNgYKabf93bRlh0MysVTmMAGWbj-Omv8fsWZQ';

export const supabase = createClient(supabaseUrl, supabaseKey); 