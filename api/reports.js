// api/reports.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { action, startDate, endDate, month } = req.body;

  switch (action) {

    // ─── 總覽數據（Dashboard 用）───
    case 'get-overview': {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = today.slice(0, 7); // '2026-05'

      // 今日預約數
      const { data: todayBookings } = await supabase
        .from('bookings')
        .select('id, status, total_price')
        .eq('booking_date', today);

      // 本月營收
      const { data: monthData } = await supabase
        .from('monthly_revenue')
        .select('*')
        .eq('month', `${thisMonth}-01`);

      // 本月 vs 上月比較
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);
      const { data: lastMonthData } = await supabase
        .from('monthly_revenue')
        .select('*')
        .eq('month', `${lastMonthStr}-01`);

      return res.status(200).json({
        today: {
          total: todayBookings?.length || 0,
          completed: todayBookings?.filter(b => b.status === 'completed').length || 0,
          pending: todayBookings?.filter(b => b.status === 'pending').length || 0,
          revenue: todayBookings?.filter(b => b.status === 'completed').reduce((s, b) => s + (b.total_price || 0), 0) || 0,
        },
        thisMonth: monthData?.[0] || { revenue: 0, total_bookings: 0, unique_customers: 0, avg_order: 0 },
        lastMonth: lastMonthData?.[0] || { revenue: 0, total_bookings: 0 },
      });
    }

    // ─── 月度趨勢（近 6 個月）───
    case 'get-monthly-trend': {
      const { data, error } = await supabase
        .from('monthly_revenue')
        .select('*')
        .order('month', { ascending: true })
        .limit(12);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data: data || [] });
    }

    // ─── 技師業績 ───
    case 'get-staff-performance': {
      const targetMonth = month || new Date().toISOString().slice(0, 7) + '-01';
      
      const { data, error } = await supabase
        .from('staff_performance')
        .select('*')
        .eq('month', targetMonth)
        .order('revenue', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data: data || [] });
    }

    // ─── 熱門服務 ───
    case 'get-popular-services': {
      const { data, error } = await supabase
        .from('popular_services')
        .select('*')
        .limit(10);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data: data || [] });
    }

    // ─── 客戶排行 ───
    case 'get-top-customers': {
      const { data, error } = await supabase
        .from('top_customers')
        .select('*')
        .limit(20);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data: data || [] });
    }

    // ─── 時段分布 ───
    case 'get-hourly-distribution': {
      const { data, error } = await supabase
        .from('hourly_distribution')
        .select('*');

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data: data || [] });
    }

    // ─── 星期分布 ───
    case 'get-weekday-distribution': {
      const { data, error } = await supabase
        .from('weekday_distribution')
        .select('*');

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data: data || [] });
    }

    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}
