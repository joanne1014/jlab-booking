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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { receipt_id } = req.body;

    // 1. 取得收據資料
    const { data: receipt, error: rErr } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receipt_id)
      .single();
    if (rErr) throw rErr;

    // 2. 取得風格設定
    const { data: template } = await supabase
      .from('receipt_template')
      .select('*')
      .limit(1)
      .single();

    const style = template || {
      shop_name: 'J.LAB HAIR STUDIO',
      shop_address: '尖沙咀加連威老道 28 號 3 樓',
      shop_phone: '2345-6789',
      footer_text: '多謝惠顧 Thank You!',
    };

    // 3. 生成 HTML（用你嘅風格設定）
    const html = generateReceiptHTML(receipt, style);

    // 4. 回傳 HTML（前端可以用呢個 HTML 去做 print / 或者用 html2pdf.js 轉 PDF）
    return res.status(200).json({
      success: true,
      html: html,
      receipt: receipt,
    });

  } catch (err) {
    console.error('PDF Generation Error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function generateReceiptHTML(receipt, style) {
  const items = receipt.items || [];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500&family=Noto+Sans+TC:wght@300;400;500&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Noto Serif TC', serif;
      background: #F5EEF0;
      padding: 20px;
      display: flex;
      justify-content: center;
    }
    .receipt {
      width: 320px;
      background: #fff;
      border-radius: 8px;
      padding: 28px 22px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid rgba(200,180,188,0.3);
    }
    .header {
      text-align: center;
      margin-bottom: 16px;
    }
    .shop-name {
      font-size: 14px;
      font-weight: 500;
      color: #38242e;
      letter-spacing: 2px;
    }
    .shop-info {
      font-size: 9px;
      color: #9e7e88;
      margin-top: 4px;
    }
    .divider {
      height: 1px;
      background: rgba(200,180,188,0.35);
      margin: 12px 0;
      position: relative;
    }
    .divider::after {
      content: '✦';
      position: absolute;
      left: 50%;
      top: -6px;
      transform: translateX(-50%);
      background: #fff;
      padding: 0 8px;
      font-size: 8px;
      color: #C4849A;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #9e7e88;
      margin-bottom: 8px;
    }
    .customer-info {
      font-size: 10px;
      color: #6a4a56;
      margin-bottom: 4px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 10px;
      color: #6a4a56;
      border-bottom: 0.5px solid rgba(200,180,188,0.2);
    }
    .item-price {
      font-family: 'Cormorant Garamond', serif;
      font-size: 12px;
      color: #38242e;
    }
    .subtotal-row {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #9e7e88;
      padding: 4px 0;
    }
    .discount-row {
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #c06060;
      padding: 4px 0;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1.5px solid #C4849A;
      margin-top: 8px;
    }
    .total-label {
      font-size: 11px;
      color: #38242e;
    }
    .total-amount {
      font-size: 18px;
      font-weight: 600;
      color: #38242e;
    }
    .payment-badge {
      margin-top: 10px;
      padding: 6px 10px;
      background: rgba(196,132,154,0.08);
      border-radius: 6px;
      font-size: 9px;
      color: #6a4a56;
      display: flex;
      justify-content: space-between;
    }
    .paid-badge {
      color: #2e7d32;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      margin-top: 16px;
      font-size: 9px;
      color: #9e7e88;
    }
    .top-line {
      height: 3px;
      background: linear-gradient(90deg, #C4849A, #DDB8C4, #EDD8E0);
      border-radius: 2px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="top-line"></div>
    <div class="header">
      <div class="shop-name">${style.shop_name}</div>
      <div class="shop-info">${style.shop_address}</div>
      <div class="shop-info">Tel: ${style.shop_phone}</div>
    </div>
    <div class="divider"></div>
    <div class="meta">
      <span>${receipt.receipt_no}</span>
      <span>${new Date(receipt.created_at).toLocaleDateString('zh-HK')} ${new Date(receipt.created_at).toLocaleTimeString('zh-HK',{hour:'2-digit',minute:'2-digit'})}</span>
    </div>
    <div class="customer-info">
      客戶：<strong>${receipt.customer_name}</strong>
      ${receipt.staff_name ? ` · 服務員：${receipt.staff_name}` : ''}
    </div>
    <div class="divider"></div>
    ${items.map(item => `
      <div class="item-row">
        <span>${item.name}${item.qty > 1 ? ` ×${item.qty}` : ''}</span>
        <span class="item-price">$${item.price * item.qty}</span>
      </div>
    `).join('')}
    <div class="divider"></div>
    <div class="subtotal-row">
      <span>小計</span><span>$${receipt.subtotal}</span>
    </div>
    ${receipt.discount_amount > 0 ? `
      <div class="discount-row">
        <span>折扣 (${receipt.discount_type === 'percent' ? receipt.discount_value + '%' : '$' + receipt.discount_value})</span>
        <span>-$${receipt.discount_amount}</span>
      </div>
    ` : ''}
    <div class="total-row">
      <span class="total-label">總計</span>
      <span class="total-amount">$${receipt.total}</span>
    </div>
    ${receipt.payment_method ? `
      <div class="payment-badge">
        <span>💳 ${receipt.payment_method}</span>
        ${receipt.status === 'paid' ? '<span class="paid-badge">✓ 已付清</span>' : ''}
      </div>
    ` : ''}
    ${receipt.remarks ? `<div style="margin-top:8px;font-size:8px;color:#9e7e88;font-style:italic;">📝 ${receipt.remarks}</div>` : ''}
    <div class="divider"></div>
    <div class="footer">${style.footer_text}</div>
  </div>
</body>
</html>`;
}
