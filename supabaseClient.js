import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://asgjeusfhziowqgredtx.supabase.co';
const SUPABASE_ANON_KEY = 'AQUÍ_PEGAS_TU_PUBLISHABLE_KEY_QUE_ACABAS_DE_COPIAR';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);