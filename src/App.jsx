import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronUp, MessageCircle, Clock, Loader, AlertTriangle, RefreshCw } from 'lucide-react';

const SB='https://vqyfbwnkdpncwvdonbcz.supabase.co';
const SK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';
const H={apikey:SK,Authorization:`Bearer ${SK}`,'Content-Type':'application/json'};

const sbGet=async p=>{const r=await fetch(`${SB}/rest/v1/${p}`,{headers:H});if(!r.ok){const t=await r.text();throw new Error(`${r.status}: ${t}`);}return r.json();};
const sbPost=async(t,d)=>{const r=await fetch(`${SB}/import { useState, useEffect, useCallback } from 'react';

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

  /* ── Derived ── */
  const displayTimes = pending[activeDate] || dbTimes;
  const isInPending = !!pending[activeDate];
  const pendingCount = Object.keys(pending).length;
  const activeDow = activeDate ? new Date(activeDate + 'T00:00:00').getDay() : 0;

  /* ═══════════════════ LOAD DB FOR ACTIVE DATE ═══════════════════ */
  const loadActiveFromDB = useCallback(async (date) => {
    if (!date) return;
    setGridLoading(true);
    try {
      const [dateData, disData] = await Promise.all([
        sbGet(`date_availability?available_date=eq.${date}`),
        sbGet(`disabled_timeslots?slot_date=eq.${date}`)
      ]);
      const info = dateData?.[0];
      setDbStatus(info?.status || null);
      if (!info || info.status !== 'available') {
        setDbTimes(new Set());
      } else {
        const disSet = new Set((disData || []).map(r => r.slot_time?.slice(0, 5)));
        setDbTimes(new Set(FRONT_TIMES.filter(t => !disSet.has(t))));
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
      next[activeDate] = on ? new Set(FRONT_TIMES) : new Set();
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
      const times = FRONT_TIMES.filter(t => t >= tmpl.from && t <= tmpl.to);
      dates.forEach(d => { next[d] = new Set(times); });
    }
    setPending(next);
    showToast(`✏️ 已套用「${tmpl.label}」到 ${dates.length} 個日期（查看右邊時段格）`);
  };

  /* ═══════════════════ BREAK ═══════════════════ */
  const applyBreakLocal = () => {
    const dates = [...selDates].filter(d => pending[d] && pending[d].size > 0);
    if (!dates.length) return alert('請先套用營業模板，再設定休息時段！');
    if (breakFrom >= breakTo) return alert('開始時間必須早於結束時間！');
    const next = { ...pending };
    const bTimes = FRONT_TIMES.filter(t => t >= breakFrom && t < breakTo);
    dates.forEach(d => {
      next[d] = new Set(next[d]);
      bTimes.forEach(t => next[d].delete(t));
    });
    setPending(next);
    showToast(`🍽️ 已關閉 ${breakFrom}–${breakTo} 休息時段（${dates.length} 個日期）`);
  };

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
      await sbDel(`date_availability?available_date=in.(${dates.join(',')})`);
      await sbDel(`disabled_timeslots?slot_date=in.(${dates.join(',')})`);

      const availRows = entries.map(([d, times]) => ({
        available_date: d,
        status: times.size > 0 ? 'available' : 'closed'
      }));
      await sbPost('date_availability', availRows);

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

      {/* ══════════ 唯一嘅同步按鈕 — Sticky Bar ══════════ */}
      {pendingCount > 0 && tab === 'timeslots' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', borderBottom: '2px solid #FFB74D' }}>
          <div style={{ padding: '14px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#E65100', fontSize: 14, fontWeight: 600 }}>
                ⏳ {pendingCount} 個日期待同步
              </span>
              <button onClick={() => setShowPendingList(!showPendingList)} style={{
                padding: '4px 12px', background: 'transparent', border: '1px solid #FFB74D',
                borderRadius: 4, color: '#E65100', cursor: 'pointer', fontSize: 12, fontFamily: font
              }}>{showPendingList ? '收起 ▲' : '查看列表 ▼'}</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setPending({}); showToast('已清除所有待同步'); setShowPendingList(false); }} style={{
                padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#666', fontFamily: font
              }}>取消全部</button>
              <button onClick={syncPending} style={{
                padding: '8px 24px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: font,
                boxShadow: '0 2px 8px rgba(76,175,80,0.3)',
              }}>✅ 確認同步到前台</button>
            </div>
          </div>

          {/* 展開待同步列表 */}
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
                    <button onClick={() => removePendingDate(date)} style={{
                      padding: '3px 10px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 4, color: '#c62828', cursor: 'pointer', fontSize: 11, fontFamily: font
                    }}>移除</button>
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
            {/* 使用說明 */}
            <div style={{ ...card, background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
              <div style={{ fontSize: 14, color: '#2e7d32', lineHeight: 2 }}>
                💡 <b>使用流程：</b>喺月曆選日期 → 套用模板或逐個調時段 → 按頂部「<b>確認同步到前台</b>」<br />
                🔒 預設所有日期關閉，只有你開放嘅日期先會出現喺前台
              </div>
            </div>

            {/* ── 月曆 + 時段格（左右並排）── */}
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

              {/* 右：時段格 */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a' }}>
                      🕐 {activeDate}（週{DAYS[activeDow]}）
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setAllTimes(true)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 12, fontFamily: font }}>全開</button>
                    <button onClick={() => setAllTimes(false)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 12, fontFamily: font }}>全關</button>
                    <button onClick={() => loadActiveFromDB(activeDate)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#f5f0eb', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄</button>
                  </div>
                </div>

                {/* 狀態 Banner */}
                <div style={{
                  padding: '8px 12px', borderRadius: 6, marginBottom: 14, fontSize: 12,
                  background: isInPending ? '#FFF3E0' : dbStatus === 'available' ? '#e8f5e9' : '#f5f5f5',
                  color: isInPending ? '#E65100' : dbStatus === 'available' ? '#2e7d32' : '#999',
                  border: `1px solid ${isInPending ? '#FFB74D' : dbStatus === 'available' ? '#a5d6a7' : '#e0e0e0'}`,
                }}>
                  {isInPending
                    ? `⏳ 有未同步嘅變更 — ${displayTimes.size} 個時段開放`
                    : dbStatus === 'available'
                    ? `✅ 已同步 — ${displayTimes.size} 個時段開放`
                    : '🔒 未開放（前台不顯示）'
                  }
                </div>

                {/* 時段格 */}
                {gridLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {FRONT_TIMES.map(t => {
                      const isOn = displayTimes.has(t);
                      return (
                        <button key={t} onClick={() => toggleTime(t)} style={{
                          padding: '12px 4px', borderRadius: 6,
                          border: `2px solid ${isOn ? '#5c4a3a' : '#e0d8cc'}`,
                          background: isOn ? '#5c4a3a' : '#faf6f0',
                          color: isOn ? '#fff' : '#c0b8aa',
                          fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: font,
                          transition: 'all 0.15s',
                        }}>{t}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── 營業模板 ── */}
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

            {/* ── 自訂休息 ── */}
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
}rest/v1/${t}`,{method:'POST',headers:{...H,Prefer:'return=representation'},body:JSON.stringify(d)});if(!r.ok){const t2=await r.text();throw new Error(`${r.status}: ${t2}`);}return r.json();};

