import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const SB = 'https://vqyfbwnkdpncwvdonbcz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';
const H = { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

const sbGet = async (p) => { const r = await fetch(`${SB}/rest/v1/${p}`, { headers: H }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const sbPost = async (t, d) => { const r = await fetch(`${SB}/rest/v1/${t}`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const sbDel = async (p) => { const r = await fetch(`${SB}/rest/v1/${p}`, { method: 'DELETE', headers: H }); if (!r.ok) throw new Error(await r.text()); };
const sbPatch = async (p, d) => { const r = await fetch(`${SB}/rest/v1/${p}`, { method: 'PATCH', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify(d) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };

const PASS = 'jlab2024';
const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const ALL_TIMES = []; for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30) ALL_TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
const ALL_TIMES_15 = []; for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) ALL_TIMES_15.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
const TEMPLATES = [
  { label: '全日班', from: '10:00', to: '20:00', icon: '☀️' },
  { label: '上午班', from: '10:00', to: '14:00', icon: '🌅' },
  { label: '下午班', from: '14:00', to: '20:00', icon: '🌇' },
  { label: '晚間班', from: '17:00', to: '21:00', icon: '🌙' },
  { label: '休息日', from: null, to: null, icon: '💤' },
];
const INTERVAL_OPTIONS = [30, 45, 60, 90];
const card = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 };
const sTitle = { fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 6 };
const sDesc = { fontSize: 13, color: '#999', marginBottom: 16 };
const font = "'Noto Serif TC', serif";
const toTimeStr = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState('bookings');
  const [toast, setToast] = useState('');

  const [staffList, setStaffList] = useState([]);
  const [activeStaff, setActiveStaff] = useState(null);
  const [newStaffName, setNewStaffName] = useState('');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editStaffId, setEditStaffId] = useState(null);
  const [editStaffName, setEditStaffName] = useState('');

  const [allBookings, setAllBookings] = useState([]);
  const [bkLoading, setBkLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTech, setFilterTech] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  /* ═══ 日程表 states ═══ */
  const [viewMode, setViewMode] = useState('list');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selDates, setSelDates] = useState(new Set());
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [pending, setPending] = useState({});
  const [batchLoading, setBatchLoading] = useState(false);
  const [showPendingList, setShowPendingList] = useState(false);
  const [templates, setTemplates] = useState(TEMPLATES.map(t => ({ ...t })));
  const [breakFrom, setBreakFrom] = useState('13:00');
  const [breakTo, setBreakTo] = useState('14:00');
  const [gridStart, setGridStart] = useState('10:00');
  const [gridEnd, setGridEnd] = useState('20:00');
  const [gridInterval, setGridInterval] = useState(30);
  const [dbTimes, setDbTimes] = useState(new Set());
  const [dbStatus, setDbStatus] = useState(null);
  const [gridLoading, setGridLoading] = useState(false);
  const [blocked, setBlocked] = useState([]);
  const [newBD, setNewBD] = useState('');
  const [newBR, setNewBR] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const bookingCountRef = useRef(0);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };
  const toDS = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const navBtn = { padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#5c4a3a', fontFamily: font };
  const smallBtn = (bg, co, bd) => ({ padding: '6px 14px', borderRadius: 6, border: bd ? `1px solid ${bd}` : 'none', background: bg, color: co, cursor: 'pointer', fontSize: 12, fontFamily: font });

  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); h(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

  const gridTimes = useMemo(() => { const times = []; let mins = toMins(gridStart); const end = toMins(gridEnd); while (mins <= end) { times.push(toTimeStr(mins)); mins += gridInterval; } return times; }, [gridStart, gridEnd, gridInterval]);
  const displayTimes = pending[activeDate] || dbTimes;
  const isInPending = !!pending[activeDate];
  const pendingCount = Object.keys(pending).length;
  const activeDow = activeDate ? new Date(activeDate + 'T00:00:00').getDay() : 0;
  const extraDbTimes = useMemo(() => { const gridSet = new Set(gridTimes); return [...(pending[activeDate] || dbTimes)].filter(t => !gridSet.has(t)).sort(); }, [gridTimes, dbTimes, pending, activeDate]);

  /* ═══════ Booking filtering & stats ═══════ */
  const techList = useMemo(() => { return staffList.map(s => s.name).sort(); }, [staffList]);

  const filteredBookings = useMemo(() => {
    let r = allBookings;
    if (filterDateFrom) r = r.filter(b => b.booking_date >= filterDateFrom);
    if (filterDateTo) r = r.filter(b => b.booking_date <= filterDateTo);
    if (filterStatus !== 'all') r = r.filter(b => b.status === filterStatus);
    if (filterTech !== 'all') r = r.filter(b => b.technician_label === filterTech);
    if (searchTerm.trim()) { const s = searchTerm.trim().toLowerCase(); r = r.filter(b => b.customer_name?.toLowerCase().includes(s) || b.customer_phone?.includes(s)); }
    return r;
  }, [allBookings, filterDateFrom, filterDateTo, filterStatus, filterTech, searchTerm]);

  const stats = useMemo(() => {
    const today = todayStr;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthPre = new Date().toISOString().slice(0, 7);
    const active = allBookings.filter(b => b.status !== 'cancelled');
    return {
      today: active.filter(b => b.booking_date === today).length,
      todayRev: active.filter(b => b.booking_date === today).reduce((s, b) => s + (b.total_price || 0), 0),
      week: active.filter(b => b.booking_date >= weekAgo).length,
      month: active.filter(b => b.booking_date?.startsWith(monthPre)).length,
      monthRev: active.filter(b => b.booking_date?.startsWith(monthPre)).reduce((s, b) => s + (b.total_price || 0), 0),
      total: allBookings.length,
      pending: allBookings.filter(b => b.status === 'pending').length,
    };
  }, [allBookings, todayStr]);

  /* ═══════ 日程表 computed ═══════ */
  const scheduleSlots = useMemo(() => {
    const slots = [];
    for (let h = 10; h <= 20; h++) for (let m = 0; m < 60; m += 30) { if (h === 20 && m > 0) break; slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`); }
    return slots;
  }, []);

  const dayBookings = useMemo(() => {
    let bks = allBookings.filter(b => b.booking_date === scheduleDate);
    if (!showCancelled) bks = bks.filter(b => b.status !== 'cancelled');
    return bks;
  }, [allBookings, scheduleDate, showCancelled]);

  const scheduleStaff = useMemo(() => {
    const names = staffList.map(s => s.name);
    dayBookings.forEach(b => { const t = b.technician_label; if (t && !names.includes(t)) names.push(t); });
    if (dayBookings.some(b => !b.technician_label)) names.push('未指定');
    return names;
  }, [staffList, dayBookings]);

  const bookingGrid = useMemo(() => {
    const grid = {};
    dayBookings.forEach(b => {
      const tech = b.technician_label || '未指定';
      const time = b.booking_time?.slice(0, 5);
      const key = `${time}|${tech}`;
      if (!grid[key]) grid[key] = [];
      grid[key].push(b);
    });
    return grid;
  }, [dayBookings]);

  const weekDates = useMemo(() => {
    const d = new Date(scheduleDate + 'T00:00:00');
    const dow = d.getDay();
    const mon = new Date(d); mon.setDate(d.getDate() - ((dow + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => { const dt = new Date(mon); dt.setDate(mon.getDate() + i); return dt.toISOString().split('T')[0]; });
  }, [scheduleDate]);

  const weekCounts = useMemo(() => {
    const c = {};
    weekDates.forEach(d => { c[d] = allBookings.filter(b => b.booking_date === d && b.status !== 'cancelled').length; });
    return c;
  }, [weekDates, allBookings]);

  const dayStats = useMemo(() => {
    const active = dayBookings.filter(b => b.status !== 'cancelled');
    return { total: active.length, revenue: active.reduce((s, b) => s + (b.total_price || 0), 0), pending: dayBookings.filter(b => b.status === 'pending').length, confirmed: dayBookings.filter(b => b.status === 'confirmed').length, completed: dayBookings.filter(b => b.status === 'completed').length };
  }, [dayBookings]);

  const prevSchedDay = () => { const d = new Date(scheduleDate + 'T00:00:00'); d.setDate(d.getDate() - 1); setScheduleDate(d.toISOString().split('T')[0]); };
  const nextSchedDay = () => { const d = new Date(scheduleDate + 'T00:00:00'); d.setDate(d.getDate() + 1); setScheduleDate(d.toISOString().split('T')[0]); };

  const modalUpdate = async (s) => {
    if (!selectedBooking) return;
    try { await sbPatch(`bookings?id=eq.${selectedBooking.id}`, { status: s }); setAllBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, status: s } : b)); setSelectedBooking(prev => prev ? { ...prev, status: s } : null); showToast(`✅ 狀態已更新為「${statusText(s)}」`); } catch (e) { showToast('❌ 更新失敗'); }
  };
  const modalDelete = async () => {
    if (!selectedBooking || !window.confirm('確定要刪除？')) return;
    try { await sbDel(`bookings?id=eq.${selectedBooking.id}`); setAllBookings(prev => prev.filter(b => b.id !== selectedBooking.id)); setSelectedBooking(null); showToast('✅ 已刪除'); } catch (e) { console.error(e); }
  };

  const rowBg = (s) => s === 'pending' ? '#FFFDE7' : s === 'confirmed' ? '#E8F5E9' : s === 'completed' ? '#E3F2FD' : s === 'cancelled' ? '#FFEBEE' : '#fff';
  const statusColor = (s) => s === 'confirmed' ? '#4CAF50' : s === 'cancelled' ? '#f44336' : s === 'completed' ? '#2196F3' : '#FF9800';
  const statusText = (s) => s === 'confirmed' ? '已確認' : s === 'cancelled' ? '已取消' : s === 'completed' ? '已完成' : '待確認';
  const waLink = (phone) => { if (!phone) return null; const c = phone.replace(/[^0-9]/g, ''); return `https://wa.me/${c.length <= 8 ? '852' + c : c}`; };

  const setQuickDate = (type) => {
    const today = todayStr;
    if (type === 'today') { setFilterDateFrom(today); setFilterDateTo(today); }
    else if (type === 'tomorrow') { const t = new Date(Date.now() + 86400000).toISOString().split('T')[0]; setFilterDateFrom(t); setFilterDateTo(t); }
    else if (type === 'week') { setFilterDateFrom(today); setFilterDateTo(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]); }
    else if (type === 'month') { const y = new Date().getFullYear(), m = new Date().getMonth(); setFilterDateFrom(`${y}-${String(m + 1).padStart(2, '0')}-01`); setFilterDateTo(`${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`); }
    else if (type === 'nextMonth') { const nm = new Date().getMonth() + 1; const ny = nm > 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(); const m = nm > 11 ? 0 : nm; setFilterDateFrom(`${ny}-${String(m + 1).padStart(2, '0')}-01`); setFilterDateTo(`${ny}-${String(m + 1).padStart(2, '0')}-${new Date(ny, m + 1, 0).getDate()}`); }
  };
  const clearFilters = () => { setSearchTerm(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterStatus('all'); setFilterTech('all'); };
  const hasFilters = searchTerm || filterDateFrom || filterDateTo || filterStatus !== 'all' || filterTech !== 'all';

  /* ═══════ 員工 CRUD ═══════ */
  const fetchStaff = async () => { try { const data = await sbGet('staff?is_active=eq.true&order=sort_order,created_at'); setStaffList(data || []); if (data && data.length > 0) setActiveStaff(prev => { if (prev && data.find(s => s.id === prev.id)) return prev; return data[0]; }); } catch (e) { console.error(e); } };
  const addStaff = async () => { const name = newStaffName.trim(); if (!name) return showToast('❌ 請輸入員工名稱'); try { const data = await sbPost('staff', [{ name, sort_order: staffList.length }]); if (data && data[0]) { setStaffList(prev => [...prev, data[0]]); setActiveStaff(data[0]); setPending({}); setNewStaffName(''); setShowAddStaff(false); showToast(`✅ 已新增員工「${name}」`); } } catch (e) { showToast('❌ 新增失敗'); } };
  const saveStaffName = async () => { if (!editStaffId || !editStaffName.trim()) return; try { await sbPatch(`staff?id=eq.${editStaffId}`, { name: editStaffName.trim() }); const n = editStaffName.trim(); setStaffList(prev => prev.map(s => s.id === editStaffId ? { ...s, name: n } : s)); if (activeStaff?.id === editStaffId) setActiveStaff(prev => ({ ...prev, name: n })); setEditStaffId(null); showToast('✅ 已更新名稱'); } catch (e) { showToast('❌ 更新失敗'); } };
  const removeStaff = async (id) => { if (staffList.length <= 1) return showToast('❌ 至少要保留一個員工'); const s = staffList.find(x => x.id === id); if (!window.confirm(`確定刪除「${s?.name}」？\n相關嘅所有時段設定都會一併刪除！`)) return; try { await sbDel(`staff?id=eq.${id}`); const rest = staffList.filter(x => x.id !== id); setStaffList(rest); if (activeStaff?.id === id) { setActiveStaff(rest[0] || null); setPending({}); } showToast('✅ 已刪除員工'); } catch (e) { showToast('❌ 刪除失敗'); } };
  const switchStaff = (s) => { if (activeStaff?.id === s.id) return; if (pendingCount > 0 && !window.confirm(`你有 ${pendingCount} 個未同步嘅變更。\n切換員工會清除呢啲變更，繼續？`)) return; setPending({}); setActiveStaff(s); setSelDates(new Set()); };

  /* ═══════ LOAD DB ═══════ */
  const loadActiveFromDB = useCallback(async (date) => { if (!date || !activeStaff) return; setGridLoading(true); try { const sid = activeStaff.id; const [dateData, enabledData] = await Promise.all([sbGet(`date_availability?available_date=eq.${date}&staff_id=eq.${sid}`), sbGet(`enabled_timeslots?slot_date=eq.${date}&staff_id=eq.${sid}&order=slot_time`)]); const info = dateData?.[0]; setDbStatus(info?.status || null); if (!info || info.status !== 'available') setDbTimes(new Set()); else setDbTimes(new Set((enabledData || []).map(r => r.slot_time?.slice(0, 5)))); } catch (e) { console.error(e); } setGridLoading(false); }, [activeStaff]);
  useEffect(() => { if (auth && activeDate && activeStaff) loadActiveFromDB(activeDate); }, [activeDate, auth, activeStaff, loadActiveFromDB]);

  /* ═══════ CALENDAR ═══════ */
  const getCalDays = (y, m) => { const dow = new Date(y, m, 1).getDay(); const total = new Date(y, m + 1, 0).getDate(); const days = []; for (let i = 0; i < dow; i++) days.push(null); for (let d = 1; d <= total; d++) days.push(d); return days; };
  const prevCal = () => { if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); } else setCalMonth(m => m - 1); };
  const nextCal = () => { if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); } else setCalMonth(m => m + 1); };
  const calDays = getCalDays(calYear, calMonth);
  const toggleDate = (day) => { if (!day) return; const ds = toDS(calYear, calMonth, day); setSelDates(prev => { const n = new Set(prev); n.has(ds) ? n.delete(ds) : n.add(ds); return n; }); setActiveDate(ds); };
  const toggleWeekdayCol = (dow) => { const total = new Date(calYear, calMonth + 1, 0).getDate(); const col = []; for (let d = 1; d <= total; d++) if (new Date(calYear, calMonth, d).getDay() === dow) col.push(toDS(calYear, calMonth, d)); setSelDates(prev => { const n = new Set(prev); const allSel = col.every(d => n.has(d)); col.forEach(d => allSel ? n.delete(d) : n.add(d)); return n; }); };
  const selectByFilter = (fn) => { const total = new Date(calYear, calMonth + 1, 0).getDate(); const n = new Set(selDates); for (let d = 1; d <= total; d++) if (fn(new Date(calYear, calMonth, d).getDay())) n.add(toDS(calYear, calMonth, d)); setSelDates(n); };
  const isColAllSel = (dow) => { const total = new Date(calYear, calMonth + 1, 0).getDate(); let c = 0; for (let d = 1; d <= total; d++) if (new Date(calYear, calMonth, d).getDay() === dow) { c++; if (!selDates.has(toDS(calYear, calMonth, d))) return false; } return c > 0; };
  const toggleTime = (time) => { if (!activeDate) return; setPending(prev => { const next = { ...prev }; if (!next[activeDate]) next[activeDate] = new Set(dbTimes); else next[activeDate] = new Set(next[activeDate]); next[activeDate].has(time) ? next[activeDate].delete(time) : next[activeDate].add(time); return next; }); };
  const setAllTimes = (on) => { if (!activeDate) return; setPending(prev => { const next = { ...prev }; next[activeDate] = on ? new Set(gridTimes) : new Set(); return next; }); };
  const applyTemplateLocal = (tmpl) => { const dates = [...selDates]; if (!dates.length) return; const next = { ...pending }; if (!tmpl.from) { dates.forEach(d => { next[d] = new Set(); }); } else { const times = gridTimes.filter(t => t >= tmpl.from && t <= tmpl.to); dates.forEach(d => { next[d] = new Set(times); }); } setPending(next); showToast(`✏️ 已套用「${tmpl.label}」到 ${dates.length} 個日期`); };
  const applyBreakLocal = () => { const dates = [...selDates].filter(d => pending[d] && pending[d].size > 0); if (!dates.length) return; if (breakFrom >= breakTo) return; const next = { ...pending }; const bTimes = gridTimes.filter(t => t >= breakFrom && t < breakTo); dates.forEach(d => { next[d] = new Set(next[d]); bTimes.forEach(t => next[d].delete(t)); }); setPending(next); showToast(`🍽️ 已關閉 ${breakFrom}–${breakTo}（${dates.length} 個日期）`); };
  const autoFitRange = () => { const starts = templates.filter(t => t.from).map(t => toMins(t.from)); const ends = templates.filter(t => t.to).map(t => toMins(t.to)); if (!starts.length) return; setGridStart(toTimeStr(Math.max(0, Math.min(...starts) - gridInterval))); setGridEnd(toTimeStr(Math.min(23 * 60 + 30, Math.max(...ends) + gridInterval))); showToast('📐 已自動適應範圍'); };

  /* ═══════ SYNC ═══════ */
  const syncPending = async () => { if (!activeStaff) return; const entries = Object.entries(pending); if (!entries.length) return; if (!window.confirm(`確定將「${activeStaff.name}」嘅 ${entries.length} 個日期同步到前台？`)) return; setBatchLoading(true); try { const dates = entries.map(([d]) => d); const sid = activeStaff.id; await sbDel(`date_availability?available_date=in.(${dates.join(',')})&staff_id=eq.${sid}`); await sbDel(`enabled_timeslots?slot_date=in.(${dates.join(',')})&staff_id=eq.${sid}`); try { await sbDel(`disabled_timeslots?slot_date=in.(${dates.join(',')})`); } catch (_) {} await sbPost('date_availability', entries.map(([d, times]) => ({ available_date: d, status: times.size > 0 ? 'available' : 'closed', staff_id: sid }))); const enabledRows = []; entries.forEach(([d, times]) => { [...times].forEach(t => { enabledRows.push({ slot_date: d, slot_time: t, staff_id: sid }); }); }); if (enabledRows.length > 0) { for (let i = 0; i < enabledRows.length; i += 500) await sbPost('enabled_timeslots', enabledRows.slice(i, i + 500)); } setPending({}); setSelDates(new Set()); showToast(`✅ 成功同步「${activeStaff.name}」嘅 ${dates.length} 個日期！`); loadActiveFromDB(activeDate); } catch (e) { console.error(e); alert('同步失敗：' + e.message); } setBatchLoading(false); };
  const removePendingDate = (d) => { setPending(prev => { const n = { ...prev }; delete n[d]; return n; }); };

  /* ═══════ BOOKINGS ═══════ */
  const fetchBookings = async () => { setBkLoading(true); try { const data = await sbGet('bookings?order=booking_date.desc,booking_time.desc&limit=1000'); setAllBookings(data || []); } catch (e) { console.error(e); } setBkLoading(false); };
  const updateStatus = async (id, s) => { try { await sbPatch(`bookings?id=eq.${id}`, { status: s }); setAllBookings(prev => prev.map(b => b.id === id ? { ...b, status: s } : b)); showToast(`✅ 狀態已更新為「${statusText(s)}」`); } catch (e) { console.error(e); showToast('❌ 更新失敗'); } };
  const deleteBooking = async (id) => { if (!window.confirm('確定要刪除？')) return; try { await sbDel(`bookings?id=eq.${id}`); setAllBookings(prev => prev.filter(b => b.id !== id)); showToast('✅ 已刪除'); } catch (e) { console.error(e); } };

  useEffect(() => { bookingCountRef.current = allBookings.length; }, [allBookings.length]);
  useEffect(() => { if (!auth || !autoRefresh) return; const id = setInterval(async () => { try { const data = await sbGet('bookings?order=booking_date.desc,booking_time.desc&limit=1000'); if (data && data.length > bookingCountRef.current && bookingCountRef.current > 0) showToast(`🔔 有 ${data.length - bookingCountRef.current} 個新預約！`); setAllBookings(data || []); } catch (_) {} }, 30000); return () => clearInterval(id); }, [auth, autoRefresh]);

  /* ═══════ BLOCKED ═══════ */
  const fetchBlocked = async () => { try { setBlocked(await sbGet('blocked_dates?order=date') || []); } catch (e) { console.error(e); } };
  const addBlocked = async () => { if (!newBD) return; try { const d = await sbPost('blocked_dates', { date: newBD, reason: newBR }); setBlocked(prev => [...prev, ...d].sort((a, b) => a.date.localeCompare(b.date))); setNewBD(''); setNewBR(''); } catch (e) { console.error(e); } };
  const removeBlocked = async (id) => { try { await sbDel(`blocked_dates?id=eq.${id}`); setBlocked(prev => prev.filter(b => b.id !== id)); } catch (e) { console.error(e); } };

  const handleLogin = (e) => { e.preventDefault(); if (pw === PASS) { setAuth(true); fetchBookings(); fetchBlocked(); fetchStaff(); } else alert('密碼錯誤！'); };

  /* ═══════ RENDER ═══════ */
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

  const actBtn = (emoji, bg, bd, onClick, title) => (
    <button onClick={onClick} title={title} style={{ padding: '5px 9px', background: bg, border: `1px solid ${bd}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: font }}>{emoji}</button>
  );

  const schedDow = new Date(scheduleDate + 'T00:00:00').getDay();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', fontFamily: font }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#5c4a3a', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}
      {batchLoading && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#fff', padding: '30px 40px', borderRadius: 12, textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div><div style={{ fontSize: 14, color: '#5c4a3a' }}>處理中...</div></div></div>}

      {/* ═══ 預約詳情 Modal ═══ */}
      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setSelectedBooking(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>預約詳情</h3>
              <button onClick={() => setSelectedBooking(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', padding: '4px 8px' }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#fff', background: statusColor(selectedBooking.status), fontWeight: 600 }}>{statusText(selectedBooking.status)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#5c4a3a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>👤</span>
                <div><div style={{ fontWeight: 700, fontSize: 16 }}>{selectedBooking.customer_name}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📱</span>
                <div>
                  {selectedBooking.customer_phone}
                  {selectedBooking.customer_phone && <a href={waLink(selectedBooking.customer_phone)} target="_blank" rel="noreferrer" style={{ marginLeft: 10, textDecoration: 'none', padding: '3px 10px', background: '#25D366', color: '#fff', borderRadius: 6, fontSize: 12 }}>💬 WhatsApp</a>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📅</span>
                <div>{selectedBooking.booking_date}（週{DAYS[new Date(selectedBooking.booking_date + 'T00:00:00').getDay()]}）　{selectedBooking.booking_time}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🎨</span>
                <div>
                  {selectedBooking.service_name}
                  {selectedBooking.variant_label && <span style={{ color: '#999' }}> · {selectedBooking.variant_label}</span>}
                  {selectedBooking.addon_names?.length > 0 && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>+ {selectedBooking.addon_names.join('、')}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>👤</span>
                <div>技師：{selectedBooking.technician_label || '未指定'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>💰</span>
                <div style={{ fontSize: 22, fontWeight: 700 }}>${selectedBooking.total_price}</div>
              </div>
              {(selectedBooking.notes || selectedBooking.remarks || selectedBooking.customer_notes) && (
                <div style={{ padding: '10px 14px', background: '#FFF8E1', borderRadius: 8, fontSize: 13, color: '#F57F17' }}>📝 {selectedBooking.notes || selectedBooking.remarks || selectedBooking.customer_notes}</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, paddingTop: 20, borderTop: '1px solid #f0ebe3', flexWrap: 'wrap' }}>
              {selectedBooking.status === 'pending' && <button onClick={() => modalUpdate('confirmed')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✅ 確認預約</button>}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && <button onClick={() => modalUpdate('completed')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2196F3', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✔️ 完成</button>}
              {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && <button onClick={() => modalUpdate('cancelled')} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ef9a9a', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 14, fontFamily: font }}>❌ 取消</button>}
              <div style={{ flex: 1 }} />
              <button onClick={modalDelete} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fafafa', color: '#999', cursor: 'pointer', fontSize: 14, fontFamily: font }}>🗑️ 刪除</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', padding: '20px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 style={{ fontSize: 20, color: '#5c4a3a', margin: 0 }}>J.LAB 管理後台</h1><p style={{ color: '#999', fontSize: 12, margin: '4px 0 0', letterSpacing: 1 }}>ADMIN DASHBOARD</p></div>
        <button onClick={() => setAuth(false)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', color: '#666', fontFamily: font }}>登出</button>
      </div>

      <div style={{ background: '#fff', borderTop: '1px solid #f0ebe3', padding: '0 30px', display: 'flex', gap: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
        {[{ key: 'bookings', label: `📋 預約管理${stats.pending > 0 ? ` (${stats.pending})` : ''}` }, { key: 'timeslots', label: '🕐 時段管理' }, { key: 'blocked', label: '📅 封鎖日期' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '14px 24px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #5c4a3a' : '2px solid transparent', fontSize: 14, color: tab === t.key ? '#5c4a3a' : '#999', fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap' }}>{t.label}</button>
        ))}
      </div>

      {pendingCount > 0 && tab === 'timeslots' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', borderBottom: '2px solid #FFB74D' }}>
          <div style={{ padding: '14px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#E65100', fontSize: 14, fontWeight: 600 }}>⏳「{activeStaff?.name}」{pendingCount} 個日期待同步</span>
              <button onClick={() => setShowPendingList(!showPendingList)} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #FFB74D', borderRadius: 4, color: '#E65100', cursor: 'pointer', fontSize: 12, fontFamily: font }}>{showPendingList ? '收起 ▲' : '查看列表 ▼'}</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setPending({}); showToast('已清除'); setShowPendingList(false); }} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#666', fontFamily: font }}>取消全部</button>
              <button onClick={syncPending} style={{ padding: '8px 24px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: font, boxShadow: '0 2px 8px rgba(76,175,80,0.3)' }}>✅ 確認同步到前台</button>
            </div>
          </div>
          {showPendingList && (
            <div style={{ padding: '0 30px 14px', maxHeight: 240, overflowY: 'auto' }}>
              <div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
                {Object.entries(pending).sort(([a], [b]) => a.localeCompare(b)).map(([date, times]) => (
                  <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f5f0eb' }}>
                    <div style={{ fontSize: 13 }}><span style={{ color: '#5c4a3a', fontWeight: 600 }}>{date}</span><span style={{ color: '#999', marginLeft: 6 }}>週{DAYS[new Date(date + 'T00:00:00').getDay()]}</span><span style={{ color: times.size > 0 ? '#4CAF50' : '#f44336', marginLeft: 10, fontSize: 12, fontWeight: 500 }}>{times.size > 0 ? `${times.size} 個時段` : '全日關閉'}</span></div>
                    <button onClick={() => removePendingDate(date)} style={smallBtn('#ffebee', '#c62828', '#ffcdd2')}>移除</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px' }}>

        {/* ══════════ BOOKINGS TAB ══════════ */}
        {tab === 'bookings' && (<>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: '今日預約', value: stats.today, sub: `$${stats.todayRev}`, color: '#FF9800' },
              { label: '本週預約', value: stats.week, sub: null, color: '#4CAF50' },
              { label: '本月預約', value: stats.month, sub: `$${stats.monthRev}`, color: '#2196F3' },
              { label: '待處理', value: stats.pending, sub: null, color: stats.pending > 0 ? '#f44336' : '#999' },
              { label: '總預約數', value: stats.total, sub: null, color: '#5c4a3a' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', padding: '18px 16px', borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: `4px solid ${s.color}` }}>
                <p style={{ color: '#999', fontSize: 12, margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 'bold', color: s.color, margin: 0 }}>{s.value}</p>
                {s.sub && <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>💰 {s.sub}</p>}
              </div>))}
          </div>

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
            {[['list', '📋 列表模式'], ['schedule', '📅 日程表']].map(([k, l]) => (
              <button key={k} onClick={() => setViewMode(k)} style={{ padding: '12px 24px', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: viewMode === k ? 700 : 400, background: viewMode === k ? '#5c4a3a' : '#fff', color: viewMode === k ? '#fff' : '#5c4a3a', borderRadius: k === 'list' ? '10px 0 0 10px' : '0 10px 10px 0', boxShadow: viewMode === k ? '0 2px 8px rgba(92,74,58,0.3)' : '0 2px 10px rgba(0,0,0,0.05)' }}>{l}</button>
            ))}
          </div>

          {/* ── LIST VIEW ── */}
          {viewMode === 'list' && (<>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 12 }}>
                <input type="text" placeholder="🔍 搜尋客人名稱或電話..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ color: '#5c4a3a', fontWeight: 600, fontSize: 13 }}>日期：</span>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                <span style={{ color: '#999', fontSize: 12 }}>至</span>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['今日', 'today'], ['明日', 'tomorrow'], ['本週', 'week'], ['本月', 'month'], ['下月', 'nextMonth']].map(([l, k]) => (
                    <button key={k} onClick={() => setQuickDate(k)} style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 11, fontFamily: font }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}>
                  <option value="all">全部狀態</option><option value="pending">待確認</option><option value="confirmed">已確認</option><option value="completed">已完成</option><option value="cancelled">已取消</option>
                </select>
                <select value={filterTech} onChange={e => setFilterTech(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}>
                  <option value="all">全部技師</option>{techList.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#999', cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> 自動刷新
                </label>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {hasFilters && <button onClick={clearFilters} style={{ padding: '6px 14px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#999', fontSize: 12, fontFamily: font }}>✕ 清除篩選</button>}
                  <button onClick={fetchBookings} style={{ padding: '6px 14px', background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄 刷新</button>
                </div>
              </div>
            </div>

            {hasFilters && (
              <div style={{ padding: '10px 16px', marginBottom: 12, borderRadius: 8, background: '#FFF8E1', border: '1px solid #FFE082', fontSize: 13, color: '#F57F17' }}>
                🔍 篩選結果：{filteredBookings.length} / {allBookings.length} 筆預約
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: '#5c4a3a', fontSize: 17 }}>預約列表 ({filteredBookings.length})</h2>
                {autoRefresh && <span style={{ fontSize: 11, color: '#999' }}>🔄 每 30 秒自動刷新</span>}
              </div>

              {bkLoading ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>載入中...</p> : filteredBookings.length === 0 ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>{hasFilters ? '搵唔到符合條件嘅預約' : '暫無預約'}</p> : isMobile ? (
                <div style={{ padding: '12px 16px' }}>
                  {filteredBookings.map(b => (
                    <div key={b.id} style={{ background: rowBg(b.status), borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid #e8e0d8' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#5c4a3a' }}>{b.customer_name}</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                            <span style={{ fontSize: 13, color: '#666' }}>{b.customer_phone}</span>
                            {b.customer_phone && <a href={waLink(b.customer_phone)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', fontSize: 16 }}>💬</a>}
                          </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#fff', background: statusColor(b.status), fontWeight: 600, whiteSpace: 'nowrap' }}>{statusText(b.status)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 6 }}>📅 {b.booking_date}（週{DAYS[new Date(b.booking_date + 'T00:00:00').getDay()]}）　🕐 {b.booking_time}</div>
                      <div style={{ fontSize: 13, color: '#5c4a3a', marginBottom: 2 }}>🎨 {b.service_name}{b.variant_label && <span style={{ color: '#999' }}> · {b.variant_label}</span>}</div>
                      {b.addon_names?.length > 0 && <div style={{ fontSize: 12, color: '#999', marginBottom: 4, paddingLeft: 20 }}>+ {b.addon_names.join('、')}</div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0', fontSize: 13 }}>
                        <span style={{ color: '#999' }}>👤 {b.technician_label || '未指定'}</span>
                        <span style={{ fontSize: 17, fontWeight: 700, color: '#5c4a3a' }}>${b.total_price}</span>
                      </div>
                      {(b.notes || b.remarks || b.customer_notes) && (
                        <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: 6, fontSize: 12, color: '#888', marginBottom: 8 }}>📝 {b.notes || b.remarks || b.customer_notes}</div>
                      )}
                      <div style={{ display: 'flex', gap: 6, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
                        {b.status === 'pending' && actBtn('✅', '#E8F5E9', '#A5D6A7', () => updateStatus(b.id, 'confirmed'), '確認')}
                        {(b.status === 'pending' || b.status === 'confirmed') && actBtn('✔️', '#E3F2FD', '#90CAF9', () => updateStatus(b.id, 'completed'), '完成')}
                        {b.status !== 'cancelled' && b.status !== 'completed' && actBtn('❌', '#FFEBEE', '#EF9A9A', () => updateStatus(b.id, 'cancelled'), '取消')}
                        <div style={{ flex: 1 }} />
                        {actBtn('🗑️', '#fafafa', '#ddd', () => deleteBooking(b.id), '刪除')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead><tr style={{ background: '#f9f6f3' }}>{['日期', '時間', '服務', '客人', '電話', '技師', '金額', '狀態', '操作'].map(h => <th key={h} style={{ padding: '12px 10px', textAlign: 'left', color: '#5c4a3a', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>{h}</th>)}</tr></thead>
                    <tbody>{filteredBookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0', background: rowBg(b.status), transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{b.booking_date}<div style={{ fontSize: 11, color: '#999' }}>週{DAYS[new Date(b.booking_date + 'T00:00:00').getDay()]}</div></td>
                        <td style={{ padding: '12px 10px', fontWeight: 600 }}>{b.booking_time}</td>
                        <td style={{ padding: '12px 10px' }}>
                          {b.service_name}
                          {b.variant_label && <div style={{ fontSize: 12, color: '#999' }}>{b.variant_label}</div>}
                          {b.addon_names?.length > 0 && <div style={{ fontSize: 11, color: '#aaa' }}>+ {b.addon_names.join('、')}</div>}
                          {(b.notes || b.remarks || b.customer_notes) && <div style={{ fontSize: 11, color: '#FF9800', marginTop: 2 }}>📝 {(b.notes || b.remarks || b.customer_notes).slice(0, 30)}{(b.notes || b.remarks || b.customer_notes).length > 30 ? '...' : ''}</div>}
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 500 }}>{b.customer_name}</td>
                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                          {b.customer_phone}
                          {b.customer_phone && <a href={waLink(b.customer_phone)} target="_blank" rel="noreferrer" style={{ marginLeft: 6, textDecoration: 'none', fontSize: 14 }} title="WhatsApp">💬</a>}
                        </td>
                        <td style={{ padding: '12px 10px' }}>{b.technician_label || <span style={{ color: '#ccc' }}>-</span>}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: 15 }}>${b.total_price}</td>
                        <td style={{ padding: '12px 10px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#fff', background: statusColor(b.status), fontWeight: 600 }}>{statusText(b.status)}</span></td>
                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {b.status === 'pending' && actBtn('✅', '#E8F5E9', '#A5D6A7', () => updateStatus(b.id, 'confirmed'), '確認')}
                            {(b.status === 'pending' || b.status === 'confirmed') && actBtn('✔️', '#E3F2FD', '#90CAF9', () => updateStatus(b.id, 'completed'), '完成')}
                            {b.status !== 'cancelled' && b.status !== 'completed' && actBtn('❌', '#FFEBEE', '#EF9A9A', () => updateStatus(b.id, 'cancelled'), '取消')}
                            {actBtn('🗑️', '#fafafa', '#ddd', () => deleteBooking(b.id), '刪除')}
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </>)}

          {/* ── SCHEDULE VIEW ── */}
          {viewMode === 'schedule' && (<>
            {/* Day navigation */}
            <div style={{ ...card, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={prevSchedDay} style={navBtn}>◀</button>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#5c4a3a' }}>{scheduleDate}</div>
                    <div style={{ fontSize: 13, color: '#999' }}>星期{DAYS[schedDow]}{scheduleDate === todayStr && <span style={{ marginLeft: 8, padding: '2px 8px', background: '#FF9800', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>今日</span>}</div>
                  </div>
                  <button onClick={nextSchedDay} style={navBtn}>▶</button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setScheduleDate(todayStr)} style={{ padding: '8px 16px', borderRadius: 6, border: scheduleDate === todayStr ? '2px solid #FF9800' : '1px solid #d0c8bc', background: scheduleDate === todayStr ? '#FFF3E0' : '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: scheduleDate === todayStr ? 600 : 400 }}>今日</button>
                  <button onClick={() => { const t = new Date(Date.now() + 86400000).toISOString().split('T')[0]; setScheduleDate(t); }} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font }}>明日</button>
                  <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#999', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} /> 顯示已取消
                  </label>
                </div>
              </div>

              {/* Week strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 16 }}>
                {weekDates.map(d => {
                  const dt = new Date(d + 'T00:00:00');
                  const cnt = weekCounts[d] || 0;
                  const isSel = d === scheduleDate;
                  const isToday = d === todayStr;
                  const pendCnt = allBookings.filter(b => b.booking_date === d && b.status === 'pending').length;
                  return (
                    <button key={d} onClick={() => setScheduleDate(d)} style={{ padding: '10px 4px', borderRadius: 8, cursor: 'pointer', border: isSel ? '2px solid #5c4a3a' : '2px solid transparent', background: isSel ? '#5c4a3a' : '#fff', color: isSel ? '#fff' : '#5c4a3a', fontFamily: font, textAlign: 'center', transition: 'all 0.15s', position: 'relative' }}>
                      <div style={{ fontSize: 11, opacity: 0.7 }}>週{DAYS[dt.getDay()]}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: isToday && !isSel ? '#FF9800' : undefined }}>{dt.getDate()}</div>
                      <div style={{ fontSize: 11, marginTop: 2, fontWeight: cnt > 0 ? 600 : 400, opacity: cnt > 0 ? 1 : 0.4 }}>{cnt} 個</div>
                      {pendCnt > 0 && <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', background: '#f44336' }} />}
                    </button>
                  );
                })}
              </div>

              {/* Day stats */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '12px 16px', background: '#f9f6f3', borderRadius: 8, fontSize: 14 }}>
                <span>📊 預約 <b style={{ color: '#5c4a3a', fontSize: 18 }}>{dayStats.total}</b></span>
                <span>💰 收入 <b style={{ color: '#5c4a3a', fontSize: 18 }}>${dayStats.revenue}</b></span>
                {dayStats.pending > 0 && <span style={{ color: '#FF9800' }}>⏳ 待確認 <b>{dayStats.pending}</b></span>}
                {dayStats.confirmed > 0 && <span style={{ color: '#4CAF50' }}>✅ 已確認 <b>{dayStats.confirmed}</b></span>}
                {dayStats.completed > 0 && <span style={{ color: '#2196F3' }}>✔️ 已完成 <b>{dayStats.completed}</b></span>}
              </div>
            </div>

            {/* Timetable */}
            {scheduleStaff.length === 0 ? (
              <div style={card}><p style={{ textAlign: 'center', color: '#999', padding: 30 }}>未有員工，請先喺「時段管理」新增。</p></div>
            ) : (
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: scheduleStaff.length * 160 + 80 }}>
                    <thead>
                      <tr style={{ background: '#f9f6f3' }}>
                        <th style={{ padding: '14px 10px', borderBottom: '2px solid #e8e0d8', fontSize: 13, color: '#5c4a3a', fontWeight: 600, position: 'sticky', left: 0, background: '#f9f6f3', zIndex: 2, minWidth: 70, textAlign: 'center' }}>時間</th>
                        {scheduleStaff.map(s => {
                          const cnt = dayBookings.filter(b => (b.technician_label || '未指定') === s).length;
                          return (
                            <th key={s} style={{ padding: '14px 10px', borderBottom: '2px solid #e8e0d8', borderLeft: '1px solid #e8e0d8', fontSize: 14, color: '#5c4a3a', fontWeight: 700, minWidth: 150, textAlign: 'center' }}>
                              {s}
                              <div style={{ fontSize: 11, color: cnt > 0 ? '#4CAF50' : '#ccc', fontWeight: 500, marginTop: 2 }}>{cnt} 個預約</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleSlots.map((time, ti) => {
                        const isHour = time.endsWith(':00');
                        return (
                          <tr key={time} style={{ borderBottom: isHour ? '2px solid #e8e0d8' : '1px solid #f0ebe3' }}>
                            <td style={{ padding: '6px 8px', fontSize: 13, color: isHour ? '#5c4a3a' : '#bbb', fontWeight: isHour ? 700 : 400, position: 'sticky', left: 0, background: '#faf8f5', zIndex: 1, borderRight: '2px solid #e8e0d8', textAlign: 'center', verticalAlign: 'top', height: 56 }}>
                              {time}
                            </td>
                            {scheduleStaff.map(s => {
                              const bks = bookingGrid[`${time}|${s}`] || [];
                              return (
                                <td key={s} style={{ padding: '4px 6px', borderLeft: '1px solid #f0ebe3', verticalAlign: 'top', height: 56, background: bks.length > 0 ? 'transparent' : (ti % 2 === 0 ? '#fefefe' : '#fafafa') }}>
                                  {bks.map(b => (
                                    <div key={b.id} onClick={() => setSelectedBooking(b)} style={{ padding: '6px 10px', borderRadius: 8, marginBottom: 3, cursor: 'pointer', borderLeft: `4px solid ${statusColor(b.status)}`, background: rowBg(b.status), fontSize: 12, lineHeight: 1.5, transition: 'box-shadow 0.15s' }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                                      <div style={{ fontWeight: 700, color: '#5c4a3a', fontSize: 13 }}>{b.customer_name}</div>
                                      <div style={{ color: '#888', marginTop: 1 }}>{b.service_name}</div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
                                        <span style={{ color: statusColor(b.status), fontWeight: 600, fontSize: 11 }}>{statusText(b.status)}</span>
                                        <span style={{ fontWeight: 700, color: '#5c4a3a' }}>${b.total_price}</span>
                                      </div>
                                    </div>
                                  ))}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Bookings outside grid range */}
                {(() => {
                  const slotSet = new Set(scheduleSlots);
                  const outside = dayBookings.filter(b => !slotSet.has(b.booking_time?.slice(0, 5)));
                  if (outside.length === 0) return null;
                  return (
                    <div style={{ padding: '12px 16px', borderTop: '2px solid #FFE082', background: '#FFF8E1' }}>
                      <div style={{ fontSize: 13, color: '#F57F17', fontWeight: 600, marginBottom: 8 }}>⚠️ 以下預約唔喺 10:00–20:00 範圍內：</div>
                      {outside.map(b => (
                        <div key={b.id} onClick={() => setSelectedBooking(b)} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 12px', background: '#fff', borderRadius: 6, marginRight: 8, marginBottom: 6, cursor: 'pointer', border: '1px solid #e8e0d8', fontSize: 13 }}>
                          <span style={{ fontWeight: 600 }}>{b.booking_time}</span>
                          <span>{b.customer_name}</span>
                          <span style={{ color: '#999' }}>{b.technician_label || '未指定'}</span>
                          <span style={{ color: statusColor(b.status), fontWeight: 600, fontSize: 11 }}>{statusText(b.status)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f0ebe3', fontSize: 11, color: '#999', textAlign: 'right' }}>
                  💡 點擊預約卡片可查看詳情及操作
                </div>
              </div>
            )}
          </>)}
        </>)}

        {/* ══════════ TIME SLOTS TAB ══════════ */}
        {tab === 'timeslots' && (<>
          <div style={{ ...card, background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
            <div style={{ fontSize: 14, color: '#2e7d32', lineHeight: 2 }}>
              💡 <b>使用流程：</b>選擇員工 → 月曆選日期 → 套用模板 → 按「<b>確認同步到前台</b>」<br />
              🔒 每個員工有獨立嘅時間表，預設所有日期關閉
            </div>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={sTitle}>👤 員工時間表</div>
              <span style={{ fontSize: 12, color: '#999' }}>每個員工有獨立嘅時段設定</span>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              {staffList.map(s => (
                <button key={s.id} onClick={() => switchStaff(s)} style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: font, transition: 'all 0.15s', fontWeight: activeStaff?.id === s.id ? 700 : 400, border: activeStaff?.id === s.id ? '2px solid #5c4a3a' : '2px solid #d0c8bc', background: activeStaff?.id === s.id ? '#5c4a3a' : '#fff', color: activeStaff?.id === s.id ? '#fff' : '#5c4a3a' }}>{s.name}{activeStaff?.id === s.id && <span style={{ marginLeft: 6, fontSize: 11 }}>✓</span>}</button>
              ))}
              {!showAddStaff ? (
                <button onClick={() => setShowAddStaff(true)} style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: font, border: '2px dashed #c0b8aa', background: 'transparent', color: '#999' }}>＋ 新增員工</button>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="text" placeholder="輸入名稱..." value={newStaffName} onChange={e => setNewStaffName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStaff()} autoFocus style={{ padding: '8px 14px', border: '2px solid #5c4a3a', borderRadius: 8, fontSize: 14, fontFamily: font, width: 140 }} />
                  <button onClick={addStaff} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#5c4a3a', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>確定</button>
                  <button onClick={() => { setShowAddStaff(false); setNewStaffName(''); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#999', cursor: 'pointer', fontSize: 13, fontFamily: font }}>取消</button>
                </div>
              )}
            </div>
            {activeStaff && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 16px', background: '#f9f6f3', borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: '#999' }}>正在管理：</span>
                {editStaffId === activeStaff.id ? (<>
                  <input type="text" value={editStaffName} onChange={e => setEditStaffName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveStaffName()} autoFocus style={{ padding: '6px 12px', border: '2px solid #5c4a3a', borderRadius: 6, fontSize: 14, fontFamily: font, width: 130 }} />
                  <button onClick={saveStaffName} style={smallBtn('#5c4a3a', '#fff')}>儲存</button>
                  <button onClick={() => setEditStaffId(null)} style={smallBtn('#fff', '#999', '#ccc')}>取消</button>
                </>) : (<>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#5c4a3a' }}>{activeStaff.name}</span>
                  <button onClick={() => { setEditStaffId(activeStaff.id); setEditStaffName(activeStaff.name); }} style={smallBtn('#fff', '#5c4a3a', '#d0c8bc')}>✏️ 改名</button>
                  {staffList.length > 1 && <button onClick={() => removeStaff(activeStaff.id)} style={smallBtn('#ffebee', '#c62828', '#ffcdd2')}>🗑️ 刪除</button>}
                </>)}
              </div>
            )}
            {staffList.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>未有員工，請先新增一個。</div>}
          </div>

          {activeStaff && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              <div style={card}>
                <div style={sTitle}>📅 選擇日期</div>
                <div style={sDesc}>點日期查看「{activeStaff.name}」嘅時段，可多選後套用模板</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <button onClick={prevCal} style={navBtn}>◀</button>
                  <span style={{ fontSize: 17, fontWeight: 600, color: '#5c4a3a' }}>{calYear}年 {calMonth + 1}月</span>
                  <button onClick={nextCal} style={navBtn}>▶</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                  {DAYS.map((d, i) => <button key={`h${i}`} onClick={() => toggleWeekdayCol(i)} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: isColAllSel(i) ? '#5c4a3a' : '#f0ebe3', color: isColAllSel(i) ? '#fff' : '#5c4a3a', fontSize: 13, fontWeight: 600, fontFamily: font }}>{d}</button>)}
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const ds = toDS(calYear, calMonth, day), sel = selDates.has(ds), isActive = ds === activeDate, isToday = ds === todayStr, hasPend = !!pending[ds];
                    return <button key={`d${i}`} onClick={() => toggleDate(day)} style={{ padding: '12px 4px', borderRadius: 8, cursor: 'pointer', position: 'relative', border: isActive ? '3px solid #FF9800' : sel ? '2px solid #5c4a3a' : '2px solid transparent', background: sel ? (isActive ? '#4a3a2a' : '#5c4a3a') : hasPend ? '#e8f5e9' : 'transparent', color: sel ? '#fff' : isToday ? '#FF9800' : '#666', fontSize: 14, fontWeight: isToday || sel || isActive ? 700 : 400, fontFamily: font, transition: 'all 0.15s' }}>{day}{hasPend && !sel && <div style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, background: '#4CAF50', borderRadius: '50%' }} />}</button>;
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  {[['平日', d => d >= 1 && d <= 5], ['週末', d => d === 0 || d === 6], ['全月', () => true]].map(([l, fn]) => <button key={l} onClick={() => selectByFilter(fn)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>{l}</button>)}
                  <button onClick={() => setSelDates(new Set())} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#999', cursor: 'pointer', fontSize: 12, fontFamily: font }}>清除選擇</button>
                </div>
                {selDates.size > 0 && <div style={{ marginTop: 14, padding: '10px 14px', background: '#f0ebe3', borderRadius: 8, fontSize: 13, color: '#5c4a3a' }}>已選 <b>{selDates.size}</b> 日 <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>（橙框 = 正在查看）</span></div>}
              </div>

              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a' }}>🕐 {activeStaff.name} — {activeDate}（週{DAYS[activeDow]}）</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setAllTimes(true)} style={smallBtn('#e8f5e9', '#2e7d32')}>全開</button>
                    <button onClick={() => setAllTimes(false)} style={smallBtn('#ffebee', '#c62828')}>全關</button>
                    <button onClick={() => loadActiveFromDB(activeDate)} style={smallBtn('#f5f0eb', '#5c4a3a')}>🔄</button>
                  </div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: '#f9f6f3', border: '1px solid #e8e0d8' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
                    <span style={{ color: '#5c4a3a', fontWeight: 500 }}>範圍</span>
                    <select value={gridStart} onChange={e => setGridStart(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font }}>{ALL_TIMES_15.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <span style={{ color: '#999' }}>至</span>
                    <select value={gridEnd} onChange={e => setGridEnd(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font }}>{ALL_TIMES_15.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <button onClick={autoFitRange} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #a5d6a7', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 12, fontFamily: font }}>📐 自動</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
                    <span style={{ color: '#5c4a3a', fontWeight: 500, fontSize: 13 }}>間隔</span>
                    {INTERVAL_OPTIONS.map(m => <button key={m} onClick={() => setGridInterval(m)} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: font, background: gridInterval === m ? '#5c4a3a' : '#e8e0d8', color: gridInterval === m ? '#fff' : '#5c4a3a', fontWeight: gridInterval === m ? 600 : 400 }}>{m}分</button>)}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12, background: isInPending ? '#FFF3E0' : dbStatus === 'available' ? '#e8f5e9' : '#f5f5f5', color: isInPending ? '#E65100' : dbStatus === 'available' ? '#2e7d32' : '#999', border: `1px solid ${isInPending ? '#FFB74D' : dbStatus === 'available' ? '#a5d6a7' : '#e0e0e0'}` }}>
                  {isInPending ? `⏳ 有未同步嘅變更 — ${displayTimes.size} / ${gridTimes.length} 個時段開放` : dbStatus === 'available' ? `✅ 已同步 — ${displayTimes.size} 個時段開放` : '🔒 未開放（前台不顯示）'}
                </div>
                {extraDbTimes.length > 0 && <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12, background: '#FFF8E1', border: '1px solid #FFE082', color: '#F57F17' }}>⚠️ 有 {extraDbTimes.length} 個已開放時段唔喺目前格仔範圍內：{extraDbTimes.slice(0, 5).join(', ')}{extraDbTimes.length > 5 ? '...' : ''}</div>}
                {gridLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${gridInterval >= 60 ? '80px' : '68px'}, 1fr))`, gap: 5, maxHeight: 480, overflowY: 'auto', padding: '2px 0' }}>
                    {gridTimes.map(t => { const isOn = displayTimes.has(t); return <button key={t} onClick={() => toggleTime(t)} style={{ padding: '10px 4px', borderRadius: 6, border: `2px solid ${isOn ? '#5c4a3a' : '#e0d8cc'}`, background: isOn ? '#5c4a3a' : '#faf6f0', color: isOn ? '#fff' : '#c0b8aa', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font, transition: 'all 0.15s' }}>{t}</button>; })}
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11, color: '#999', textAlign: 'right' }}>{gridTimes.length} 個時段（{gridStart}–{gridEnd}，每 {gridInterval} 分鐘）</div>
              </div>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                <div style={sTitle}>⚡ 套用營業模板到「{activeStaff.name}」</div>
                {selDates.size > 0 ? <span style={{ fontSize: 12, color: '#4CAF50', fontWeight: 600 }}>已選 {selDates.size} 日</span> : <span style={{ fontSize: 12, color: '#c00' }}>請先選擇日期</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {templates.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#faf6f0', border: '1px solid #e8e0d8', opacity: selDates.size === 0 ? 0.5 : 1, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{t.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', minWidth: 52 }}>{t.label}</span>
                    {t.from !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1 1 auto', minWidth: 0 }}>
                        <select value={t.from} onChange={e => setTemplates(prev => prev.map((tt, idx) => idx === i ? { ...tt, from: e.target.value } : tt))} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}</select>
                        <span style={{ color: '#999', fontSize: 11 }}>–</span>
                        <select value={t.to} onChange={e => setTemplates(prev => prev.map((tt, idx) => idx === i ? { ...tt, to: e.target.value } : tt))} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}</select>
                      </div>
                    ) : (<span style={{ flex: '1 1 auto', fontSize: 12, color: '#999' }}>全日關閉</span>)}
                    <button onClick={() => applyTemplateLocal(t)} disabled={selDates.size === 0} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontFamily: font, fontWeight: 600, whiteSpace: 'nowrap', background: selDates.size === 0 ? '#ddd' : '#5c4a3a', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer' }}>套用</button>
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed #d0c8bc', marginTop: 6, paddingTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#fff5f5', border: '1px solid #ffcdd2', opacity: selDates.size === 0 ? 0.5 : 1, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>🍽️</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c62828', minWidth: 52 }}>休息</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1 1 auto', minWidth: 0 }}>
                      <select value={breakFrom} onChange={e => setBreakFrom(e.target.value)} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                      <span style={{ color: '#999', fontSize: 11 }}>–</span>
                      <select value={breakTo} onChange={e => setBreakTo(e.target.value)} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    </div>
                    <button onClick={applyBreakLocal} disabled={selDates.size === 0} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontFamily: font, fontWeight: 600, whiteSpace: 'nowrap', background: selDates.size === 0 ? '#ddd' : '#e53935', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer' }}>扣除</button>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: '#999' }}>💡 「套用」會設定時段，「扣除」會喺已有時段入面移除休息時間</div>
            </div>
          </>)}
        </>)}

        {/* ══════════ BLOCKED TAB ══════════ */}
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
                  <button onClick={() => removeBlocked(b.id)} style={smallBtn('#ffebee', '#c62828', '#ffcdd2')}>刪除</button>
                </div>))}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
