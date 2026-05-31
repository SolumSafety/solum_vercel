import { createClient } from '@supabase/supabase-js';

export function createWixAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getWixAuthUrl(redirectUri: string): string {
  const clientId = process.env.WIX_CLIENT_ID;
  if (!clientId) throw new Error('WIX_CLIENT_ID not set');

  return `https://www.wix.com/oauth/access?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=offline_access`;
}
