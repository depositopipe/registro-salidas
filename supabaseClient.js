import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://asgjeusfhziowqgredtx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZ2pldXNmaHppb3dxZ3JlZHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3NDA2NjgsImV4cCI6MjEwOTMxNjY2OH0.ggxaZAwNmpKKffIhCvzuWOsf8OMGcdjG8EaA_5QJ-RQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);