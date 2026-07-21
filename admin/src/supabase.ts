import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://piknvoejjwgbrgewifeq.supabase.co';
const supabaseAnonKey = 'sb_publishable_l_Ue_-YjL5kd9MgHeRRD9w_WEVkILIX';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