const P='#b0a08a',PD='#90806a',PL='#c8b8a0',PBG='#eae0d0',BTN='#8a7c68';
const BG='#f4ede4',CD='#faf6f0',CB='#d8ccba',DV='#dcd4c8',IB='#f0e8dc';
const TX='#3a3430',TM='#6e6050',TL='#a09484',TLL='#c0b8aa';
const DV_BG='#e6e2dc',DV_BD='#c8c2b8',DV_TX='#74706a';
const DA_BG='#ece4d0',DA_BD='#ccc0a4',DA_TX='#7a7258';
const DR_BG='#e6d4cc',DR_BD='#c4aea4',DR_TX='#785a50';
const WDN=['日','一','二','三','四','五','六'];
const MEN=['','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const ALL_TIMES=['10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00'];

const parseD=s=>{const[y,m,d]=s.split('-').map(Number);const dt=new Date(y,m-1,d);return{day:d,mo:m,me:MEN[m],wd:dt.getDay()};};
const getDC=s=>{if(s==='limited')return{bg:DA_BG,bd:DA_BD,tx:DA_TX};if(s==='full')return{bg:DR_BG,bd:DR_BD,tx:DR_TX};return{bg:DV_BG,bd:DV_BD,tx:DV_TX};};
const crd=(vis=true)=>({background:CD,borderRadius:3,padding:'28px 22px',marginBottom:18,border:`1px solid ${CB}`,boxShadow:'0 2px 16px rgba(0,0,0,0.03)',opacity:vis?1:0.4,pointerEvents:vis?'auto':'none',transition:'opacity 0.3s'});

function SH({n,z,e,fp,fc}){return(<div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}><div style={{width:3,height:20,background:P,borderRadius:1}}/><span style={{fontWeight:500,fontSize:'0.92rem'}}><span style={{fontFamily:fp}}>{n}.</span> {z}</span><span style={{fontFamily:fc,fontSize:'0.58rem',letterSpacing:'0.12em',color:TL,fontStyle:'italic'}}>{e}</span></div>);}

