// POST /api/membership/check
// Body: { userId: string }
// Returns: { isMember: boolean, downloadsThisMonth: number, monthlyLimit: number }
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const MEMBER_MONTHLY_LIMIT = 10; // members can download 20 forms/month

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ isMember: false, downloadsThisMonth: 0, monthlyLimit: MEMBER_MONTHLY_LIMIT });

  const supabase = createSupabaseAdminClient();

  // Check active membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('status, current_period_end, plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  const isMember = !!membership &&
    (!membership.current_period_end || new Date(membership.current_period_end) > new Date());

  // Count downloads this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: downloadsThisMonth } = await supabase
    .from('download_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  return NextResponse.json({
    isMember,
    downloadsThisMonth: downloadsThisMonth ?? 0,
    monthlyLimit: MEMBER_MONTHLY_LIMIT,
    remainingDownloads: Math.max(0, MEMBER_MONTHLY_LIMIT - (downloadsThisMonth ?? 0)),
    plan: membership?.plan ?? null,
  });
}
