import { useState, useEffect, useMemo } from 'react';

const font = "'Noto Serif TC', serif";
const card = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 };

const reportsApi = async (action, payload = {}) => {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
};

export default function ReportsPanel() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [techStats, setTechStats] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [period, setPeriod] = useState('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [ov, svc, tech, daily] = await Promise.all([
        reportsApi('get-overview'),
        reportsApi('get-top-services', { period }),
        reportsApi('get-technician-stats', { period }),
        reportsApi('get-daily-revenue', { period })
      ]);
      setOverview(ov);
      setTopServices(svc.data || []);
      setTechStats(tech.data || []);
      setDailyRevenue(daily.data || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const loadCustom = async () => {
    if (!customFrom || !customTo) return;
    setLoading(true);
    setError('');
    try {
      const [svc, tech, daily] = await Promise.all([
        reportsApi('get-top-services', { period: 'custom', from: customFrom, to: customTo }),
        reportsApi('get-technician-stats', { period: 'custom', from: customFrom, to: customTo }),
        reportsApi('get-daily-revenue', { period: 'custom', from: customFrom, to: customTo })
      ]);
      setTopServices(svc.data || []);
      setTechStats(tech.data || []);
      setDailyRevenue(daily.data || []);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [period]);

  const maxRevenue = useMemo(() => Math.max(...dailyRevenue.map(d => d.revenue || 0), 1), [dailyRevenue]);
  const totalRevenue = useMemo(() => dailyRevenue.reduce((s, d) => s + (d.revenue || 0), 0), [dailyRevenue]);
  const totalBookings = useMemo(() => dailyRevenue.reduce((s, d) => s + (d.count || 0), 0), [dailyRevenue]);

  if (loading && !overview) return (
    <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
      <div style={{ fontSize: 14 }}>載入報表中...</div>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
      <div style={{ fontSize: 14, color: '#c62828', marginBottom: 16 }}>{error}</div>
      <button onClick={loadAll} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#5c4a3a', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font }}>🔄 重試</button>
    </div>
  );

  return (
    <div>
      {/* Period Selector */}
      <div style={{ ...card, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: 16 }}>
        <span style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600 }}>📅 時段：</span>
        {[['thisMonth', '本月'], ['lastMonth', '上月'], ['thisWeek', '本週'], ['last30', '近30日'], ['last90', '近90日']].map(([k, l]) => (
          <button key={k} onClick={() => setPeriod(k)} style={{ padding: '7px 16px', borderRadius: 6, border: period === k ? '2px solid #5c4a3a' : '1px solid #d0c8bc', background: period === k ? '#5c4a3a' : '#fff', color: period === k ? '#fff' : '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: period === k ? 700 : 400 }}>{l}</button>
        ))}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }} />
          <span style={{ color: '#999', fontSize: 12 }}>至</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }} />
          <button onClick={loadCustom} style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: '#FF9800', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: 600 }}>查詢</button>
        </div>
        <button onClick={loadAll} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄</button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
          {[
            { label: '今日', data: overview.today, color: '#FF9800', icon: '☀️' },
            { label: '本月', data: overview.thisMonth, color: '#2196F3', icon: '📅' },
            { label: '上月', data: overview.lastMonth, color: '#9C27B0', icon: '📆' }
          ].map(({ label, data, color, icon }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: `4px solid ${color}` }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>{icon} {label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color }}>${data?.revenue || 0}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>收入</div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#5c4a3a' }}>{data?.total || 0}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>預約數</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#4CAF50' }}>{data?.completed || 0}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>已完成</div>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#f44336' }}>{data?.cancelled || 0}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>已取消</div>
                </div>
              </div>
              {data?.total > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                  平均單價 ${Math.round((data.revenue || 0) / Math.max(data.completed || data.total, 1))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Bar */}
      <div style={{ ...card, background: '#f9f6f3', padding: 16, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#5c4a3a' }}>${totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: '#999' }}>期間總收入</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#5c4a3a' }}>{totalBookings}</div>
          <div style={{ fontSize: 12, color: '#999' }}>期間總預約</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#5c4a3a' }}>${totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0}</div>
          <div style={{ fontSize: 12, color: '#999' }}>平均客單價</div>
        </div>
      </div>

      {/* Daily Revenue Chart */}
      {dailyRevenue.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 16 }}>📈 每日收入趨勢</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 160, overflowX: 'auto', paddingBottom: 30, position: 'relative' }}>
            {dailyRevenue.map((d, i) => {
              const h = Math.max((d.revenue / maxRevenue) * 100, 3);
              const isWeekend = [0, 6].includes(new Date(d.date + 'T00:00:00').getDay());
              return (
                <div key={d.date} style={{ flex: '1 0 24px', minWidth: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div style={{ fontSize: 9, color: '#999', marginBottom: 2, whiteSpace: 'nowrap' }} title={`${d.date}: $${d.revenue} (${d.count}單)`}>
                    {d.revenue > 0 ? `$${d.revenue}` : ''}
                  </div>
                  <div style={{
                    width: '70%',
                    background: isWeekend ? '#FF9800' : '#b8956a',
                    borderRadius: '4px 4px 0 0',
                    height: `${h}%`,
                    minHeight: 3,
                    transition: 'height 0.3s',
                    position: 'relative'
                  }}>
                    {d.count > 0 && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: '#666', whiteSpace: 'nowrap' }}>{d.count}單</div>}
                  </div>
                  <div style={{ fontSize: 9, color: isWeekend ? '#FF9800' : '#aaa', marginTop: 4, transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap', position: 'absolute', bottom: -20, left: '50%' }}>
                    {d.date.slice(5)}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, fontSize: 11, color: '#999' }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#b8956a', borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} />平日</span>
            <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#FF9800', borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} />週末</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Top Services */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 16 }}>🏆 熱門服務 TOP 10</div>
          {topServices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#999', fontSize: 13 }}>暫無數據</div>
          ) : (
            <div>
              {topServices.slice(0, 10).map((svc, i) => {
                const maxCount = topServices[0]?.count || 1;
                const pct = Math.round((svc.count / maxCount) * 100);
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? '#FF9800' : '#999', minWidth: 20 }}>#{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a' }}>{svc.service_name || '未命名'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#888' }}>{svc.count} 次</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#5c4a3a' }}>${svc.revenue || 0}</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: '#f0ebe3', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: i < 3 ? '#FF9800' : '#b8956a', borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Technician Stats */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 16 }}>👤 技師表現</div>
          {techStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#999', fontSize: 13 }}>暫無數據</div>
          ) : (
            <div>
              {techStats.map((tech, i) => {
                const maxRev = techStats[0]?.revenue || 1;
                const pct = Math.round((tech.revenue / maxRev) * 100);
                return (
                  <div key={i} style={{ marginBottom: 14, padding: '12px 14px', background: '#faf6f0', borderRadius: 10, border: '1px solid #e8e0d8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#5c4a3a' }}>{tech.technician_label || '未指定'}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#FF9800' }}>${tech.revenue || 0}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#888', marginBottom: 6 }}>
                      <span>📋 {tech.count || 0} 單</span>
                      <span>💰 均 ${tech.count > 0 ? Math.round(tech.revenue / tech.count) : 0}</span>
                      {tech.completed && <span>✅ {tech.completed} 完成</span>}
                    </div>
                    <div style={{ height: 5, background: '#e8e0d8', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#4CAF50', borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Rate */}
      {overview && (
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 12 }}>📊 取消率分析</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {[
              { label: '今日', data: overview.today },
              { label: '本月', data: overview.thisMonth },
              { label: '上月', data: overview.lastMonth }
            ].map(({ label, data }) => {
              const rate = data?.total > 0 ? Math.round((data.cancelled / data.total) * 100) : 0;
              return (
                <div key={label} style={{ textAlign: 'center', padding: 16, background: '#faf6f0', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>{label} 取消率</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: rate > 20 ? '#f44336' : rate > 10 ? '#FF9800' : '#4CAF50' }}>{rate}%</div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{data?.cancelled || 0} / {data?.total || 0}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
