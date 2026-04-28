// pages/api/admin.js
import { createClient } from '@supabase/supabase-js';

/* ═══ 環境變數 ═══ */
const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* ═══ 安全初始化 Supabase client ═══ */
let supabase = null;
try {
  if (SB_URL && SB_KEY) {
    supabase = createClient(SB_URL, SB_KEY);
  }
} catch (e) {
  console.error('Failed to create Supabase client:', e.message);
}

/* ═══ Rate Limiting ═══ */
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

/* ═══ ★ 修正：完整白名單 ═══ */
const ALLOWED_TABLES = [
  'bookings',
  'services',
  'service_addons',
  'service_variants',
  'staff',
  'enabled_timeslots',
  'disabled_timeslots',
  'date_availability',
  'blocked_dates',
  'daily_slots',
  'timeslot_config',
  'notification_templates',
  'frontend_settings',
  'customers',
  'admin_logs',
  'admin_users',
  'reminder_logs',
  'addons',
  'technicians',
  'time_slots',
];

/* ═══ ★ 新增：DB Proxy 核心邏輯（共用） ═══ */
async function handleDbProxy(payload, res) {
  const { method = 'GET', path, body } = payload;
  if (!path) return res.status(400).json({ error: 'Missing path' });

  const table = path.split('?')[0].split('/')[0];
  if (!ALLOWED_TABLES.includes(table)) {
    console.warn(`⚠️ Blocked table access: "${table}"`);
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
  if (method === 'DELETE') headers['Prefer'] = 'return=minimal';

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
    console.error(`DB Proxy Error [${method} ${path}]:`, responseData);
    return res.status(response.status).json(responseData || { error: 'Supabase error' });
  }
  return res.status(200).json(responseData);
}

