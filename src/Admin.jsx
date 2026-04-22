import { useState, useEffect, useMemo } from 'react';

const SB = 'https://vqyfbwnkdpncwvdonbcz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';
const H = { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

const sbGet = async (p) => { const r = await fetch(`${SB}/rest/v1/${p}`, { headers: H }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const sbPost = async (t, d) => { const r = await fetch(`${SB}/rest/v1/${t}`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const sbUpsert = async (t, d) => { const r = await fetch(`${SB}/rest/v1/${t}?on_conflict=slot_date,slot_time`, { method: 'POST', headers: { ...H, Prefer: 'return=representation,resolution=merge-duplicates' }, body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const sbPatch = async (p, d) => { const r = await fetch(`${SB}/rest/v1/${p}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const sbDel = async (p) => { const r = await fetch(`${SB}/rest/v1/${p}`, { method: 'DELETE', headers: H }); if (!r.ok) throw new Error(await r.text()); };

const PASS = 'jlab2024';
const DAYS = ['日', '一', '二', '三', '四', '五', '六'];

/* ── 生成時段（包含 from 同 to） ── */
const genTimes = (from, to) => {
  const times = [];
  let [h, m] = from.split(':').map(Number);
  const [eh, em] = to.split(':').map(Number);
  const endMin = eh * 60 + em;
  while (h * 60 + m <= endMin) {
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { h++; m -= 60; }
  }
  return times;
};

/* 微調顯示用嘅預設時段 10:00–19:00 */
const DEFAULT_TIMES = genTimes('10:00', '19:00');

/* 下拉選單用 */
const ALL_TIMES = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    ALL_TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

const TEMPLATE_INIT = [
  { label: '全日班', from: '10:00', to: '19:00', icon: '☀️' },
  { label: '上午班', from: '10:00', to: '13:30', icon: '🌅' },
  { label: '下午班', from: '14:00', to: '19:00', icon: '🌇' },
  { label: '晚間班', from: '17:00', to: '20:00', icon: '🌙' },
  { label: '休息日', from: null, to: null, icon: '💤' },
];

const BREAK_INIT = [
  { label: '午休', from: '13:00', to: '14:00', icon: '🍽️' },
  { label: '茶息', from: '15:30', to: '16:00', icon: '☕' },
];

const card = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 };
const sectionTitle = { fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 6 };
const sectionDesc = { fontSize: 13, color: '#999', marginBottom: 16 };

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState('bookings');

  /* ── 預約 ── */
  const [bookings, setBookings] = useState([]);
  const [bkLoading, setBkLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });

  /* ── 批量月曆 ── */
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selDates, setSelDates] = useState(new Set());
  const [calSlotCounts, setCalSlotCounts] = useState({});

  /* ── 模板 ── */
  const [templates, setTemplates] = useState(TEMPLATE_INIT.map(t => ({ ...t })));

  /* ── 休息時段 ── */
  const [breakTemplates, setBreakTemplates] = useState(BREAK_INIT.map(t => ({ ...t })));
  const [breakFrom, setBreakFrom] = useState('13:00');
  const [breakTo, setBreakTo] = useState('14:00');

  /* ── 自訂範圍 ── */
  const [rangeFrom, setRangeFrom] = useState('10:00');
  const [rangeTo, setRangeTo] = useState('19:00');
  const [batchLoading, setBatchLoading] = useState(false);
  const [toast, setToast] = useState('');

  /* ── 單日微調 ── */
  const [microYear, setMicroYear] = useState(new Date().getFullYear());
  const [microMonth, setMicroMonth] = useState(new Date().getMonth());
  const [microDate, setMicroDate] = useState(new Date().toISOString().split('T')[0]);
  const [microSlots, setMicroSlots] = useState({});
  const [microLoading, setMicroLoading] = useState(false);
  const [microSlotCounts, setMicroSlotCounts] = useState({});

  /* ── 封鎖日期 ── */
  const [blocked, setBlocked] = useState([]);
  const [newBD, setNewBD] = useState('');
  const [newBR, setNewBR] = useState('');

  const font = "'Noto Serif TC', serif";
  const ddStyle = { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font, flex: 1, minWidth: 0 };
  const navBtnStyle = { padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#5c4a3a', fontFamily: font };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ══════ 通用工具 ══════ */
  const toDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayStr = new Date().toISOString().split('T')[0];

  /* ══════ 月曆 ══════ */
  const getCalendarDays = (y, m) => {
    const startDow = new Date(y, m, 1).getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDow; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);
    return days;
  };

  const prevMonth = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };

  const toggleDate = (day) => {
    if (!day) return;
    const ds = toDateStr(calYear, calMonth, day);
    setSelDates(prev => { const n = new Set(prev); if (n.has(ds)) n.delete(ds); else n.add(ds); return n; });
  };

  const toggleWeekdayCol = (dow) => {
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const colDates = [];
    for (let d = 1; d <= totalDays; d++) {
      if (new Date(calYear, calMonth, d).getDay() === dow) colDates.push(toDateStr(calYear, calMonth, d));
    }
    setSelDates(prev => {
      const n = new Set(prev);
      const allSel = colDates.every(d => n.has(d));
      colDates.forEach(d => allSel ? n.delete(d) : n.add(d));
      return n;
    });
  };

  const selectByFilter = (filterFn) => {
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const dates = new Set(selDates);
    for (let d = 1; d <= totalDays; d++) {
      if (filterFn(new Date(calYear, calMonth, d).getDay())) dates.add(toDateStr(calYear, calMonth, d));
    }
    setSelDates(dates);
  };

  const isColAllSelected = (dow) => {
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= totalDays; d++) {
      if (new Date(calYear, calMonth, d).getDay() === dow) {
        count++;
        if (!selDates.has(toDateStr(calYear, calMonth, d))) return false;
      }
    }
    return count > 0;
  };

  const calendarDays = getCalendarDays(calYear, calMonth);

  /* ── 微調月曆 ── */
  const prevMicroMonth = () => { if (microMonth === 0) { setMicroYear(y => y - 1); setMicroMonth(11); } else setMicroMonth(m => m - 1); };
  const nextMicroMonth = () => { if (microMonth === 11) { setMicroYear(y => y + 1); setMicroMonth(0); } else setMicroMonth(m => m + 1); };
  const microCalDays = getCalendarDays(microYear, microMonth);

  /* 微調用嘅顯示時段：DEFAULT_TIMES + daily_slots 中額外嘅時段 */
  const microTimesToShow = useMemo(() => {
    const set = new Set(DEFAULT_TIMES);
    Object.keys(microSlots).forEach(t => set.add(t));
    return [...set].sort();
  }, [microSlots]);

  const microActiveCount = microTimesToShow.filter(t => microSlots[t]).length;

  /* ══════ 登入 ══════ */
  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === PASS) { setAuth(true); fetchBookings(); fetchBlocked(); }
    else alert('密碼錯誤！');
  };

  /* ══════ 預約管理（保持不變）══════ */
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
    try { await sbPatch(`bookings?id=eq.${id}`, { status }); fetchBookings(); } catch (e) { console.error(e); }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm('確定要刪除呢筆預約？')) return;
    try { await sbDel(`bookings?id=eq.${id}`); fetchBookings(); showToast('✅ 預約已刪除'); } catch (e) { console.error(e); }
  };

  useEffect(() => { if (auth) fetchBookings(); }, [filterDate, filterStatus]);

  /* ══════ 月曆時段狀態（日曆上顯示綠點）══════ */
  const fetchCalStatus = async (year, month) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const start = toDateStr(year, month, 1);
    const end = toDateStr(year, month, lastDay);
    try {
      const data = await sbGet(`daily_slots?slot_date=gte.${start}&slot_date=lte.${end}&is_open=eq.true&select=slot_date`);
      const counts = {};
      (data || []).forEach(s => { counts[s.slot_date] = (counts[s.slot_date] || 0) + 1; });
      return counts;
    } catch (e) { console.error(e); return {}; }
  };

  useEffect(() => {
    if (auth && tab === 'timeslots') {
      fetchCalStatus(calYear, calMonth).then(setCalSlotCounts);
    }
  }, [calYear, calMonth, auth, tab]);

  useEffect(() => {
    if (auth && tab === 'timeslots') {
      fetchCalStatus(microYear, microMonth).then(setMicroSlotCounts);
    }
  }, [microYear, microMonth, auth, tab]);

  /* ══════ 單日微調：讀取 daily_slots ══════ */
  const fetchMicroSlots = async (date) => {
    setMicroLoading(true);
    try {
      const data = await sbGet(`daily_slots?slot_date=eq.${date}&order=slot_time`);
      const map = {};
      (data || []).forEach(s => { map[s.slot_time] = s.is_open; });
      setMicroSlots(map);
    } catch (e) { console.error(e); }
    setMicroLoading(false);
  };

  useEffect(() => { if (auth && tab === 'timeslots') fetchMicroSlots(microDate); }, [microDate, auth, tab]);

  const toggleMicroSlot = async (date, time) => {
    const cur = microSlots[time] || false;
    const next = !cur;
    setMicroSlots(prev => ({ ...prev, [time]: next }));
    try {
      await sbUpsert('daily_slots', [{ slot_date: date, slot_time: time, is_open: next }]);
    } catch (e) {
      setMicroSlots(prev => ({ ...prev, [time]: cur }));
      console.error(e);
    }
  };

  const toggleMicroAll = async (date, activate) => {
    const rows = microTimesToShow.map(t => ({ slot_date: date, slot_time: t, is_open: activate }));
    const newMap = {};
    microTimesToShow.forEach(t => { newMap[t] = activate; });
    setMicroSlots(newMap);
    try {
      await sbUpsert('daily_slots', rows);
    } catch (e) {
      console.error(e);
      fetchMicroSlots(date);
    }
  };

  /* ══════ 批量操作：模板 ══════ */
  const updateTemplate = (idx, field, value) => {
    setTemplates(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const applyTemplate = async (tmpl) => {
    const dates = [...selDates].sort();
    if (dates.length === 0) { alert('請先選擇日期！'); return; }
    const timeDesc = tmpl.from ? `${tmpl.from} — ${tmpl.to}` : '全部關閉';
    if (!window.confirm(`套用「${tmpl.icon} ${tmpl.label}」\n\n時段：${timeDesc}\n影響：${dates.length} 個日期\n\n⚠️ 所選日期嘅現有時段會被覆蓋`)) return;

    setBatchLoading(true);
    try {
      /* 計算每個時段嘅 is_open */
      const openSet = (tmpl.from && tmpl.to) ? new Set(genTimes(tmpl.from, tmpl.to)) : new Set();

      /* 為所有選中日期生成 DEFAULT_TIMES + 模板範圍嘅所有時段 */
      const allTimes = new Set(DEFAULT_TIMES);
      openSet.forEach(t => allTimes.add(t));
      const sortedTimes = [...allTimes].sort();

      const rows = dates.flatMap(date =>
        sortedTimes.map(time => ({ slot_date: date, slot_time: time, is_open: openSet.has(time) }))
      );

      await sbUpsert('daily_slots', rows);
      showToast(`✅ 已套用「${tmpl.label}」到 ${dates.length} 個日期`);

      /* 刷新月曆狀態 */
      fetchCalStatus(calYear, calMonth).then(setCalSlotCounts);
      fetchCalStatus(microYear, microMonth).then(setMicroSlotCounts);
      if (selDates.has(microDate)) fetchMicroSlots(microDate);
    } catch (e) { console.error(e); alert('操作失敗：' + e.message); }
    setBatchLoading(false);
  };

  /* ══════ 批量操作：休息時段 ══════ */
  const updateBreakTemplate = (idx, field, value) => {
    setBreakTemplates(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const applyBreak = async (from, to) => {
    const dates = [...selDates].sort();
    if (dates.length === 0) { alert('請先選擇日期！'); return; }
    if (from >= to) { alert('開始時間必須早於結束時間！'); return; }
    if (!window.confirm(`設定休息時段 ${from}–${to}\n影響：${dates.length} 個日期\n\n呢個範圍內嘅時段將被關閉`)) return;

    setBatchLoading(true);
    try {
      const dateList = dates.join(',');
      await sbPatch(
        `daily_slots?slot_date=in.(${dateList})&slot_time=gte.${from}&slot_time=lt.${to}`,
        { is_open: false }
      );
      showToast(`✅ 已設定休息時段 ${from}–${to}`);
      fetchCalStatus(calYear, calMonth).then(setCalSlotCounts);
      fetchCalStatus(microYear, microMonth).then(setMicroSlotCounts);
      if (selDates.has(microDate)) fetchMicroSlots(microDate);
    } catch (e) { console.error(e); alert('操作失敗：' + e.message); }
    setBatchLoading(false);
  };

  /* ══════ 批量操作：自訂範圍 ══════ */
  const batchSetRange = async (activate) => {
    const dates = [...selDates].sort();
    if (dates.length === 0) { alert('請先選擇日期！'); return; }
    if (rangeFrom >= rangeTo) { alert('開始時間必須早於結束時間！'); return; }

    setBatchLoading(true);
    try {
      const times = genTimes(rangeFrom, rangeTo);
      const rows = dates.flatMap(date =>
        times.map(time => ({ slot_date: date, slot_time: time, is_open: activate }))
      );
      await sbUpsert('daily_slots', rows);
      showToast(`✅ 已${activate ? '開放' : '關閉'} ${rangeFrom}–${rangeTo}，共 ${dates.length} 日`);
      fetchCalStatus(calYear, calMonth).then(setCalSlotCounts);
      fetchCalStatus(microYear, microMonth).then(setMicroSlotCounts);
      if (selDates.has(microDate)) fetchMicroSlots(microDate);
    } catch (e) { console.error(e); alert('操作失敗：' + e.message); }
    setBatchLoading(false);
  };

  /* ══════ 封鎖日期（保持不變）══════ */
  const fetchBlocked = async () => { try { const data = await sbGet('blocked_dates?order=date'); setBlocked(data || []); } catch (e) { console.error(e); } };
  const addBlocked = async () => { if (!newBD) return; try { const data = await sbPost('blocked_dates', { date: newBD, reason: newBR }); setBlocked(prev => [...prev, ...data].sort((a, b) => a.date.localeCompare(b.date))); setNewBD(''); setNewBR(''); } catch (e) { console.error(e); } };
  const removeBlocked = async (id) => { try { await sbDel(`blocked_dates?id=eq.${id}`); setBlocked(prev => prev.filter(b => b.id !== id)); } catch (e) { console.error(e); } };

  /* ══════ Helpers ══════ */
  const statusColor = (s) => s === 'confirmed' ? '#4CAF50' : s === 'cancelled' ? '#f44336' : s === 'completed' ? '#2196F3' : '#FF9800';
  const statusText = (s) => s === 'confirmed' ? '已確認' : s === 'cancelled' ? '已取消' : s === 'completed' ? '已完成' : '待確認';

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  if (!auth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f5f0eb 0%, #e8e0d8 100%)', fontFamily: font }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '60px 40px', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 400, width: '90%' }}>
          <h1 style={{ fontSize: 24, color: '#5c4a3a', marginBottom: 8 }}>J.LAB</h1>
          <p style={{ color: '#999', fontSize: 14, marginBottom: 40, letterSpacing: 2 }}>管理後台 ADMIN</p>
          <input type="password" placeholder="請輸入管理密碼" value={pw} onChange={e => setPw(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 20, boxSizing: 'border-box', textAlign: 'center' }} />
          <button type="submit" style={{ width: '100%', padding: 14, background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>登入</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', fontFamily: font }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#5c4a3a', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}

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
        {[{ key: 'bookings', label: '📋 預約管理' }, { key: 'timeslots', label: '🕐 時段管理' }, { key: 'blocked', label: '📅 封鎖日期' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '14px 24px', background: 'none', border: 'none',
            borderBottom: tab === t.key ? '2px solid #5c4a3a' : '2px solid transparent',
            fontSize: 14, color: tab === t.key ? '#5c4a3a' : '#999',
            fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px' }}>

        {/* ══════ BOOKINGS（完全唔變）══════ */}
        {tab === 'bookings' && (
          <>
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

            <div style={{ background: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <span style={{ color: '#5c4a3a', fontWeight: 'bold', fontSize: 14 }}>篩選：</span>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }}>
                <option value="all">全部狀態</option><option value="pending">待確認</option><option value="confirmed">已確認</option><option value="completed">已完成</option><option value="cancelled">已取消</option>
              </select>
              <button onClick={() => { setFilterDate(''); setFilterStatus('all'); }} style={{ padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#5c4a3a', fontSize: 13 }}>清除篩選</button>
              <button onClick={fetchBookings} style={{ padding: '8px 16px', background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto', fontSize: 13 }}>🔄 重新整理</button>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: 20, borderBottom: '1px solid #eee' }}>
                <h2 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>預約列表 ({bookings.length} 筆)</h2>
              </div>
              {bkLoading ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>載入中...</p> : bookings.length === 0 ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>暫無預約紀錄</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead><tr style={{ background: '#f9f6f3' }}>
                      {['日期', '時間', '服務', '客人', '電話', '技師', '金額', '狀態', '操作'].map(h => <th key={h} style={{ padding: '14px 12px', textAlign: 'left', color: '#5c4a3a', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{bookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>{b.booking_date}</td>
                        <td style={{ padding: '14px 12px' }}>{b.booking_time}</td>
                        <td style={{ padding: '14px 12px' }}>{b.service_name}{b.variant_label && <div style={{ fontSize: 12, color: '#999' }}>{b.variant_label}</div>}{b.addon_names?.length > 0 && <div style={{ fontSize: 12, color: '#999' }}>+ {b.addon_names.join('、')}</div>}</td>
                        <td style={{ padding: '14px 12px' }}>{b.customer_name}</td>
                        <td style={{ padding: '14px 12px' }}>{b.customer_phone}</td>
                        <td style={{ padding: '14px 12px' }}>{b.technician_label || '-'}</td>
                        <td style={{ padding: '14px 12px', fontWeight: 'bold' }}>${b.total_price}</td>
                        <td style={{ padding: '14px 12px' }}><span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, color: '#fff', background: statusColor(b.status) }}>{statusText(b.status)}</span></td>
                        <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
                          <select value={b.status || 'pending'} onChange={e => updateStatus(b.id, e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, marginRight: 6 }}>
                            <option value="pending">待確認</option><option value="confirmed">已確認</option><option value="completed">已完成</option><option value="cancelled">已取消</option>
                          </select>
                          <button onClick={() => deleteBooking(b.id)} style={{ padding: '4px 8px', background: '#fee', border: '1px solid #fcc', borderRadius: 4, color: '#c00', cursor: 'pointer', fontSize: 12 }}>刪除</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════ TIME SLOTS（改用 daily_slots）══════ */}
        {tab === 'timeslots' && (
          <>
            {batchLoading && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', padding: '30px 40px', borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
                  <div style={{ fontSize: 14, color: '#5c4a3a' }}>批量操作中...</div>
                </div>
              </div>
            )}

            {/* 重要提示 */}
            <div style={{ ...card, background: '#fffde7', border: '1px solid #fff9c4' }}>
              <div style={{ fontSize: 14, color: '#5c4a3a', lineHeight: 1.8 }}>
                💡 <b>操作流程：</b><br />
                ① 喺下方月曆<b>選擇日期</b> → ② 用<b>快速模板</b>設定營業時間 → ③ 用<b>休息時段</b>關閉午休 → ④ 用<b>單日微調</b>微調個別日子<br />
                🔗 設定完成後，前台客人只會睇到你開放嘅日期同時段
              </div>
            </div>

            {/* ─── 1. 批量月曆 ─── */}
            <div style={card}>
              <div style={sectionTitle}>📅 批量選擇日期</div>
              <div style={sectionDesc}>逐日點選，或點星期標題選該欄全部日期（🟢 = 已有開放時段）</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button onClick={prevMonth} style={navBtnStyle}>◀</button>
                <span style={{ fontSize: 17, fontWeight: 600, color: '#5c4a3a' }}>{calYear}年 {calMonth + 1}月</span>
                <button onClick={nextMonth} style={navBtnStyle}>▶</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {DAYS.map((d, i) => {
                  const allSel = isColAllSelected(i);
                  return (
                    <button key={`h${i}`} onClick={() => toggleWeekdayCol(i)} style={{
                      padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: allSel ? '#5c4a3a' : '#f0ebe3',
                      color: allSel ? '#fff' : '#5c4a3a',
                      fontSize: 13, fontWeight: 600, fontFamily: font, transition: 'all 0.2s',
                    }}>{d}</button>
                  );
                })}
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`e${i}`} />;
                  const ds = toDateStr(calYear, calMonth, day);
                  const sel = selDates.has(ds);
                  const today = ds === todayStr;
                  const openCount = calSlotCounts[ds] || 0;
                  return (
                    <button key={`d${i}`} onClick={() => toggleDate(day)} style={{
                      padding: '8px 4px', borderRadius: 8, cursor: 'pointer', position: 'relative',
                      border: today ? '2px solid #FF9800' : sel ? '2px solid #5c4a3a' : '2px solid transparent',
                      background: sel ? '#5c4a3a' : 'transparent',
                      color: sel ? '#fff' : today ? '#FF9800' : '#888',
                      fontSize: 14, fontWeight: today || sel ? 700 : 400,
                      fontFamily: font, transition: 'all 0.15s',
                    }}>
                      {day}
                      {openCount > 0 && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: sel ? '#8eff8e' : '#4CAF50', margin: '3px auto 0' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                <button onClick={() => selectByFilter(d => d >= 1 && d <= 5)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>本月平日</button>
                <button onClick={() => selectByFilter(d => d === 0 || d === 6)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>本月週末</button>
                <button onClick={() => selectByFilter(() => true)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>全月</button>
                <button onClick={() => setSelDates(new Set())} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#999', cursor: 'pointer', fontSize: 12, fontFamily: font }}>清除全部</button>
              </div>

              {selDates.size > 0 && (
                <div style={{ marginTop: 14, padding: '12px 16px', background: '#f0ebe3', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#5c4a3a' }}>
                    已選 <b>{selDates.size}</b> 個日期
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4, lineHeight: 1.8 }}>
                    {[...selDates].sort().map(d => (
                      <span key={d} style={{ display: 'inline-block', padding: '2px 8px', margin: 2, background: '#e8e0d8', borderRadius: 4, fontSize: 11 }}>{d.slice(5)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ─── 2. 快速模板 ─── */}
            <div style={card}>
              <div style={sectionTitle}>⚡ 快速模板</div>
              <div style={sectionDesc}>
                設定營業時間模板，一鍵套用到已選日期
                {selDates.size === 0 && <span style={{ color: '#c00' }}> — 請先選擇日期</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
                {templates.map((t, i) => (
                  <div key={i} style={{
                    padding: 16, borderRadius: 10, border: '1px solid #e0d8cc', background: '#fff',
                    opacity: selDates.size === 0 ? 0.5 : 1, transition: 'opacity 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 22 }}>{t.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>{t.label}</span>
                    </div>
                    {t.from !== null ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                        <select value={t.from} onChange={e => updateTemplate(i, 'from', e.target.value)} style={ddStyle}>
                          {ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        <span style={{ color: '#999', fontSize: 12, flexShrink: 0 }}>至</span>
                        <select value={t.to} onChange={e => updateTemplate(i, 'to', e.target.value)} style={ddStyle}>
                          {ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#999', marginBottom: 12, padding: '6px 0' }}>全部時段關閉</div>
                    )}
                    <button onClick={() => applyTemplate(t)} disabled={selDates.size === 0} style={{
                      width: '100%', padding: 9, borderRadius: 6, border: 'none',
                      background: selDates.size === 0 ? '#ddd' : '#5c4a3a', color: '#fff',
                      cursor: selDates.size === 0 ? 'not-allowed' : 'pointer',
                      fontSize: 13, fontFamily: font, fontWeight: 500, transition: 'background 0.2s',
                    }}>套用到 {selDates.size} 個日期</button>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── 3. 休息時段 ─── */}
            <div style={card}>
              <div style={sectionTitle}>🍽️ 休息時段</div>
              <div style={sectionDesc}>
                喺已開放嘅營業時間內設定休息時段，指定範圍會被關閉
                {selDates.size === 0 && <span style={{ color: '#c00' }}> — 請先選擇日期</span>}
              </div>

              <div style={{ fontSize: 12, color: '#666', background: '#faf6f0', padding: '10px 14px', borderRadius: 8, marginBottom: 16, lineHeight: 1.8 }}>
                💡 <b>建議流程：</b>先用上方模板設定營業時間 → 再用呢度關閉休息時段<br />
                例如：套用「全日班 10:00–19:00」→ 設定「午休 13:00–14:00」→ 結果為 10:00–13:00 + 14:00–19:00
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12, marginBottom: 20 }}>
                {breakTemplates.map((t, i) => (
                  <div key={i} style={{
                    padding: 16, borderRadius: 10, border: '1px solid #fce4ec', background: '#fff',
                    opacity: selDates.size === 0 ? 0.5 : 1, transition: 'opacity 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 22 }}>{t.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>{t.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                      <select value={t.from} onChange={e => updateBreakTemplate(i, 'from', e.target.value)} style={ddStyle}>
                        {ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                      <span style={{ color: '#999', fontSize: 12, flexShrink: 0 }}>至</span>
                      <select value={t.to} onChange={e => updateBreakTemplate(i, 'to', e.target.value)} style={ddStyle}>
                        {ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                      </select>
                    </div>
                    <button onClick={() => applyBreak(t.from, t.to)} disabled={selDates.size === 0} style={{
                      width: '100%', padding: 9, borderRadius: 6, border: 'none',
                      background: selDates.size === 0 ? '#ddd' : '#e53935', color: '#fff',
                      cursor: selDates.size === 0 ? 'not-allowed' : 'pointer',
                      fontSize: 13, fontFamily: font, fontWeight: 500, transition: 'background 0.2s',
                    }}>設為休息</button>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px', background: '#fff8f8', borderRadius: 10, border: '1px solid #fce4ec' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', marginBottom: 10 }}>自訂休息時段</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select value={breakFrom} onChange={e => setBreakFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}>
                    {ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ color: '#999', fontSize: 12 }}>至</span>
                  <select value={breakTo} onChange={e => setBreakTo(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}>
                    {ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button onClick={() => applyBreak(breakFrom, breakTo)} disabled={selDates.size === 0} style={{
                    padding: '8px 20px', borderRadius: 6, border: 'none',
                    background: selDates.size === 0 ? '#ddd' : '#e53935', color: '#fff',
                    cursor: selDates.size === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontFamily: font, fontWeight: 500,
                  }}>設為休息</button>
                </div>
              </div>
            </div>

            {/* ─── 4. 自訂時段範圍 ─── */}
            <div style={card}>
              <div style={sectionTitle}>🎯 自訂時段範圍</div>
              <div style={sectionDesc}>
                選擇時間範圍，批量開放或關閉
                {selDates.size === 0 && <span style={{ color: '#c00' }}> — 請先選擇日期</span>}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#666' }}>從</span>
                <select value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: font }}>
                  {ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ fontSize: 13, color: '#666' }}>到</span>
                <select value={rangeTo} onChange={e => setRangeTo(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: font }}>
                  {ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={() => batchSetRange(true)} disabled={selDates.size === 0} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: selDates.size === 0 ? '#ccc' : '#4CAF50', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: font, fontWeight: 500 }}>✅ 開放</button>
                <button onClick={() => batchSetRange(false)} disabled={selDates.size === 0} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: selDates.size === 0 ? '#ccc' : '#f44336', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: font, fontWeight: 500 }}>❌ 關閉</button>
              </div>
            </div>

            {/* ─── 5. 單日微調 ─── */}
            <div style={card}>
              <div style={sectionTitle}>🔧 單日微調</div>
              <div style={sectionDesc}>揀一個日期，微調嗰日嘅時段開關（啡色 = 開放，淺色 = 關閉）（🟢 = 已有開放時段）</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button onClick={prevMicroMonth} style={navBtnStyle}>◀</button>
                <span style={{ fontSize: 17, fontWeight: 600, color: '#5c4a3a' }}>{microYear}年 {microMonth + 1}月</span>
                <button onClick={nextMicroMonth} style={navBtnStyle}>▶</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 20 }}>
                {DAYS.map((d, i) => (
                  <div key={`mh${i}`} style={{ padding: '8px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#5c4a3a' }}>{d}</div>
                ))}
                {microCalDays.map((day, i) => {
                  if (!day) return <div key={`me${i}`} />;
                  const ds = toDateStr(microYear, microMonth, day);
                  const sel = ds === microDate;
                  const today = ds === todayStr;
                  const openCount = microSlotCounts[ds] || 0;
                  return (
                    <button key={`md${i}`} onClick={() => setMicroDate(ds)} style={{
                      padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                      border: today && !sel ? '2px solid #FF9800' : sel ? '2px solid #5c4a3a' : '2px solid transparent',
                      background: sel ? '#5c4a3a' : 'transparent',
                      color: sel ? '#fff' : today ? '#FF9800' : '#888',
                      fontSize: 14, fontWeight: today || sel ? 700 : 400,
                      fontFamily: font, transition: 'all 0.15s',
                    }}>
                      {day}
                      {openCount > 0 && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: sel ? '#8eff8e' : '#4CAF50', margin: '3px auto 0' }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: '12px 16px', background: '#f0ebe3', borderRadius: 8, marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: '#5c4a3a' }}>
                  📌 已選：<b>{microDate}</b>（週{DAYS[new Date(microDate + 'T00:00:00').getDay()]}）
                </div>
                <div style={{ fontSize: 12, color: '#4CAF50', marginTop: 4 }}>
                  ✅ 修改只會影響呢一日（{microDate}）
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0ebe3' }}>
                <span style={{ fontSize: 14, color: '#999' }}>{microActiveCount} / {microTimesToShow.length} 個時段開放</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => toggleMicroAll(microDate, true)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 13, fontFamily: font }}>全部開</button>
                  <button onClick={() => toggleMicroAll(microDate, false)} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 13, fontFamily: font }}>全部關</button>
                </div>
              </div>

              {microLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {microTimesToShow.map(time => {
                    const isOpen = microSlots[time] || false;
                    return (
                      <button key={time} onClick={() => toggleMicroSlot(microDate, time)} style={{
                        padding: '14px 8px', borderRadius: 8,
                        border: `2px solid ${isOpen ? '#5c4a3a' : '#e0d8cc'}`,
                        background: isOpen ? '#5c4a3a' : '#faf6f0',
                        color: isOpen ? '#fff' : '#c0b8aa',
                        fontSize: 15, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontFamily: font,
                      }}>{time}</button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════ BLOCKED（完全唔變）══════ */}
        {tab === 'blocked' && (
          <div style={card}>
            <h2 style={{ margin: '0 0 20px', color: '#5c4a3a', fontSize: 18 }}>封鎖日期</h2>
            <p style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>封鎖特定日期，該日將無法被預約。</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0ebe3', flexWrap: 'wrap' }}>
              <input type="date" value={newBD} onChange={e => setNewBD(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, flex: '1 1 150px' }} />
              <input type="text" placeholder="原因（可選）" value={newBR} onChange={e => setNewBR(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, flex: '2 1 200px', fontFamily: font }} />
              <button onClick={addBlocked} style={{ padding: '10px 20px', background: '#c62828', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: font }}>封鎖</button>
            </div>
            {blocked.length === 0 ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>未有封鎖日期</p> : (
              <div>{blocked.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 8, background: '#faf6f0', marginBottom: 8 }}>
                  <div><span style={{ fontWeight: 500, fontSize: 14 }}>{b.date}</span>{b.reason && <span style={{ color: '#999', fontSize: 13, marginLeft: 12 }}>— {b.reason}</span>}</div>
                  <button onClick={() => removeBlocked(b.id)} style={{ padding: '6px 14px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 6, color: '#c62828', cursor: 'pointer', fontSize: 12, fontFamily: font }}>刪除</button>
                </div>
              ))}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
