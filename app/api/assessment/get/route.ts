// GET /api/assessment/get?id=xxx
// Returns a stored assessment with its generated report
// Used by the Wix client portal to display assessment results
//
// v2.0 — June 2026: added v2.0 columns to list query
//   (benchmark_position, category_scores, psychosocial_applicable,
//    cor_applicable, critical_risk_override)

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id      = searchParams.get('id');
  const orgName = searchParams.get('org');
  const status  = searchParams.get('status'); // draft | qa_review | approved | issued
  const tier    = searchParams.get('tier');   // 2 | 3

  const supabase = createSupabaseAdminClient();

  if (id) {
    const { data, error } = await supabase
      .from('whs_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    return NextResponse.json({ assessment: data });
  }

  // List mode — for admin dashboard
  // v2.0: includes new scoring model columns
  let query = supabase
    .from('whs_assessments')
    .select([
      'id',
      'tier',
      'organisation_name',
      'overall_score',          // now a percentage (0–100) in v2.0
      'maturity_label',         // now uses Critical/Basic/Developing/Competent/Leading
      'benchmark_position',     // NEW v2.0: Bottom 10% / Bottom 30% / Average / Top 30% / Top 10%
      'category_scores',        // NEW v2.0: { "Risk Management": 72, "Compliance": 65, ... }
      'critical_risk_override', // NEW v2.0: boolean
      'psychosocial_applicable',// NEW v2.0: boolean
      'psychosocial_score',     // NEW v2.0: number | null
      'cor_applicable',         // NEW v2.0: boolean
      'cor_score',              // NEW v2.0: number | null
      'critical_triggers',
      'high_triggers',
      'status',
      'created_at',
      'assessor',
    ].join(', '))
    .order('created_at', { ascending: false })
    .limit(50);

  if (orgName) query = query.ilike('organisation_name', `%${orgName}%`);
  if (status)  query = query.eq('status', status);
  if (tier)    query = query.eq('tier', parseInt(tier));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 });

  return NextResponse.json({ assessments: data || [] });
}

// PATCH /api/assessment/get — update status (QA workflow)
export async function PATCH(req: NextRequest) {
  const { id, status, qaReviewer, qaNotes } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const validStatuses = ['draft', 'qa_review', 'approved', 'issued'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (qaReviewer)          updateData.qa_reviewer  = qaReviewer;
  if (qaNotes)             updateData.qa_notes     = qaNotes;
  if (status === 'approved') updateData.qa_approved = true;
  if (status === 'issued')   updateData.issued_date = new Date().toISOString();

  const { data, error } = await supabase
    .from('whs_assessments')
    .update(updateData)
    .eq('id', id)
    .select('id, status, updated_at')
    .single();

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  return NextResponse.json({ assessment: data });
}
