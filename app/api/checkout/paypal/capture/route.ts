import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { getPayPalAccessToken, getPayPalBaseUrl } from '@/lib/paypal';

function parseCustomId(customId?: string | null): { user_id?: string; product_sku?: string } {
  if (!customId) return {};
  try {
    return JSON.parse(customId);
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('token') || req.nextUrl.searchParams.get('orderId');
  const siteUrl = process.env.SITE_URL ?? 'http://localhost:3000';

  if (!orderId) {
    return NextResponse.redirect(`${siteUrl}/account/downloads?paypal=missing_order`);
  }

  const accessToken = await getPayPalAccessToken();
  const captureResponse = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `capture-${orderId}`,
    },
  });

  if (!captureResponse.ok) {
    return NextResponse.redirect(`${siteUrl}/account/downloads?paypal=capture_failed`);
  }

  const capture = await captureResponse.json();
  const purchaseUnit = capture.purchase_units?.[0];
  const captureDetails = purchaseUnit?.payments?.captures?.[0];
  const parsed = parseCustomId(purchaseUnit?.custom_id || captureDetails?.custom_id);
  const userId = parsed.user_id;
  const productSku = parsed.product_sku || purchaseUnit?.reference_id;

  if (!userId || !productSku) {
    return NextResponse.redirect(`${siteUrl}/account/downloads?paypal=metadata_missing`);
  }

  const supabase = createSupabaseAdminClient();
  const { data: product } = await supabase
    .from('products')
    .select('id')
    .eq('sku', productSku)
    .single();

  if (!product) {
    return NextResponse.redirect(`${siteUrl}/account/downloads?paypal=product_missing`);
  }

  const amount = captureDetails?.amount || purchaseUnit?.amount;
  const amountCents = amount?.value ? Math.round(Number(amount.value) * 100) : 0;
  const currency = amount?.currency_code ?? 'AUD';
  const providerPaymentId = captureDetails?.id || capture.id || orderId;

  const { data: purchase } = await supabase
    .from('purchases')
    .upsert({
      user_id: userId,
      product_id: product.id,
      provider: 'paypal',
      provider_checkout_id: orderId,
      provider_payment_id: providerPaymentId,
      status: 'paid',
      amount_cents: amountCents,
      currency,
      purchased_at: new Date().toISOString(),
    }, { onConflict: 'provider,provider_payment_id' })
    .select('id')
    .single();

  if (purchase) {
    await supabase.rpc('grant_download_access', {
      p_user_id: userId,
      p_product_id: product.id,
      p_purchase_id: purchase.id,
    });
  }

  return NextResponse.redirect(`${siteUrl}/account/downloads?paypal=success`);
}
