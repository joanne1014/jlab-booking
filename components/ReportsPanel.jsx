// components/ReportsPanel.jsx
import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Area, AreaChart
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export default function ReportsPanel() {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);

  // 所有數據 state
  const [overview, setOverview] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [staffData, setStaffData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [weekdayData, setWeekdayData] = useState([]);

  // ═══ API Helper ═══
  const api = async (action, extra = {}) => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    });
    return res.json();
  };

  // ═══ 載入所有數據 ═══
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        monthlyRes,
        staffRes,
        servicesRes,
        customersRes,
        hourlyRes,
        weekdayRes,
      ] = await Promise.all([
        api('get-overview'),
        api('get-monthly-trend'),
        api('get-staff-performance'),
        api('get-popular-services'),
        api('get-top-customers'),
        api('get-hourly-distribution'),
        api('get-weekday-distribution'),
      ]);

      setOverview(overviewRes);

      // 月度趨勢
      setMonthlyData((monthlyRes.data || []).map(d => ({
        month: new Date(d.month).toLocaleDateString('zh-HK', { year: '2-digit', month: 'short' }),
        revenue: Number(d.revenue) || 0,
        bookings: Number(d.completed_bookings) || 0,
        totalBookings: Number(d.total_bookings) || 0,
        customers: Number(d.unique_customers) || 0,
        avgOrder: Math.round(Number(d.avg_order)) || 0,
      })));

      // 技師
      setStaffData((staffRes.data || []).map((d, i) => ({
        name: d.staff_name,
        revenue: Number(d.revenue) || 0,
        bookings: Number(d.completed_count) || 0,
        color: COLORS[i % COLORS.length],
      })));

      // 服務
      setServiceData((servicesRes.data || []).map((d, i) => ({
        name: d.service_name,
        count: Number(d.booking_count) || 0,
        completed: Number(d.completed_count) || 0,
        revenue: Number(d.total_revenue) || 0,
        color: COLORS[i % COLORS.length],
      })));

      // 客戶
      setCustomerData((customersRes.data || []).map(d => ({
        name: d.customer_name || '未命名',
        phone: d.customer_phone,
        visits: Number(d.visit_count) || 0,
        spent: Number(d.total_spent) || 0,
        lastVisit: d.last_visit,
      })));

      // 時段
      setHourlyData((hourlyRes.data || []).map(d => ({
        hour: String(d.hour),
        count: Number(d.booking_count) || 0,
      })));

      // 星期
      setWeekdayData((weekdayRes.data || []).map(d => ({
        day: WEEKDAY_NAMES[Number(d.day_of_week)] || '?',
        count: Number(d.booking_count) || 0,
        revenue: Number(d.revenue) || 0,
      })));

    } catch (err) {
      console.error('載入報表失敗:', err);
    }
    setLoading(false);
  };

  // ═══ 計算比較數據 ═══
  const revenueChange = overview
    ? overview.lastMonth.revenue > 0
      ? (((overview.thisMonth.revenue - overview.lastMonth.revenue) / overview.lastMonth.revenue) * 100).toFixed(1)
      : overview.thisMonth.revenue > 0 ? '100' : '0'
    : '0';

  const bookingChange = overview
    ? overview.lastMonth.completed > 0
      ? (((overview.thisMonth.completed - overview.lastMonth.completed) / overview.lastMonth.completed) * 100).toFixed(1)
      : overview.thisMonth.completed > 0 ? '100' : '0'
    : '0';

  // ═══ Tab 列表 ═══
  const sections = [
    { id: 'overview', label: '📊 總覽' },
    { id: 'revenue', label: '💰 營收' },
    { id: 'staff', label: '👩‍💼 技師' },
    { id: 'services', label: '💅 服務' },
    { id: 'customers', label: '👥 客戶' },
    { id: 'time', label: '⏰ 時段' },
  ];

  // ═══ Loading ═══
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 12 }}>📊</div>
        <div style={{ color: '#6b7280' }}>載入報表數據中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>

      {/* Section Tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20,
        overflowX: 'auto', paddingBottom: 4
      }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13,
              fontWeight: 500, border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeSection === s.id ? '#8b5cf6' : '#fff',
              color: activeSection === s.id ? '#fff' : '#6b7280',
              boxShadow: activeSection === s.id
                ? '0 2px 8px rgba(139,92,246,0.3)'
                : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════ */}
      {/*           OVERVIEW                  */}
      {/* ════════════════════════════════════ */}
      {activeSection === 'overview' && overview && (
        <div>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12, marginBottom: 20
          }}>
            <KPICard
              emoji="💰" label="本月營收"
              value={`$${overview.thisMonth.revenue.toLocaleString()}`}
              change={`${revenueChange > 0 ? '+' : ''}${revenueChange}%`}
              positive={revenueChange >= 0}
            />
            <KPICard
              emoji="📋" label="本月完成預約"
              value={overview.thisMonth.completed}
              change={`${bookingChange > 0 ? '+' : ''}${bookingChange}%`}
              positive={bookingChange >= 0}
            />
            <KPICard
              emoji="👥" label="活躍客戶"
              value={overview.thisMonth.unique_customers}
              change="" positive={true}
            />
            <KPICard
              emoji="🧾" label="平均客單價"
              value={`$${overview.thisMonth.avg_order}`}
              change="" positive={true}
            />
          </div>

          {/* 今日速覽 */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: 16,
            border: '1px solid #f3f4f6', marginBottom: 16
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
              📅 今日速覽
            </h3>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <MiniStat label="總預約" value={overview.today.total} />
              <MiniStat label="已完成" value={overview.today.completed} color="#10b981" />
              <MiniStat label="待處理" value={overview.today.pending} color="#f59e0b" />
              <MiniStat label="已取消" value={overview.today.cancelled} color="#ef4444" />
              <MiniStat label="今日收入" value={`$${overview.today.revenue.toLocaleString()}`} color="#8b5cf6" />
            </div>
          </div>

          {/* 營收趨勢 */}
          {monthlyData.length > 0 && (
            <div style={{
              background: '#fff', borderRadius: 14, padding: 20,
              border: '1px solid #f3f4f6', marginBottom: 16
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                營收趨勢
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip formatter={(v) => [`$${Number(v).toLocaleString()}`, '營收']} />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 快速排行 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* 熱門服務 Top 3 */}
            <div style={{
              background: '#fff', borderRadius: 14, padding: 16,
              border: '1px solid #f3f4f6'
            }}>
              <h4 style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                🏆 最受歡迎服務
              </h4>
              {serviceData.length === 0 && <EmptyMsg />}
              {serviceData.slice(0, 3).map((s, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '6px 0',
                  borderBottom: i < 2 ? '1px solid #f9fafb' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', width: 16 }}>
                      #{i + 1}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{s.count} 次</span>
                </div>
              ))}
            </div>

            {/* 技師業績 */}
            <div style={{
              background: '#fff', borderRadius: 14, padding: 16,
              border: '1px solid #f3f4f6'
            }}>
              <h4 style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                👩‍💼 技師本月業績
              </h4>
              {staffData.length === 0 && <EmptyMsg />}
              {staffData.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '8px 0',
                  borderBottom: i < staffData.length - 1 ? '1px solid #f9fafb' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: s.color + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: s.color
                    }}>
                      {s.name?.[0] || '?'}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                      ${s.revenue.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.bookings} 單</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/*           REVENUE                   */}
      {/* ════════════════════════════════════ */}
      {activeSection === 'revenue' && (
        <div>
          {monthlyData.length === 0 ? <EmptySection /> : (
            <>
              <div style={{
                background: '#fff', borderRadius: 14, padding: 20,
                border: '1px solid #f3f4f6', marginBottom: 16
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                  月度營收 vs 預約數
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="revenue" fill="#8b5cf6" radius={[4,4,0,0]} name="營收" />
                    <Bar yAxisId="right" dataKey="bookings" fill="#06b6d4" radius={[4,4,0,0]} name="完成數" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 月度明細表 */}
              <div style={{
                background: '#fff', borderRadius: 14, padding: 20,
                border: '1px solid #f3f4f6'
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>月度明細</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={thStyle}>月份</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>營收</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>完成數</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>客單價</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>客戶數</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...monthlyData].reverse().map((m, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={tdStyle}>{m.month}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                            ${m.revenue.toLocaleString()}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{m.bookings}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>${m.avgOrder}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{m.customers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/*           STAFF                     */}
      {/* ════════════════════════════════════ */}
      {activeSection === 'staff' && (
        <div>
          {staffData.length === 0 ? <EmptySection msg="未有技師數據" /> : (
            <>
              <div style={{
                background: '#fff', borderRadius: 14, padding: 20,
                border: '1px solid #f3f4f6', marginBottom: 16
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
                  技師業績比較
                </h3>
                <ResponsiveContainer width="100%" height={Math.max(120, staffData.length * 60)}>
                  <BarChart data={staffData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                    <Tooltip formatter={v => `$${Number(v).toLocaleString()}`} />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                      {staffData.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 技師卡片 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 12
              }}>
                {staffData.map((s, i) => (
                  <div key={i} style={{
                    background: '#fff', borderRadius: 14, padding: 20,
                    border: '1px solid #f3f4f6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: `${s.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: s.color
                      }}>
                        {s.name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>本月業績</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <StatBox label="營收" value={`$${s.revenue.toLocaleString()}`} />
                      <StatBox label="完成預約" value={s.bookings} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/*           SERVICES                  */}
      {/* ════════════════════════════════════ */}
      {activeSection === 'services' && (
        <div>
          {serviceData.length === 0 ? <EmptySection msg="未有服務數據" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* 餅圖 */}
              <div style={{
                background: '#fff', borderRadius: 14, padding: 20,
                border: '1px solid #f3f4f6'
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>服務佔比</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={serviceData} dataKey="count" nameKey="name"
                      cx="50%" cy="50%" outerRadius={80} innerRadius={45}
                      paddingAngle={3}
                    >
                      {serviceData.map((s, i) => <Cell key={i} fill={s.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, name) => [`${v} 次`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {serviceData.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                      <span style={{ color: '#6b7280' }}>{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 排行榜 */}
              <div style={{
                background: '#fff', borderRadius: 14, padding: 20,
                border: '1px solid #f3f4f6'
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>服務排行榜</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {serviceData.map((s, i) => {
                    const maxCount = serviceData[0]?.count || 1;
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</span>
                          <span style={{ fontSize: 11, color: '#6b7280' }}>
                            {s.count} 次 · ${s.revenue.toLocaleString()}
                          </span>
                        </div>
                        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${(s.count / maxCount) * 100}%`,
                            background: s.color, borderRadius: 4
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/*           CUSTOMERS                 */}
      {/* ════════════════════════════════════ */}
      {activeSection === 'customers' && (
        <div style={{
          background: '#fff', borderRadius: 14, padding: 20,
          border: '1px solid #f3f4f6'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🏆 客戶消費排行</h3>
          {customerData.length === 0 ? <EmptyMsg /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customerData.map((c, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                  background: i === 0 ? '#fef3c720' : '#f9fafb',
                  borderRadius: 10,
                  border: i === 0 ? '1px solid #fde68a' : '1px solid transparent'
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                    background: i === 0 ? '#fef3c7' : i === 1 ? '#e5e7eb' : i === 2 ? '#fed7aa' : '#f3f4f6',
                    color: i === 0 ? '#92400e' : i === 1 ? '#374151' : i === 2 ? '#9a3412' : '#6b7280'
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      ${c.spent.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.visits} 次到訪</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════ */}
      {/*           TIME DISTRIBUTION         */}
      {/* ════════════════════════════════════ */}
      {activeSection === 'time' && (
        <div>
          {/* 每小時 */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: 20,
            border: '1px solid #f3f4f6', marginBottom: 16
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>⏰ 每小時預約分布</h3>
            {hourlyData.length === 0 ? <EmptyMsg /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={v => `${v}:00`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={v => `${v}:00`} formatter={v => [`${v} 個預約`]} />
                  <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* 每星期 */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: 20,
            border: '1px solid #f3f4f6'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📅 星期預約分布</h3>
            {weekdayData.length === 0 ? <EmptyMsg /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekdayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="預約數" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════
// 小組件
// ═══════════════════════════════

function KPICard({ emoji, label, value, change, positive }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 18,
      border: '1px solid #f3f4f6',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        {change && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: positive ? '#10b981' : '#ef4444'
          }}>
            {positive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1f2937', marginBottom: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || '#1f2937' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ padding: 12, background: '#f9fafb', borderRadius: 10, textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#9ca3af' }}>{label}</div>
    </div>
  );
}

function EmptyMsg() {
  return <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>暫無數據</div>;
}

function EmptySection({ msg }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: 40,
      border: '1px solid #f3f4f6', textAlign: 'center'
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
      <div style={{ color: '#9ca3af' }}>{msg || '暫無數據，完成更多預約後會顯示'}</div>
    </div>
  );
}

const thStyle = { padding: '8px 12px', textAlign: 'left', fontWeight: 500, color: '#6b7280' };
const tdStyle = { padding: '10px 12px' };
