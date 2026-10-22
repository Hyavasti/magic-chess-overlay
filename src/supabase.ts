import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and public Anon Key
// Found in Supabase Dashboard -> Project Settings -> API
const SUPABASE_URL = 'https://hjasxlveijbrhdzulzsc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYXN4bHZlaWpicmhkenVsenNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NDY4OTksImV4cCI6MjEwODIyMjg5OX0.dUhJwaDW5vOb6QbOZZ5GEGxxNtExTYHavOZtpkuPtZE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);