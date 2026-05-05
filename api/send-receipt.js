import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { receipt_id, method, phone, email } = req.body;
    // method: 'whatsapp' | 'email'

    // 取得收據
    const { data: receipt, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receipt_id)
      .single();
    if (error) throw error;

    // 取得風格設定
    const { data: template } = await supabase
      .from('receipt_template')
      .select('*')
      .limit(1)
      .single();

    const style = template || { shop_name: 'J.LAB', footer_text: '多謝惠顧' };

    if (method === 'whatsapp') {
      // ══ WhatsApp 方案 ══
      // 方案A: 用 WhatsApp Business API (Twilio / 360dialog)
      // 方案B: 直接開 wa.me link（簡單，但只能發文字）
      // 方案C: 用 WhatsApp Cloud API（Meta 官方，免費）
      
      const msg = formatWhatsAppMessage(receipt, style);
      const waLink = `https://wa.me/${phone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`;
      
      // 更新記錄
      await supabase.from('receipts').update({
        sent_via: 'whatsapp',
        sent_at: new Date().toISOString()
      }).eq('id', receipt_id);

      return res.status(200).json({ 
        success: true, 
        method: 'whatsapp',
        wa_link: waLink,
        message: msg
      });
    }

    if (method === 'email') {
      // ══ Email 方案 ══
      // 用 Resend API（免費 100 封/日）
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      
      if (RESEND_API_KEY) {
        const emailHtml = generateEmailHTML(receipt, style);
        
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: `${style.shop_name} <receipts@yourdomain.com>`,
            to: [email],
            subject: `收據 ${receipt.receipt_no} - ${style.shop_name}`,
            html: emailHtml
          })
        });

        const emailResult = await emailRes.json();
        
        // 更新記錄
        await supabase.from('receipts').update({
          sent_via: 'email',
          sent_at: new Date().toISOString()
        }).eq('id', receipt_id);

        return res.status(200).json({ success: true, method: 'email', result: emailResult });
      } else {
        // 無 API key，回傳 HTML 讓前端處理
        return res.status(200).json({ 
          success: true, 
          method: 'email',
          fallback: true,
          mailto: `mailto:${email}?subject=${encodeURIComponent(`收據 ${receipt.receipt_no}`)}&body=${encodeURIComponent(formatTextReceipt(receipt, style))}`
        });
      }
    }

    return res.status(400).json({ error: 'Invalid method' });
  } catch (err) {
    console.error('Send Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function formatWhatsAppMessage(receipt, style) {
  const items = receipt.items || [];
  let msg = '';
  msg += `*${style.shop_name}*\n`;
  msg += `${style.shop_address || ''}\n\n`;
  msg += `📋 *收據 ${receipt.receipt_no}*\n`;
  msg += `📅 ${new Date(receipt.created_at).toLocaleDateString('zh-HK')}\n`;
  msg += `👤 ${receipt.customer_name}\n`;
  if (receipt.staff_name) msg += `✂️ 服務員：${receipt.staff_name}\n`;
  msg += `\n━━━━━━━━━━━━━━\n`;
  items.forEach(item => {
    msg += `• ${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''} — $${item.price * item.qty}\n`;
  });
  msg += `━━━━━━━━━━━━━━\n`;
  if (receipt.discount_amount > 0) {
    msg += `🏷️ 折扣: -$${receipt.discount_amount}\n`;
  }
  msg += `\n💰 *總計：$${receipt.total}*\n\n`;
  if (receipt.payment_method && receipt.status === 'paid') {
    msg += `💳 ${receipt.payment_method} ✓ 已付清\n`;
  }
  msg += `\n${style.footer_text || '多謝惠顧！'}`;
  return msg;
}

function formatTextReceipt(receipt, style) {
  const items = receipt.items || [];
  let txt = `${style.shop_name}\n收據 ${receipt.receipt_no}\n\n`;
  items.forEach(item => { txt += `${item.name} $${item.price * item.qty}\n`; });
  txt += `\n總計: $${receipt.total}\n`;
  txt += `${style.footer_text}`;
  return txt;
}

function generateEmailHTML(receipt, style) {
  const items = receipt.items || [];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,sans-serif;background:#F5EEF0;padding:20px;">
<div style="max-width:400px;margin:0 auto;background:#fff;border-radius:12px;padding:28px 24px;box-shadow:0 4px 20px rgba(0,0,0,.06);">
<div style="height:3px;background:linear-gradient(90deg,#C4849A,#DDB8C4,#EDD8E0);border-radius:2px;margin-bottom:16px;"></div>
<h1 style="text-align:center;font-size:16px;color:#38242e;letter-spacing:2px;margin:0 0 4px;">${style.shop_name}</h1>
<p style="text-align:center;font-size:10px;color:#9e7e88;margin:0;">${style.shop_address || ''}<br>Tel: ${style.shop_phone || ''}</p>
<hr style="border:none;height:1px;background:rgba(200,180,188,.3);margin:14px 0;">
<p style="font-size:10px;color:#9e7e88;">${receipt.receipt_no} · ${new Date(receipt.created_at).toLocaleDateString('zh-HK')}</p>
<p style="font-size:11px;color:#6a4a56;">客戶：<strong>${receipt.customer_name}</strong>${receipt.staff_name ? ` · 服務員：${receipt.staff_name}` : ''}</p>
<hr style="border:none;height:1px;background:rgba(200,180,188,.3);margin:14px 0;">
${items.map(item => `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:11px;color:#6a4a56;border-bottom:0.5px solid rgba(200,180,188,.2);"><span>${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}</span><span style="font-weight:600;">$${item.price * item.qty}</span></div>`).join('')}
<hr style="border:none;height:1px;background:rgba(200,180,188,.3);margin:14px 0;">
${receipt.discount_amount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:10px;color:#c06060;padding:4px 0;"><span>折扣</span><span>-$${receipt.discount_amount}</span></div>` : ''}
<div style="display:flex;justify-content:space-between;align-items:center;border-top:2px solid #C4849A;padding-top:10px;margin-top:8px;">
<span style="font-size:12px;color:#38242e;">總計</span>
<span style="font-size:22px;font-weight:700;color:#38242e;">$${receipt.total}</span>
</div>
${receipt.status === 'paid' ? `<div style="margin-top:10px;padding:6px 10px;background:#f0f7ed;border-radius:6px;font-size:10px;color:#2e7d32;">💳 ${receipt.payment_method} · ✓ 已付清</div>` : ''}
<hr style="border:none;height:1px;background:rgba(200,180,188,.3);margin:14px 0;">
<p style="text-align:center;font-size:10px;color:#9e7e88;">${style.footer_text || ''}</p>
</div></body></html>`;
}
