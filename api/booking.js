import { createClient } from '@supabase/supabase-js'

const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase = null;
try {
  if (SB_URL && SB_KEY) supabase = createClient(SB_URL, SB_KEY);
} catch (e) {
  console.error('Failed to create Supabase client:', e.message);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabase) return res.status(500).json({ error: '伺服器配置錯誤' });

  const { action, payload = {} } = req.body || {};
  if (!action) return res.status(400).json({ error: 'Missing action' });

  try {

    // ═══ 取得所有上架中嘅服務 ═══
    if (action === 'get-services') {
      const { data: services, error: sErr } = await supabase
        .from('services').select('*').eq('is_active', true).order('sort_order', { ascending: true });
      if (sErr) return res.status(500).json({ error: sErr.message });
      const serviceIds = (services || []).map(s => s.id);
      let variants = [];
      if (serviceIds.length > 0) {
        const { data: v } = await supabase
          .from('service_variants').select('*').in('service_id', serviceIds)
          .eq('is_active', true).order('sort_order', { ascending: true });
        variants = v || [];
      }
      const result = (services || []).map(s => ({ ...s, variants: variants.filter(v => v.service_id === s.id) }));
      return res.status(200).json({ services: result });
    }

    // ═══ 取得附加項目 ═══
    if (action === 'get-addons') {
      const { data, error } = await supabase
        .from('service_addons').select('*').eq('is_active', true).order('sort_order', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ addons: data || [] });
    }

    // ═══ 取得所有員工 ═══
    if (action === 'get-staff') {
      const { data, error } = await supabase
        .from('staff').select('id, name, sort_order').eq('is_active', true).order('sort_order', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ staff: data || [] });
    }

    // ═══ 取得可預約日期（支援按技師篩選）═══
    if (action === 'get-available-dates') {
      const { staffId } = payload;
      const today = new Date().toISOString().slice(0, 10);
      const futureDate = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

      const { data: blocked } = await supabase
        .from('blocked_dates').select('date').gte('date', today).lte('date', futureDate);
      const blockedSet = new Set((blocked || []).map(b => b.date));

      let availQuery = supabase
        .from('date_availability').select('available_date, staff_id, status')
        .gte('available_date', today).lte('available_date', futureDate).eq('status', 'available');
      if (staffId) availQuery = availQuery.eq('staff_id', staffId);
      const { data: available } = await availQuery;

      const { data: bookings } = await supabase
        .from('bookings').select('booking_date')
        .gte('booking_date', today).lte('booking_date', futureDate).neq('status', 'cancelled');
      const bookingCount = {};
      (bookings || []).forEach(b => { bookingCount[b.booking_date] = (bookingCount[b.booking_date] || 0) + 1; });

      const dateMap = {};
      (available || []).forEach(a => {
        if (blockedSet.has(a.available_date)) return;
        if (!dateMap[a.available_date]) dateMap[a.available_date] = { staffCount: 0 };
        dateMap[a.available_date].staffCount++;
      });

      let slotsQuery = supabase
        .from('enabled_timeslots').select('slot_date').gte('slot_date', today).lte('slot_date', futureDate);
      if (staffId) slotsQuery = slotsQuery.eq('staff_id', staffId);
      const { data: slots } = await slotsQuery;
      const slotCount = {};
      (slots || []).forEach(s => { slotCount[s.slot_date] = (slotCount[s.slot_date] || 0) + 1; });

      const dates = Object.keys(dateMap).sort().map(d => {
        const totalSlots = slotCount[d] || 0;
        const booked = bookingCount[d] || 0;
        const ratio = totalSlots > 0 ? booked / totalSlots : 0;
        let status = 'ok';
        if (ratio > 0.8) status = 'full';
        else if (ratio > 0.5) status = 'few';
        return { date: d, status, staffCount: dateMap[d].staffCount, totalSlots, booked };
      }).filter(d => d.status !== 'full');

      return res.status(200).json({ dates, blocked: [...blockedSet] });
    }

    // ═══ 取得某日期嘅可用時段 ═══
    if (action === 'get-timeslots') {
      const { date, staffId } = payload;
      if (!date) return res.status(400).json({ error: 'Missing date' });

      const { data: isBlocked } = await supabase
        .from('blocked_dates').select('id').eq('date', date).limit(1);
      if (isBlocked && isBlocked.length > 0) return res.status(200).json({ slots: [], blocked: true });

      let query = supabase
        .from('enabled_timeslots').select('slot_time, staff_id')
        .eq('slot_date', date).order('slot_time', { ascending: true });
      if (staffId) query = query.eq('staff_id', staffId);
      const { data: enabledSlots } = await query;

      const { data: existingBookings } = await supabase
        .from('bookings').select('booking_time, technician_label, duration_minutes')
        .eq('booking_date', date).neq('status', 'cancelled');

      const staffSlots = {};
      (enabledSlots || []).forEach(s => {
        const sid = s.staff_id;
        if (!staffSlots[sid]) staffSlots[sid] = [];
        staffSlots[sid].push(s.slot_time?.slice(0, 5));
      });

      const staffIds = Object.keys(staffSlots);
      let staffNames = {};
      if (staffIds.length > 0) {
        const { data: staffData } = await supabase.from('staff').select('id, name').in('id', staffIds);
        (staffData || []).forEach(s => { staffNames[s.id] = s.name; });
      }

      const bookedSlots = new Set();
      (existingBookings || []).forEach(b => {
        const t = b.booking_time?.slice(0, 5);
        const tech = b.technician_label;
        if (t && tech) bookedSlots.add(`${t}|${tech}`);
      });

      const result = [];
      for (const [sid, times] of Object.entries(staffSlots)) {
        const name = staffNames[sid] || '未知';
        const avail = times.filter(t => !bookedSlots.has(`${t}|${name}`));
        if (avail.length > 0) result.push({ staffId: sid, staffName: name, slots: avail });
      }
      return res.status(200).json({ slots: result, blocked: false });
    }
