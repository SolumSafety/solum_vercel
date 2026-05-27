// POST /api/webhooks/stripe
// Stripe calls this after a payment. Signature is verified before anything happens.
// Grants download_access ONLY after confirmed paid event.
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? ''
    );
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, skipped: 'not_paid' });
    }

    const userId    = session.metadata?.user_id;
    const productSku = session.metadata?.product_sku;

    if (!userId || !productSku) {
      // Fallback: try to identify product by amount (for legacy Payment Links)
      console.warn('[Stripe Webhook] Missing metadata — userId:', userId, 'sku:', productSku);
      return NextResponse.json({ error: 'Missing checkout metadata. Use /api/checkout/stripe to initiate checkout.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Get product ID from SKU
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('id')
      .eq('sku', productSku)
      .single();

    if (prodErr || !product) {
      return NextResponse.json({ error: `Product not found for SKU: ${productSku}` }, { status: 404 });
    }

    // Record purchase (upsert — idempotent if webhook fires twice)
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id ?? session.id;

    const { data: purchase, error: purchaseErr } = await supabase
      .from('purchases')
      .upsert({
        user_id:              userId,
        product_id:           product.id,
        provider:             'stripe',
        provider_checkout_id: session.id,
        provider_payment_id:  paymentIntentId,
        status:               'paid',
        amount_cents:         session.amount_total ?? 0,
        currency:             (session.currency ?? 'aud').toUpperCase(),
        purchased_at:         new Date().toISOString(),
      }, { onConflict: 'provider,provider_payment_id' })
      .select('id')
      .single();

    if (purchaseErr || !purchase) {
      console.error('[Stripe Webhook] Purchase insert error:', purchaseErr);
      return NextResponse.json({ error: 'Could not record purchase.' }, { status: 500 });
    }

    // Grant download access — this is the key step
    await supabase.rpc('grant_download_access', {
      p_user_id:    userId,
      p_product_id: product.id,
      p_purchase_id: purchase.id,
    });

    console.log(`[Stripe Webhook] Access granted — user:${userId} sku:${productSku}`);
  }

  return NextResponse.json({ received: true });
}

// Required: Stripe sends raw body. Next.js must not parse it.

