import { useState, useEffect, useCallback, useMemo } from 'react';

/* ═══════════════════ API ═══════════════════ */
const SB = 'https://vqyfbwnkdpncwvdonbcz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';
const H = { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

const sbGet = async (p) => { const r = await fetch(`${SB}/rest/v1/${p}`, { headers: H }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const sbPost = async (t, d) => { const r = await fetch(`${SB}/rest/v1/${t}`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const sbDel = async (p) => { const r = await fetch(`${SB}/rest/v1/${p}`, { method: 'DELETE', headers: H }); if (!r.ok) throw new Error(await r.text()); };
const sbPatch = async (p, d) => { const r = await fetch(`${SB}/rest/v1/${p}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };

/* ═══════════════════ CONSTANTS ═══════════════════ */
const PASS = 'jlab2024';
const DAYS = ['日', '一', '二', '三', '四', '五', '六'];

const ALL_TIMES = [];
for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30)
  ALL_TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

const ALL_TIMES_15 = [];
for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15)
  ALL_TIMES_15.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

const TEMPLATES = [
  { label: '全日班', from: '10:00', to: '20:00', icon: '☀️' },
  { label: '上午班', from: '10:00', to: '14:00', icon: '🌅' },
  { label: '下午班', from: '14:00', to: '20:00', icon: '🌇' },
  { label: '晚間班', from: '17:00', to: '21:00', icon: '🌙' },
  { label: '休息日', from: null, to: null, icon: '💤' },
];

const INTERVAL_OPTIONS = [30, 45, 60, 90];

/* ═══════════════════ STYLES ═══════════════════ */
const card = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 };
const sTitle = { fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 6 };
const sDesc = { fontSize: 13, color: '#999', marginBottom: 16 };
const font = "'Noto Serif TC', serif";

/* ═══════════════════ HELPERS ═══════════════════ */
const toTimeStr = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/* ═══════════════════ COMPONENT ═══════════════════ */
export default function Admin() {
  /* ── Auth ── */
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState('bookings');
  const [toast, setToast] = useState('');

  /* ── Bookings ── */
  const [bookings, setBookings] = useState([]);
  const [bkLoading, setBkLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });

  /* ── 統一月曆 ── */
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selDates, setSelDates] = useState(new Set());
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);

  /* ── Pending Changes ── */
  const [pending, setPending] = useState({});
  const [batchLoading, setBatchLoading] = useState(false);
  const [showPendingList, setShowPendingList] = useState(false);

  /* ── Templates ── */
  const [templates, setTemplates] = useState(TEMPLATES.map(t => ({ ...t })));

  /* ── Break ── */
  const [breakFrom, setBreakFrom] = useState('13:00');
  const [breakTo, setBreakTo] = useState('14:00');

  /* ══ Grid Settings — 自動記住 ══ */
  const [gridStart, setGridStart] = useState(() => localStorage.getItem('jlab_grid_start') || '10:00');
  const [gridEnd, setGridEnd] = useState(() => localStorage.getItem('jlab_grid_end') || '20:00');
  const [gridInterval, setGridInterval] = useState(() => Number(localStorage.getItem('jlab_grid_interval')) || 30);
  const [settingSaved, setSettingSaved] = useState(false);

  useEffect(() => {
    localStorage.setItem('jlab_grid_start', gridStart);
    localStorage.setItem('jlab_grid_end', gridEnd);
    localStorage.setItem('jlab_grid_interval', String(gridInterval));
    setSettingSaved(true);
    const t = setTimeout(() => setSettingSaved(false), 1500);
    return () => clearTimeout(t);
  }, [gridStart, gridEnd, gridInterval]);

  /* ── DB state for active date ── */
  const [dbTimes, setDbTimes] = useState(new Set());
  const [dbStatus, setDbStatus] = useState(null);
  const [gridLoading, setGridLoading] = useState(false);

  /* ── Blocked ── */
  const [blocked, setBlocked] = useState([]);
  const [newBD, setNewBD] = useState('');
  const [newBR, setNewBR] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  const toDS = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const navBtn = { padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#5c4a3a', fontFamily: font };
  const ddStyle = { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font, flex: 1, minWidth: 0 };

  /* ═══════════════════ DYNAMIC GRID TIMES ═══════════════════ */
  const gridTimes = useMemo(() => {
    const times = [];
    let mins = toMins(gridStart);
    const end = toMins(gridEnd);
    while (mins <= end) {
      times.push(toTimeStr(mins));
      mins += gridInterval;
    }
    return times;
  }, [gridStart, gridEnd, gridInterval]);

  const autoFitRange = () => {
    const starts = templates.filter(t => t.from).map(t => toMins(t.from));
    const ends = templates.filter(t => t.to).map(t => toMins(t.to));
    if (!starts.length || !ends.length) return;
    const earliest = Math.max(0, Math.min(...starts) - gridInterval);
    const latest = Math.min(23 * 60 + 30, Math.max(...ends) + gridInterval);
    setGridStart(toTimeStr(earliest));
    setGridEnd(toTimeStr(latest));
    showToast(`📐 已自動適應範圍`);
  };

  /* ── Derived ── */
  const displayTimes = pending[activeDate] || dbTimes;
  const isInPending = !!pending[activeDate];
  const pendingCount = Object.keys(pending).length;
  const activeDow = activeDate ? new Date(activeDate + 'T00:00:00').getDay() : 0;

  // 檢查 DB 有冇唔喺目前 grid 嘅時段
  const extraDbTimes = useMemo(() => {
    const gridSet = new Set(gridTimes);
    return [...(pending[activeDate] || dbTimes)].filter(t => !gridSet.has(t)).sort();
  }, [gridTimes, dbTimes, pending, activeDate]);

  /* ═══════════════════ LOAD DB — 讀 enabled_timeslots ═══════════════════ */
  const loadActiveFromDB = useCallback(async (date) => {
    if (!date) return;
    setGridLoading(true);
    try {
      const [dateData, enabledData] = await Promise.all([
        sbGet(`date_availability?available_date=eq.${date}`),
        sbGet(`enabled_timeslots?slot_date=eq.${date}&order=slot_time`)
      ]);
      const info = dateData?.[0];
      setDbStatus(info?.status || null);
      if (!info || info.status !== 'available') {
        setDbTimes(new Set());
      } else {
        setDbTimes(new Set((enabledData || []).map(r => r.slot_time?.slice(0, 5))));
      }
    } catch (e) { console.error(e); }
    setGridLoading(false);
  }, []);

  useEffect(() => {
    if (auth && activeDate) loadActiveFromDB(activeDate);
  }, [activeDate, auth, loadActiveFromDB]);

  /* ═══════════════════ CALENDAR ═══════════════════ */
  const getCalDays = (y, m) => {
    const dow = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < dow; i++) days.push(null);
    for (let d = 1; d <= total; d++) days.push(d);
    return days;
  };

  const prevCal = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextCal = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };
  const calDays = getCalDays(calYear, calMonth);

  const toggleDate = (day) => {
    if (!day) return;
    const ds = toDS(calYear, calMonth, day);
    setSelDates(prev => { const n = new Set(prev); n.has(ds) ? n.delete(ds) : n.add(ds); return n; });
    setActiveDate(ds);
  };

  const toggleWeekdayCol = (dow) => {
    const total = new Date(calYear, calMonth + 1, 0).getDate();
    const col = [];
    for (let d = 1; d <= total; d++) if (new Date(calYear, calMonth, d).getDay() === dow) col.push(toDS(calYear, calMonth, d));
    setSelDates(prev => {
      const n = new Set(prev);
      const allSel = col.every(d => n.has(d));
      col.forEach(d => allSel ? n.delete(d) : n.add(d));
      return n;
    });
  };

  const selectByFilter = (fn) => {
    const total = new Date(calYear, calMonth + 1, 0).getDate();
    const n = new Set(selDates);
    for (let d = 1; d <= total; d++) if (fn(new Date(calYear, calMonth, d).getDay())) n.add(toDS(calYear, calMonth, d));
    setSelDates(n);
  };

  const isColAllSel = (dow) => {
    const total = new Date(calYear, calMonth + 1, 0).getDate();
    let c = 0;
    for (let d = 1; d <= total; d++) if (new Date(calYear, calMonth, d).getDay() === dow) { c++; if (!selDates.has(toDS(calYear, calMonth, d))) return false; }
    return c > 0;
  };

  /* ═══════════════════ TIME SLOT TOGGLE ═══════════════════ */
  const toggleTime = (time) => {
    if (!activeDate) return;
    setPending(prev => {
      const next = { ...prev };
      if (!next[activeDate]) {
        next[activeDate] = new Set(dbTimes);
      } else {
        next[activeDate] = new Set(next[activeDate]);
      }
      next[activeDate].has(time) ? next[activeDate].delete(time) : next[activeDate].add(time);
      return next;
    });
  };

  const setAllTimes = (on) => {
    if (!activeDate) return;
    setPending(prev => {
      const next = { ...prev };
      next[activeDate] = on ? new Set(gridTimes) : new Set();
      return next;
    });
  };

  /* ═══════════════════ TEMPLATE ═══════════════════ */
  const applyTemplateLocal = (tmpl) => {
    const dates = [...selDates];
    if (!dates.length) return alert('請先選擇日期！');
    const next = { ...pending };
    if (!tmpl.from) {
      dates.forEach(d => { next[d] = new Set(); });
    } else {
      const times = gridTimes.filter(t => t >= tmpl.from && t <= tmpl.to);
      dates.forEach(d => { next[d] = new Set(times); });
    }
    setPending(next);
    showToast(`✏️ 已套用「${tmpl.label}」到 ${dates.length} 個日期`);
  };

  /* ═══════════════════ BREAK ═══════════════════ */
  const applyBreakLocal = () => {
    const dates = [...selDates].filter(d => pending[d] && pending[d].size > 0);
    if (!dates.length) return alert('請先套用營業模板，再設定休息時段！');
    if (breakFrom >= breakTo) return alert('開始時間必須早於結束時間！');
    const next = { ...pending };
    const bTimes = gridTimes.filter(t => t >= breakFrom && t < breakTo);
    dates.forEach(d => {
      next[d] = new Set(next[d]);
      bTimes.forEach(t => next[d].delete(t));
    });
    setPending(next);
    showToast(`🍽️ 已關閉 ${breakFrom}–${breakTo} 休息時段（${dates.length} 個日期）`);
  };

  /* ═══════════════════ SYNC — 寫入 enabled_timeslots ═══════════════════ */
  const syncPending = async () => {
    const entries = Object.entries(pending);
    if (!entries.length) return;
    if (!window.confirm(
      `確定同步 ${entries.length} 個日期到前台？\n\n` +
      `客人將立即睇到新嘅可預約時段。\n` +
      `呢個操作會覆蓋呢啲日期嘅現有設定。`
    )) return;

    setBatchLoading(true);
    try {
      const dates = entries.map(([d]) => d);

      // 清除舊資料
      await sbDel(`date_availability?available_date=in.(${dates.join(',')})`);
      await sbDel(`enabled_timeslots?slot_date=in.(${dates.join(',')})`);
      // 也清舊嘅 disabled_timeslots（向下兼容）
      try { await sbDel(`disabled_timeslots?slot_date=in.(${dates.join(',')})`); } catch (_) {}

      // 寫入日期狀態
      const availRows = entries.map(([d, times]) => ({
        available_date: d,
        status: times.size > 0 ? 'available' : 'closed'
      }));
      await sbPost('date_availability', availRows);

      // 寫入開放嘅時段
      const enabledRows = [];
      entries.forEach(([d, times]) => {
        [...times].forEach(t => {
          enabledRows.push({ slot_date: d, slot_time: t });
        });
      });
      if (enabledRows.length > 0) {
        for (let i = 0; i < enabledRows.length; i += 500) {
          await sbPost('enabled_timeslots', enabledRows.slice(i, i + 500));
        }
      }

      setPending({});
      setSelDates(new Set());
      showToast(`✅ 成功同步 ${dates.length} 個日期到前台！`);
      loadActiveFromDB(activeDate);
    } catch (e) {
      console.error(e);
      alert('同步失敗：' + e.message);
    }
    setBatchLoading(false);
  };

  const removePendingDate = (date) => {
    setPending(prev => { const next = { ...prev }; delete next[date]; return next; });
  };

  /* ═══════════════════ BOOKINGS ═══════════════════ */
  const fetchBookings = async () => {
    setBkLoading(true);
    try {
      let q = 'bookings?order=booking_date.desc,booking_time.desc';
      if (filterDate) q += `&booking_date=eq.${filterDate}`;
      if (filterStatus !== 'all') q += `&status=eq.${filterStatus}`;
      const data = await sbGet(q);
      setBookings(data || []);
      const today = todayStr;
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const monthPre = new Date().toISOString().slice(0, 7);
      setStats({
        today: (data || []).filter(b => b.booking_date === today).length,
        week: (data || []).filter(b => b.booking_date >= weekAgo).length,
        month: (data || []).filter(b => b.booking_date?.startsWith(monthPre)).length,
        total: (data || []).length,
      });
    } catch (e) { console.error(e); }
    setBkLoading(false);
  };

  const updateStatus = async (id, s) => { try { await sbPatch(`bookings?id=eq.${id}`, { status: s }); fetchBookings(); } catch (e) { console.error(e); } };
  const deleteBooking = async (id) => { if (!window.confirm('確定要刪除？')) return; try { await sbDel(`bookings?id=eq.${id}`); fetchBookings(); showToast('✅ 已刪除'); } catch (e) { console.error(e); } };

  useEffect(() => { if (auth) fetchBookings(); }, [filterDate, filterStatus]);

  /* ═══════════════════ BLOCKED ═══════════════════ */
  const fetchBlocked = async () => { try { setBlocked(await sbGet('blocked_dates?order=date') || []); } catch (e) { console.error(e); } };
  const addBlocked = async () => { if (!newBD) return; try { const d = await sbPost('blocked_dates', { date: newBD, reason: newBR }); setBlocked(prev => [...prev, ...d].sort((a, b) => a.date.localeCompare(b.date))); setNewBD(''); setNewBR(''); } catch (e) { console.error(e); } };
  const removeBlocked = async (id) => { try { await sbDel(`blocked_dates?id=eq.${id}`); setBlocked(prev => prev.filter(b => b.id !== id)); } catch (e) { console.error(e); } };

  /* ═══════════════════ AUTH ═══════════════════ */
  const handleLogin = (e) => {
    e.preventDefault();
    if (pw === PASS) { setAuth(true); fetchBookings(); fetchBlocked(); }
    else alert('密碼錯誤！');
  };

  const statusColor = (s) => s === 'confirmed' ? '#4CAF50' : s === 'cancelled' ? '#f44336' : s === 'completed' ? '#2196F3' : '#FF9800';
  const statusText = (s) => s === 'confirmed' ? '已確認' : s === 'cancelled' ? '已取消' : s === 'completed' ? '已完成' : '待確認';

  /* ═══════════════════ RENDER ═══════════════════ */
  if (!auth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f5f0eb,#e8e0d8)', fontFamily: font }}>
      <form onSubmit={handleLogin} style={{ background: '#fff', padding: '60px 40px', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 400, width: '90%' }}>
        <h1 style={{ fontSize: 24, color: '#5c4a3a', marginBottom: 8 }}>J.LAB</h1>
        <p style={{ color: '#999', fontSize: 14, marginBottom: 40, letterSpacing: 2 }}>管理後台 ADMIN</p>
        <input type="password" placeholder="請輸入管理密碼" value={pw} onChange={e => setPw(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 20, boxSizing: 'border-box', textAlign: 'center' }} />
        <button type="submit" style={{ width: '100%', padding: 14, background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>登入</button>
      </form>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', fontFamily: font }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#5c4a3a', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}

      {batchLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '30px 40px', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 14, color: '#5c4a3a' }}>處理中...</div>
          </div>
        </div>
      )}

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

      {/* Sticky Sync Bar */}
      {pendingCount > 0 && tab === 'timeslots' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', borderBottom: '2px solid #FFB74D' }}>
          <div style={{ padding: '14px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#E65100', fontSize: 14, fontWeight: 600 }}>⏳ {pendingCount} 個日期待同步</span>
              <button onClick={() => setShowPendingList(!showPendingList)} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #FFB74D', borderRadius: 4, color: '#E65100', cursor: 'pointer', fontSize: 12, fontFamily: font }}>
                {showPendingList ? '收起 ▲' : '查看列表 ▼'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setPending({}); showToast('已清除所有待同步'); setShowPendingList(false); }} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#666', fontFamily: font }}>取消全部</button>
              <button onClick={syncPending} style={{ padding: '8px 24px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: font, boxShadow: '0 2px 8px rgba(76,175,80,0.3)' }}>✅ 確認同步到前台</button>
            </div>
          </div>
          {showPendingList && (
            <div style={{ padding: '0 30px 14px', maxHeight: 240, overflowY: 'auto' }}>
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                {Object.entries(pending).sort(([a], [b]) => a.localeCompare(b)).map(([date, times]) => (
                  <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f5f0eb' }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#5c4a3a', fontWeight: 600 }}>{date}</span>
                      <span style={{ color: '#999', marginLeft: 6 }}>週{DAYS[new Date(date + 'T00:00:00').getDay()]}</span>
                      <span style={{ color: times.size > 0 ? '#4CAF50' : '#f44336', marginLeft: 10, fontSize: 12, fontWeight: 500 }}>
                        {times.size > 0 ? `${times.size} 個時段開放` : '全日關閉'}
                      </span>
                    </div>
                    <button onClick={() => removePendingDate(date)} style={{ padding: '3px 10px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 4, color: '#c62828', cursor: 'pointer', fontSize: 11, fontFamily: font }}>移除</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px' }}>

        {/* ══════════════════════ BOOKINGS TAB ══════════════════════ */}
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
              <button onClick={() => { setFilterDate(''); setFilterStatus('all'); }} style={{ padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#5c4a3a', fontSize: 13 }}>清除</button>
              <button onClick={fetchBookings} style={{ padding: '8px 16px', background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', marginLeft: 'auto', fontSize: 13 }}>🔄 重新整理</button>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: 20, borderBottom: '1px solid #eee' }}>
                <h2 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>預約列表 ({bookings.length})</h2>
              </div>
              {bkLoading ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>載入中...</p> : bookings.length === 0 ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>暫無預約</p> : (
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

        {/* ══════════════════════ TIME SLOTS TAB ══════════════════════ */}
        {tab === 'timeslots' && (
          <>
            <div style={{ ...card, background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
              <div style={{ fontSize: 14, color: '#2e7d32', lineHeight: 2 }}>
                💡 <b>使用流程：</b>喺月曆選日期 → 套用模板或逐個調時段 → 按頂部「<b>確認同步到前台</b>」<br />
                🔒 預設所有日期關閉，只有你開放嘅日期先會出現喺前台
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

              {/* 左：月曆 */}
              <div style={card}>
                <div style={sTitle}>📅 選擇日期</div>
                <div style={sDesc}>點日期查看 / 編輯時段，可多選後套用模板</div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <button onClick={prevCal} style={navBtn}>◀</button>
                  <span style={{ fontSize: 17, fontWeight: 600, color: '#5c4a3a' }}>{calYear}年 {calMonth + 1}月</span>
                  <button onClick={nextCal} style={navBtn}>▶</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                  {DAYS.map((d, i) => (
                    <button key={`h${i}`} onClick={() => toggleWeekdayCol(i)} style={{
                      padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: isColAllSel(i) ? '#5c4a3a' : '#f0ebe3', color: isColAllSel(i) ? '#fff' : '#5c4a3a',
                      fontSize: 13, fontWeight: 600, fontFamily: font,
                    }}>{d}</button>
                  ))}
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const ds = toDS(calYear, calMonth, day);
                    const sel = selDates.has(ds);
                    const isActive = ds === activeDate;
                    const isToday = ds === todayStr;
                    const hasPend = !!pending[ds];
                    return (
                      <button key={`d${i}`} onClick={() => toggleDate(day)} style={{
                        padding: '12px 4px', borderRadius: 8, cursor: 'pointer', position: 'relative',
                        border: isActive ? '3px solid #FF9800' : sel ? '2px solid #5c4a3a' : '2px solid transparent',
                        background: sel ? (isActive ? '#4a3a2a' : '#5c4a3a') : hasPend ? '#e8f5e9' : 'transparent',
                        color: sel ? '#fff' : isToday ? '#FF9800' : '#666',
                        fontSize: 14, fontWeight: isToday || sel || isActive ? 700 : 400, fontFamily: font,
                        transition: 'all 0.15s',
                      }}>
                        {day}
                        {hasPend && !sel && <div style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, background: '#4CAF50', borderRadius: '50%' }} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  <button onClick={() => selectByFilter(d => d >= 1 && d <= 5)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>平日</button>
                  <button onClick={() => selectByFilter(d => d === 0 || d === 6)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>週末</button>
                  <button onClick={() => selectByFilter(() => true)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>全月</button>
                  <button onClick={() => setSelDates(new Set())} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#999', cursor: 'pointer', fontSize: 12, fontFamily: font }}>清除選擇</button>
                </div>

                {selDates.size > 0 && (
                  <div style={{ marginTop: 14, padding: '10px 14px', background: '#f0ebe3', borderRadius: 8, fontSize: 13, color: '#5c4a3a' }}>
                    已選 <b>{selDates.size}</b> 日
                    <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>（橙框 = 正在查看）</span>
                  </div>
                )}
              </div>

              {/* ════════ 右：時段格 ════════ */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a' }}>
                    🕐 {activeDate}（週{DAYS[activeDow]}）
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setAllTimes(true)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 12, fontFamily: font }}>全開</button>
                    <button onClick={() => setAllTimes(false)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 12, fontFamily: font }}>全關</button>
                    <button onClick={() => loadActiveFromDB(activeDate)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#f5f0eb', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄</button>
                  </div>
                </div>

                {/* ── 範圍設定（自動記住）── */}
                <div style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                  background: '#f9f6f3', border: '1px solid #e8e0d8',
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
                    <span style={{ color: '#5c4a3a', fontWeight: 500 }}>範圍</span>
                    <select value={gridStart} onChange={e => setGridStart(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font }}>
                      {ALL_TIMES_15.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ color: '#999' }}>至</span>
                    <select value={gridEnd} onChange={e => setGridEnd(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font }}>
                      {ALL_TIMES_15.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={autoFitRange} style={{
                      padding: '4px 10px', borderRadius: 4, border: '1px solid #a5d6a7',
                      background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 12, fontFamily: font,
                    }}>📐 自動</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
                    <span style={{ color: '#5c4a3a', fontWeight: 500, fontSize: 13 }}>間隔</span>
                    {INTERVAL_OPTIONS.map(m => (
                      <button key={m} onClick={() => setGridInterval(m)} style={{
                        padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: font,
                        background: gridInterval === m ? '#5c4a3a' : '#e8e0d8',
                        color: gridInterval === m ? '#fff' : '#5c4a3a',
                        fontWeight: gridInterval === m ? 600 : 400,
                      }}>{m}分</button>
                    ))}
                    {settingSaved && <span style={{ fontSize: 11, color: '#4CAF50', marginLeft: 6 }}>✓ 已記住</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>
                    💾 設定會自動記住，下次打開唔使重設
                  </div>
                </div>

                {/* 狀態 Banner */}
                <div style={{
                  padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12,
                  background: isInPending ? '#FFF3E0' : dbStatus === 'available' ? '#e8f5e9' : '#f5f5f5',
                  color: isInPending ? '#E65100' : dbStatus === 'available' ? '#2e7d32' : '#999',
                  border: `1px solid ${isInPending ? '#FFB74D' : dbStatus === 'available' ? '#a5d6a7' : '#e0e0e0'}`,
                }}>
                  {isInPending
                    ? `⏳ 有未同步嘅變更 — ${displayTimes.size} / ${gridTimes.length} 個時段開放`
                    : dbStatus === 'available'
                    ? `✅ 已同步 — ${displayTimes.size} 個時段開放`
                    : '🔒 未開放（前台不顯示）'
                  }
                </div>

                {/* 隱藏時段警告 */}
                {extraDbTimes.length > 0 && (
                  <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12, background: '#FFF8E1', border: '1px solid #FFE082', color: '#F57F17' }}>
                    ⚠️ 有 {extraDbTimes.length} 個已開放時段唔喺目前格仔範圍內：{extraDbTimes.slice(0, 5).join(', ')}{extraDbTimes.length > 5 ? '...' : ''}
                    <br /><span style={{ fontSize: 11 }}>請調整範圍 / 間隔以顯示佢哋</span>
                  </div>
                )}

                {/* 時段格 */}
                {gridLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fill, minmax(${gridInterval >= 60 ? '80px' : '68px'}, 1fr))`,
                    gap: 5,
                    maxHeight: 480,
                    overflowY: 'auto',
                    padding: '2px 0',
                  }}>
                    {gridTimes.map(t => {
                      const isOn = displayTimes.has(t);
                      return (
                        <button key={t} onClick={() => toggleTime(t)} style={{
                          padding: '10px 4px', borderRadius: 6,
                          border: `2px solid ${isOn ? '#5c4a3a' : '#e0d8cc'}`,
                          background: isOn ? '#5c4a3a' : '#faf6f0',
                          color: isOn ? '#fff' : '#c0b8aa',
                          fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font,
                          transition: 'all 0.15s',
                        }}>{t}</button>
                      );
                    })}
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: '#999', textAlign: 'right' }}>
                  {gridTimes.length} 個時段（{gridStart}–{gridEnd}，每 {gridInterval} 分鐘）
                </div>
              </div>
            </div>

            {/* 營業模板 */}
            <div style={card}>
              <div style={sTitle}>⚡ 套用營業模板</div>
              <div style={sDesc}>
                套用後效果即時顯示喺右邊時段格
                {selDates.size === 0 && <span style={{ color: '#c00' }}> — 請先選擇日期</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {templates.map((t, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 10, border: '1px solid #e0d8cc', background: '#fff', opacity: selDates.size === 0 ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 22 }}>{t.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>{t.label}</span>
                    </div>
                    {t.from !== null ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                        <select value={t.from} onChange={e => setTemplates(prev => prev.map((tt, idx) => idx === i ? { ...tt, from: e.target.value } : tt))} style={ddStyle}>
                          {ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        <span style={{ color: '#999', fontSize: 12 }}>至</span>
                        <select value={t.to} onChange={e => setTemplates(prev => prev.map((tt, idx) => idx === i ? { ...tt, to: e.target.value } : tt))} style={ddStyle}>
                          {ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#999', marginBottom: 12 }}>全日關閉</div>
                    )}
                    <button onClick={() => applyTemplateLocal(t)} disabled={selDates.size === 0} style={{
                      width: '100%', padding: 9, borderRadius: 6, border: 'none',
                      background: selDates.size === 0 ? '#ddd' : '#5c4a3a', color: '#fff',
                      cursor: selDates.size === 0 ? 'not-allowed' : 'pointer',
                      fontSize: 13, fontFamily: font, fontWeight: 500,
                    }}>套用（{selDates.size} 日）</button>
                  </div>
                ))}
              </div>
            </div>

            {/* 自訂休息 */}
            <div style={card}>
              <div style={sTitle}>🍽️ 自訂休息時段（可選）</div>
              <div style={sDesc}>喺已套用模板嘅日期內關閉休息時段，效果即時顯示喺時段格</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={breakFrom} onChange={e => setBreakFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}>
                  {ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ color: '#999', fontSize: 12 }}>至</span>
                <select value={breakTo} onChange={e => setBreakTo(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}>
                  {ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={applyBreakLocal} disabled={selDates.size === 0} style={{
                  padding: '8px 20px', borderRadius: 6, border: 'none',
                  background: selDates.size === 0 ? '#ddd' : '#e53935', color: '#fff',
                  cursor: selDates.size === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13, fontFamily: font, fontWeight: 500,
                }}>套用休息</button>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════ BLOCKED TAB ══════════════════════ */}
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