// ═══ 發送通知給店主 ═══
      try {
        // 取得通知設定
        const { data: settings } = await supabase
          .from('frontend_settings')
          .select('notification_email, whatsapp_number, brand_name')
          .limit(1)
          .single();

        if (settings?.notification_email) {
          // 發送 Email 通知（使用 Resend）
          const RESEND_KEY = process.env.RESEND_API_KEY;
          if (RESEND_KEY) {
            const emailBody = `
📋 新預約通知

服務：${serviceName}${variantLabel ? ` (${variantLabel})` : ''}
${addonNames?.length ? `加購：${addonNames.join('、')}\n` : ''}日期：${bookingDate}
時段：${bookingTime}
技師：${technicianLabel || '待分配'}

客人資料：
姓名：${customerName}
電話：${customerPhone}
${notes ? `備註：${notes}\n` : ''}
總額：$${totalPrice}

---
此通知由 ${settings.brand_name || 'J.LAB'} 預約系統自動發送
            `.trim();

            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_KEY}`
              },
              body: JSON.stringify({
                from: `${settings.brand_name || 'J.LAB'} Booking <onboarding@resend.dev>`,
                to: [settings.notification_email],
                subject: `🆕 新預約 - ${customerName} | ${bookingDate} ${bookingTime}`,
                text: emailBody
              })
            });
          }
        }
      } catch (notifyErr) {
        // 通知失敗唔影響預約結果
        console.error('Notification failed:', notifyErr.message);
      }
    // ═══ 提交預約 ═══
    if (action === 'submit-booking') {
      const { serviceName, variantLabel, addonNames, bookingDate, bookingTime, technicianLabel, staffId, customerName, customerPhone, notes, totalPrice, durationMinutes } = payload;
      if (!serviceName || !bookingDate || !bookingTime || !customerName || !customerPhone)
        return res.status(400).json({ error: '請填寫所有必填欄位' });

      const { data: isBlocked } = await supabase.from('blocked_dates').select('id').eq('date', bookingDate).limit(1);
      if (isBlocked && isBlocked.length > 0) return res.status(409).json({ error: '此日期已關閉，無法預約' });

      let conflictQuery = supabase.from('bookings').select('id')
        .eq('booking_date', bookingDate).eq('booking_time', bookingTime).neq('status', 'cancelled');
      if (technicianLabel) conflictQuery = conflictQuery.eq('technician_label', technicianLabel);
      const { data: conflicts } = await conflictQuery;
      if (conflicts && conflicts.length > 0) return res.status(409).json({ error: '此時段已被預約，請選擇其他時間' });

      const { data: blacklisted } = await supabase
        .from('customers').select('id, is_blacklisted').eq('phone', customerPhone).eq('is_blacklisted', true).limit(1);
      if (blacklisted && blacklisted.length > 0) return res.status(403).json({ error: '無法預約，請聯絡店舖' });

      const { data: newBooking, error: insertErr } = await supabase.from('bookings').insert([{
        service_name: serviceName, variant_label: variantLabel || null, addon_names: addonNames || [],
        booking_date: bookingDate, booking_time: bookingTime,
        technician_label: technicianLabel || null, staff_id: staffId || null,
        customer_name: customerName, customer_phone: customerPhone,
        customer_notes: notes || null, notes: notes || null,
        total_price: totalPrice || 0, duration_minutes: durationMinutes || 60, status: 'pending',
      }]).select().single();
      if (insertErr) return res.status(500).json({ error: insertErr.message });

      try {
        const { data: existing } = await supabase.from('customers').select('id').eq('phone', customerPhone).limit(1);
        if (!existing || existing.length === 0) {
          await supabase.from('customers').insert([{
            name: customerName, phone: customerPhone, total_visits: 0, total_spent: 0,
            last_visit_date: bookingDate, tags: [], notes: '', is_blacklisted: false,
          }]);
        }
      } catch (_) {}

      return res.status(200).json({ success: true, booking: newBooking, message: '預約已提交，我們將透過 WhatsApp 確認' });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (err) {
    console.error('Booking API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
