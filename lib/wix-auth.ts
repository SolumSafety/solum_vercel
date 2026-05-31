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

export async function exchangeWixCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
  const clientId = process.env.WIX_CLIENT_ID;
  const clientSecret = process.env.WIX_CLIENT_SECRET;

  const res = await fetch('https://www.wix.com/oauth/access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const data = await res.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}

export async function getWixMember(accessToken: string): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const res = await fetch('https://www.wixapis.com/members/v1/members/my', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const member = data.member;

    return {
      id: member.id,
      email: member.loginEmail || member.contact?.emails?.[0] || '',
      name: `${member.contact?.firstName || ''} ${member.contact?.lastName || ''}`.trim(),
    };
  } catch {
    return null;
  }
}
