import { useState, useEffect } from 'react';

const SB = 'https://vqyfbwnkdpncwvdonbcz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';
const H = { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

const sbGet = async (p) => {
  const r = await fetch(`${SB}/rest/v1/${p}`, { headers: H });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
const sbPost = async (t, d) => {
  const r = await fetch(`${SB}/rest/v1/${t}`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
const sbPatch = async (p, d) => {
  const r = await fetch(`${SB}/rest/v1/${p}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
const sbDel = async (p) => {
  const r = await fetch(`${SB}/rest/v1/${p}`, { method: 'DELETE', headers: H });
  if (!r.ok) throw new Error(await r.text());
};

const PASS = 'jlab2024';
const DAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState('bookings');

  const [bookings, setBookings] = useState([]);
  const [bkLoading, setBkLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });

  const [slots, setSlots] = useState([]);
  const [selDay, setSelDay] = useState(1);
  const [slLoading, setSlLoading] = useState(false);

  const [blocked, setBlocked] = useState([]);
  const [newBD, setNewBD] = useState('');
  const [newBR, setNewBR] = useState('');

  const font = "'Noto Serif TC', serif";

  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === PASS) {
      setAuth(true);
      fetchBookings();
      fetchSlots();
      fetchBlocked();
    } else {
      alert('密碼錯誤！');
    }
  };

  // ── Bookings ──
  const fetchBookings = async () => {
    setBkLoading(true);
    try {
      let q = 'bookings?order=booking_date.desc,booking_time.desc';
      if (filterDate) q += `&booking_date=eq.${filterDate}`;
      if (filterStatus !== 'all') q += `&status=eq.${filterStatus}`;
      const data = await sbGet(q);
      setBookings(data || []);
      calcStats(data || []);
    } catch (e) { console.error(e); }
    setBkLoading(false);
  };

  const calcStats = (data) => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthStart = new Date().toISOString().slice(0, 7);
    setStats({
      today: data.filter(b => b.booking_date === today).length,
      week: data.filter(b => b.booking_date >= weekAgo).length,
      month: data.filter(b => b.booking_date?.startsWith(monthStart)).length,
      total: data.length,
    });
  };

  const updateStatus = async (id, status) => {
    try {
      await sbPatch(`bookings?id=eq.${id}`, { status });
      fetchBookings();
    } catch (e) { console.error(e); }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm('確定要刪除呢筆預約？')) return;
    try {
      await sbDel(`bookings?id=eq.${id}`);
      fetchBookings();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (auth) fetchBookings();
  }, [filterDate, filterStatus]);

  // ── Time Slots ──
  const fetchSlots = async () => {
    setSlLoading(true);
    try {
      const data = await sbGet('time_slots?order=day_of_week,time');
      setSlots(data || []);
    } catch (e) { console.error(e); }
    setSlLoading(false);
  };

  const toggleSlot = async (id, current) => {
    try {
      await sbPatch(`time_slots?id=eq.${id}`, { is_active: !current });
      setSlots(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s));
    } catch (e) { console.error(e); }
  };

  const toggleDayAll = async (day, activate) => {
    try {
      await sbPatch(`time_slots?day_of_week=eq.${day}`, { is_active: activate });
      setSlots(prev => prev.map(s => s.day_of_week === day ? { ...s, is_active: activate } : s));
    } catch (e) { console.error(e); }
  };

  // ── Blocked Dates ──
  const fetchBlocked = async () => {
    try {
      const data = await sbGet('blocked_dates?order=date');
      setBlocked(data || []);
    } catch (e) { console.error(e); }
  };

  const addBlocked = async () => {
    if (!newBD) return;
    try {
      const data = await sbPost('blocked_dates', { date: newBD, reason: newBR });
      setBlocked(prev => [...prev, ...data].sort((a, b) => a.date.localeCompare(b.date)));
      setNewBD('');
      setNewBR('');
    } catch (e) { console.error(e); }
  };

  const removeBlocked = async (id) => {
    try {
      await sbDel(`blocked_dates?id=eq.${id}`);
      setBlocked(prev => prev.filter(b => b.id !== id));
    } catch (e) { console.error(e); }
  };

  // ── Helpers ──
  const statusColor = (s) => {
    if (s === 'confirmed') return '#4CAF50';
    if (s === 'cancelled') return '#f44336';
    if (s === 'completed') return '#2196F3';
    return '#FF9800';
  };
  const statusText = (s) => {
    if (s === 'confirmed') return '已確認';
    if (s === 'cancelled') return '已取消';
    if (s === 'completed') return '已完成';
    return '待確認';
  };

  const daySlots = slots.filter(s => s.day_of_week === selDay);
  const activeCount = daySlots.filter(s => s.is_active).length;

  // ══════════════════════════════
  // LOGIN SCREEN
  // ══════════════════════════════
  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f0eb 0%, #e8e0d8 100%)', fontFamily: font }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '60px 40px', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 400, width: '90%' }}>
          <h1 style={{ fontSize: 24, color: '#5c4a3a', marginBottom: 8 }}>J.LAB</h1>
          <p style={{ color: '#999', fontSize: 14, marginBottom: 40, letterSpacing: 2 }}>管理後台 ADMIN</p>
          <input type="password" placeholder="請輸入管理密碼" value={pw} onChange={e => setPw(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 20, boxSizing: 'border-box', textAlign: 'center' }} />
          <button type="submit" style={{ width: '100%', padding: 14, background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>登入</button>
        </form>
      </div>
    );
  }

  // ══════════════════════════════
  // DASHBOARD
  // ══════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', fontFamily: font }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '20px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, color: '#5c4a3a', margin: 0 }}>J.LAB 管理後台</h1>
          <p style={{ color: '#999', fontSize: 12, margin: '4px 0 0', letterSpacing: 1 }}>ADMIN DASHBOARD</p>
        </div>
        <button onClick={() => setAuth(false)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', color: '#666', fontFamily: font }}>登出</button>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderTop: '1px solid #f0ebe3', padding: '0 30px', display: 'flex', gap: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
        {[
          { key: 'bookings', label: '📋 預約管理' },
          { key: 'timeslots', label: '🕐 時段管理' },
          { key: 'blocked', label: '📅 封鎖日期' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '14px 24px', background: 'none', border: 'none',
            borderBottom: tab === t.key ? '2px solid #5c4a3a' : '2px solid transparent',
            fontSize: 14, color: tab === t.key ? '#5c4a3a' : '#999',
            fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: font,
            whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px' }}>

        {/* ══════ TAB: BOOKINGS ══════ */}
        {tab === 'bookings' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 30 }}>
              {[
                { label: '今日預約', value: stats.today, color: '#FF9800' },
                { label: '本週預約', value: stats.week, color: '#4CAF50' },
                { label: '本月預約', value: stats.month, color: '#2196F3' },
                { label: '總預約數', value: stats.total, color: '#5c4a3a' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#fff', padding: 24, borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                  <p style={{ color: '#999', fontSize: 13, margin: '0 0 8px' }}>{s.label}</p>
                  <p style={{ fontSize: 32, fontWeight: 'bold', color: s.color, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ background: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <span style={{ color: '#5c4a3a', fontWeight: 'bold', fontSize: 14 }}>篩選：</span>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}>
                <option value="all">全部狀態</option>
                <option value="pending">待確認</option>
                <option value="confirmed">已確認</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
              <button onClick={() => { setFilterDate(''); setFilterStatus('all'); }}
                style={{ padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#5c4a3a', fontSize: 13 }}>清除篩選</button>
              <button onClick={fetchBookings}
                style={{ padding: '8px 16px', background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto', fontSize: 13 }}>🔄 重新整理</button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: 20, borderBottom: '1px solid #eee' }}>
                <h2 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>預約列表 ({bookings.length} 筆)</h2>
              </div>
              {bkLoading ? (
                <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>載入中...</p>
              ) : bookings.length === 0 ? (
                <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>暫無預約紀錄</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f9f6f3' }}>
                        {['日期', '時間', '服務', '客人', '電話', '技師', '金額', '狀態', '操作'].map(h => (
                          <th key={h} style={{ padding: '14px 12px', textAlign: 'left', color: '#5c4a3a', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>{b.booking_date}</td>
                          <td style={{ padding: '14px 12px' }}>{b.booking_time}</td>
                          <td style={{ padding: '14px 12px' }}>
                            {b.service_name}
                            {b.variant_label && <div style={{ fontSize: 12, color: '#999' }}>{b.variant_label}</div>}
                            {b.addon_names && b.addon_names.length > 0 && (
                              <div style={{ fontSize: 12, color: '#999' }}>+ {b.addon_names.join('、')}</div>
                            )}
                          </td>
                          <td style={{ padding: '14px 12px' }}>{b.customer_name}</td>
                          <td style={{ padding: '14px 12px' }}>{b.customer_phone}</td>
                          <td style={{ padding: '14px 12px' }}>{b.technician_label || '-'}</td>
                          <td style={{ padding: '14px 12px', fontWeight: 'bold' }}>${b.total_price}</td>
                          <td style={{ padding: '14px 12px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, color: '#fff', background: statusColor(b.status) }}>
                              {statusText(b.status)}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
                            <select value={b.status || 'pending'} onChange={e => updateStatus(b.id, e.target.value)}
                              style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, marginRight: 6 }}>
                              <option value="pending">待確認</option>
                              <option value="confirmed">已確認</option>
                              <option value="completed">已完成</option>
                              <option value="cancelled">已取消</option>
                            </select>
                            <button onClick={() => deleteBooking(b.id)}
                              style={{ padding: '4px 8px', background: '#fee', border: '1px solid #fcc', borderRadius: 4, color: '#c00', cursor: 'pointer', fontSize: 12 }}>
                              刪除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════ TAB: TIME SLOTS ══════ */}
        {tab === 'timeslots' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 20px', color: '#5c4a3a', fontSize: 18 }}>時段管理</h2>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>揀星期幾，然後撳時段開/關。啡色 = 開放，淺色 = 關閉。</p>

            {/* Day selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {DAYS.map((d, i) => (
                <button key={i} onClick={() => setSelDay(i)} style={{
                  padding: '10px 18px', borderRadius: 8, border: 'none',
                  background: selDay === i ? '#5c4a3a' : '#f5f0eb',
                  color: selDay === i ? '#fff' : '#5c4a3a',
                  fontWeight: 500, cursor: 'pointer', fontFamily: font, fontSize: 14,
                  whiteSpace: 'nowrap',
                }}>週{d}</button>
              ))}
            </div>

            {/* Bulk actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0ebe3' }}>
              <span style={{ fontSize: 14, color: '#999' }}>{activeCount} / {daySlots.length} 個時段開放</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleDayAll(selDay, true)}
                  style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 13, fontFamily: font }}>全部開</button>
                <button onClick={() => toggleDayAll(selDay, false)}
                  style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 13, fontFamily: font }}>全部關</button>
              </div>
            </div>

            {/* Slots grid */}
            {slLoading ? (
              <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p>
            ) : daySlots.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>呢日冇時段資料</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                {daySlots.map(s => (
                  <button key={s.id} onClick={() => toggleSlot(s.id, s.is_active)} style={{
                    padding: '14px 8px', borderRadius: 8,
                    border: `2px solid ${s.is_active ? '#5c4a3a' : '#e0d8cc'}`,
                    background: s.is_active ? '#5c4a3a' : '#faf6f0',
                    color: s.is_active ? '#fff' : '#c0b8aa',
                    fontSize: 15, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.2s', fontFamily: font,
                  }}>{s.time}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: BLOCKED DATES ══════ */}
        {tab === 'blocked' && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 20px', color: '#5c4a3a', fontSize: 18 }}>封鎖日期</h2>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>封鎖特定日期，該日將無法被預約。</p>

            {/* Add form */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0ebe3', flexWrap: 'wrap' }}>
              <input type="date" value={newBD} onChange={e => setNewBD(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, flex: '1 1 150px' }} />
              <input type="text" placeholder="原因（可選）" value={newBR} onChange={e => setNewBR(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, flex: '2 1 200px', fontFamily: font }} />
              <button onClick={addBlocked}
                style={{ padding: '10px 20px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: font }}>封鎖</button>
            </div>

            {/* List */}
            {blocked.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>未有封鎖日期</p>
            ) : (
              <div>
                {blocked.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 8, background: '#faf6f0', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{b.date}</span>
                      {b.reason && <span style={{ color: '#999', fontSize: 13, marginLeft: 12 }}>— {b.reason}</span>}
                    </div>
                    <button onClick={() => removeBlocked(b.id)}
                      style={{ padding: '6px 14px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 6, color: '#c62828', cursor: 'pointer', fontSize: 12, fontFamily: font }}>刪除</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