/* ═══ Main Handler ═══ */
export default async function handler(req, res) {
  /* CORS */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  /* 環境變數檢查 */
  if (!supabase) {
    console.error('Supabase client not initialized. SUPABASE_URL:', SB_URL ? 'SET' : 'MISSING', 'SUPABASE_SERVICE_ROLE_KEY:', SB_KEY ? 'SET' : 'MISSING');
    return res.status(500).json({
      error: '伺服器配置錯誤：無法連接資料庫。請檢查 Vercel 環境變數。',
      debug: { hasUrl: !!SB_URL, hasKey: !!SB_KEY }
    });
  }

  const { action, payload = {} } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  try {
    /* ════════════════════════════════════════════════════════════
       不需要 Token 的 Actions
    ════════════════════════════════════════════════════════════ */

    if (action === 'login') {
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: '嘗試次數過多，請15分鐘後再試' });
      }

      const { email, password } = payload;
      if (!email || !password) return res.status(400).json({ error: '請輸入 email 同密碼' });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: error.message });

      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      return res.status(200).json({
        token: data.session.access_token,
        access_token: data.session.access_token,
        email: data.user.email,
        role: adminUser?.role || 'staff',
        staffId: adminUser?.staff_id || null,
      });
    }

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

    if (action === 'reset-via-token') {
      const { access_token, token, newPassword } = payload;
      const actualToken = access_token || token;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: '密碼最少 6 位' });
      }
      if (!actualToken) {
        return res.status(400).json({ error: '重設連結已過期或無效（缺少 token）' });
      }

      const { data: { user }, error: verifyError } = await supabase.auth.getUser(actualToken);
      if (verifyError || !user) {
        return res.status(401).json({ error: '重設連結已過期或無效，請重新申請' });
      }

      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    /* ════════════════════════════════════════════════════════════
       需要 Token 的 Actions
    ════════════════════════════════════════════════════════════ */
    const user = await verifyToken(req);
    if (!user) return res.status(401).json({ error: '認證已過期，請重新登入' });

    /* ★ 修正：verify action（session 恢復用） */
    if (action === 'verify') {
      return res.status(200).json({ valid: true, email: user.email });
    }

    /* ★ 修正：'db' action — 同 'sb-proxy' 共用同一個邏輯 */
    if (action === 'db' || action === 'sb-proxy') {
      return handleDbProxy(payload, res);
    }

    /* 改密碼 */
    if (action === 'change-password') {
      const { oldPassword, newPassword } = payload;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: '密碼最少 6 位' });
      }

      // 驗證舊密碼
      if (oldPassword) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: oldPassword,
        });
        if (loginErr) return res.status(401).json({ error: '舊密碼不正確' });
      }

      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    /* 衝突檢測 */
    if (action === 'check-conflict') {
      const { date, time, duration, technician, excludeId } = payload;
      try {
        const { data, error } = await supabase.rpc('check_booking_conflict', {
          p_date: date,
          p_start_time: time,
          p_duration: duration || 60,
          p_technician: technician,
          p_exclude_id: excludeId || null,
          p_buffer: payload.buffer || 15,
        });
        if (error) {
          // 如果 RPC 唔存在就 fallback 返 false
          console.warn('check_booking_conflict RPC error:', error.message);
          return res.status(200).json({ hasConflict: false });
        }
        return res.status(200).json({ hasConflict: data });
      } catch (e) {
        return res.status(200).json({ hasConflict: false });
      }
    }

    /* 安全建立預約 */
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
      if (!data?.success) return res.status(409).json({ error: data?.error || '建立失敗' });
      return res.status(200).json(data);
    }

    /* 分頁查詢預約 */
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

    /* 操作日誌 */
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

    /* 客戶 */
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

    /* 提醒 */
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
/* ★ 自動備份（每日一次，靜默執行） */
    /* ============================================
       ★ 儀表板統計
       ============================================ */
    if (action === 'dashboard-stats') {
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const monthStart = today.slice(0, 7) + '-01';

      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true })
          .eq('booking_date', today).neq('status', 'cancelled'),
        supabase.from('bookings').select('*', { count: 'exact', head: true })
          .gte('booking_date', weekAgo).neq('status', 'cancelled'),
        supabase.from('bookings').select('*', { count: 'exact', head: true })
          .gte('booking_date', monthStart).neq('status', 'cancelled'),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true })
          .eq('booking_date', today).eq('status', 'cancelled'),
      ]);

      return res.status(200).json({
        today: r1.count || 0,
        week: r2.count || 0,
        month: r3.count || 0,
        customers: r4.count || 0,
        cancelledToday: r5.count || 0,
      });
    }

    /* ============================================
       ★ 篩選預約記錄（支援日期範圍 + 狀態）
       ============================================ */
    if (action === 'get-bookings') {
      const { fromDate, toDate, status: bookingStatus } = req.method === 'GET' ? req.query : req.body;

      let query = supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      if (fromDate) query = query.gte('booking_date', fromDate);
      if (toDate)   query = query.lte('booking_date', toDate);
      if (bookingStatus && bookingStatus !== 'all') query = query.eq('status', bookingStatus);

      const { data, error } = await query.limit(500);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    /* ============================================
       ★ 更新預約狀態（確認 / 完成 / 取消 + 原因）
       ============================================ */
    if (action === 'update-booking-status') {
      const { bookingId, status: newStatus, cancel_reason } = payload || {};
      if (!bookingId || !newStatus) return res.status(400).json({ error: 'Missing bookingId or status' });

      const updateData = { status: newStatus };
      if (cancel_reason) updateData.cancel_reason = cancel_reason;

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) return res.status(500).json({ error: error.message });

      await supabase.from('audit_logs').insert([{
        action: 'booking_' + newStatus,
        target_type: 'booking',
        target_id: String(bookingId),
        details: { status: newStatus, cancel_reason: cancel_reason || null },
      }]).catch(() => {});

      return res.status(200).json({ success: true });
    }

    /* ============================================
       ★ 檢查預約衝突（防止同時段重複預約）
       ============================================ */
    if (action === 'check-conflict') {
      const { date, time, technician, excludeId } = payload || {};

      let query = supabase
        .from('bookings')
        .select('id, customer_name, booking_time, booking_date')
        .eq('booking_date', date)
        .eq('booking_time', time)
        .neq('status', 'cancelled');

      if (technician) query = query.eq('technician_label', technician);
      if (excludeId) query = query.neq('id', excludeId);

      const { data } = await query;
      return res.status(200).json({
        hasConflict: data && data.length > 0,
        conflicts: data || [],
      });
    }

    /* ============================================
       ★ 更新預約狀態（確認 / 完成 / 取消 + 原因）
       — 自動寫審計記錄
       ============================================ */
    if (action === 'update-booking-status') {
      const { bookingId, status: newStatus, cancel_reason } = payload || {};
      if (!bookingId || !newStatus) return res.status(400).json({ error: 'Missing bookingId or status' });

      const updateData = { status: newStatus };
      if (cancel_reason) updateData.cancel_reason = cancel_reason;

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) return res.status(500).json({ error: error.message });

      await supabase.from('audit_logs').insert([{
        action: 'booking_' + newStatus,
        target_type: 'booking',
        target_id: String(bookingId),
        details: { status: newStatus, cancel_reason: cancel_reason || null },
      }]).catch(() => {});

      return res.status(200).json({ success: true });
    }

    /* ============================================
       ★ 檢查預約衝突
       ============================================ */
    if (action === 'check-conflict') {
      const { date, time, technician, excludeId } = payload || {};

      let query = supabase
        .from('bookings')
        .select('id, customer_name, booking_time, booking_date')
        .eq('booking_date', date)
        .eq('booking_time', time)
        .neq('status', 'cancelled');

      if (technician) query = query.eq('technician_label', technician);
      if (excludeId) query = query.neq('id', excludeId);

      const { data } = await query;
      return res.status(200).json({
        hasConflict: data && data.length > 0,
        conflicts: data || [],
      });
    }

    /* ============================================
       ★ 更新客戶（備註 / 黑名單）
       ============================================ */
    if (action === 'update-customer') {
      const { customerId, notes, is_blacklisted } = payload || {};
      if (!customerId) return res.status(400).json({ error: 'Missing customerId' });

      const updateData = {};
      if (notes !== undefined) updateData.notes = notes;
      if (is_blacklisted !== undefined) updateData.is_blacklisted = is_blacklisted;

      const { error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customerId);

      if (error) return res.status(500).json({ error: error.message });

      await supabase.from('audit_logs').insert([{
        action: is_blacklisted !== undefined ? 'customer_blacklist_toggle' : 'customer_notes_update',
        target_type: 'customer',
        target_id: String(customerId),
        details: updateData,
      }]).catch(() => {});

      return res.status(200).json({ success: true });
    }

    /* ============================================
       ★ 取得審計記錄
       ============================================ */
    if (action === 'get-audit-logs') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(200);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    /* ============================================
       ★ 刷新客戶到訪次數
       ============================================ */
    if (action === 'refresh-customer-stats') {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('customer_phone')
        .in('status', ['confirmed', 'completed']);

      if (bookings) {
        const counts = {};
        bookings.forEach(b => {
          if (b.customer_phone) counts[b.customer_phone] = (counts[b.customer_phone] || 0) + 1;
        });
        for (const [phone, count] of Object.entries(counts)) {
          await supabase.from('customers').update({ total_visits: count }).eq('phone', phone);
        }
      }
      return res.status(200).json({ success: true });
    }
    if (action === 'auto-backup') {
      const today = new Date().toISOString().slice(0, 10);

      const { data: existing } = await supabase
        .from('backups')
        .select('id')
        .eq('backup_date', today)
        .limit(1);

      if (existing && existing.length > 0) {
        return res.status(200).json({ skipped: true, message: '今日已備份' });
      }

      const backup = {};
      const tablesToBackup = [
        'staff', 'services', 'service_variants', 'service_addons',
        'enabled_timeslots', 'date_availability', 'blocked_dates',
        'customers', 'notification_templates'
      ];

      for (const t of tablesToBackup) {
        try {
          const { data } = await supabase.from(t).select('*').limit(10000);
          backup[t] = data || [];
        } catch {
          backup[t] = [];
        }
      }

      const { error: insertErr } = await supabase.from('backups').insert([{
        backup_date: today,
        data: backup,
      }]);

      if (insertErr) return res.status(500).json({ error: insertErr.message });

      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      await supabase.from('backups').delete().lt('backup_date', cutoff);

      return res.status(200).json({ success: true, date: today });
    }
    /* ★ 新增：健康檢查 */
    if (action === 'health') {
      const tables = {};
      for (const t of ['staff', 'services', 'bookings', 'enabled_timeslots']) {
        try {
          const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
          tables[t] = count;
        } catch { tables[t] = 'error'; }
      }
      return res.status(200).json({ status: 'ok', tables, timestamp: new Date().toISOString() });
    }

    /* 未知 action */
    console.warn(`⚠️ Unknown action received: "${action}"`);
    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
