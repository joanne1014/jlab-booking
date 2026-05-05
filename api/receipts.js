import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 用 service role key 喺 server side
);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ═══ GET - 取得收據列表 ═══
    if (req.method === 'GET') {
      const { id, status, search, from, to } = req.query;

      // 取得單一收據
      if (id) {
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return res.status(200).json(data);
      }

      // 取得列表（有篩選）
      let query = supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.or(`receipt_no.ilike.%${search}%,customer_name.ilike.%${search}%,staff_name.ilike.%${search}%`);
      }
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to);

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return res.status(200).json(data);
    }

    // ═══ POST - 建立新收據 ═══
    if (req.method === 'POST') {
      const body = req.body;

      // 生成收據編號
      const today = new Date();
      const dateStr = today.toISOString().slice(0,10).replace(/-/g,'');
      
      // 查詢今日已有幾多張
      const { count } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString().slice(0,10) + 'T00:00:00')
        .lte('created_at', today.toISOString().slice(0,10) + 'T23:59:59');

      const receiptNo = `INV-${dateStr}-${String((count || 0) + 1).padStart(3, '0')}`;

      // 計算金額
      const items = body.items || [];
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      let discountAmount = 0;
      if (body.discount_type === 'percent') {
        discountAmount = Math.round(subtotal * (body.discount_value / 100));
      } else if (body.discount_type === 'fixed') {
        discountAmount = body.discount_value || 0;
      }
      const total = subtotal - discountAmount;

      const newReceipt = {
        receipt_no: receiptNo,
        customer_id: body.customer_id || null,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone || '',
        staff_id: body.staff_id || null,
        staff_name: body.staff_name || '',
        items: items,
        subtotal: subtotal,
        discount_type: body.discount_type || 'none',
        discount_value: body.discount_value || 0,
        discount_amount: discountAmount,
        total: total,
        payment_method: body.payment_method || '',
        status: body.status || 'unpaid',
        remarks: body.remarks || '',
      };

      const { data, error } = await supabase
        .from('receipts')
        .insert(newReceipt)
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    // ═══ PUT - 更新收據 ═══
    if (req.method === 'PUT') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const updates = req.body;
      updates.updated_at = new Date().toISOString();

      // 如果標記為已付
      if (updates.status === 'paid' && !updates.paid_at) {
        updates.paid_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('receipts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    // ═══ DELETE ═══
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Receipt API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
