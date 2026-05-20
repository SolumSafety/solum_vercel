# Solum Safety Consulting — Vercel API Layer

Secure payment webhooks and download signing for solumsafetyconsulting.com.au

## What this does
- Receives and verifies Stripe payment webhooks → grants download access in Supabase
- Receives and verifies PayPal payment webhooks → same
- Generates 5-minute signed download URLs from private Supabase Storage
- Hosts the /account/downloads member page
- Provides Stripe Checkout endpoint that passes user_id to webhooks

## Deploy in 5 steps

### 1. Push to GitHub
Create a new GitHub repo and push this folder to it.

### 2. Connect to Vercel
Go to vercel.com → Add New Project → import the GitHub repo.
When prompted for framework, select Next.js.

### 3. Add environment variables in Vercel
In Vercel project settings → Environment Variables, add everything from .env.example.
Get the Supabase Service Role key from: Supabase Dashboard → Settings → API → service_role

### 4. Get your Supabase Service Role key
Dashboard → Project Settings → API → service_role key
This is the only key not pre-filled in .env.example (it must stay secret).

### 5. Configure Stripe webhook
After Vercel deploys (you'll get a URL like https://solum-api.vercel.app):
- Stripe Dashboard → Developers → Webhooks → Add endpoint
- URL: https://your-vercel-url.vercel.app/api/webhooks/stripe
- Events: checkout.session.completed
- Copy the signing secret → add as STRIPE_WEBHOOK_SECRET in Vercel env vars
- Redeploy

### 6. Configure PayPal webhook
- PayPal Developer Dashboard → My Apps → Your App → Webhooks
- URL: https://your-vercel-url.vercel.app/api/webhooks/paypal
- Event: PAYMENT.CAPTURE.COMPLETED
- Copy Webhook ID → add as PAYPAL_WEBHOOK_ID in Vercel env vars

### 7. Update product_store.html
In your Wix product_store.html, change the Buy buttons from direct Stripe Payment Links
to calling this endpoint instead:
  POST https://your-vercel-url.vercel.app/api/checkout/stripe
  Body: { sku, userId, userEmail }
This passes user identity to the checkout so the webhook can grant access.

## API Endpoints
| Endpoint | Method | Purpose |
|---|---|---|
| /api/checkout/stripe | POST | Create Stripe Checkout session with metadata |
| /api/webhooks/stripe | POST | Verify payment → grant download access |
| /api/webhooks/paypal | POST | Verify PayPal payment → grant access |
| /api/checkout/paypal/capture | GET | Capture PayPal payment after approval |
| /api/downloads/sign-url | POST | Generate 5-min signed download URL |
| /account/downloads | GET | Member downloads page |

## Supabase Storage — file upload paths
Upload your Word/Excel/ZIP files to the paid-products bucket using these paths:
  products/whs/SSC-WHS-RA-001.docx
  products/whs/SSC-WHS-RA-001.xlsx
  products/rca/SSC-RCA-INC-001.docx
  bundles/SSC-BND-WHS-001.zip
  (full list in lib/products.ts)
