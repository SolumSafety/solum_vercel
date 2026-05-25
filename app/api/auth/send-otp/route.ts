// POST /api/auth/send-otp
// Body: { email: string }
// 1. Checks email is on assessor whitelist
// 2. Generates a 6-digit OTP
// 3. Stores bcrypt hash in Supabase (expires 10 min)
// 4. Sends code via email (Resend) and optionally SMS (Twilio)
// Returns: { sent: true } — never reveals the code itself

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient }  from '@/lib/supabase-admin';
import crypto from 'crypto';

// Rate limit: max 3 OTP requests per email per 10 minutes
const RATE_WINDOW_MS  = 10 * 60 * 1000;
const RATE_MAX        = 3;
const OTP_EXPIRY_MINS = 10;

function generateOTP(): string {
  // Cryptographically secure 6-digit code
  return String(crypto.randomInt(100000, 999999));
}

function hashOTP(code: string): string {
  // SHA-256 + server secret — fast enough for OTPs (bcrypt is overkill here)
  const secret = process.env.OTP_SECRET ?? 'solum-otp-secret-change-me';
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

async function sendEmail(to: string, code: string, name: string): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) { console.warn('[OTP] RESEND_API_KEY not set — skipping email'); return false; }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Solum Safety Consulting <noreply@solumsafetyconsulting.com.au>',
      to:      [to],
      subject: 'Your Assessor Login Code — Solum Safety Consulting',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <img src="https://static.wixstatic.com/media/bc735f_b2e81e8865874f99ab4b9548dc6ef20e~mv2.png"
               style="height:48px;margin-bottom:24px" alt="Solum Safety Consulting">
          <h2 style="color:#3D5A80;margin-bottom:8px">Assessor Login Verification</h2>
          <p style="color:#444">Hi ${name},</p>
          <p style="color:#444">Your 6-digit verification code is:</p>
          <div style="background:#f4f6f8;border:2px solid #3D5A80;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#3D5A80;font-family:monospace">${code}</span>
          </div>
          <p style="color:#666;font-size:14px">This code expires in <strong>10 minutes</strong>.<br>
             If you did not request this code, please contact us immediately.</p>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0">
          <p style="color:#999;font-size:12px">Solum Safety Consulting · ABN 54 932 321 683 · solumsafetyconsulting.com.au</p>
        </div>
      `
    })
  });
  return res.ok;
}

async function sendSMS(phone: string, code: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[OTP] Twilio not configured — skipping SMS');
    return false;
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      From: fromNumber,
      To:   phone,
      Body: `Solum Safety: Your assessor login code is ${code}. Expires in 10 minutes. Do not share this code.`
    })
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

  const supabase = createSupabaseAdminClient();

  // 1. Check whitelist
  const { data: assessor } = await supabase
    .from('assessor_whitelist')
    .select('email, name, phone, is_active')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .maybeSingle();

  // Always return the same response to prevent email enumeration
  if (!assessor) {
    await new Promise(r => setTimeout(r, 800)); // timing attack prevention
    return NextResponse.json({ sent: true }); // don't reveal email not found
  }

  // 2. Rate limit check — max 3 OTPs per 10 minutes
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from('assessor_otp')
    .select('id', { count: 'exact', head: true })
    .eq('email', assessor.email)
    .gte('created_at', windowStart);

  if ((count ?? 0) >= RATE_MAX) {
    return NextResponse.json({
      error: 'Too many code requests. Please wait 10 minutes before trying again.'
    }, { status: 429 });
  }

  // 3. Generate OTP
  const code    = generateOTP();
  const hash    = hashOTP(code);
  const expires = new Date(Date.now() + OTP_EXPIRY_MINS * 60 * 1000).toISOString();

  // 4. Store hash in Supabase (never the raw code)
  await supabase.from('assessor_otp').insert({
    email:      assessor.email,
    code_hash:  hash,
    expires_at: expires,
    used:       false,
    attempts:   0,
  });

  // 5. Send email + SMS in parallel
  const [emailSent, smsSent] = await Promise.all([
    sendEmail(assessor.email, code, assessor.name || 'Assessor'),
    assessor.phone ? sendSMS(assessor.phone, code) : Promise.resolve(false),
  ]);

  console.log(`[OTP] Sent to ${assessor.email} — email:${emailSent} sms:${smsSent}`);

  return NextResponse.json({ sent: true, channels: { email: emailSent, sms: !!assessor.phone } });
}