export default function App(){
  const ff="'Noto Serif TC',serif",fp="'Playfair Display',serif",fc="'Cormorant Garamond',serif";
  const [services,setSvcs]=useState([]);
  const [variants,setVars]=useState([]);
  const [addonsList,setAddons]=useState([]);
  const [techList,setTechs]=useState([]);
  const [dateList,setDates]=useState([]);
  const [disabledTimes,setDisabledTimes]=useState(new Set());
  const [dateBookings,setDateBookings]=useState([]);
  const [loading,setLoading]=useState(true);
  const [loadErr,setLoadErr]=useState(null);
  const [slotsLoading,setSlotsLoading]=useState(false);
  const [sid,setSid]=useState(null);
  const [vi,setVi]=useState({});
  const [ao,setAo]=useState([]);
  const [selDate,setSelDate]=useState(null);
  const [tm,setTm]=useState(null);
  const [nm,setNm]=useState('');
  const [ph,setPh]=useState('');
  const [rk,setRk]=useState('');
  const [tid,setTid]=useState(null);
  const [step,setStep]=useState(1);
  const [done,setDone]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [submitErr,setSubmitErr]=useState(null);
  const [techConflict,setTechConflict]=useState(false);
  const r2=useRef(null),r3=useRef(null),r4=useRef(null),r5=useRef(null),r6=useRef(null),rS=useRef(null);
  const refs={2:r2,3:r3,4:r4,5:r5,6:r6,7:rS};
  const scrollTo=n=>setTimeout(()=>refs[n]?.current?.scrollIntoView({behavior:'smooth',block:'start'}),280);

  useEffect(()=>{if(!document.getElementById('p3f')){const l=document.createElement('link');l.id='p3f';l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+TC:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap';document.head.appendChild(l);}},[]);

  /* ═══════════════════════════════════════════════════════
     🔧 修正 1：載入可用日期
     - 改用 status=eq.available（只顯示明確開放嘅日期）
     - 加入 blocked_dates 過濾
     ═══════════════════════════════════════════════════════ */
  const loadAll=useCallback(async()=>{
    setLoading(true);setLoadErr(null);
    try{
      const today=new Date().toISOString().split('T')[0];
      const [svcs,vars,adds,techs,dts,blocked]=await Promise.all([
        sbGet('services?is_active=eq.true&order=sort_order'),
        sbGet('service_variants?order=service_id,sort_order'),
        sbGet('addons?is_active=eq.true&order=sort_order'),
        sbGet('technicians?is_active=eq.true&order=sort_order'),
        sbGet(`date_availability?available_date=gte.${today}&status=eq.available&order=available_date`),
        sbGet(`blocked_dates?date=gte.${today}`),
      ]);
      setSvcs(svcs);setVars(vars);setAddons(adds);setTechs(techs);

      // 過濾掉封鎖日期
      const blockedSet=new Set((blocked||[]).map(b=>b.date));
      const availDates=(dts||[]).filter(d=>!blockedSet.has(d.available_date));

      setDates(availDates.map(d=>({...d,...parseD(d.available_date)})));
      if(techs.length>0)setTid(techs[techs.length-1].id);
    }catch(e){setLoadErr(e.message);}
    setLoading(false);
  },[]);

  useEffect(()=>{loadAll();},[loadAll]);

  /* ═══════════════════════════════════════════════════════
     🔧 修正 2：載入時段
     - slot_time 加 .slice(0,5) 統一格式
       DB 返回 '10:00:00'，前台用 '10:00'
       唔 slice 就永遠 match 唔到 → 呢個係同步失敗嘅根本原因
     ═══════════════════════════════════════════════════════ */
  useEffect(()=>{
    if(!selDate){setDisabledTimes(new Set());setDateBookings([]);return;}
    let c=false;
    const fetchSlots=async(showLoading)=>{
      if(showLoading)setSlotsLoading(true);
      try{
        const [dis,bks]=await Promise.all([
          sbGet(`disabled_timeslots?slot_date=eq.${selDate}`),
          sbGet(`bookings?select=booking_time,technician_id&booking_date=eq.${selDate}&status=neq.cancelled`)
        ]);
        if(!c){
          // ✅ 關鍵修正：.slice(0,5) 將 '10:00:00' 轉為 '10:00'
          setDisabledTimes(new Set((dis||[]).map(s=>(s.slot_time||'').slice(0,5))));
          setDateBookings((bks||[]).map(b=>({...b,booking_time:(b.booking_time||'').slice(0,5)})));
        }
      }catch(e){
        if(!c){setDisabledTimes(new Set());setDateBookings([]);}
      }
      if(!c&&showLoading)setSlotsLoading(false);
    };
    fetchSlots(true);
    const interval=setInterval(()=>fetchSlots(false),30000);
    const onFocus=()=>fetchSlots(false);
    window.addEventListener('focus',onFocus);
    return()=>{c=true;clearInterval(interval);window.removeEventListener('focus',onFocus);};
  },[selDate]);

  const randomTechId=useMemo(()=>{
    const rt=techList.find(t=>t.label.includes('隨機'));
    return rt?rt.id:null;
  },[techList]);

  const maxPerSlot=useMemo(()=>{
    const real=techList.filter(t=>!t.label.includes('隨機'));
    return Math.max(real.length,1);
  },[techList]);

  const slots=useMemo(()=>{
    return ALL_TIMES.map(t=>{
      if(disabledTimes.has(t))return{slot_time:t,is_available:false,booked:false};
      const bks=dateBookings.filter(b=>b.booking_time===t);
      if(bks.length>=maxPerSlot)return{slot_time:t,is_available:false,booked:true};
      if(tid&&tid!==randomTechId){
        if(bks.some(b=>b.technician_id===tid))return{slot_time:t,is_available:false,booked:true};
      }
      return{slot_time:t,is_available:true,booked:false};
    });
  },[disabledTimes,dateBookings,tid,randomTechId,maxPerSlot]);

  useEffect(()=>{
    if(!tm||!selDate)return;
    const slot=slots.find(s=>s.slot_time===tm);
    if(slot&&!slot.is_available){
      setTm(null);
      setTechConflict(true);
      setTimeout(()=>setTechConflict(false),3500);
      scrollTo(5);
    }
  },[slots,tm,selDate]);

  const sv=services.find(s=>s.id===sid);
  const svcVars=variants.filter(v=>v.service_id===sid);
  const hasV=svcVars.length>0;
  const sp=sv?(hasV?(svcVars[vi[sid]||0]?.price||0):sv.price):0;
  const selAddons=addonsList.filter(a=>ao.includes(a.id));
  const ap=selAddons.reduce((s,a)=>s+a.price,0);
  const tc=techList.find(t=>t.id===tid);
  const tp=tc?.surcharge||0;
  const total=sp+ap+tp;
  const ad=dateList.find(d=>d.available_date===selDate);
  const canGo=sid!==null&&selDate!==null&&tm&&nm.trim()&&ph.trim()&&tid!==null;
  const amSlots=slots.filter(s=>{const h=parseInt(s.slot_time);return h<13;});
  const pmSlots=slots.filter(s=>{const h=parseInt(s.slot_time);return h>=13&&h<17;});
  const evSlots=slots.filter(s=>{const h=parseInt(s.slot_time);return h>=17;});
  const tao=id=>setAo(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const pick=id=>{setSid(id);setSelDate(null);setTm(null);setDisabledTimes(new Set());setDateBookings([]);if(step<2)setStep(2);scrollTo(2);};
  const pickDate=ds=>{setSelDate(ds);setTm(null);if(step<3)setStep(3);scrollTo(5);};
  const pickTime=t=>{setTm(t);if(step<4)setStep(4);scrollTo(6);};

  const submitBooking=async()=>{
    if(!canGo||submitting)return;
    setSubmitting(true);setSubmitErr(null);
    try{
      await sbPost('bookings',{service_id:sv.id,service_name:sv.name,variant_label:hasV?(svcVars[vi[sid]||0]?.label||''):'',variant_price:sp,addon_ids:selAddons.map(a=>String(a.id)),addon_names:selAddons.map(a=>a.name_zh),addon_total:ap,booking_date:selDate,booking_time:tm,technician_id:tc.id,technician_label:tc.label,technician_surcharge:tp,customer_name:nm.trim(),customer_phone:ph.trim(),remarks:rk.trim(),total_price:total});
      setDone(true);
    }catch(e){setSubmitErr(e.message);}
    setSubmitting(false);
  };

  const renderTG=(label,arr)=>{
    if(!arr.length)return null;
    return(<div style={{marginBottom:16}}>
      <div style={{fontSize:'0.52rem',color:TL,letterSpacing:'0.1em',marginBottom:8,fontWeight:400}}>{label}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>
        {arr.map(s=>{const sel=tm===s.slot_time;const dis=!s.is_available;return(
          <motion.div key={s.slot_time} whileTap={dis?{}:{scale:0.96}} onClick={()=>{if(!dis)pickTime(s.slot_time);}}
            style={{textAlign:'center',padding:s.booked?'9px 6px':'13px 6px',borderRadius:3,fontFamily:fc,fontSize:'0.88rem',letterSpacing:'0.06em',fontWeight:sel?500:400,border:`1px solid ${sel?PD:dis&&s.booked?DR_BD:CB}`,cursor:dis?'not-allowed':'pointer',background:sel?P:dis&&s.booked?'#f5ece8':dis?'#ebe4da':'#fff',color:sel?'#fff':dis?TLL:TX,opacity:dis?0.35:1,textDecoration:dis?'line-through':'none',transition:'all 0.2s'}}>
            {s.slot_time}
            {dis&&s.booked&&<div style={{fontSize:'0.34rem',color:DR_TX,marginTop:1,textDecoration:'none',opacity:1}}>已約滿</div>}
          </motion.div>);})}
      </div></div>);};

  if(loading)return(
    <div style={{background:BG,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:ff}}>
      <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1.5,ease:'linear'}}><Loader size={28} color={P} strokeWidth={1.5}/></motion.div>
      <div style={{marginTop:16,fontSize:'0.72rem',color:TL,fontWeight:300}}>正在載入預約系統...</div>
    </div>);

  if(loadErr)return(
    <div style={{background:BG,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:ff,color:TX,padding:30,textAlign:'center'}}>
      <div style={{background:CD,borderRadius:4,padding:'36px 28px',maxWidth:420,width:'100%',border:`1px solid ${CB}`}}>
        <div style={{fontFamily:fp,fontSize:'1.2rem',fontWeight:500,color:TM,fontStyle:'italic',marginBottom:20}}>J.LAB</div>
        <AlertTriangle size={36} color={DA_TX} strokeWidth={1.5} style={{marginBottom:16}}/>
        <div style={{fontSize:'0.92rem',fontWeight:500,marginBottom:12}}>無法載入預約系統</div>
        <div style={{fontSize:'0.44rem',color:DR_TX,background:DR_BG,padding:'12px',borderRadius:3,border:`1px solid ${DR_BD}`,wordBreak:'break-all',textAlign:'left',marginBottom:20,maxHeight:120,overflow:'auto',lineHeight:1.6}}>{loadErr}</div>
        <button onClick={loadAll} style={{padding:'12px 28px',borderRadius:3,border:'none',background:BTN,color:'#fff',fontFamily:ff,fontSize:'0.72rem',cursor:'pointer',fontWeight:400,display:'flex',alignItems:'center',gap:8,margin:'0 auto'}}><RefreshCw size={14} strokeWidth={1.5}/>重新載入</button>
      </div>
    </div>);

  return(
    <div style={{background:BG,minHeight:'100vh',fontFamily:ff,color:TX,maxWidth:480,margin:'0 auto',position:'relative',fontWeight:300}}>
      <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 22px',position:'sticky',top:0,background:BG,zIndex:10,borderBottom:`1px solid ${DV}`}}>
        <div style={{fontFamily:fp,fontSize:'1.1rem',fontWeight:500,color:TM,letterSpacing:'0.04em',fontStyle:'italic'}}>J.LAB</div>
        <div style={{fontFamily:fc,fontSize:'0.52rem',color:TL,fontStyle:'italic',letterSpacing:'0.1em'}}>LASH & BEAUTY</div>
      </header>

      <div style={{padding:'0 16px 60px'}}>
        <div style={{textAlign:'center',padding:'36px 0 28px'}}>
          <div style={{fontFamily:fc,fontSize:'0.58rem',letterSpacing:'0.3em',color:P,fontWeight:400}}>BOOKING</div>
          <div style={{fontSize:'1.3rem',fontWeight:500,margin:'10px 0 6px',letterSpacing:'0.08em'}}>線上預約系統</div>
          <div style={{fontFamily:fc,fontSize:'0.56rem',letterSpacing:'0.22em',color:TL,fontStyle:'italic'}}>ONLINE BOOKING SYSTEM</div>
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:28,padding:'0 10px'}}>
          {[1,2,3,4,5,6].map((n,i)=>{const a=n<=5?step>=n:canGo;const dn=n<=5?step>n:canGo;return(<React.Fragment key={n}>
            <div style={{width:22,height:22,borderRadius:'50%',background:a?P:'transparent',border:`1.5px solid ${a?P:CB}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.48rem',fontFamily:fp,fontWeight:500,color:a?'#fff':TLL,transition:'all 0.3s'}}>{dn?<Check size={10} strokeWidth={3}/>:n}</div>
            {i<5&&<div style={{flex:1,height:1,background:n<5?(step>n?PL:DV):(canGo?PL:DV),transition:'all 0.3s'}}/>}
          </React.Fragment>);})}</div>

        {/* STEP 1: SERVICE */}
        <div style={crd()}>
          <SH n="1" z="選擇預約項目" e="SELECT SERVICE" fp={fp} fc={fc}/>
          {services.map(s=>{const sel=sid===s.id;const sv_=variants.filter(v=>v.service_id===s.id);const hv=sv_.length>0;return(
            <div key={s.id} onClick={()=>pick(s.id)} style={{border:`1px solid ${sel?P:s.tag?PL:CB}`,borderRadius:3,padding:'18px 16px',marginBottom:12,cursor:'pointer',position:'relative',overflow:'hidden',background:sel?PBG:'#fff',transition:'all 0.25s'}}>
              {s.tag&&<div style={{position:'absolute',top:0,right:0,background:s.sort_order===1?'#c4886c':P,color:'#fff',fontSize:'0.42rem',padding:'3px 10px',letterSpacing:'0.08em',fontWeight:400,borderRadius:'0 2px 0 3px'}}>{s.tag}</div>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,paddingRight:s.tag?50:0}}>
                <div style={{fontWeight:500,fontSize:'0.8rem',lineHeight:1.5,flex:1}}>{s.name}</div>
                <div style={{fontFamily:fp,fontWeight:500,color:TM,fontSize:'0.88rem',flexShrink:0}}>{s.price_label||(hv?`$${sv_[0].price}`:`$${s.price}`)}</div>
              </div>
              <div style={{fontSize:'0.66rem',color:TM,margin:'8px 0 4px',lineHeight:1.7,fontWeight:300}}>{s.description_zh}</div>
              <div style={{fontFamily:fc,fontSize:'0.62rem',color:TL,lineHeight:1.6,fontStyle:'italic'}}>{s.description_en}</div>
              {(s.duration_zh || s.duration) ? (
                <div style={{display:'flex',alignItems:'center',gap:5,marginTop:10}}>
                  <Clock size={11} color={TL} strokeWidth={1.5}/>
                  <span style={{fontSize:'0.56rem',color:TL,fontWeight:300}}>
                    {s.duration_zh || `約 ${s.duration} 分鐘`}
                  </span>
                </div>
              ) : null}
              {hv&&sel&&(<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:14}}>
                {sv_.map((v,idx)=>{const vs=(vi[s.id]||0)===idx;return(
                  <button key={v.id} onClick={e=>{e.stopPropagation();setVi(p=>({...p,[s.id]:idx}));}}
                    style={{padding:'8px 18px',borderRadius:2,fontSize:'0.62rem',fontFamily:ff,fontWeight:vs?500:300,border:`1px solid ${vs?PD:CB}`,background:vs?P:'#fff',color:vs?'#fff':TX,cursor:'pointer',transition:'all 0.2s'}}>{v.label}</button>);})}
              </div>)}
            </div>);})}
        </div>

        {/* STEP 2: ADD-ONS */}
        <div ref={r2} style={crd(step>=2)}>
          <SH n="2" z="可選加購項目" e="ADD-ONS" fp={fp} fc={fc}/>
          <div style={{fontSize:'0.6rem',color:TL,marginBottom:16,fontWeight:300}}>非必選項目，可根據需要加選。</div>
          {addonsList.map(a=>{const on=ao.includes(a.id);return(
            <div key={a.id} onClick={()=>tao(a.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'14px',border:`1px solid ${on?PL:CB}`,borderRadius:3,marginBottom:10,cursor:'pointer',background:on?PBG:'#fff',transition:'all 0.2s'}}>
              <div style={{width:20,height:20,borderRadius:'50%',border:`1.5px solid ${on?P:CB}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:on?P:'transparent',transition:'all 0.2s'}}>{on&&<Check size={11} color="#fff" strokeWidth={2.5}/>}</div>
              <div style={{flex:1}}><div style={{fontSize:'0.72rem',fontWeight:on?500:300}}>{a.name_zh}</div><div style={{fontFamily:fc,fontSize:'0.58rem',fontStyle:'italic',color:TL}}>{a.name_en}</div></div>
              <div style={{fontFamily:fp,fontWeight:500,color:TM,fontSize:'0.72rem'}}>+${a.price}</div>
            </div>);})}
        </div>

        {/* STEP 3: TECHNICIAN */}
        <div ref={r3} style={crd(step>=2)}>
          <SH n="3" z="指定技師" e="TECHNICIAN" fp={fp} fc={fc}/>
          <div style={{fontSize:'0.56rem',color:TL,marginBottom:14,fontWeight:300,lineHeight:1.7}}>
            選擇技師後，系統會根據該技師的預約情況顯示可用時段。
          </div>
          {techList.map(t=>{const sel=tid===t.id;return(
            <motion.div key={t.id} whileTap={{scale:0.98}} onClick={()=>{setTid(t.id);if(!selDate)scrollTo(4);}}
              style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 18px',borderRadius:3,marginBottom:8,cursor:'pointer',background:sel?P:'#fff',border:`1px solid ${sel?PD:CB}`,transition:'all 0.25s'}}>
              <div><div style={{fontSize:'0.76rem',fontWeight:sel?500:300,color:sel?'#fff':TX}}>{t.label}</div><div style={{fontFamily:fc,fontSize:'0.58rem',fontStyle:'italic',color:sel?'rgba(255,255,255,0.7)':TL,marginTop:2}}>{t.label_en}</div></div>
              <div style={{fontFamily:fp,fontWeight:500,color:sel?'#fff':TM,fontSize:'0.76rem'}}>{t.surcharge?`+$${t.surcharge}`:'免費'}</div>
            </motion.div>);})}
        </div>

        {/* STEP 4: DATE */}
        <div ref={r4} style={crd(step>=2)}>
          <SH n="4" z="選擇日期" e="SELECT DATE" fp={fp} fc={fc}/>
          {dateList.length===0?(<div style={{textAlign:'center',padding:20,fontSize:'0.68rem',color:TL}}>暫無可預約日期，請稍後再試</div>):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7}}>
              {dateList.map(d=>{const sel=selDate===d.available_date;const full=d.status==='full';const c=getDC(d.status);return(
                <motion.div key={d.available_date} whileTap={full?{}:{scale:0.94}} onClick={()=>{if(!full)pickDate(d.available_date);}}
                  style={{textAlign:'center',padding:'9px 4px',borderRadius:3,cursor:full?'not-allowed':'pointer',background:sel?P:c.bg,border:`1px solid ${sel?PD:c.bd}`,opacity:full?0.25:1,transition:'all 0.2s'}}>
                  <div style={{fontSize:'0.42rem',color:sel?'rgba(255,255,255,0.65)':c.tx}}>{d.mo}月</div>
                  <div style={{fontFamily:fp,fontSize:'1.05rem',fontWeight:500,color:sel?'#fff':TX,lineHeight:1.4}}>{d.day}</div>
                  <div style={{fontSize:'0.38rem',color:sel?'rgba(255,255,255,0.65)':c.tx}}>週{WDN[d.wd]}</div>
                </motion.div>);})}
            </div>)}
          <div style={{display:'flex',gap:14,marginTop:14,justifyContent:'center'}}>
            {[['充裕',DV_BG,DV_BD],['少量',DA_BG,DA_BD],['已滿',DR_BG,DR_BD]].map(([l,bg,bd])=>(
              <span key={l} style={{fontSize:'0.42rem',color:TL,display:'flex',alignItems:'center',gap:4}}><span style={{width:10,height:10,borderRadius:2,background:bg,border:`1px solid ${bd}`,display:'inline-block'}}/>{l}</span>))}
          </div>
        </div>

        {/* STEP 5: TIME */}
        <div ref={r5} style={crd(step>=3)}>
          <SH n="5" z="選擇時段" e="SELECT TIME" fp={fp} fc={fc}/>
          <AnimatePresence>
            {techConflict&&(
              <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                style={{background:DA_BG,border:`1px solid ${DA_BD}`,color:DA_TX,padding:'10px 14px',borderRadius:3,fontSize:'0.6rem',marginBottom:14,lineHeight:1.6,overflow:'hidden'}}>
                ⚠️ 所選時段已被此技師預約，請重新選擇時段
              </motion.div>
            )}
          </AnimatePresence>
          {tc&&selDate&&(
            <div style={{fontSize:'0.52rem',color:TL,marginBottom:14,fontWeight:300,background:IB,padding:'8px 12px',borderRadius:3,border:`1px solid ${DV}`}}>
              顯示「<span style={{color:TX,fontWeight:500}}>{tc.label}</span>」於 <span style={{fontFamily:fp,fontWeight:500,color:TX}}>{selDate}</span> 的可預約時段
            </div>
          )}
          {slotsLoading?(<div style={{textAlign:'center',padding:'24px 0'}}><motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}} style={{display:'inline-block'}}><Loader size={20} color={P} strokeWidth={1.5}/></motion.div></div>):(<>
            {renderTG('上午 MORNING',amSlots)}
            {renderTG('下午 AFTERNOON',pmSlots)}
            {renderTG('晚間 EVENING',evSlots)}
          </>)}
        </div>

        {/* STEP 6: CONTACT */}
        <div ref={r6} style={crd(step>=4)}>
          <SH n="6" z="聯絡資料" e="CONTACT" fp={fp} fc={fc}/>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,fontWeight:300}}>您的姓名 <span style={{color:DR_TX}}>*</span></div>
            <input value={nm} onChange={e=>setNm(e.target.value)} placeholder="e.g. Miss Chan" style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,background:IB,fontSize:'0.76rem',fontFamily:ff,fontWeight:300,outline:'none',boxSizing:'border-box',color:TX}}/>
          </div>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,fontWeight:300}}>WhatsApp 電話 <span style={{color:DR_TX}}>*</span></div>
            <input value={ph} onChange={e=>setPh(e.target.value)} placeholder="e.g. 6000 0000" type="tel" style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,background:IB,fontSize:'0.76rem',fontFamily:ff,fontWeight:300,outline:'none',boxSizing:'border-box',color:TX}}/>
          </div>
          <div style={{marginBottom:4}}>
            <div style={{fontSize:'0.6rem',color:TL,marginBottom:8,fontWeight:300}}>備註（選填）</div>
            <textarea value={rk} onChange={e=>setRk(e.target.value)} placeholder="如有特別需要..." rows={3} style={{width:'100%',padding:'13px 16px',borderRadius:3,border:`1px solid ${CB}`,background:IB,fontSize:'0.72rem',fontFamily:ff,fontWeight:300,outline:'none',boxSizing:'border-box',color:TX,resize:'vertical',lineHeight:1.6}}/>
          </div>
          {nm.trim()&&ph.trim()&&step<5&&(
            <motion.button whileTap={{scale:0.97}} onClick={()=>{if(step<5)setStep(5);scrollTo(7);}}
              style={{width:'100%',padding:'14px',marginTop:14,borderRadius:3,border:'none',background:BTN,color:'#fff',fontFamily:ff,fontSize:'0.72rem',cursor:'pointer',fontWeight:400}}>下一步 →</motion.button>)}
        </div>

        {/* SUMMARY */}
        <div ref={rS} style={crd(step>=4)}>
          <div style={{textAlign:'center',marginBottom:22}}>
            <div style={{fontFamily:fc,fontSize:'0.54rem',letterSpacing:'0.24em',color:P}}>ORDER SUMMARY</div>
            <div style={{fontSize:'1.05rem',fontWeight:500,marginTop:6}}>預約摘要</div>
          </div>
          <div style={{background:IB,borderRadius:3,padding:'18px 16px',border:`1px solid ${DV}`,marginBottom:18}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
              <div><div style={{fontSize:'0.56rem',color:TL,marginBottom:4}}>服務項目</div><div style={{fontSize:'0.72rem',fontWeight:500}}>{sv?sv.name:'尚未選擇'}</div>{hasV&&<div style={{fontSize:'0.58rem',color:TM,marginTop:2}}>{svcVars[vi[sid]||0]?.label}</div>}</div>
              <div style={{fontFamily:fp,fontWeight:500,fontSize:'0.82rem'}}>{sv?`$${sp}`:'—'}</div>
            </div>
            {selAddons.length>0&&(<div style={{borderTop:`1px solid ${DV}`,paddingTop:12,marginBottom:12}}>
              <div style={{fontSize:'0.56rem',color:TL,marginBottom:8}}>加購項目</div>
              {selAddons.map(a=>(<div key={a.id} style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:6}}><span>{a.name_zh}</span><span style={{fontFamily:fp,fontWeight:500}}>+${a.price}</span></div>))}</div>)}
            <div style={{borderTop:`1px solid ${DV}`,paddingTop:12,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:8}}><span style={{color:TL}}>技師</span><span>{tc?.label} {tp?`+$${tp}`:'免費'}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:8}}><span style={{color:TL}}>日期</span><span style={{fontFamily:fp,fontWeight:500}}>{ad?`${ad.available_date}（週${WDN[ad.wd]}）`:'—'}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem'}}><span style={{color:TL}}>時段</span><span style={{fontFamily:fp,fontWeight:500}}>{tm||'—'}</span></div>
            </div>
            <div style={{borderTop:`1px solid ${DV}`,paddingTop:12}}>
              <div style={{fontSize:'0.56rem',color:TL,marginBottom:8}}>聯絡資料</div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginBottom:6}}><span style={{color:TL}}>姓名</span><span>{nm||'—'}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem'}}><span style={{color:TL}}>電話</span><span>{ph||'—'}</span></div>
              {rk&&<div style={{display:'flex',justifyContent:'space-between',fontSize:'0.68rem',marginTop:6}}><span style={{color:TL}}>備註</span><span style={{maxWidth:'60%',textAlign:'right',fontSize:'0.64rem'}}>{rk}</span></div>}
            </div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',padding:'16px 0 6px',borderTop:`1.5px solid ${P}`}}>
            <div><div style={{fontSize:'1.05rem',fontWeight:500}}>預計總額</div><div style={{fontFamily:fc,fontSize:'0.52rem',color:TL,marginTop:3,fontStyle:'italic'}}>ESTIMATED TOTAL</div></div>
            <div style={{fontFamily:fp,fontSize:'1.7rem',fontWeight:500}}>${total}</div>
          </div>
        </div>

        {submitErr&&<div style={{textAlign:'center',fontSize:'0.54rem',color:DR_TX,marginBottom:14,background:DR_BG,padding:'10px 14px',borderRadius:3,border:`1px solid ${DR_BD}`,wordBreak:'break-all'}}>{submitErr}</div>}

        <motion.button whileTap={canGo&&!submitting?{scale:0.97}:{}} onClick={submitBooking}
          style={{width:'100%',padding:'20px',borderRadius:3,border:'none',background:canGo&&!submitting?BTN:DV,fontSize:'0.82rem',fontWeight:400,fontFamily:ff,cursor:canGo&&!submitting?'pointer':'not-allowed',color:canGo&&!submitting?'#fff':TLL,letterSpacing:'0.14em',marginBottom:10,lineHeight:2,display:'flex',flexDirection:'column',alignItems:'center'}}>
          {submitting?(<span style={{display:'flex',alignItems:'center',gap:8}}><motion.span animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}} style={{display:'inline-flex'}}><Loader size={16} strokeWidth={1.5}/></motion.span>提交中...</span>):(<>確認並發送預約<br/><span style={{fontFamily:fc,fontSize:'0.54rem',fontWeight:300,fontStyle:'italic',color:canGo?'rgba(255,255,255,0.7)':TLL}}>CONFIRM BOOKING</span></>)}
        </motion.button>
        <div style={{textAlign:'center',fontSize:'0.48rem',color:TLL,lineHeight:1.8,marginTop:8}}>提交後我們將透過 WhatsApp 與您確認預約</div>
      </div>

      <div style={{background:'#1a1814',padding:'28px 22px',textAlign:'center'}}>
        <div style={{fontFamily:fp,fontSize:'0.9rem',fontWeight:500,color:P,fontStyle:'italic'}}>J.LAB</div>
        <div style={{fontFamily:fc,fontSize:'0.5rem',letterSpacing:'0.2em',color:'#665e52',marginTop:8,fontStyle:'italic'}}>LASH & BEAUTY STUDIO</div>
        <a href="/admin" style={{display:'inline-block',marginTop:18,fontSize:'0.42rem',color:'#565248',textDecoration:'none',letterSpacing:'0.12em',fontFamily:fc,fontStyle:'italic',borderBottom:'1px solid #3a3632',paddingBottom:2,opacity:0.6,transition:'opacity 0.2s'}}
        onMouseEnter={e=>e.target.style.opacity='1'}
        onMouseLeave={e=>e.target.style.opacity='0.6'}
        >ADMIN</a>
      </div>

      <AnimatePresence>{done&&(
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{position:'fixed',inset:0,background:'rgba(26,24,20,0.6)',backdropFilter:'blur(6px)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setDone(false)}>
          <motion.div initial={{scale:0.92,y:16}} animate={{scale:1,y:0}} transition={{type:'spring',damping:24}} onClick={e=>e.stopPropagation()}
            style={{background:CD,borderRadius:4,padding:'32px 24px',maxWidth:360,width:'100%',textAlign:'center',border:`1px solid ${CB}`,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{width:50,height:50,borderRadius:'50%',background:P,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}><Check size={22} color="#fff" strokeWidth={2}/></div>
            <div style={{fontSize:'1.05rem',fontWeight:500,marginBottom:5}}>預約已送出！</div>
            <div style={{fontFamily:fc,fontSize:'0.66rem',color:TL,marginBottom:22,fontStyle:'italic'}}>Booking submitted successfully</div>
            <div style={{background:IB,borderRadius:3,padding:'16px',textAlign:'left',fontSize:'0.66rem',color:TM,lineHeight:2.2,marginBottom:22,border:`1px solid ${DV}`}}>
              <div><b>服務：</b>{sv?.name}</div>
              {hasV&&<div><b>類型：</b>{svcVars[vi[sid]||0]?.label}</div>}
              {selAddons.length>0&&<div><b>加購：</b>{selAddons.map(a=>a.name_zh).join('、')}</div>}
              <div><b>技師：</b>{tc?.label}</div>
              <div><b>日期：</b>{ad?.available_date}（週{WDN[ad?.wd||0]}）</div>
              <div><b>時段：</b>{tm}</div>
              <div><b>姓名：</b>{nm}</div>
              <div><b>電話：</b>{ph}</div>
              {rk&&<div><b>備註：</b>{rk}</div>}
              <div style={{borderTop:`1px solid ${DV}`,marginTop:6,paddingTop:6}}><b>總額：</b><span style={{fontFamily:fp,fontSize:'1rem',fontWeight:500}}>${total}</span></div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setDone(false)} style={{flex:1,padding:'12px',borderRadius:3,border:`1px solid ${CB}`,background:'#fff',fontSize:'0.68rem',fontFamily:ff,cursor:'pointer',color:TM}}>關閉</button>
              <button onClick={()=>{let m=`Hi J.Lab\n\n服務：${sv?.name}\n技師：${tc?.label}\n日期：${ad?.available_date}\n時段：${tm}\n姓名：${nm}\n電話：${ph}\n總額：$${total}\n\n請確認，謝謝！`;window.open(`https://wa.me/?text=${encodeURIComponent(m)}`,'_blank');}}
                style={{flex:1,padding:'12px',borderRadius:3,border:'none',background:BTN,fontSize:'0.68rem',fontFamily:ff,cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                <MessageCircle size={13} strokeWidth={1.5}/>WhatsApp</button>
            </div>
          </motion.div>
        </motion.div>)}</AnimatePresence>

      <motion.div whileTap={{scale:0.9}} onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
        style={{position:'fixed',bottom:24,right:20,width:38,height:38,borderRadius:'50%',background:CD,border:`1px solid ${CB}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 2px 12px rgba(0,0,0,0.08)',zIndex:20}}>
        <ChevronUp size={16} color={TM} strokeWidth={1.5}/>
      </motion.div>
    </div>);
}
