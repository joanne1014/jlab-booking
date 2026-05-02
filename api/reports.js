// api/reports.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // ═══ 只接受 POST ═══
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  // ═══ 環境變數檢查（放喺 createClient 之前）═══
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: '伺服器設定錯誤：缺少 Supabase 環境變數' });
  }

  // ═══ 初始化 Supabase ═══
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { action, startDate, endDate, month } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: '缺少 action 參數' });
  }

  try {
    switch (action) {

      // ═══════════════════════════════════════
      //  總覽數據（Dashboard KPI 卡片用）
      // ═══════════════════════════════════════
      case 'get-overview': {
        const today = new Date().toISOString().split('T')[0];
        const thisMonthStart = today.slice(0, 7) + '-01';

        // 計算上月日期範圍
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonthStart = lastMonthDate.toISOString().slice(0, 7) + '-01';
        const lastMonthEnd = new Date(
          lastMonthDate.getFullYear(),
          lastMonthDate.getMonth() + 1,
          0
        ).toISOString().split('T')[0];

        // 並行查詢提升速度
        const [todayRes, thisMonthRes, lastMonthRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('id, status, total_price')
            .eq('booking_date', today),

          supabase
            .from('bookings')
            .select('id, status, total_price, customer_phone')
            .gte('booking_date', thisMonthStart)
            .lte('booking_date', today),

          supabase
            .from('bookings')
            .select('id, status, total_price')
            .gte('booking_date', lastMonthStart)
            .lte('booking_date', lastMonthEnd),
        ]);

        // 檢查查詢錯誤
        if (todayRes.error || thisMonthRes.error || lastMonthRes.error) {
          const errMsg = todayRes.error?.message || thisMonthRes.error?.message || lastMonthRes.error?.message;
          return res.status(500).json({ error: '查詢失敗: ' + errMsg });
        }

        // 統一計算函數
        const calc = (arr) => {
          const all = arr || [];
          const completed = all.filter(b => b.status === 'completed');
          const pending = all.filter(b => b.status === 'pending' || b.status === 'confirmed');
          const cancelled = all.filter(b => b.status === 'cancelled');
          const revenue = completed.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
          return {
            total: all.length,
            completed: completed.length,
            pending: pending.length,
            cancelled: cancelled.length,
            revenue,
          };
        };

        const todayCalc = calc(todayRes.data);
        const thisMonthCalc = calc(thisMonthRes.data);
        const lastMonthCalc = calc(lastMonthRes.data);

        // 本月獨立客戶數
        const uniquePhones = new Set(
          (thisMonthRes.data || [])
            .map(b => b.customer_phone)
            .filter(Boolean)
        );

        // 平均客單價
        const avgOrder = thisMonthCalc.completed > 0
          ? Math.round(thisMonthCalc.revenue / thisMonthCalc.completed)
          : 0;

        return res.status(200).json({
          today: todayCalc,
          thisMonth: {
            ...thisMonthCalc,
            unique_customers: uniquePhones.size,
            avg_order: avgOrder,
          },
          lastMonth: lastMonthCalc,
        });
      }

      // ═══════════════════════════════════════
      //  月度趨勢
      // ═══════════════════════════════════════
      case 'get-monthly-trend': {
        const { data, error } = await supabase
          .from('monthly_revenue')
          .select('*')
          .order('month', { ascending: true })
          .limit(12);

        if (error) {
          console.error('monthly_revenue error:', error);
          return res.status(500).json({ error: '取得月度趨勢失敗: ' + error.message });
        }
        return res.status(200).json({ data: data || [] });
      }

      // ═══════════════════════════════════════
      //  技師業績
      // ═══════════════════════════════════════
      case 'get-staff-performance': {
        const targetMonth = month || (new Date().toISOString().slice(0, 7) + '-01');

        const { data, error } = await supabase
          .from('staff_performance')
          .select('*')
          .eq('month', targetMonth)
          .order('revenue', { ascending: false });

        if (error) {
          console.error('staff_performance error:', error);
          return res.status(500).json({ error: '取得技師業績失敗: ' + error.message });
        }
        return res.status(200).json({ data: data || [] });
      }

      // ═══════════════════════════════════════
      //  熱門服務
      // ═══════════════════════════════════════
      case 'get-popular-services': {
        const { data, error } = await supabase
          .from('popular_services')
          .select('*')
          .limit(10);

        if (error) {
          console.error('popular_services error:', error);
          return res.status(500).json({ error: '取得熱門服務失敗: ' + error.message });
        }
        return res.status(200).json({ data: data || [] });
      }

      // ═══════════════════════════════════════
      //  客戶消費排行
      // ═══════════════════════════════════════
      case 'get-top-customers': {
        const { data, error } = await supabase
          .from('top_customers')
          .select('*')
          .limit(20);

        if (error) {
          console.error('top_customers error:', error);
          return res.status(500).json({ error: '取得客戶排行失敗: ' + error.message });
        }
        return res.status(200).json({ data: data || [] });
      }

      // ═══════════════════════════════════════
      //  每小時預約分布
      // ═══════════════════════════════════════
      case 'get-hourly-distribution': {
        const { data, error } = await supabase
          .from('hourly_distribution')
          .select('*')
          .order('hour', { ascending: true });

        if (error) {
          console.error('hourly_distribution error:', error);
          return res.status(500).json({ error: '取得時段分布失敗: ' + error.message });
        }
        return res.status(200).json({ data: data || [] });
      }

      // ═══════════════════════════════════════
      //  星期預約分布
      // ═══════════════════════════════════════
      case 'get-weekday-distribution': {
        const { data, error } = await supabase
          .from('weekday_distribution')
          .select('*')
          .order('day_of_week', { ascending: true });

        if (error) {
          console.error('weekday_distribution error:', error);
          return res.status(500).json({ error: '取得星期分布失敗: ' + error.message });
        }
        return res.status(200).json({ data: data || [] });
      }

      // ═══════════════════════════════════════
      //  自訂日期範圍查詢
      // ═══════════════════════════════════════
      case 'get-date-range': {
        if (!startDate || !endDate) {
          return res.status(400).json({ error: '需要 startDate 同 endDate 參數' });
        }

        const { data, error } = await supabase
          .from('bookings')
          .select('id, status, total_price, booking_date, service_name, technician_label, customer_name, customer_phone')
          .gte('booking_date', startDate)
          .lte('booking_date', endDate)
          .order('booking_date', { ascending: false });

        if (error) {
          return res.status(500).json({ error: '查詢失敗: ' + error.message });
        }

        const all = data || [];
        const completed = all.filter(b => b.status === 'completed');
        const revenue = completed.reduce((s, b) => s + (Number(b.total_price) || 0), 0);
        const uniqueCustomers = new Set(all.map(b => b.customer_phone).filter(Boolean)).size;

        return res.status(200).json({
          summary: {
            total_bookings: all.length,
            completed: completed.length,
            cancelled: all.filter(b => b.status === 'cancelled').length,
            revenue,
            unique_customers: uniqueCustomers,
            avg_order: completed.length > 0 ? Math.round(revenue / completed.length) : 0,
          },
          bookings: all,
        });
      }

      // ═══════════════════════════════════════
      //  每日營收
      // ═══════════════════════════════════════
      case 'get-daily-revenue': {
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const monthStart = targetMonth + '-01';
        const [y, m2] = targetMonth.split('-').map(Number);
        const monthEnd = new Date(y, m2, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('bookings')
          .select('booking_date, total_price, status')
          .gte('booking_date', monthStart)
          .lte('booking_date', monthEnd)
          .eq('status', 'completed');

        if (error) {
          return res.status(500).json({ error: '查詢失敗: ' + error.message });
        }

        const dailyMap = {};
        (data || []).forEach(b => {
          const d = b.booking_date;
          if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, count: 0 };
          dailyMap[d].revenue += Number(b.total_price) || 0;
          dailyMap[d].count += 1;
        });

        return res.status(200).json({
          data: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
        });
      }

      // ═══════════════════════════════════════
      default:
        return res.status(400).json({ error: `未知嘅 action: ${action}` });
    }

  } catch (err) {
    console.error('Reports API 錯誤:', err);
    return res.status(500).json({
      error: '伺服器內部錯誤',
      detail: err.message,
    });
  }
}
