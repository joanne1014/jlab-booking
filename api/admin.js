// pages/api/admin.js
import { createClient } from '@supabase/supabase-js';

/* ═══ 環境變數 ═══ */
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* ═══ 🔥 新增：安全初始化 Supabase client ═══ */
let supabase = null;
try {
  if (SB_URL && SB_KEY) {
    supabase = createClient(SB_URL, SB_KEY);
  }
} catch (e) {
  console.error('Failed to create Supabase client:', e.message);
}

/* ═══ Rate Limiting（防暴力破解）═══ */
const loginAttempts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, first: now };
  if (now - rec.first > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, first: now });
    return true;
  }
  if (rec.count >= 10) return false;
  rec.count++;
  loginAttempts.set(ip, rec);
  return true;
}

/* ═══ Token 驗證 ═══ */
async function verifyToken(req) {
  const h = req.headers.authorization || req.headers.Authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  const token = h.slice(7);
  if (!token) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/* ═══ Supabase REST Proxy 白名單 ═══ */
const ALLOWED_TABLES = [
  'bookings', 'services', 'service_addons', 'staff',
  'timeslot_config', 'notification_templates', 'frontend_settings',
  'customers', 'admin_logs', 'admin_users', 'reminder_logs',
];

/* ═══ Main Handler ═══ */
export default async function handler(req, res) {
  /* CORS */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  /* 🔥 新增：環境變數診斷 — 如果 Supabase client 初始化失敗，直接報錯 */
  if (!supabase) {
    console.error('Supabase client not initialized. SUPABASE_URL:', SB_URL ? 'SET' : 'MISSING', 'SUPABASE_SERVICE_ROLE_KEY:', SB_KEY ? 'SET' : 'MISSING');
    return res.status(500).json({
      error: '伺服器配置錯誤：無法連接資料庫。請檢查 Vercel 環境變數。',
      debug: {
        hasUrl: !!SB_URL,
        hasKey: !!SB_KEY,
      }
    });
  }

  const { action, payload = {} } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  try {
    /* ────────────────────────────────────────────────────────────
       LOGIN（唔需要 token）
    ──────────────────────────────────────────────────────────── */
    if (action === 'login') {
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: '嘗試次數過多，請15分鐘後再試' });
      }

      const { email, password } = payload;
      if (!email || !password) return res.status(400).json({ error: '請輸入 email 同密碼' });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: error.message });

      // 查角色
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      return res.status(200).json({
        token: data.session.access_token,
        access_token: data.session.access_token,  /* 🔥 修改：兼容兩種寫法 */
        email: data.user.email,
        role: adminUser?.role || 'staff',
        staffId: adminUser?.staff_id || null,
      });
    }

    /* ────────────────────────────────────────────────────────────
       🔥 新增：RECOVER（忘記密碼 — 唔需要 token）
    ──────────────────────────────────────────────────────────── */
    if (action === 'recover') {
      const { email, redirectUrl } = payload;
      if (!email) return res.status(400).json({ error: '請輸入 Email' });

      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: '嘗試次數過多，請稍後再試' });
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl || undefined,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    /* ────────────────────────────────────────────────────────────
       🔥 新增：RESET-VIA-TOKEN（用 email 連結嘅 token 重設密碼 — 唔需要 token）
    ──────────────────────────────────────────────────────────── */
    if (action === 'reset-via-token') {
      const { access_token, refresh_token, newPassword } = payload;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: '密碼最少 6 位' });
      }
      if (!access_token) {
        return res.status(400).json({ error: '重設連結已過期或無效（缺少 token）' });
      }

      // 用 access_token 驗證用戶身份
      const { data: { user }, error: verifyError } = await supabase.auth.getUser(access_token);
      if (verifyError || !user) {
        return res.status(401).json({ error: '重設連結已過期或無效，請重新申請' });
      }

      // 用 admin API 更新密碼
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    /* ────────────────────────────────────────────────────────────
       以下所有 action 都需要有效 token
    ──────────────────────────────────────────────────────────── */
    const user = await verifyToken(req);
    if (!user) return res.status(401).json({ error: '認證已過期，請重新登入' });

    /* ── 改密碼 ── */
    if (action === 'change-password') {
      const { newPassword } = payload;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: '密碼最少 6 位' });
      }
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    /* ── 衝突檢測 ── */
    if (action === 'check-conflict') {
      const { date, time, duration, technician, excludeId } = payload;
      const { data, error } = await supabase.rpc('check_booking_conflict', {
        p_date: date,
        p_start_time: time,
        p_duration: duration || 60,
        p_technician: technician,
        p_exclude_id: excludeId || null,
        p_buffer: payload.buffer || 15,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ hasConflict: data });
    }

    /* ── 安全建立預約 ── */
    if (action === 'create-booking-safe') {
      const { data, error } = await supabase.rpc('create_booking_safe', {
        p_date: payload.date,
        p_time: payload.time,
        p_duration: payload.duration || 60,
        p_technician: payload.technician,
        p_customer_name: payload.customerName,
        p_customer_phone: payload.customerPhone,
        p_service_name: payload.serviceName,
        p_variant_label: payload.variantLabel || null,
        p_addon_names: payload.addonNames || [],
        p_total_price: payload.totalPrice || 0,
        p_notes: payload.notes || '',
        p_staff_id: payload.staffId || null,
      });
      if (error) return res.status(500).json({ error: error.message });
      if (!data.success) return res.status(409).json({ error: data.error });
      return res.status(200).json(data);
    }

    /* ── 分頁查詢預約 ── */
    if (action === 'bookings-paginated') {
      const page = payload.page || 1;
      const pageSize = Math.min(payload.pageSize || 50, 200);
      const offset = (page - 1) * pageSize;

      let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (payload.dateFrom) query = query.gte('booking_date', payload.dateFrom);
      if (payload.dateTo) query = query.lte('booking_date', payload.dateTo);
      if (payload.status) query = query.eq('status', payload.status);
      if (payload.technician) query = query.eq('technician_label', payload.technician);
      if (payload.search) {
        query = query.or(
          `customer_name.ilike.%${payload.search}%,customer_phone.ilike.%${payload.search}%`
        );
      }

      const { data, error, count } = await query;
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({
        bookings: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      });
    }

    /* ── 操作日誌 ── */
    if (action === 'log-action') {
      await supabase.from('admin_logs').insert([{
        action: payload.text,
        details: payload.text,
        admin_email: user.email,
      }]);
      return res.status(200).json({ success: true });
    }

    if (action === 'load-logs') {
      const { data } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      return res.status(200).json(data || []);
    }

    /* ── 客戶 ── */
    if (action === 'load-customers') {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('last_visit_date', { ascending: false, nullsFirst: false })
        .limit(payload.limit || 200);
      return res.status(200).json(data || []);
    }

    if (action === 'update-customer') {
      const { id, updates } = payload;
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    }

    if (action === 'customer-bookings') {
      const { phone } = payload;
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_phone', phone)
        .order('booking_date', { ascending: false })
        .limit(50);
      return res.status(200).json(data || []);
    }

    /* ── 提醒（生成 WhatsApp 連結）── */
    if (action === 'generate-reminders') {
      const targetDate = payload.date;
      if (!targetDate) return res.status(400).json({ error: 'Missing date' });

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', targetDate)
        .in('status', ['confirmed', 'pending']);

      const reminders = (bookings || [])
        .filter(b => b.customer_phone)
        .map(b => {
          const phone = b.customer_phone.replace(/[^0-9]/g, '');
          const fullPhone = phone.length <= 8 ? '852' + phone : phone;
          const msg = `${b.customer_name} 你好！提醒你 ${b.booking_date} ${b.booking_time} 有預約（${b.service_name || ''}）。如需更改請提前聯絡我哋 🙏`;
          return {
            bookingId: b.id,
            name: b.customer_name,
            phone: fullPhone,
            message: msg,
            waLink: `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`,
          };
        });

      return res.status(200).json({ reminders, count: reminders.length });
    }

    /* ────────────────────────────────────────────────────────────
       Supabase REST Proxy（取代前端直接用 service key）
    ──────────────────────────────────────────────────────────── */
    if (action === 'sb-proxy') {
      const { method = 'GET', path, body } = payload;
      if (!path) return res.status(400).json({ error: 'Missing path' });

      const table = path.split('?')[0].split('/')[0];
      if (!ALLOWED_TABLES.includes(table)) {
        return res.status(403).json({ error: `Table "${table}" not allowed` });
      }

      const url = `${SB_URL}/rest/v1/${path}`;
      const headers = {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
      };
      if (method === 'POST') headers['Prefer'] = 'return=representation';
      if (method === 'PATCH') headers['Prefer'] = 'return=representation';

      const fetchOpts = { method, headers };
      if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
        fetchOpts.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOpts);

      if (response.status === 204) {
        return res.status(200).json({ success: true });
      }

      const responseData = await response.json().catch(() => null);
      if (!response.ok) {
        return res.status(response.status).json(responseData || { error: 'Supabase error' });
      }
      return res.status(200).json(responseData);
    }

    /* ── 未知 action ── */
    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
