import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const PRODUCT_TIER_MAP: Record<string, number> = {
  'fe5a2766-4c3a-4973-9385-7b231967902d': 1,
  '040c2269-d38a-4319-9777-9d9444952a5a': 2,
  '68795fcc-25fe-4597-b326-271f3426c0c7': 3,
};

const TIER_PRICES: Record<number, string> = {
  1: 'AU$55.00', 2: 'AU$3,500.00', 3: 'AU$7,500.00',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, orderId, clientName, clientEmail, clientPhone, organisation, notes } = body;

    if (!productId || !clientEmail) {
      return NextResponse.json({ error: 'productId and clientEmail required' }, { status: 400 });
    }

    const tier = PRODUCT_TIER_MAP[productId];
    if (!tier) {
      return NextResponse.json({ received: true, processed: false, reason: 'Not a WHS product' });
    }

    const supabase = createSupabaseAdminClient();
    const dateStr  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const jobRef   = `SSC-T${tier}-${dateStr}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const { data: job, error } = await supabase
      .from('assessment_pipeline')
      .insert({
        job_ref:           jobRef,
        tier,
        wix_order_id:      orderId || null,
        client_name:       clientName || 'New Client',
        client_email:      clientEmail,
        client_phone:      clientPhone || null,
        organisation_name: organisation || clientName || 'Not provided',
        jurisdiction:      'NSW',
        purchase_notes:    notes || null,
        status:            tier === 1 ? 'active' : 'pending',
        revenue:           tier === 1 ? 5500 : tier === 2 ? 350000 : 750000,
        purchased_at:      new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[NewJob] DB error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Send assessor alert email for Tier 2 and 3
    if (tier > 1 && process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Solum Safety Consulting <noreply@solumsafetyconsulting.com.au>',
          to:   ['solumsafetyconsulting@gmail.com'],
          subject: `🆕 New Tier ${tier} Assessment — ${clientName || clientEmail} (Ref: ${jobRef})`,
          html: `<p><strong>New Tier ${tier} assessment purchased.</strong></p>
                 <p>Client: ${clientName || 'Not provided'}<br>
                 Email: ${clientEmail}<br>
                 Phone: ${clientPhone || 'Not provided'}<br>
                 Organisation: ${organisation || 'Not provided'}<br>
                 Reference: ${jobRef}<br>
                 Revenue: ${TIER_PRICES[tier]}</p>
                 <p><a href="https://solum-vercel-solumvercel.vercel.app/SolumSafety_assessor.html">Open Assessor Dashboard</a></p>`
        })
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, jobId: job.id, jobRef, tier });

  } catch (err) {
    console.error('[NewJob] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
