// Member downloads page — /account/downloads
// Shows all purchased products with secure download buttons
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { SKU_TO_FILE_KEYS } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function DownloadsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; paypal?: string; session_id?: string }>;
}) {
  const params = await searchParams;

  // Get auth token from cookie (server-side)
  // For Wix embed: token passed via URL param after redirect
  const token = undefined; // handled client-side via JS below
  const supabase = createSupabaseAdminClient();

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 760, margin: '0 auto', padding: '28px 20px', background: '#f5f3ef', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <img src="https://static.wixstatic.com/media/bc735f_b2e81e8865874f99ab4b9548dc6ef20e~mv2.png" alt="Solum Safety" style={{ height: 28 }} />
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#172c20' }}>My Downloads</h1>
      </div>

      {params.success && (
        <div style={{ background: '#e4f4e8', border: '1px solid #88c898', borderLeft: '3px solid #287040', borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#1a3828' }}>
          ✅ Payment confirmed — your download is ready below.
        </div>
      )}
      {params.paypal === 'success' && (
        <div style={{ background: '#e4f4e8', border: '1px solid #88c898', borderLeft: '3px solid #287040', borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#1a3828' }}>
          ✅ PayPal payment confirmed — your download is ready below.
        </div>
      )}

      <div id="downloadsContent" style={{ background: '#fff', border: '1px solid #e0d8cc', borderRadius: 8, padding: '20px' }}>
        <p style={{ color: '#7a8a78', fontSize: 13 }}>Loading your downloads…</p>
      </div>

      <p style={{ fontSize: 11.5, color: '#aab4a8', marginTop: 16, lineHeight: 1.6 }}>
        Download links are secure and expire after 5 minutes. You can generate a new link at any time (up to 10 downloads per licence). Files are delivered from private storage.
      </p>

      <script dangerouslySetInnerHTML={{ __html: `
        const SB_URL = '${process.env.NEXT_PUBLIC_SUPABASE_URL}';
        const SB_ANON = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}';
        const API = '${process.env.SITE_URL ?? ''}';

        async function loadDownloads() {
          // Get current session via Supabase JS
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
          script.onload = async () => {
            const { createClient } = window.supabase;
            const sb = createClient(SB_URL, SB_ANON);
            const { data: { session } } = await sb.auth.getSession();
            if (!session) {
              document.getElementById('downloadsContent').innerHTML =
                '<p style="color:#c03028;font-size:13px">⚠ Please <a href="/login" style="color:#172c20">log in</a> to view your downloads.</p>';
              return;
            }
            // Fetch download access records
            const { data: access } = await sb.from('download_access')
              .select('product_id, download_count, max_downloads, access_granted_at, products(sku, title, file_keys)')
              .eq('is_active', true)
              .order('access_granted_at', { ascending: false });

            if (!access?.length) {
              document.getElementById('downloadsContent').innerHTML =
                '<p style="color:#7a8a78;font-size:13px">No purchases yet. <a href="/templates" style="color:#172c20">Browse templates →</a></p>';
              return;
            }

            const html = access.map(a => {
              const p = a.products;
              const fkeys = p?.file_keys || [];
              const btns = fkeys.map(fk => {
                const fname = fk.split('/').pop();
                return \`<button onclick="downloadFile('\${a.product_id}','\${fk}','\${session.access_token}')"
                  style="padding:8px 14px;background:#172c20;color:#d8f0da;border:none;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;margin-right:6px">\${fname}</button>\`;
              }).join('');
              return \`<div style="padding:14px 0;border-bottom:1px solid #f0ece4">
                <div style="font-size:13.5px;font-weight:600;color:#172c20;margin-bottom:4px">\${p?.title || '—'}</div>
                <div style="font-size:10px;color:#aab4a8;margin-bottom:8px">\${a.download_count}/\${a.max_downloads} downloads used · Purchased \${new Date(a.access_granted_at).toLocaleDateString('en-AU')}</div>
                \${btns}
              </div>\`;
            }).join('');
            document.getElementById('downloadsContent').innerHTML = html;
          };
          document.head.appendChild(script);
        }

        async function downloadFile(productId, fileKey, token) {
          const res = await fetch(API + '/api/downloads/sign-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ productId, fileKey })
          });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
          else alert('Download error: ' + (data.error || 'Unknown error'));
        }

        loadDownloads();
      `}} />
    </main>
  );
}
