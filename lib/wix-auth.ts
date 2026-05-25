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

export async function exchangeWixCode(code: string) {
  const res = await fetch('https://www.wix.com/oauth2/token', {
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
  if (!res.ok) throw new Error(`Wix token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function getWixMember(accessToken: string) {
  const res = await fetch('https://www.wix.com/oauth2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch Wix member info');
  return res.json();
}
