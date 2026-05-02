// ========================================
// api/customer.js（建議獨立一個 file）
// ========================================
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { action, ...payload } = req.body;

  switch (action) {

    // ─────────────────────────────────
    // 取得所有客戶列表（簡要）
    // ─────────────────────────────────
    case 'get-customers': {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ customers: data });
    }

    // ─────────────────────────────────
    // 取得單一客戶完整檔案
    // ─────────────────────────────────
    case 'get-customer-profile': {
      const { phone } = payload;
      if (!phone) return res.status(400).json({ error: 'Missing phone' });

      // 基本資料
      const { data: customer, error: custErr } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();

      if (custErr) return res.status(500).json({ error: custErr.message });

      // 服務記錄
      const { data: records } = await supabase
        .from('service_records')
        .select('*')
        .eq('customer_phone', phone)
        .order('service_date', { ascending: false });

      // 消費記錄
      const { data: consumption } = await supabase
        .from('consumption_records')
        .select('*')
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false });

      // 套票
      const { data: packages } = await supabase
        .from('customer_packages')
        .select('*')
        .eq('customer_phone', phone)
        .eq('status', 'active');

      // 積分記錄
      const { data: points } = await supabase
        .from('points_log')
        .select('*')
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false })
        .limit(20);

      return res.status(200).json({
        customer,
        serviceRecords: records || [],
        consumption: consumption || [],
        packages: packages || [],
        pointsLog: points || [],
      });
    }

    // ─────────────────────────────────
    // 新增 / 更新客戶基本資料 + 偏好
    // ─────────────────────────────────
    case 'upsert-customer': {
      const { phone, ...fields } = payload;
      if (!phone) return res.status(400).json({ error: 'Missing phone' });

      const { data, error } = await supabase
        .from('customers')
        .upsert(
          { phone, ...fields, updated_at: new Date().toISOString() },
          { onConflict: 'phone' }
        )
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ customer: data });
    }

    // ─────────────────────────────────
    // 新增服務記錄
    // ─────────────────────────────────
    case 'add-service-record': {
      const { customer_phone, ...recordData } = payload;
      if (!customer_phone) return res.status(400).json({ error: 'Missing phone' });

      const { data, error } = await supabase
        .from('service_records')
        .insert({ customer_phone, ...recordData })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      // 同時更新客戶嘅 total_visits
      await supabase.rpc('increment_visits', { p_phone: customer_phone });

      return res.status(200).json({ record: data });
    }

    // ─────────────────────────────────
    // 新增消費記錄
    // ─────────────────────────────────
    case 'add-consumption': {
      const { customer_phone, amount, ...rest } = payload;
      if (!customer_phone) return res.status(400).json({ error: 'Missing phone' });

      const { data, error } = await supabase
        .from('consumption_records')
        .insert({ customer_phone, amount, ...rest })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      // 更新客戶總消費
      await supabase
        .from('customers')
        .update({
          total_spent: supabase.rpc ? undefined : 0, // 用 RPC 更安全
          updated_at: new Date().toISOString(),
        })
        .eq('phone', customer_phone);

      // 用 RPC 更新 total_spent
      await supabase.rpc('add_spent', { p_phone: customer_phone, p_amount: amount });

      return res.status(200).json({ record: data });
    }

    // ─────────────────────────────────
    // 增減積分
    // ─────────────────────────────────
    case 'adjust-points': {
      const { customer_phone, points, type, description } = payload;
      if (!customer_phone || !points) return res.status(400).json({ error: 'Missing data' });

      // 記錄積分變動
      const { error: logErr } = await supabase
        .from('points_log')
        .insert({ customer_phone, points, type: type || 'adjust', description: description || '' });

      if (logErr) return res.status(500).json({ error: logErr.message });

      // 更新客戶總積分
      await supabase.rpc('adjust_points', { p_phone: customer_phone, p_points: points });

      return res.status(200).json({ success: true });
    }

    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}
