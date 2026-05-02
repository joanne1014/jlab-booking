// pages/api/admin.js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

let supabase = null;
try {
  if (SB_URL && SB_KEY) supabase = createClient(SB_URL, SB_KEY);
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

/* ═══ 白名單 ═══ */
const ALLOWED_TABLES = [
  'bookings','services','service_addons','service_variants',
  'staff','enabled_timeslots','disabled_timeslots',
  'date_availability','blocked_dates','daily_slots',
  'timeslot_config','notification_templates','frontend_settings',
  'customers','admin_logs','admin_users','reminder_logs',
  'addons','technicians','time_slots','audit_logs','backups',
];

/* ═══ DB Proxy ═══ */
async function handleDbProxy(payload, res) {
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
  if (method === 'POST')   headers['Prefer'] = 'return=representation';
  if (method === 'PATCH')  headers['Prefer'] = 'return=representation';
  if (method === 'DELETE') headers['Prefer'] = 'return=minimal';

  const fetchOpts = { method, headers };
  if (body && ['POST','PATCH','PUT'].includes(method)) {
    fetchOpts.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOpts);
  if (response.status === 204) return res.status(200).json({ success: true });

  const responseData = await response.json().catch(() => null);
  if (!response.ok) {
    return res.status(response.status).json(responseData || { error: 'Supabase error' });
  }
  return res.status(200).json(responseData);
}

/* ═══════════════════════════════════════════
   Main Handler
   ═══════════════════════════════════════════ */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  if (!supabase) {
    return res.status(500).json({
      error: '伺服器配置錯誤：無法連接資料庫',
      debug: { hasUrl: !!SB_URL, hasKey: !!SB_KEY },
    });
  }

  const { action, payload = {} } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  try {

    /* ══════════════════════════════════════
       不需要 Token
       ══════════════════════════════════════ */

    if (action === 'login') {
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: '嘗試次數過多，請15分鐘後再試' });
      }
      const { email, password } = payload;
      if (!email || !password) return res.status(400).json({ error: '請輸入 email 同密碼' });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return res.status(401).json({ error: error.message });

      let role = 'staff';
      let staffId = null;
      try {
        const { data: adminUser } = await supabase
          .from('admin_users').select('*').eq('email', email).single();
        if (adminUser) {
          role = adminUser.role || 'staff';
          staffId = adminUser.staff_id || null;
        }
      } catch (_) {}

      return res.status(200).json({
        token: data.session.access_token,
        access_token: data.session.access_token,
        email: data.user.email,
        role,
        staffId,
      });
    }

    if (action === 'recover') {
      const { email, redirectUrl } = payload;
      if (!email) return res.status(400).json({ error: '請輸入 Email' });
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
      if (!checkRateLimit(ip)) return res.status(429).json({ error: '嘗試次數過多，請稍後再試' });
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl || undefined,
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    if (action === 'reset-via-token') {
      const { access_token, token, newPassword } = payload;
      const actualToken = access_token || token;
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: '密碼最少 6 位' });
      if (!actualToken) return res.status(400).json({ error: '重設連結已過期或無效（缺少 token）' });
      const { data: { user: resetUser }, error: verifyError } = await supabase.auth.getUser(actualToken);
      if (verifyError || !resetUser) return res.status(401).json({ error: '重設連結已過期或無效，請重新申請' });
      const { error } = await supabase.auth.admin.updateUserById(resetUser.id, { password: newPassword });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    /* ══════════════════════════════════════
       需要 Token
       ══════════════════════════════════════ */

    const user = await verifyToken(req);
    if (!user) return res.status(401).json({ error: '認證已過期，請重新登入' });

    if (action === 'verify') {
      return res.status(200).json({ valid: true, email: user.email });
    }

    if (action === 'db' || action === 'sb-proxy') {
      return handleDbProxy(payload, res);
    }

    if (action === 'change-password') {
      const { oldPassword, newPassword } = payload;
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: '密碼最少 6 位' });
      if (oldPassword) {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPassword });
        if (loginErr) return res.status(401).json({ error: '舊密碼不正確' });
      }
      const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true });
    }

    /* ══════════════════════════════════════
       預約相關
       ══════════════════════════════════════ */

    if (action === 'check-conflict') {
      const { date, time, technician, excludeId } = payload;
      let query = supabase
        .from('bookings')
        .select('id, customer_name, booking_time, booking_date')
        .eq('booking_date', date)
        .eq('booking_time', time)
        .neq('status', 'cancelled');
      if (technician) query = query.eq('technician_label', technician);
      if (excludeId)  query = query.neq('id', excludeId);
      const { data } = await query;
      return res.status(200).json({
        hasConflict: data && data.length > 0,
        conflicts: data || [],
      });
    }

    if (action === 'update-booking-status') {
      const { bookingId, status: newStatus, cancel_reason } = payload;
      if (!bookingId || !newStatus) return res.status(400).json({ error: 'Missing bookingId or status' });
      const updateData = { status: newStatus };
      if (cancel_reason) updateData.cancel_reason = cancel_reason;
      const { error } = await supabase.from('bookings').update(updateData).eq('id', bookingId);
      if (error) return res.status(500).json({ error: error.message });

      // ★ 確認/完成時自動建立或更新客戶
      if (['confirmed', 'completed'].includes(newStatus)) {
        try {
          const { data: booking } = await supabase
            .from('bookings')
            .select('customer_name, customer_phone, booking_date, total_price')
            .eq('id', bookingId)
            .single();

          if (booking && booking.customer_phone) {
            const { data: existCust } = await supabase
              .from('customers')
              .select('id, total_visits, total_spent')
              .eq('phone', booking.customer_phone)
              .limit(1);

            if (existCust && existCust.length > 0) {
              await supabase.from('customers').update({
                name: booking.customer_name,
                total_visits: (existCust[0].total_visits || 0) + 1,
                total_spent: (existCust[0].total_spent || 0) + (booking.total_price || 0),
                last_visit_date: booking.booking_date,
              }).eq('id', existCust[0].id);
            } else {
              await supabase.from('customers').insert([{
                name: booking.customer_name,
                phone: booking.customer_phone,
                total_visits: 1,
                total_spent: booking.total_price || 0,
                last_visit_date: booking.booking_date,
                tags: [],
                notes: '',
                is_blacklisted: false,
              }]);
            }
          }
        } catch (e) {
          console.error('Auto-create customer error:', e.message);
        }
      }

      await supabase.from('audit_logs').insert([{
        action: 'booking_' + newStatus,
        target_type: 'booking',
        target_id: String(bookingId),
        details: { status: newStatus, cancel_reason: cancel_reason || null },
      }]).catch(() => {});
      return res.status(200).json({ success: true });
    }

    if (action === 'create-booking-safe') {
      try {
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
        if (error) throw error;
        if (!data?.success) return res.status(409).json({ error: data?.error || '建立失敗' });
        return res.status(200).json(data);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    if (action === 'get-bookings') {
      const { fromDate, toDate, status: bookingStatus } = payload;
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
      if (payload.dateFrom)    query = query.gte('booking_date', payload.dateFrom);
      if (payload.dateTo)      query = query.lte('booking_date', payload.dateTo);
      if (payload.status)      query = query.eq('status', payload.status);
      if (payload.technician)  query = query.eq('technician_label', payload.technician);
      if (payload.search) {
        query = query.or(`customer_name.ilike.%${payload.search}%,customer_phone.ilike.%${payload.search}%`);
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

    /* ══════════════════════════════════════
       客戶相關
       ══════════════════════════════════════ */

    if (action === 'load-customers') {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('last_visit_date', { ascending: false, nullsFirst: false })
        .limit(payload.limit || 200);
      return res.status(200).json(data || []);
    }

    if (action === 'update-customer') {
      const customerId = payload.id || payload.customerId;
      if (!customerId) return res.status(400).json({ error: 'Missing customer id' });
      let updateData = {};
      if (payload.updates) {
        updateData = payload.updates;
      } else {
        if (payload.notes !== undefined)          updateData.notes = payload.notes;
        if (payload.is_blacklisted !== undefined)  updateData.is_blacklisted = payload.is_blacklisted;
      }
      const { data, error } = await supabase
        .from('customers').update(updateData).eq('id', customerId).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await supabase.from('audit_logs').insert([{
        action: payload.is_blacklisted !== undefined ? 'customer_blacklist_toggle' : 'customer_update',
        target_type: 'customer',
        target_id: String(customerId),
        details: updateData,
      }]).catch(() => {});
      return res.status(200).json(data || { success: true });
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

    if (action === 'refresh-customer-stats') {
      // 1. 攞所有已確認/已完成嘅預約
      const { data: bookings, error: bErr } = await supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'completed']);

      if (bErr) return res.status(500).json({ error: bErr.message });

      // 2. 按電話號碼分組統計
      const phoneMap = {};
      for (const b of (bookings || [])) {
        const phone = b.customer_phone;
        if (!phone) continue;

        if (!phoneMap[phone]) {
          phoneMap[phone] = {
            name: b.customer_name || '未知',
            phone,
            total_visits: 0,
            total_spent: 0,
            last_visit_date: null,
          };
        }

        // 計算次數同金額
        phoneMap[phone].total_visits++;
        phoneMap[phone].total_spent += (b.total_price || 0);

        // 記錄最近一次日期
        if (b.booking_date) {
          if (!phoneMap[phone].last_visit_date || b.booking_date > phoneMap[phone].last_visit_date) {
            phoneMap[phone].last_visit_date = b.booking_date;
          }
        }

        // 用最新嘅名
        if (b.customer_name) {
          phoneMap[phone].name = b.customer_name;
        }
      }

      // 3. Upsert：有就 update，冇就 insert
      let created = 0;
      let updated = 0;

      for (const phone of Object.keys(phoneMap)) {
        const cust = phoneMap[phone];

        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', phone)
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase
            .from('customers')
            .update({
              name: cust.name,
              total_visits: cust.total_visits,
              total_spent: cust.total_spent,
              last_visit_date: cust.last_visit_date,
            })
            .eq('id', existing[0].id);
          updated++;
        } else {
          await supabase
            .from('customers')
            .insert([{
              name: cust.name,
              phone: cust.phone,
              total_visits: cust.total_visits,
              total_spent: cust.total_spent,
              last_visit_date: cust.last_visit_date,
              tags: [],
              notes: '',
              is_blacklisted: false,
            }]);
          created++;
        }
      }

      return res.status(200).json({
        success: true,
        total: Object.keys(phoneMap).length,
        created,
        updated,
      });
    }

    /* ══════════════════════════════════════
       統計 / 審計
       ══════════════════════════════════════ */

    if (action === 'dashboard-stats') {
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const monthStart = today.slice(0, 7) + '-01';
      const [r1, r2, r3, r4, r5] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', today).neq('status', 'cancelled'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('booking_date', weekAgo).neq('status', 'cancelled'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('booking_date', monthStart).neq('status', 'cancelled'),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_date', today).eq('status', 'cancelled'),
      ]);
      return res.status(200).json({
        today: r1.count || 0,
        week: r2.count || 0,
        month: r3.count || 0,
        customers: r4.count || 0,
        cancelledToday: r5.count || 0,
      });
    }

    if (action === 'get-audit-logs') {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('performed_at', { ascending: false })
        .limit(200);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    }

    /* ══════════════════════════════════════
       日誌
       ══════════════════════════════════════ */

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

    /* ══════════════════════════════════════
       提醒
       ══════════════════════════════════════ */

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

    /* ══════════════════════════════════════
       備份
       ══════════════════════════════════════ */

    if (action === 'auto-backup') {
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase
        .from('backups').select('id').eq('backup_date', today).limit(1);
      if (existing && existing.length > 0) {
        return res.status(200).json({ skipped: true, message: '今日已備份' });
      }
      const backup = {};
      const tablesToBackup = [
        'staff','services','service_variants','service_addons',
        'enabled_timeslots','date_availability','blocked_dates',
        'customers','notification_templates',
      ];
      for (const t of tablesToBackup) {
        try {
          const { data } = await supabase.from(t).select('*').limit(10000);
          backup[t] = data || [];
        } catch { backup[t] = []; }
      }
      const { error: insertErr } = await supabase.from('backups').insert([{
        backup_date: today,
        data: backup,
      }]);
      if (insertErr) return res.status(500).json({ error: insertErr.message });
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      await supabase.from('backups').delete().lt('backup_date', cutoff);
      return res.status(200).json({ success: true, date: today });
    }

    /* ══════════════════════════════════════
       健康檢查
       ══════════════════════════════════════ */

    if (action === 'health') {
      const tables = {};
      for (const t of ['staff','services','bookings','enabled_timeslots']) {
        try {
          const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
          tables[t] = count;
        } catch { tables[t] = 'error'; }
      }
      return res.status(200).json({ status: 'ok', tables, timestamp: new Date().toISOString() });
    }

    /* ══════════════════════════════════════ */

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
