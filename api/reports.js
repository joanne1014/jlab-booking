import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  // 檢查環境變數
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      error: 'Missing environment variables',
      details: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { action, period, from, to } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'Missing action' });
  }

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (period === 'custom' && from && to) {
      return { from, to };
    }
    
    switch (period) {
      case 'thisWeek': {
        const d = new Date(now);
        d.setDate(d.getDate() - d.getDay());
        return { from: d.toISOString().split('T')[0], to: today };
      }
      case 'lastMonth': {
        const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const m = now.getMonth() === 0 ? 12 : now.getMonth();
        const lastDay = new Date(y, m, 0).getDate();
        return { from: `${y}-${String(m).padStart(2, '0')}-01`, to: `${y}-${String(m).padStart(2, '0')}-${lastDay}` };
      }
      case 'last30': {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return { from: d.toISOString().split('T')[0], to: today };
      }
      case 'last90': {
        const d = new Date(now);
        d.setDate(d.getDate() - 90);
        return { from: d.toISOString().split('T')[0], to: today };
      }
      case 'thisMonth':
      default: {
        return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today };
      }
    }
  };

  try {
    if (action === 'get-overview') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lastMonthNum = now.getMonth() === 0 ? 12 : now.getMonth();
      const lastMonthStart = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}-01`;
      const lastMonthEnd = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}-${new Date(lastMonthYear, lastMonthNum, 0).getDate()}`;

      const getStats = async (dateFrom, dateTo) => {
        const { data, error } = await supabase
          .from('bookings')
          .select('status, total_price')
          .gte('booking_date', dateFrom)
          .lte('booking_date', dateTo);
        if (error) throw error;
        const all = data || [];
        const active = all.filter(b => b.status !== 'cancelled');
        return {
          total: all.length,
          completed: all.filter(b => b.status === 'completed').length,
          confirmed: all.filter(b => b.status === 'confirmed').length,
          pending: all.filter(b => b.status === 'pending').length,
          cancelled: all.filter(b => b.status === 'cancelled').length,
          revenue: active.reduce((s, b) => s + (b.total_price || 0), 0)
        };
      };

      const [todayStats, thisMonthStats, lastMonthStats] = await Promise.all([
        getStats(today, today),
        getStats(monthStart, today),
        getStats(lastMonthStart, lastMonthEnd)
      ]);

      return res.status(200).json({ today: todayStats, thisMonth: thisMonthStats, lastMonth: lastMonthStats });
    }

    if (action === 'get-top-services') {
      const { from: dateFrom, to: dateTo } = getDateRange();
      const { data, error } = await supabase
        .from('bookings')
        .select('service_name, total_price, status')
        .gte('booking_date', dateFrom)
        .lte('booking_date', dateTo)
        .neq('status', 'cancelled');
      if (error) throw error;

      const map = {};
      (data || []).forEach(b => {
        const name = b.service_name || '未命名';
        if (!map[name]) map[name] = { service_name: name, count: 0, revenue: 0 };
        map[name].count++;
        map[name].revenue += b.total_price || 0;
      });

      const sorted = Object.values(map).sort((a, b) => b.revenue - a.revenue);
      return res.status(200).json({ data: sorted });
    }

    if (action === 'get-technician-stats') {
      const { from: dateFrom, to: dateTo } = getDateRange();
      const { data, error } = await supabase
        .from('bookings')
        .select('technician_label, total_price, status')
        .gte('booking_date', dateFrom)
        .lte('booking_date', dateTo)
        .neq('status', 'cancelled');
      if (error) throw error;

      const map = {};
      (data || []).forEach(b => {
        const tech = b.technician_label || '未指定';
        if (!map[tech]) map[tech] = { technician_label: tech, count: 0, revenue: 0, completed: 0 };
        map[tech].count++;
        map[tech].revenue += b.total_price || 0;
        if (b.status === 'completed') map[tech].completed++;
      });

      const sorted = Object.values(map).sort((a, b) => b.revenue - a.revenue);
      return res.status(200).json({ data: sorted });
    }

    if (action === 'get-daily-revenue') {
      const { from: dateFrom, to: dateTo } = getDateRange();
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date, total_price, status')
        .gte('booking_date', dateFrom)
        .lte('booking_date', dateTo)
        .neq('status', 'cancelled');
      if (error) throw error;

      const map = {};
      (data || []).forEach(b => {
        const d = b.booking_date;
        if (!map[d]) map[d] = { date: d, revenue: 0, count: 0 };
        map[d].revenue += b.total_price || 0;
        map[d].count++;
      });

      // Fill in missing dates
      const start = new Date(dateFrom + 'T00:00:00');
      const end = new Date(dateTo + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split('T')[0];
        if (!map[ds]) map[ds] = { date: ds, revenue: 0, count: 0 };
      }

      const sorted = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
      return res.status(200).json({ data: sorted });
    }

    return res.status(400).json({ error: '未知 action: ' + action });
  } catch (e) {
    console.error('Reports API error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
