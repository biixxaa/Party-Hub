import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://boohxylibbujlibmwexi.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UJBSvCDMJqTUXLolm89C8Q__W9YGx5H';

export const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;

