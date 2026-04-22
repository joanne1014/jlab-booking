import { useState, useEffect, useCallback } from 'react';

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
const FRONT_TIMES = [
  '10:00','10:30','11:00','11:30','12:00','12:30',
  '13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00'
];
const ALL_TIMES = [];
for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30) ALL_TIMES.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);

const TEMPLATES = [
  { label: '全日班', from: '10:00', to: '19:00', icon: '☀️' },
  { label: '上午班', from: '10:00', to: '13:30', icon: '🌅' },
  { label: '下午班', from: '14:00', to: '19:00', icon: '🌇' },
  { label: '晚間班', from: '17:00', to: '20:00', icon: '🌙' },
  { label: '休息日', from: null, to: null, icon: '💤' },
];

/* ═══════════════════ STYLES ═══════════════════ */
const card = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 };
const sTitle = { fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 6 };
const sDesc = { fontSize: 13, color: '#999', marginBottom: 16 };
const font = "'Noto Serif TC', serif";

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

  /* ── Batch Calendar ── */
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selDates, setSelDates] = useState(new Set());

  /* ── Pending Changes（核心！）── */
  const [pending, setPending] = useState({}); // { '2026-04-10': Set(['10:00','10:30',...]) }
  const [expandedDate, setExpandedDate] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  /* ── Templates ── */
  const [templates, setTemplates] = useState(TEMPLATES.map(t => ({ ...t })));

  /* ── Break & Range ── */
  const [breakFrom, setBreakFrom] = useState('13:00');
  const [breakTo, setBreakTo] = useState('14:00');
  const [rangeFrom, setRangeFrom] = useState('10:00');
  const [rangeTo, setRangeTo] = useState('19:00');

  /* ── Micro Adjust ── */
  const [microYear, setMicroYear] = useState(new Date().getFullYear());
  const [microMonth, setMicroMonth] = useState(new Date().getMonth());
  const [microDate, setMicroDate] = useState(new Date().toISOString().split('T')[0]);
  const [microTimes, setMicroTimes] = useState(new Set());
  const [microStatus, setMicroStatus] = useState(null);
  const [microLoading, setMicroLoading] = useState(false);
  const [microDirty, setMicroDirty] = useState(false);

  /* ── Blocked ── */
  const [blocked, setBlocked] = useState([]);
  const [newBD, setNewBD] = useState('');
  const [newBR, setNewBR] = useState('');

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  const todayStr = new Date().toISOString().split('T')[0];
  const toDS = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const navBtn = { padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#5c4a3a', fontFamily: font };
  const ddStyle = { padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font, flex: 1, minWidth: 0 };

  /* ═══════════════════ CALENDAR HELPERS ═══════════════════ */
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

  const toggleDate = (day) => {
    if (!day) return;
    const ds = toDS(calYear, calMonth, day);
    setSelDates(prev => { const n = new Set(prev); n.has(ds) ? n.delete(ds) : n.add(ds); return n; });
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

  const calDays = getCalDays(calYear, calMonth);

  /* ═══════════════════ PENDING（本地預覽，未同步）═══════════════════ */

  const applyTemplateLocal = (tmpl) => {
    const dates = [...selDates];
    if (!dates.length) return alert('請先選擇日期！');
    const next = { ...pending };
    if (!tmpl.from) {
      dates.forEach(d => { next[d] = new Set(); });
    } else {
      const times = FRONT_TIMES.filter(t => t >= tmpl.from && t <= tmpl.to);
      dates.forEach(d => { next[d] = new Set(times); });
    }
    setPending(next);
    showToast(`✏️ 已預覽「${tmpl.label}」— 請確認後同步到前台`);
  };

  const applyBreakLocal = () => {
    const dates = [...selDates].filter(d => pending[d]);
    if (!dates.length) return alert('請先套用營業模板，再設定休息時段！');
    if (breakFrom >= breakTo) return alert('開始時間必須早於結束時間！');
    const next = { ...pending };
    const bTimes = FRONT_TIMES.filter(t => t >= breakFrom && t < breakTo);
    dates.forEach(d => {
      next[d] = new Set(next[d]);
      bTimes.forEach(t => next[d].delete(t));
    });
    setPending(next);
    showToast(`✏️ 已預覽休息 ${breakFrom}–${breakTo} — 請確認後同步`);
  };

  const applyRangeLocal = (activate) => {
    const dates = [...selDates];
    if (!dates.length) return alert('請先選擇日期！');
    if (rangeFrom >= rangeTo) return alert('開始必須早於結束！');
    const next = { ...pending };
    const rTimes = FRONT_TIMES.filter(t => t >= rangeFrom && t <= rangeTo);
    dates.forEach(d => {
      if (!next[d]) next[d] = new Set();
      else next[d] = new Set(next[d]);
      rTimes.forEach(t => activate ? next[d].add(t) : next[d].delete(t));
    });
    setPending(next);
    showToast(`✏️ 已預覽${activate ? '開放' : '關閉'} ${rangeFrom}–${rangeTo}`);
  };

  const togglePendingTime = (date, time) => {
    setPending(prev => {
      const next = { ...prev };
      next[date] = new Set(next[date]);
      next[date].has(time) ? next[date].delete(time) : next[date].add(time);
      return next;
    });
  };

  const removePendingDate = (date) => {
    setPending(prev => { const next = { ...prev }; delete next[date]; return next; });
  };

  const pendingCount = Object.keys(pending).length;

  /* ═══════════════════ SYNC TO DB ═══════════════════ */
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

      // 1. 清除舊資料
      await sbDel(`date_availability?available_date=in.(${dates.join(',')})`);
      await sbDel(`disabled_timeslots?slot_date=in.(${dates.join(',')})`);

      // 2. 寫入 date_availability
      const availRows = entries.map(([d, times]) => ({
        available_date: d,
        status: times.size > 0 ? 'available' : 'closed'
      }));
      await sbPost('date_availability', availRows);

      // 3. 寫入 disabled_timeslots（只為開放日期）
      const disRows = [];
      entries.forEach(([d, times]) => {
        if (times.size > 0) {
          FRONT_TIMES.forEach(t => {
            if (!times.has(t)) disRows.push({ slot_date: d, slot_time: t });
          });
        }
      });
      if (disRows.length > 0) {
        for (let i = 0; i < disRows.length; i += 500) {
          await sbPost('disabled_timeslots', disRows.slice(i, i + 500));
        }
      }

      setPending({});
      setSelDates(new Set());
      showToast(`✅ 成功同步 ${dates.length} 個日期到前台！`);

      // 如果微調中的日期被同步了，重新載入
      if (dates.includes(microDate)) fetchMicroData();
    } catch (e) {
      console.error(e);
      alert('同步失敗：' + e.message);
    }
    setBatchLoading(false);
  };

  /* ═══════════════════ MICRO ADJUST ═══════════════════ */
  const prevMicro = () => { if (microMonth === 0) { setMicroYear(y => y - 1); setMicroMonth(11); } else setMicroMonth(m => m - 1); };
  const nextMicro = () => { if (microMonth === 11) { setMicroYear(y => y + 1); setMicroMonth(0); } else setMicroMonth(m => m + 1); };
  const microCalDays = getCalDays(microYear, microMonth);
  const microDow = new Date(microDate + 'T00:00:00').getDay();

  const fetchMicroData = useCallback(async () => {
    setMicroLoading(true);
    try {
      const [dateData, disData] = await Promise.all([
        sbGet(`date_availability?available_date=eq.${microDate}`),
        sbGet(`disabled_timeslots?slot_date=eq.${microDate}`)
      ]);
      const info = dateData?.[0];
      setMicroStatus(info?.status || null);

      if (!info || info.status !== 'available') {
        setMicroTimes(new Set());
      } else {
        const disSet = new Set((disData || []).map(r => r.slot_time?.slice(0, 5)));
        setMicroTimes(new Set(FRONT_TIMES.filter(t => !disSet.has(t))));
      }
      setMicroDirty(false);
    } catch (e) { console.error(e); }
    setMicroLoading(false);
  }, [microDate]);

  useEffect(() => { if (auth) fetchMicroData(); }, [microDate, auth, fetchMicroData]);

  const toggleMicroTime = (time) => {
    setMicroTimes(prev => { const n = new Set(prev); n.has(time) ? n.delete(time) : n.add(time); return n; });
    setMicroDirty(true);
  };

  const saveMicro = async () => {
    if (!window.confirm(`確定儲存 ${microDate}（週${DAYS[microDow]}）嘅時段設定到前台？`)) return;
    setBatchLoading(true);
    try {
      const isOpen = microTimes.size > 0;
      await sbDel(`date_availability?available_date=eq.${microDate}`);
      await sbPost('date_availability', [{ available_date: microDate, status: isOpen ? 'available' : 'closed' }]);

      await sbDel(`disabled_timeslots?slot_date=eq.${microDate}`);
      if (isOpen) {
        const dis = FRONT_TIMES.filter(t => !microTimes.has(t)).map(t => ({ slot_date: microDate, slot_time: t }));
        if (dis.length > 0) await sbPost('disabled_timeslots', dis);
      }

      setMicroDirty(false);
      setMicroStatus(isOpen ? 'available' : 'closed');
      showToast(`✅ 已儲存 ${microDate} 到前台`);
    } catch (e) { console.error(e); alert('儲存失敗：' + e.message); }
    setBatchLoading(false);
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
  const updateTemplate = (i, f, v) => setTemplates(prev => prev.map((t, idx) => idx === i ? { ...t, [f]: v } : t));

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

      {/* ── Header ── */}
      <div style={{ background: '#fff', padding: '20px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, color: '#5c4a3a', margin: 0 }}>J.LAB 管理後台</h1>
          <p style={{ color: '#999', fontSize: 12, margin: '4px 0 0', letterSpacing: 1 }}>ADMIN DASHBOARD</p>
        </div>
        <button onClick={() => setAuth(false)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', color: '#666', fontFamily: font }}>登出</button>
      </div>

      {/* ── Tabs ── */}
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

      {/* ── Pending Sticky Bar ── */}
      {pendingCount > 0 && tab === 'timeslots' && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 100,
          background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', padding: '14px 30px',
          borderBottom: '2px solid #FFB74D',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        }}>
          <span style={{ color: '#E65100', fontSize: 14, fontWeight: 600 }}>
            ⏳ {pendingCount} 個日期待同步到前台
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setPending({}); showToast('已清除所有預覽'); }} style={{
              padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#666', fontFamily: font
            }}>取消全部</button>
            <button onClick={syncPending} style={{
              padding: '8px 24px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: font
            }}>✅ 確認同步到前台</button>
          </div>
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
            {/* ── 使用說明 ── */}
            <div style={{ ...card, background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
              <div style={{ fontSize: 14, color: '#2e7d32', lineHeight: 2 }}>
                💡 <b>使用流程（3 步）：</b><br />
                ① 喺月曆選擇日期 → ② 套用模板（本地預覽）→ ③ 按「<b>確認同步到前台</b>」按鈕<br />
                🔒 <b>預設所有日期都係關閉</b>，只有你明確開放嘅日期先會出現喺前台
              </div>
            </div>

            {/* ── 1. 批量月曆 ── */}
            <div style={card}>
              <div style={sTitle}>📅 Step 1：選擇日期</div>
              <div style={sDesc}>點日期逐日選，或點星期標題選該欄全部</div>

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
                    fontSize: 13, fontWeight: 600, fontFamily: font, transition: 'all 0.2s',
                  }}>{d}</button>
                ))}
                {calDays.map((day, i) => {
                  if (!day) return <div key={`e${i}`} />;
                  const ds = toDS(calYear, calMonth, day);
                  const sel = selDates.has(ds);
                  const isToday = ds === todayStr;
                  const hasPend = !!pending[ds];
                  return (
                    <button key={`d${i}`} onClick={() => toggleDate(day)} style={{
                      padding: '12px 4px', borderRadius: 8, cursor: 'pointer', position: 'relative',
                      border: isToday ? '2px solid #FF9800' : sel ? '2px solid #5c4a3a' : '2px solid transparent',
                      background: sel ? '#5c4a3a' : hasPend ? '#e8f5e9' : 'transparent',
                      color: sel ? '#fff' : isToday ? '#FF9800' : '#888',
                      fontSize: 14, fontWeight: isToday || sel ? 700 : 400, fontFamily: font, transition: 'all 0.15s',
                    }}>
                      {day}
                      {hasPend && !sel && <div style={{ position: 'absolute', top: 3, right: 3, width: 6, height: 6, background: '#4CAF50', borderRadius: '50%' }} />}
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
                <div style={{ marginTop: 14, padding: '12px 16px', background: '#f0ebe3', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, color: '#5c4a3a' }}>已選 <b>{selDates.size}</b> 日</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 6, lineHeight: 1.8 }}>
                    {[...selDates].sort().map(d => (
                      <span key={d} style={{ display: 'inline-block', padding: '2px 8px', margin: 2, background: '#e8e0d8', borderRadius: 4, fontSize: 11 }}>{d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── 2. 快速模板 ── */}
            <div style={card}>
              <div style={sTitle}>⚡ Step 2：套用營業模板</div>
              <div style={sDesc}>
                選擇模板設定營業時間（只影響已選日期，不會自動同步）
                {selDates.size === 0 && <span style={{ color: '#c00' }}> — 請先選擇日期</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
                {templates.map((t, i) => (
                  <div key={i} style={{ padding: 16, borderRadius: 10, border: '1px solid #e0d8cc', background: '#fff', opacity: selDates.size === 0 ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 22 }}>{t.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>{t.label}</span>
                    </div>
                    {t.from !== null ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
                        <select value={t.from} onChange={e => updateTemplate(i, 'from', e.target.value)} style={ddStyle}>
                          {ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                        <span style={{ color: '#999', fontSize: 12 }}>至</span>
                        <select value={t.to} onChange={e => updateTemplate(i, 'to', e.target.value)} style={ddStyle}>
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
                    }}>預覽效果 ({selDates.size} 日)</button>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 3. 休息時段（只保留自訂）── */}
            <div style={card}>
              <div style={sTitle}>🍽️ 自訂休息時段（可選）</div>
              <div style={sDesc}>
                喺已套用模板嘅日期內設定休息時段，指定範圍會被關閉
                {selDates.size === 0 && <span style={{ color: '#c00' }}> — 請先選擇日期</span>}
              </div>
              <div style={{ fontSize: 12, color: '#666', background: '#faf6f0', padding: '10px 14px', borderRadius: 8, marginBottom: 16, lineHeight: 1.8 }}>
                💡 先套用營業模板 → 再用呢度關閉休息時段。例：套用「全日班」→ 設定休息「13:00–14:00」
              </div>
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
                }}>預覽休息效果</button>
              </div>
            </div>

            {/* ── 4. 自訂範圍 ── */}
            <div style={card}>
              <div style={sTitle}>🎯 自訂時段範圍（可選）</div>
              <div style={sDesc}>批量開放或關閉指定範圍{selDates.size === 0 && <span style={{ color: '#c00' }}> — 請先選擇日期</span>}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#666' }}>從</span>
                <select value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: font }}>
                  {ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={{ fontSize: 13, color: '#666' }}>到</span>
                <select value={rangeTo} onChange={e => setRangeTo(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: font }}>
                  {ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={() => applyRangeLocal(true)} disabled={selDates.size === 0} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: selDates.size === 0 ? '#ccc' : '#4CAF50', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: font }}>預覽開放</button>
                <button onClick={() => applyRangeLocal(false)} disabled={selDates.size === 0} style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: selDates.size === 0 ? '#ccc' : '#f44336', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: font }}>預覽關閉</button>
              </div>
            </div>

            {/* ── 5. 待同步預覽（核心！）── */}
            {pendingCount > 0 && (
              <div style={{ ...card, border: '2px solid #FFB74D', background: '#FFFDE7' }}>
                <div style={{ ...sTitle, color: '#E65100' }}>⏳ Step 3：確認並同步（{pendingCount} 個日期）</div>
                <div style={sDesc}>以下係預覽效果，可以逐個時段微調。確認無誤後按底部按鈕同步到前台。</div>

                {Object.entries(pending).sort(([a], [b]) => a.localeCompare(b)).map(([date, times]) => {
                  const dow = new Date(date + 'T00:00:00').getDay();
                  const isExpanded = expandedDate === date;
                  return (
                    <div key={date} style={{ marginBottom: 8, borderRadius: 8, border: '1px solid #e0d8cc', background: '#fff', overflow: 'hidden' }}>
                      <div
                        onClick={() => setExpandedDate(isExpanded ? null : date)}
                        style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f9f6f3' : '#fff' }}
                      >
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>{date}</span>
                          <span style={{ fontSize: 12, color: '#888', marginLeft: 8 }}>週{DAYS[dow]}</span>
                          <span style={{ fontSize: 12, marginLeft: 12, color: times.size > 0 ? '#4CAF50' : '#f44336', fontWeight: 600 }}>
                            {times.size > 0 ? `${times.size} 個時段開放` : '🚫 全日關閉'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button onClick={(e) => { e.stopPropagation(); removePendingDate(date); }} style={{
                            padding: '4px 10px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 4, color: '#c62828', cursor: 'pointer', fontSize: 11, fontFamily: font
                          }}>移除</button>
                          <span style={{ color: '#999', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: 16, borderTop: '1px solid #f0ebe3' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6 }}>
                            {FRONT_TIMES.map(t => (
                              <button key={t} onClick={() => togglePendingTime(date, t)} style={{
                                padding: '10px 4px', borderRadius: 6,
                                border: `2px solid ${times.has(t) ? '#5c4a3a' : '#e0d8cc'}`,
                                background: times.has(t) ? '#5c4a3a' : '#faf6f0',
                                color: times.has(t) ? '#fff' : '#c0b8aa',
                                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font,
                              }}>{t}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button onClick={syncPending} style={{
                    flex: 1, padding: 16, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 10,
                    fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: font,
                    boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
                  }}>
                    ✅ 確認同步到前台（{pendingCount} 個日期）
                  </button>
                  <button onClick={() => setPending({})} style={{
                    padding: '16px 24px', background: '#f5f0eb', color: '#999', border: 'none', borderRadius: 10,
                    fontSize: 14, cursor: 'pointer', fontFamily: font,
                  }}>清除</button>
                </div>
              </div>
            )}

            {/* ── 6. 單日微調 ── */}
            <div style={card}>
              <div style={sTitle}>🔧 單日微調（已同步日期）</div>
              <div style={sDesc}>揀一個已同步嘅日期，逐個時段微調。修改後需按「儲存」。</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <button onClick={prevMicro} style={navBtn}>◀</button>
                <span style={{ fontSize: 17, fontWeight: 600, color: '#5c4a3a' }}>{microYear}年 {microMonth + 1}月</span>
                <button onClick={nextMicro} style={navBtn}>▶</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 20 }}>
                {DAYS.map((d, i) => (
                  <div key={`mh${i}`} style={{ padding: '8px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#5c4a3a' }}>{d}</div>
                ))}
                {microCalDays.map((day, i) => {
                  if (!day) return <div key={`me${i}`} />;
                  const ds = toDS(microYear, microMonth, day);
                  const sel = ds === microDate;
                  const isToday = ds === todayStr;
                  return (
                    <button key={`md${i}`} onClick={() => setMicroDate(ds)} style={{
                      padding: '10px 4px', borderRadius: 8, cursor: 'pointer',
                      border: isToday && !sel ? '2px solid #FF9800' : sel ? '2px solid #5c4a3a' : '2px solid transparent',
                      background: sel ? '#5c4a3a' : 'transparent', color: sel ? '#fff' : isToday ? '#FF9800' : '#888',
                      fontSize: 14, fontWeight: isToday || sel ? 700 : 400, fontFamily: font,
                    }}>{day}</button>
                  );
                })}
              </div>

              {/* 日期狀態 */}
              <div style={{ padding: '14px 16px', borderRadius: 8, marginBottom: 20, background: microStatus === 'available' ? '#e8f5e9' : '#FFF3E0', border: `1px solid ${microStatus === 'available' ? '#a5d6a7' : '#ffcc80'}` }}>
                <div style={{ fontSize: 14, color: '#5c4a3a', marginBottom: 4 }}>
                  📌 {microDate}（週{DAYS[microDow]}）
                </div>
                <div style={{ fontSize: 13, color: microStatus === 'available' ? '#2e7d32' : '#e65100' }}>
                  {microStatus === 'available' ? '✅ 此日期已開放，前台可見' : '⚠️ 此日期未開放，前台不會顯示'}
                </div>
                {pending[microDate] && (
                  <div style={{ fontSize: 12, color: '#c00', marginTop: 6 }}>⚠️ 此日期有待同步嘅批量變更</div>
                )}
              </div>

              {/* 時段開關 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0ebe3' }}>
                <span style={{ fontSize: 14, color: '#999' }}>{microTimes.size} / {FRONT_TIMES.length} 開放</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setMicroTimes(new Set(FRONT_TIMES)); setMicroDirty(true); }} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 13, fontFamily: font }}>全開</button>
                  <button onClick={() => { setMicroTimes(new Set()); setMicroDirty(true); }} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 13, fontFamily: font }}>全關</button>
                  <button onClick={fetchMicroData} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#f5f0eb', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font }}>🔄</button>
                </div>
              </div>

              {microLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                  {FRONT_TIMES.map(t => {
                    const isOn = microTimes.has(t);
                    return (
                      <button key={t} onClick={() => toggleMicroTime(t)} style={{
                        padding: '14px 8px', borderRadius: 8,
                        border: `2px solid ${isOn ? '#5c4a3a' : '#e0d8cc'}`,
                        background: isOn ? '#5c4a3a' : '#faf6f0',
                        color: isOn ? '#fff' : '#c0b8aa',
                        fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: font,
                      }}>{t}</button>
                    );
                  })}
                </div>
              )}

              {/* 儲存按鈕 */}
              {microDirty && (
                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <button onClick={saveMicro} style={{
                    flex: 1, padding: 14, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 8,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: font,
                    boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
                  }}>
                    ✅ 儲存 {microDate} 到前台
                  </button>
                  <button onClick={fetchMicroData} style={{
                    padding: '14px 20px', background: '#f5f0eb', color: '#999', border: 'none', borderRadius: 8,
                    fontSize: 14, cursor: 'pointer', fontFamily: font,
                  }}>取消</button>
                </div>
              )}
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
