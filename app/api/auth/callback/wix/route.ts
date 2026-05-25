// GET /api/auth/callback/wix
// Wix redirects here after the user logs in.
// Exchanges code for tokens, looks up / creates Supabase user, sets session cookie.

import { NextRequest, NextResponse } from 'next/server';
import { exchangeWixCode, getWixMember } from '@/lib/wix-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');
  const siteUrl = process.env.SITE_URL ?? 'https://solumsafetyconsulting.com.au';

  if (error || !code) {
    return NextResponse.redirect(`${siteUrl}/templates?auth_error=true`);
  }

  try {
    // 1. Exchange code for Wix tokens
    const tokens = await exchangeWixCode(code);

    // 2. Get Wix member info
    const wixMember = await getWixMember(tokens.access_token);

    // 3. Look up or create matching Supabase user
    const supabase = createSupabaseAdminClient();

    let supabaseUserId: string;

    // Check if user already exists via email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(u => u.email === wixMember.email);

    if (existing) {
      supabaseUserId = existing.id;
    } else {
      // Create new Supabase user linked to Wix member
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: wixMember.email,
        email_confirm: true,
        user_metadata: {
          wix_member_id: wixMember.id,
          wix_site_id:   process.env.WIX_SITE_ID,
          full_name:     wixMember.name,
        },
      });
      if (createErr || !newUser.user) {
        throw new Error(`Failed to create Supabase user: ${createErr?.message}`);
      }
      supabaseUserId = newUser.user.id;
    }

    // 4. Generate a Supabase session for the user
    const { data: session, error: sessionErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: wixMember.email,
    });
    if (sessionErr) throw new Error(sessionErr.message);

    // 5. Store Wix tokens in Supabase (for membership check)
    await supabase.from('wix_tokens').upsert({
      user_id:       supabaseUserId,
      wix_member_id: wixMember.id,
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at:    new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // 6. Redirect to downloads with magic link (user gets auto-logged in)
    const redirectUrl = session?.properties?.hashed_token
      ? `${siteUrl}/account/downloads?token=${session.properties.hashed_token}&wix=true`
      : `${siteUrl}/account/downloads?wix=true&uid=${supabaseUserId}`;

    return NextResponse.redirect(redirectUrl);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Auth error';
    console.error('[Wix OAuth Callback]', msg);
    return NextResponse.redirect(`${siteUrl}/templates?auth_error=true&msg=${encodeURIComponent(msg)}`);
  }
}
