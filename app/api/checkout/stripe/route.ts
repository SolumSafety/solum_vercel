// POST /api/checkout/stripe
// Called when user clicks Buy in the product store.
// Requires: { sku: string, userId: string, userEmail: string }
// Returns: { url: string } — the Stripe Checkout redirect URL
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { SKU_TO_PRICE_CENTS } from '@/lib/products';

const schema = z.object({
  sku:       z.string().min(1),
  userId:    z.string().uuid(),
  userEmail: z.string().email().optional(),
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '');

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { sku, userId, userEmail } = parsed.data;
  const siteUrl = process.env.SITE_URL ?? 'https://solumsafetyconsulting.com.au';

  // Verify user exists in Supabase
  const supabase = createSupabaseAdminClient();
  const { data: user, error: userErr } = await supabase.auth.admin.getUserById(userId);
  if (userErr || !user) {
    return NextResponse.json({ error: 'User not found. Please log in.' }, { status: 401 });
  }

  // Get product from database
  const { data: product } = await supabase
    .from('products')
    .select('id, title, price_cents, stripe_price_id')
    .eq('sku', sku)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
  }

  const priceCents = product.price_cents || SKU_TO_PRICE_CENTS[sku] || 499;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [{
        price_data: {
          currency: 'aud',
          unit_amount: priceCents,
          product_data: {
            name: product.title,
            description: `Solum Safety Consulting — ${sku}`,
          },
        },
        quantity: 1,
      }],
      // CRITICAL: metadata passes user identity to the webhook
      metadata: {
        user_id:     userId,
        product_sku: sku,
        product_id:  product.id,
      },
      success_url: `${siteUrl}/account/downloads?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url:  `${siteUrl}/templates?cancelled=true`,
      automatic_tax: { enabled: false }, // GST handled at price level
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
