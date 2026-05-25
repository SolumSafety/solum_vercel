// POST /api/auth/verify-otp
// Body: { email: string, code: string }
// 1. Finds the most recent unused, unexpired OTP for this email
// 2. Verifies code hash matches
// 3. Marks OTP as used
// 4. Returns a signed JWT session token for the assessor dashboard
// Max 5 attempts before lockout (prevents brute force)

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient }  from '@/lib/supabase-admin';
import crypto from 'crypto';
import { SignJWT } from 'jose';

const MAX_ATTEMPTS  = 5;
const SESSION_HOURS = 8;   // assessor session lasts 8 hours

function hashOTP(code: string): string {
  const secret = process.env.OTP_SECRET ?? 'solum-otp-secret-change-me';
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

async function createSessionToken(email: string, name: string): Promise<string> {
  const secret = new TextEncoder().encode(
    process.env.ASSESSOR_JWT_SECRET ?? 'solum-assessor-jwt-change-in-production'
  );
  return new SignJWT({ email, name, role: 'assessor' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .setIssuer('solum-safety-consulting')
    .sign(secret);
}

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code required.' }, { status: 400 });
  }

  // Sanitise — code must be exactly 6 digits
  const cleanCode = String(code).trim().replace(/\D/g, '');
  if (cleanCode.length !== 6) {
    return NextResponse.json({ error: 'Invalid code format.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Find the most recent valid OTP for this email
  const { data: otp } = await supabase
    .from('assessor_otp')
    .select('id, code_hash, expires_at, used, attempts')
    .eq('email', email.toLowerCase().trim())
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otp) {
    return NextResponse.json({
      error: 'No valid code found. Codes expire after 10 minutes — please request a new one.'
    }, { status: 401 });
  }

  // Check attempt limit
  if (otp.attempts >= MAX_ATTEMPTS) {
    // Mark as used to prevent further attempts
    await supabase.from('assessor_otp').update({ used: true }).eq('id', otp.id);
    return NextResponse.json({
      error: `Too many incorrect attempts. Please request a new code.`
    }, { status: 429 });
  }

  // Verify code
  const expectedHash = hashOTP(cleanCode);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(otp.code_hash),
    Buffer.from(expectedHash)
  );

  if (!isValid) {
    // Increment attempt counter
    await supabase.from('assessor_otp')
      .update({ attempts: otp.attempts + 1 })
      .eq('id', otp.id);

    const remaining = MAX_ATTEMPTS - otp.attempts - 1;
    return NextResponse.json({
      error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
    }, { status: 401 });
  }

  // ✅ Code is correct — mark as used immediately (single-use)
  await supabase.from('assessor_otp').update({ used: true }).eq('id', otp.id);

  // Get assessor details for the session token
  const { data: assessor } = await supabase
    .from('assessor_whitelist')
    .select('name, email')
    .eq('email', email.toLowerCase().trim())
    .single();

  // Create signed session token
  const token = await createSessionToken(
    assessor?.email ?? email,
    assessor?.name  ?? 'Assessor'
  );

  // Log successful login
  console.log(`[2FA] Assessor login verified: ${email} at ${new Date().toISOString()}`);

  return NextResponse.json({
    verified: true,
    token,
    expiresIn: SESSION_HOURS * 3600,
    assessor: { email: assessor?.email, name: assessor?.name }
  });
}
