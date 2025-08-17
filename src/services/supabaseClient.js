// src/services/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Configuration ---
const SUPABASE_URL = 'https://clsirugxuvdyxdnlwqqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc2lydWd4dXZkeXhkbmx3cXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNDQ2MzgsImV4cCI6MjA3MDkyMDYzOH0.gow7e2mHP_Qa0S0TsCriCfkKZ8jFTXO6ahp0mCstmoU';

// Initialize and export the Supabase client.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
