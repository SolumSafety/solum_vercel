// Wix OAuth 2.0 integration
// Docs: https://dev.wix.com/docs/build-apps/build-your-app/authentication/oauth

const WIX_AUTH_BASE = 'https://www.wix.com/oauth2/token';
const WIX_USERINFO   = 'https://www.wix.com/oauth2/userinfo';

export function getWixAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id:     process.env.WIX_CLIENT_ID ?? '',
    redirect_uri:  process.env.NEXT_PUBLIC_WIX_REDIRECT_URI ?? '',
    response_type: 'code',
    scope:         'offline_access',
    state:         state ?? crypto.randomUUID(),
  });
  return `https://www.wix.com/oauth2/authorize?${params}`;
}

export async function exchangeWixCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(WIX_AUTH_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type:    'authorization_code',
      client_id:     process.env.WIX_CLIENT_ID,
      client_secret: process.env.WIX_CLIENT_SECRET,
      redirect_uri:  process.env.NEXT_PUBLIC_WIX_REDIRECT_URI,
      code,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Wix token exchange failed: ${err}`);
  }
  return res.json();
}

export async function getWixMember(accessToken: string): Promise<{
  id: string;
  email: string;
  name?: string;
  picture?: string;
}> {
  const res = await fetch(WIX_USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Wix member info');
  return res.json();
}
