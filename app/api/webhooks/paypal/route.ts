import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { verifyPayPalWebhook } from '@/lib/paypal';

function parseCustomId(resource: any): { user_id?: string; product_sku?: string } {
  const customId = resource?.custom_id || resource?.purchase_units?.[0]?.custom_id || resource?.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
  if (!customId) return {};
  try {
    return JSON.parse(customId);
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const verified = await verifyPayPalWebhook(req.headers, rawBody);

  if (!verified) {
    return NextResponse.json({ error: 'Invalid PayPal webhook signature.' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type;

  if (eventType !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ received: true, ignored: true });
  }

  const resource = event.resource;
  const parsed = parseCustomId(resource);
  const userId = parsed.user_id;
  const productSku = parsed.product_sku || resource?.purchase_units?.[0]?.reference_id || resource?.invoice_id;

  if (!userId || !productSku) {
    return NextResponse.json({ error: 'Missing PayPal user/product metadata.' }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('sku', productSku)
    .single();

  if (productError || !product) return NextResponse.json({ error: 'Product not found in database.' }, { status: 404 });

  const amount = resource?.amount || resource?.purchase_units?.[0]?.amount;
  const amountCents = amount?.value ? Math.round(Number(amount.value) * 100) : 0;
  const currency = amount?.currency_code ?? 'AUD';

  const providerPaymentId = resource?.id ?? event.id;

  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .upsert({
      user_id: userId,
      product_id: product.id,
      provider: 'paypal',
      provider_checkout_id: resource?.id,
      provider_payment_id: providerPaymentId,
      status: 'paid',
      amount_cents: amountCents,
      currency,
      purchased_at: new Date().toISOString(),
    }, { onConflict: 'provider,provider_payment_id' })
    .select('id')
    .single();

  if (purchaseError || !purchase) return NextResponse.json({ error: 'Could not record PayPal purchase.' }, { status: 500 });

  await supabase.rpc('grant_download_access', {
    p_user_id: userId,
    p_product_id: product.id,
    p_purchase_id: purchase.id,
  });

  return NextResponse.json({ received: true });
}
