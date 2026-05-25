// GET /api/auth/assessor-session
// Header: Authorization: Bearer <token>
// Validates the assessor JWT and returns session info
// Used by Wix Velo to gate the admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ valid: false, error: 'No token provided.' }, { status: 401 });
  }

  const token = auth.replace('Bearer ', '');
  const secret = new TextEncoder().encode(
    process.env.ASSESSOR_JWT_SECRET ?? 'solum-assessor-jwt-change-in-production'
  );

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'solum-safety-consulting'
    });

    if (payload.role !== 'assessor') {
      return NextResponse.json({ valid: false, error: 'Not an assessor account.' }, { status: 403 });
    }

    return NextResponse.json({
      valid:    true,
      email:    payload.email,
      name:     payload.name,
      role:     payload.role,
      expiresAt: new Date((payload.exp ?? 0) * 1000).toISOString(),
    });
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid or expired session.' }, { status: 401 });
  }
}
