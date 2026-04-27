import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const apiCall = async (action, payload = {}) => {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': '$jlab1014'
    },
    body: JSON.stringify({ action, payload })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
};
const sbGet = async (p) => apiCall('db', { path: p });
const sbPost = async (t, d) => apiCall('db', { path: t, method: 'POST', body: d });
const sbDel = async (p) => apiCall('db', { path: p, method: 'DELETE' });
const sbPatch = async (p, d) => apiCall('db', { path: p, method: 'PATCH', body: d });

const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const ALL_TIMES = []; for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30) ALL_TIMES.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
const ALL_TIMES_15 = []; for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) ALL_TIMES_15.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
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
const toTimeStr = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export default function Admin() {
  const [auth, setAuth] = useState(false);
  const [pw, setPw] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [showChangePw, setShowChangePw] = useState(false);
  const [cpOld, setCpOld] = useState('');
  const [cpNew, setCpNew] = useState('');
  const [cpConfirm, setCpConfirm] = useState('');
  const [cpMsg, setCpMsg] = useState('');
  const [cpError, setCpError] = useState('');
  const [cpLoading, setCpLoading] = useState(false);

  /* ✅ 新增：Recovery token 相關 state */
  const [recoveryToken, setRecoveryToken] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetNewPw, setResetNewPw] = useState('');
  const [resetConfirmPw, setResetConfirmPw] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [resetPwError, setResetPwError] = useState('');

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

  const [changeLog, setChangeLog] = useState([]);

  const [viewMode, setViewMode] = useState('list');
  const [schedYear, setSchedYear] = useState(new Date().getFullYear());
  const [schedMonth, setSchedMonth] = useState(new Date().getMonth());
  const [schedDate, setSchedDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthAvail, setMonthAvail] = useState({});
  const [daySlots, setDaySlots] = useState({});
  const [dayLoading, setDayLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [schedRefreshKey, setSchedRefreshKey] = useState(0);

  const [reschedMode, setReschedMode] = useState(false);
  const [reschedDate, setReschedDate] = useState('');
  const [reschedTime, setReschedTime] = useState('');
  const [reschedTech, setReschedTech] = useState('');
  const [reschedSlots, setReschedSlots] = useState({});
  const [reschedLoading, setReschedLoading] = useState(false);

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
  const toDS = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const navBtn = { padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#5c4a3a', fontFamily: font };
  const smallBtn = (bg, co, bd) => ({ padding: '6px 14px', borderRadius: 6, border: bd ? `1px solid ${bd}` : 'none', background: bg, color: co, cursor: 'pointer', fontSize: 12, fontFamily: font });

  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); h(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

  /* ✅ 新增：頁面載入時檢查 URL 有冇 recovery token */
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');
    if (accessToken && type === 'recovery') {
      setRecoveryToken(accessToken);
      setShowResetForm(true);
      // 清除 URL 嘅 hash，唔好顯示 token
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  /* ✅ 新增：用 recovery token 設定新密碼 */
    const handleResetNewPw = async () => {
    setResetPwError('');
    if (!resetNewPw || resetNewPw.length < 6) { setResetPwError('新密碼至少要 6 個字元'); return; }
    if (resetNewPw !== resetConfirmPw) { setResetPwError('兩次密碼不一致'); return; }
    setResetPwLoading(true);
    try {
      await apiCall('reset-via-token', { token: recoveryToken, newPassword: resetNewPw });
      alert('✅ 密碼已重設，請重新登入');
      setShowResetForm(false);
      setRecoveryToken('');
      setResetNewPw('');
      setResetConfirmPw('');
    } catch (err) {
      setResetPwError(err.message || '重設失敗');
    }
    setResetPwLoading(false);
  };

  const logChange = (text) => {
    const id = Date.now();
    const ts = new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChangeLog(prev => [{ id, text, ts }, ...prev].slice(0, 30));
  };

  const gridTimes = useMemo(() => { const times = []; let mins = toMins(gridStart); const end = toMins(gridEnd); while (mins <= end) { times.push(toTimeStr(mins)); mins += gridInterval; } return times; }, [gridStart, gridEnd, gridInterval]);
  const displayTimes = pending[activeDate] || dbTimes;
  const isInPending = !!pending[activeDate];
  const pendingCount = Object.keys(pending).length;
  const activeDow = activeDate ? new Date(activeDate + 'T00:00:00').getDay() : 0;
  const extraDbTimes = useMemo(() => { const gridSet = new Set(gridTimes); return [...(pending[activeDate] || dbTimes)].filter(t => !gridSet.has(t)).sort(); }, [gridTimes, dbTimes, pending, activeDate]);

  const techList = useMemo(() => staffList.map(s => s.name).sort(), [staffList]);
  const filteredBookings = useMemo(() => {
    let r = allBookings;
    if (filterDateFrom) r = r.filter(b => b.booking_date >= filterDateFrom);
    if (filterDateTo) r = r.filter(b => b.booking_date <= filterDateTo);
    if (filterStatus !== 'all') r = r.filter(b => b.status === filterStatus);
    if (filterTech !== 'all') r = r.filter(b => b.technician_label === filterTech);
    if (searchTerm.trim()) { const s = searchTerm.trim().toLowerCase(); r = r.filter(b => b.customer_name?.toLowerCase().includes(s) || b.customer_phone?.includes(s)); }
    return r;
  }, [allBookings, filterDateFrom, filterDateTo, filterStatus, filterTech, searchTerm]);

  const nextMonthStr = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }, []);
  const nextMonthLabel = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getMonth() + 1}月預約`; }, []);

  const stats = useMemo(() => {
    const today = todayStr; const monthPre = new Date().toISOString().slice(0, 7);
    const active = allBookings.filter(b => b.status !== 'cancelled');
    return {
      today: active.filter(b => b.booking_date === today).length,
      todayRev: active.filter(b => b.booking_date === today).reduce((s, b) => s + (b.total_price || 0), 0),
      month: active.filter(b => b.booking_date?.startsWith(monthPre)).length,
      monthRev: active.filter(b => b.booking_date?.startsWith(monthPre)).reduce((s, b) => s + (b.total_price || 0), 0),
      nextMonth: active.filter(b => b.booking_date?.startsWith(nextMonthStr)).length,
      nextMonthRev: active.filter(b => b.booking_date?.startsWith(nextMonthStr)).reduce((s, b) => s + (b.total_price || 0), 0),
      total: allBookings.length,
      pending: allBookings.filter(b => b.status === 'pending').length,
    };
  }, [allBookings, todayStr, nextMonthStr]);

  const monthBkStats = useMemo(() => {
    const c = {};
    allBookings.forEach(b => { const d = b.booking_date; if (!d) return; if (!c[d]) c[d] = { total: 0, pending: 0, revenue: 0 }; if (b.status === 'cancelled') return; c[d].total++; if (b.status === 'pending') c[d].pending++; c[d].revenue += b.total_price || 0; });
    return c;
  }, [allBookings]);

  const dayBks = useMemo(() => {
    let bks = allBookings.filter(b => b.booking_date === schedDate);
    if (!showCancelled) bks = bks.filter(b => b.status !== 'cancelled');
    return bks.sort((a, b) => (a.booking_time || '').localeCompare(b.booking_time || ''));
  }, [allBookings, schedDate, showCancelled]);

  const timetableTimes = useMemo(() => {
    const all = new Set();
    Object.values(daySlots).forEach(s => s.forEach(t => all.add(t)));
    dayBks.forEach(b => { const t = b.booking_time?.slice(0, 5); if (t) all.add(t); });
    return [...all].sort();
  }, [daySlots, dayBks]);

  const timetableStaff = useMemo(() => {
    const list = staffList.map(s => ({ id: s.id, name: s.name }));
    const nameSet = new Set(list.map(n => n.name));
    dayBks.forEach(b => { if (b.technician_label && !nameSet.has(b.technician_label)) { list.push({ id: null, name: b.technician_label }); nameSet.add(b.technician_label); } });
    if (dayBks.some(b => !b.technician_label)) list.push({ id: null, name: '未指定' });
    return list;
  }, [staffList, dayBks]);

  const timetableGrid = useMemo(() => {
    const g = {};
    dayBks.forEach(b => { const tech = b.technician_label || '未指定'; const t = b.booking_time?.slice(0, 5); const k = `${t}|${tech}`; if (!g[k]) g[k] = []; g[k].push(b); });
    return g;
  }, [dayBks]);

  const dayStats = useMemo(() => {
    const active = dayBks.filter(b => b.status !== 'cancelled');
    return { total: active.length, revenue: active.reduce((s, b) => s + (b.total_price || 0), 0), pending: dayBks.filter(b => b.status === 'pending').length, confirmed: dayBks.filter(b => b.status === 'confirmed').length, completed: dayBks.filter(b => b.status === 'completed').length };
  }, [dayBks]);

  const schedCalDays = useMemo(() => {
    const dow = new Date(schedYear, schedMonth, 1).getDay();
    const total = new Date(schedYear, schedMonth + 1, 0).getDate();
    const days = []; for (let i = 0; i < dow; i++) days.push(null); for (let d = 1; d <= total; d++) days.push(d); return days;
  }, [schedYear, schedMonth]);

  const reschedAvailTimes = useMemo(() => {
    const staffObj = staffList.find(s => s.name === reschedTech);
    if (!staffObj) return [];
    return [...(reschedSlots[staffObj.id] || [])].sort();
  }, [reschedTech, reschedSlots, staffList]);

  const isTimeConflict = useMemo(() => {
    if (!reschedDate || !reschedTime || !reschedTech) return false;
    return allBookings.some(b => b.booking_date === reschedDate && b.booking_time?.slice(0, 5) === reschedTime && b.technician_label === reschedTech && b.status !== 'cancelled' && b.id !== selectedBooking?.id);
  }, [reschedDate, reschedTime, reschedTech, allBookings, selectedBooking]);

  const loadMonthAvail = useCallback(async (y, m) => {
    try {
      const s = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const e = `${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`;
      const data = await sbGet(`date_availability?available_date=gte.${s}&available_date=lte.${e}`);
      const map = {};
      (data || []).forEach(a => { if (!map[a.available_date]) map[a.available_date] = {}; map[a.available_date][a.staff_id] = a.status; });
      setMonthAvail(map);
    } catch (e) { console.error(e); }
  }, []);

  const loadDaySlots = useCallback(async (date) => {
    if (!date) return; setDayLoading(true);
    try {
      const data = await sbGet(`enabled_timeslots?slot_date=eq.${date}&order=slot_time`);
      const map = {};
      (data || []).forEach(s => { const sid = s.staff_id; if (!map[sid]) map[sid] = new Set(); map[sid].add(s.slot_time?.slice(0, 5)); });
      setDaySlots(map);
    } catch (e) { console.error(e); }
    setDayLoading(false);
  }, []);

  useEffect(() => { if (auth && viewMode === 'schedule') loadMonthAvail(schedYear, schedMonth); }, [auth, viewMode, schedYear, schedMonth, schedRefreshKey, loadMonthAvail]);
  useEffect(() => { if (auth && viewMode === 'schedule' && schedDate) loadDaySlots(schedDate); }, [auth, viewMode, schedDate, schedRefreshKey, loadDaySlots]);

  const prevSchedCal = () => { if (schedMonth === 0) { setSchedYear(y => y - 1); setSchedMonth(11); } else setSchedMonth(m => m - 1); };
  const nextSchedCal = () => { if (schedMonth === 11) { setSchedYear(y => y + 1); setSchedMonth(0); } else setSchedMonth(m => m + 1); };
  const schedToToday = () => { const now = new Date(); setSchedYear(now.getFullYear()); setSchedMonth(now.getMonth()); setSchedDate(todayStr); };

  const openBooking = (b) => { setSelectedBooking(b); setReschedMode(false); setReschedSlots({}); };
  const closeBooking = () => { setSelectedBooking(null); setReschedMode(false); };
  const rowBg = (s) => s === 'pending' ? '#FFFDE7' : s === 'confirmed' ? '#E8F5E9' : s === 'completed' ? '#E3F2FD' : s === 'cancelled' ? '#FFEBEE' : '#fff';
  const statusColor = (s) => s === 'confirmed' ? '#4CAF50' : s === 'cancelled' ? '#f44336' : s === 'completed' ? '#2196F3' : '#FF9800';
  const statusText = (s) => s === 'confirmed' ? '已確認' : s === 'cancelled' ? '已取消' : s === 'completed' ? '已完成' : '待確認';
  const waLink = (phone) => { if (!phone) return null; const c = phone.replace(/[^0-9]/g, ''); return `https://wa.me/${c.length <= 8 ? '852' + c : c}`; };
// ═══ WhatsApp 通知模板 + 發送 ═══
// ═══════════════════════════════════════════
// WhatsApp 通知模板（從 DB 載入）
// ═══════════════════════════════════════════

const [msgTemplates, setMsgTemplates] = useState([]);
const [showTemplateEditor, setShowTemplateEditor] = useState(false);

// 載入模板
useEffect(() => {
  if (auth) {
    sbGet('notification_templates?order=id')
      .then(data => { if (data) setMsgTemplates(data); })
      .catch(e => console.error('載入模板失敗', e));
  }
}, [auth]);

// 將模板入面嘅 {variable} 替換成真實值
const fillTemplate = (templateKey, booking, extras = {}) => {
  const tpl = msgTemplates.find(t => t.key === templateKey);
  if (!tpl) return '';
  const vars = {
    customer_name: booking.customer_name || '',
    booking_date: booking.booking_date || '',
    booking_time: booking.booking_time || '',
    service_name: booking.service_name || '未指定',
    technician_label: booking.technician_label || '待定',
    total_price: booking.total_price || '—',
    old_date: extras.oldDate || '',
    old_time: extras.oldTime || '',
  };
  return tpl.content.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
};

// 發送 WhatsApp
const sendWhatsApp = (phone, message) => {
  if (!phone) { showToast('⚠️ 呢個客人冇留電話號碼'); return; }
  const cleaned = phone.replace(/[^0-9]/g, '');
  const num = cleaned.length <= 8 ? '852' + cleaned : cleaned;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
};

// 儲存模板到 DB
const saveTemplate = async (id, newContent) => {
  try {
    await sbPatch(`notification_templates?id=eq.${id}`, {
      content: newContent,
      updated_at: new Date().toISOString()
    });
    setMsgTemplates(prev => prev.map(t => t.id === id ? { ...t, content: newContent } : t));
    showToast('✅ 模板已儲存');
  } catch (e) {
    showToast('❌ 儲存失敗');
  }
};
  const startResched = () => {
    if (!selectedBooking) return;
    setReschedMode(true);
    setReschedDate(selectedBooking.booking_date);
    setReschedTime(selectedBooking.booking_time?.slice(0, 5) || '');
    setReschedTech(selectedBooking.technician_label || '');
    loadReschedSlots(selectedBooking.booking_date);
  };
  const loadReschedSlots = async (date) => {
    try {
      const data = await sbGet(`enabled_timeslots?slot_date=eq.${date}&order=slot_time`);
      const map = {};
      (data || []).forEach(s => { const sid = s.staff_id; if (!map[sid]) map[sid] = new Set(); map[sid].add(s.slot_time?.slice(0, 5)); });
      setReschedSlots(map);
    } catch (e) { setReschedSlots({}); }
  };
  const handleReschedDateChange = (date) => { setReschedDate(date); setReschedTime(''); loadReschedSlots(date); };
const saveResched = async () => {
  if (!selectedBooking || !reschedDate || !reschedTime) return showToast('❌ 請選擇日期同時間');
  if (isTimeConflict) return showToast('❌ 此時段已有其他預約，請選擇其他時間');
  setReschedLoading(true);
  try {
    // 記住舊時間（通知用）
    const oldDate = selectedBooking.booking_date;
    const oldTime = selectedBooking.booking_time;

    const updates = { booking_date: reschedDate, booking_time: reschedTime };
    if (reschedTech) updates.technician_label = reschedTech;
    await sbPatch(`bookings?id=eq.${selectedBooking.id}`, updates);

    const oldInfo = `${oldDate} ${oldTime}`;
    const updatedBooking = { ...selectedBooking, ...updates };

    setAllBookings(prev => prev.map(b => b.id === selectedBooking.id ? updatedBooking : b));
    setSelectedBooking(updatedBooking);
    setReschedMode(false);
    logChange(`✏️ 改期 ${selectedBooking.customer_name}：${oldInfo} → ${reschedDate} ${reschedTime}`);
    showToast('✅ 已更改預約時間');

    // ═══ 問要唔要 WhatsApp 通知客人 ═══
    const ask = window.confirm('📲 要唔要 WhatsApp 通知客人改期？');
    if (ask) {
      const msg = fillTemplate('rescheduled', updatedBooking, { oldDate, oldTime });
      sendWhatsApp(selectedBooking.customer_phone, msg);
    }

  } catch (e) { showToast('❌ 更改失敗'); }
  setReschedLoading(false);
};
  const updateStatus = async (id, s) => {
    const b = allBookings.find(x => x.id === id);
    try {
      await sbPatch(`bookings?id=eq.${id}`, { status: s });
      setAllBookings(prev => prev.map(x => x.id === id ? { ...x, status: s } : x));
      logChange(`${statusText(s)} — ${b?.customer_name} ${b?.booking_date} ${b?.booking_time}`);
      showToast(`✅ 狀態已更新為「${statusText(s)}」`);
    } catch (e) { showToast('❌ 更新失敗'); }
  };
  const deleteBooking = async (id) => {
    if (!window.confirm('確定要刪除？')) return;
    const b = allBookings.find(x => x.id === id);
    try {
      await sbDel(`bookings?id=eq.${id}`);
      setAllBookings(prev => prev.filter(x => x.id !== id));
      logChange(`🗑️ 已刪除 — ${b?.customer_name} ${b?.booking_date} ${b?.booking_time}`);
      showToast('✅ 已刪除');
    } catch (e) { console.error(e); }
  };
 const modalUpdate = async (s) => {
    if (!selectedBooking) return;
    try {
      await sbPatch(`bookings?id=eq.${selectedBooking.id}`, { status: s });
      const updated = { ...selectedBooking, status: s };
      setAllBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
      setSelectedBooking(updated);
     logChange(`${statusText(s)} — ${selectedBooking.customer_name} ${selectedBooking.booking_date} ${selectedBooking.booking_time}`);
      showToast(`✅ 狀態已更新為「${statusText(s)}」`);

      // ═══ WhatsApp 通知 ═══
      if (s === 'confirmed' || s === 'cancelled') {
        const ask = window.confirm(`📲 要唔要 WhatsApp 通知 ${selectedBooking.customer_name}？`);
        if (ask) {
          const msg = fillTemplate(s, updated);
          sendWhatsApp(selectedBooking.customer_phone, msg);
        }
      }
    } catch (e) { showToast('❌ 更新失敗'); }
  };
  const modalDelete = async () => {
    if (!selectedBooking || !window.confirm('確定要刪除？')) return;
    try {
      logChange(`🗑️ 已刪除 — ${selectedBooking.customer_name} ${selectedBooking.booking_date} ${selectedBooking.booking_time}`);
      await sbDel(`bookings?id=eq.${selectedBooking.id}`);
      setAllBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
      closeBooking();
      showToast('✅ 已刪除');
    } catch (e) { console.error(e); }
  };

  const confirmAllPending = async () => {
    const pend = allBookings.filter(b => b.status === 'pending' && b.booking_date >= todayStr);
    if (!pend.length) return showToast('❌ 沒有待確認嘅預約');
    if (!window.confirm(`確定確認全部 ${pend.length} 個待確認預約？`)) return;
    try {
      const ids = pend.map(b => b.id);
      await sbPatch(`bookings?id=in.(${ids.join(',')})`, { status: 'confirmed' });
      setAllBookings(prev => prev.map(b => ids.includes(b.id) ? { ...b, status: 'confirmed' } : b));
      logChange(`✅ 批量確認 ${pend.length} 個待確認預約`);
      showToast(`✅ 已確認 ${pend.length} 個預約`);
    } catch (e) { showToast('❌ 確認失敗'); }
  };
  const confirmDayPending = async () => {
    const pend = dayBks.filter(b => b.status === 'pending');
    if (!pend.length) return;
    if (!window.confirm(`確定確認 ${schedDate} 共 ${pend.length} 個待確認預約？`)) return;
    try {
      const ids = pend.map(b => b.id);
      await sbPatch(`bookings?id=in.(${ids.join(',')})`, { status: 'confirmed' });
      setAllBookings(prev => prev.map(b => ids.includes(b.id) ? { ...b, status: 'confirmed' } : b));
      logChange(`✅ 批量確認 ${schedDate} 共 ${pend.length} 個預約`);
      showToast(`✅ 已確認 ${pend.length} 個預約`);
    } catch (e) { showToast('❌ 確認失敗'); }
  };

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

const fetchStaff = async () => { try { const data = await sbGet('staff?order=sort_order,created_at'); setStaffList(data || []); if (data && data.length > 0) setActiveStaff(prev => { if (prev && data.find(s => s.id === prev.id)) return prev; return data[0]; }); } catch (e) { console.error(e); } };
const data = await sbPost('staff', [{ name, sort_order: staffList.length, is_active: true }]);
  const saveStaffName = async () => { if (!editStaffId || !editStaffName.trim()) return; try { await sbPatch(`staff?id=eq.${editStaffId}`, { name: editStaffName.trim() }); const n = editStaffName.trim(); setStaffList(prev => prev.map(s => s.id === editStaffId ? { ...s, name: n } : s)); if (activeStaff?.id === editStaffId) setActiveStaff(prev => ({ ...prev, name: n })); setEditStaffId(null); showToast('✅ 已更新名稱'); } catch (e) { showToast('❌ 更新失敗'); } };
  const removeStaff = async (id) => { if (staffList.length <= 1) return showToast('❌ 至少要保留一個員工'); const s = staffList.find(x => x.id === id); if (!window.confirm(`確定刪除「${s?.name}」？`)) return; try { await sbDel(`staff?id=eq.${id}`); const rest = staffList.filter(x => x.id !== id); setStaffList(rest); if (activeStaff?.id === id) { setActiveStaff(rest[0] || null); setPending({}); } showToast('✅ 已刪除員工'); } catch (e) { showToast('❌ 刪除失敗'); } };
  const switchStaff = (s) => { if (activeStaff?.id === s.id) return; if (pendingCount > 0 && !window.confirm(`你有 ${pendingCount} 個未同步嘅變更，切換會清除，繼續？`)) return; setPending({}); setActiveStaff(s); setSelDates(new Set()); };

  const loadActiveFromDB = useCallback(async (date) => { if (!date || !activeStaff) return; setGridLoading(true); try { const sid = activeStaff.id; const [dateData, enabledData] = await Promise.all([sbGet(`date_availability?available_date=eq.${date}&staff_id=eq.${sid}`), sbGet(`enabled_timeslots?slot_date=eq.${date}&staff_id=eq.${sid}&order=slot_time`)]); const info = dateData?.[0]; setDbStatus(info?.status || null); if (!info || info.status !== 'available') setDbTimes(new Set()); else setDbTimes(new Set((enabledData || []).map(r => r.slot_time?.slice(0, 5)))); } catch (e) { console.error(e); } setGridLoading(false); }, [activeStaff]);
  useEffect(() => { if (auth && activeDate && activeStaff) loadActiveFromDB(activeDate); }, [activeDate, auth, activeStaff, loadActiveFromDB]);

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

  const syncPending = async () => { if (!activeStaff) return; const entries = Object.entries(pending); if (!entries.length) return; if (!window.confirm(`確定將「${activeStaff.name}」嘅 ${entries.length} 個日期同步到前台？`)) return; setBatchLoading(true); try { const dates = entries.map(([d]) => d); const sid = activeStaff.id; await sbDel(`date_availability?available_date=in.(${dates.join(',')})&staff_id=eq.${sid}`); await sbDel(`enabled_timeslots?slot_date=in.(${dates.join(',')})&staff_id=eq.${sid}`); try { await sbDel(`disabled_timeslots?slot_date=in.(${dates.join(',')})`); } catch (_) {} await sbPost('date_availability', entries.map(([d, times]) => ({ available_date: d, status: times.size > 0 ? 'available' : 'closed', staff_id: sid }))); const enabledRows = []; entries.forEach(([d, times]) => { [...times].forEach(t => { enabledRows.push({ slot_date: d, slot_time: t, staff_id: sid }); }); }); if (enabledRows.length > 0) { for (let i = 0; i < enabledRows.length; i += 500) await sbPost('enabled_timeslots', enabledRows.slice(i, i + 500)); } setPending({}); setSelDates(new Set()); setSchedRefreshKey(k => k + 1); showToast(`✅ 成功同步「${activeStaff.name}」嘅 ${dates.length} 個日期！`); loadActiveFromDB(activeDate); } catch (e) { console.error(e); alert('同步失敗：' + e.message); } setBatchLoading(false); };
  const removePendingDate = (d) => { setPending(prev => { const n = { ...prev }; delete n[d]; return n; }); };

  const fetchBookings = async () => { setBkLoading(true); try { const data = await sbGet('bookings?order=booking_date.desc,booking_time.desc&limit=1000'); setAllBookings(data || []); } catch (e) { console.error(e); } setBkLoading(false); };
  useEffect(() => { bookingCountRef.current = allBookings.length; }, [allBookings.length]);
  useEffect(() => { if (!auth || !autoRefresh) return; const id = setInterval(async () => { try { const data = await sbGet('bookings?order=booking_date.desc,booking_time.desc&limit=1000'); if (data && data.length > bookingCountRef.current && bookingCountRef.current > 0) showToast(`🔔 有 ${data.length - bookingCountRef.current} 個新預約！`); setAllBookings(data || []); } catch (_) {} }, 30000); return () => clearInterval(id); }, [auth, autoRefresh]);

  const fetchBlocked = async () => { try { setBlocked(await sbGet('blocked_dates?order=date') || []); } catch (e) { console.error(e); } };
  const addBlocked = async () => { if (!newBD) return; try { const d = await sbPost('blocked_dates', { date: newBD, reason: newBR }); setBlocked(prev => [...prev, ...d].sort((a, b) => a.date.localeCompare(b.date))); setNewBD(''); setNewBR(''); } catch (e) { console.error(e); } };
  const removeBlocked = async (id) => { try { await sbDel(`blocked_dates?id=eq.${id}`); setBlocked(prev => prev.filter(b => b.id !== id)); } catch (e) { console.error(e); } };

    const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await apiCall('login', { email: loginEmail, password: pw });
      setAuth(true);
      fetchBookings();
      fetchBlocked();
      fetchStaff();
    } catch (err) {
      setLoginError(err.message || '帳號或密碼錯誤');
    }
    setLoginLoading(false);
  };

  const handleChangePw = async () => {
    setCpError(''); setCpMsg('');
    if (!cpOld || !cpNew || !cpConfirm) { setCpError('請填寫所有欄位'); return; }
    if (cpNew.length < 6) { setCpError('新密碼至少要 6 個字元'); return; }
    if (cpNew !== cpConfirm) { setCpError('兩次輸入嘅新密碼唔一樣'); return; }
    setCpLoading(true);
    try {
      await apiCall('change-password', { email: loginEmail, oldPassword: cpOld, newPassword: cpNew });
      setCpMsg('✅ 密碼已更新！');
      setCpOld(''); setCpNew(''); setCpConfirm('');
      setTimeout(() => { setShowChangePw(false); setCpMsg(''); }, 2000);
    } catch (err) {
      setCpError(err.message || '更新失敗');
    }
    setCpLoading(false);
  };

  /* ═══════ RENDER ═══════ */

  /* ✅ 新增：Recovery 重設密碼表單 */
  if (!auth && showResetForm) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f5f0eb,#e8e0d8)', fontFamily: font }}>
      <div style={{ background: '#fff', padding: '60px 40px', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 400, width: '90%' }}>
        <h1 style={{ fontSize: 24, color: '#5c4a3a', marginBottom: 8 }}>J.LAB</h1>
        <p style={{ color: '#FF9800', fontSize: 16, marginBottom: 30, fontWeight: 600 }}>🔑 重設密碼</p>
        <p style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>請輸入你嘅新密碼</p>
        {resetPwError && <div style={{ padding: '10px 16px', background: '#FFEBEE', color: '#c62828', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>❌ {resetPwError}</div>}
        <input type="password" placeholder="新密碼（至少 6 個字元）" value={resetNewPw} onChange={e => { setResetNewPw(e.target.value); setResetPwError(''); }} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 12, boxSizing: 'border-box', textAlign: 'center' }} />
        <input type="password" placeholder="確認新密碼" value={resetConfirmPw} onChange={e => { setResetConfirmPw(e.target.value); setResetPwError(''); }} onKeyDown={e => e.key === 'Enter' && handleResetNewPw()} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 20, boxSizing: 'border-box', textAlign: 'center' }} />
        <button onClick={handleResetNewPw} disabled={resetPwLoading} style={{ width: '100%', padding: 14, background: resetPwLoading ? '#a89888' : '#FF9800', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: resetPwLoading ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 600 }}>{resetPwLoading ? '處理中...' : '確認重設密碼'}</button>
        <button type="button" onClick={() => { setShowResetForm(false); setRecoveryToken(''); setResetPwError(''); setResetNewPw(''); setResetConfirmPw(''); }} style={{ background: 'none', border: 'none', color: '#999', fontSize: 13, marginTop: 16, cursor: 'pointer', textDecoration: 'underline', fontFamily: font }}>返回登入</button>
      </div>
    </div>
  );

  if (!auth) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f5f0eb,#e8e0d8)', fontFamily: font }}>
      <form onSubmit={handleLogin} style={{ background: '#fff', padding: '60px 40px', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 400, width: '90%' }}>
        <h1 style={{ fontSize: 24, color: '#5c4a3a', marginBottom: 8 }}>J.LAB</h1>
        <p style={{ color: '#999', fontSize: 14, marginBottom: 40, letterSpacing: 2 }}>管理後台 ADMIN</p>
        {loginError && <div style={{ padding: '10px 16px', background: '#FFEBEE', color: '#c62828', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>❌ {loginError}</div>}
        {resetMsg && <div style={{ padding: '10px 16px', background: '#E8F5E9', color: '#2e7d32', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>✅ {resetMsg}</div>}
        <input type="email" placeholder="管理員 Email" value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setResetMsg(''); }} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 12, boxSizing: 'border-box', textAlign: 'center' }} />
        <input type="password" placeholder="密碼" value={pw} onChange={e => setPw(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 20, boxSizing: 'border-box', textAlign: 'center' }} />
        <button type="submit" disabled={loginLoading} style={{ width: '100%', padding: 14, background: loginLoading ? '#a89888' : '#5c4a3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: loginLoading ? 'not-allowed' : 'pointer' }}>{loginLoading ? '登入中...' : '登入'}</button>
        {/* ✅ 忘記密碼：發送重設連結到 Email，redirect_to 指向當前頁面 */}
        <button type="button" onClick={async () => {
          if (!loginEmail) { setLoginError('請先輸入 Email'); setResetMsg(''); return; }
          setLoginError('');
          setResetMsg('');
          try {
            const redirectUrl = window.location.origin + window.location.pathname;
            await apiCall('recover', { email: loginEmail, redirectUrl });
            setResetMsg('重設密碼連結已發送到你嘅 Email，請查收信箱（包括垃圾郵件）。撳 Email 入面嘅連結會返嚟呢度設定新密碼。');
          } catch (err) {
            setLoginError('發送失敗：' + (err.message || '請稍後再試'));
          }
        }} style={{ background: 'none', border: 'none', color: '#999', fontSize: 13, marginTop: 16, cursor: 'pointer', textDecoration: 'underline', fontFamily: font }}>
          忘記密碼？
        </button>
      </form>
    </div>
  );

  const actBtn = (emoji, bg, bd, onClick, title) => (<button onClick={onClick} title={title} style={{ padding: '5px 9px', background: bg, border: `1px solid ${bd}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: font }}>{emoji}</button>);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', fontFamily: font }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#5c4a3a', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}
      {batchLoading && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#fff', padding: '30px 40px', borderRadius: 12, textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div><div style={{ fontSize: 14, color: '#5c4a3a' }}>處理中...</div></div></div>}

      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeBooking}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>預約詳情</h3>
              <button onClick={closeBooking} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}><span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#fff', background: statusColor(selectedBooking.status), fontWeight: 600 }}>{statusText(selectedBooking.status)}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#5c4a3a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>👤</span><div style={{ fontWeight: 700, fontSize: 16 }}>{selectedBooking.customer_name}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>📱</span><div>{selectedBooking.customer_phone}{selectedBooking.customer_phone && <a href={waLink(selectedBooking.customer_phone)} target="_blank" rel="noreferrer" style={{ marginLeft: 10, textDecoration: 'none', padding: '3px 10px', background: '#25D366', color: '#fff', borderRadius: 6, fontSize: 12 }}>💬 WhatsApp</a>}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>📅</span><div>{selectedBooking.booking_date}（週{DAYS[new Date(selectedBooking.booking_date + 'T00:00:00').getDay()]}）　{selectedBooking.booking_time}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>🎨</span><div>{selectedBooking.service_name}{selectedBooking.variant_label && <span style={{ color: '#999' }}> · {selectedBooking.variant_label}</span>}{selectedBooking.addon_names?.length > 0 && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>+ {selectedBooking.addon_names.join('、')}</div>}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>💰</span><div style={{ fontSize: 22, fontWeight: 700 }}>${selectedBooking.total_price}</div></div>
              {(selectedBooking.notes || selectedBooking.remarks || selectedBooking.customer_notes) && <div style={{ padding: '10px 14px', background: '#FFF8E1', borderRadius: 8, fontSize: 13, color: '#F57F17' }}>📝 {selectedBooking.notes || selectedBooking.remarks || selectedBooking.customer_notes}</div>}
            </div>
            {reschedMode ? (
              <div style={{ marginTop: 20, padding: 16, background: '#FFF3E0', borderRadius: 10, border: '1px solid #FFB74D' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E65100', marginBottom: 12 }}>✏️ 更改預約時間</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#5c4a3a', minWidth: 45 }}>日期：</span>
                    <input type="date" value={reschedDate} onChange={e => handleReschedDateChange(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, flex: 1 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#5c4a3a', minWidth: 45 }}>技師：</span>
                    <select value={reschedTech} onChange={e => { setReschedTech(e.target.value); setReschedTime(''); }} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, flex: 1, fontFamily: font }}>
                      <option value="">選擇技師</option>
                      {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: '#5c4a3a', minWidth: 45 }}>時間：</span>
                    {reschedAvailTimes.length > 0 ? (
                      <select value={reschedTime} onChange={e => setReschedTime(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, flex: 1, fontFamily: font }}>
                        <option value="">選擇時間</option>
                        {reschedAvailTimes.map(t => <option key={t} value={t}>{t}{allBookings.some(b => b.booking_date === reschedDate && b.booking_time?.slice(0,5) === t && b.technician_label === reschedTech && b.status !== 'cancelled' && b.id !== selectedBooking.id) ? ' ⚠️ 已有預約' : ''}</option>)}
                      </select>
                    ) : (
                      <div style={{ fontSize: 12, color: '#999', flex: 1 }}>{reschedTech ? '此技師當日未有開放時段' : '請先選擇技師'}</div>
                    )}
                  </div>
                  {isTimeConflict && <div style={{ padding: '8px 12px', background: '#FFEBEE', borderRadius: 6, fontSize: 12, color: '#c62828' }}>⚠️ 此時段已有其他預約，建議選擇其他時間</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={saveResched} disabled={!reschedDate || !reschedTime || reschedLoading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: reschedDate && reschedTime ? '#FF9800' : '#ddd', color: '#fff', cursor: reschedDate && reschedTime ? 'pointer' : 'not-allowed', fontSize: 14, fontFamily: font, fontWeight: 600 }}>{reschedLoading ? '處理中...' : '✅ 確認改期'}</button>
                  <button onClick={() => setReschedMode(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: font }}>取消</button>
                </div>
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0ebe3', flexWrap: 'wrap' }}>
              {selectedBooking.status === 'pending' && <button onClick={() => modalUpdate('confirmed')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✅ 確認預約</button>}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && <button onClick={() => modalUpdate('completed')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2196F3', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✔️ 完成</button>}
              {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && <button onClick={() => modalUpdate('cancelled')} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ef9a9a', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 14, fontFamily: font }}>❌ 取消</button>}
              {!reschedMode && selectedBooking.status !== 'cancelled' && <button onClick={startResched} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #FFB74D', background: '#FFF3E0', color: '#E65100', cursor: 'pointer', fontSize: 14, fontFamily: font }}>✏️ 改期</button>}
{selectedBooking.customer_phone && (
  <button onClick={() => {
    const msg = fillTemplate('reminder', selectedBooking);
    if (msg) {
      sendWhatsApp(selectedBooking.customer_phone, msg);
    } else {
      sendWhatsApp(selectedBooking.customer_phone,
`${selectedBooking.customer_name} 你好！關於你 ${selectedBooking.booking_date} ${selectedBooking.booking_time} 嘅預約，如有任何疑問歡迎聯絡我哋。\n— J.LAB`
      );
    }
  }} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #25D366', background: '#E8F5E9', color: '#25D366', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>
    📲 通知客人
  </button>
)}
<div style={{ flex: 1 }} />
<button onClick={modalDelete} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fafafa', color: '#999', cursor: 'pointer', fontSize: 14, fontFamily: font }}>🗑️</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', padding: '20px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 style={{ fontSize: 20, color: '#5c4a3a', margin: 0 }}>J.LAB 管理後台</h1><p style={{ color: '#999', fontSize: 12, margin: '4px 0 0', letterSpacing: 1 }}>ADMIN DASHBOARD</p></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { setShowChangePw(true); setCpOld(''); setCpNew(''); setCpConfirm(''); setCpMsg(''); setCpError(''); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #d0c8bc', borderRadius: 6, cursor: 'pointer', color: '#5c4a3a', fontFamily: font, fontSize: 13 }}>🔑 改密碼</button>
          <button onClick={() => setAuth(false)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', color: '#666', fontFamily: font }}>登出</button>
        </div>
      </div>

      {showChangePw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowChangePw(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>🔑 更改密碼</h3>
              <button onClick={() => setShowChangePw(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            {cpMsg && <div style={{ padding: '12px 16px', background: '#E8F5E9', color: '#2e7d32', borderRadius: 8, fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>{cpMsg}</div>}
            {cpError && <div style={{ padding: '12px 16px', background: '#FFEBEE', color: '#c62828', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>❌ {cpError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>舊密碼</label>
                <input type="password" value={cpOld} onChange={e => setCpOld(e.target.value)} placeholder="輸入目前嘅密碼" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>新密碼</label>
                <input type="password" value={cpNew} onChange={e => setCpNew(e.target.value)} placeholder="至少 6 個字元" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>確認新密碼</label>
                <input type="password" value={cpConfirm} onChange={e => setCpConfirm(e.target.value)} placeholder="再輸入一次新密碼" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} />
              </div>
            </div>
            <button onClick={handleChangePw} disabled={cpLoading} style={{ width: '100%', padding: 14, background: cpLoading ? '#a89888' : '#5c4a3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: cpLoading ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 600, marginTop: 20 }}>{cpLoading ? '處理中...' : '確認更改'}</button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderTop: '1px solid #f0ebe3', padding: '0 30px', display: 'flex', gap: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
       {[{ key: 'bookings', label: `📋 預約管理${stats.pending > 0 ? ` (${stats.pending})` : ''}` }, { key: 'timeslots', label: '🕐 時段管理' }, { key: 'blocked', label: '📅 封鎖日期' }, { key: 'templates', label: '📝 訊息模板' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '14px 24px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #5c4a3a' : '2px solid transparent', fontSize: 14, color: tab === t.key ? '#5c4a3a' : '#999', fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'bookings' && changeLog.length > 0 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)', borderBottom: '2px solid #66BB6A' }}>
          <div style={{ padding: '10px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflowX: 'auto' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2e7d32', whiteSpace: 'nowrap' }}>📝 最近操作 ({changeLog.length})</span>
              <span style={{ fontSize: 12, color: '#388E3C' }}>{changeLog[0]?.ts} — {changeLog[0]?.text}</span>
            </div>
            <button onClick={() => setChangeLog([])} style={{ padding: '4px 12px', background: '#fff', border: '1px solid #66BB6A', borderRadius: 4, color: '#2e7d32', cursor: 'pointer', fontSize: 12, fontFamily: font, whiteSpace: 'nowrap', marginLeft: 10 }}>✕ 清除</button>
          </div>
        </div>
      )}

      {pendingCount > 0 && tab === 'timeslots' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', borderBottom: '2px solid #FFB74D' }}>
          <div style={{ padding: '14px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#E65100', fontSize: 14, fontWeight: 600 }}>⏳「{activeStaff?.name}」{pendingCount} 個日期待同步</span>
              <button onClick={() => setShowPendingList(!showPendingList)} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #FFB74D', borderRadius: 4, color: '#E65100', cursor: 'pointer', fontSize: 12, fontFamily: font }}>{showPendingList ? '收起 ▲' : '查看 ▼'}</button>
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
                    <div style={{ fontSize: 13 }}><span style={{ color: '#5c4a3a', fontWeight: 600 }}>{date}</span><span style={{ color: '#999', marginLeft: 6 }}>週{DAYS[new Date(date + 'T00:00:00').getDay()]}</span><span style={{ color: times.size > 0 ? '#4CAF50' : '#f44336', marginLeft: 10, fontSize: 12 }}>{times.size > 0 ? `${times.size} 個時段` : '全日關閉'}</span></div>
                    <button onClick={() => removePendingDate(date)} style={smallBtn('#ffebee', '#c62828', '#ffcdd2')}>移除</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px' }}>

        {tab === 'bookings' && (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: '今日預約', value: stats.today, sub: `💰 $${stats.todayRev}`, color: '#FF9800' },
              { label: '本月預約', value: stats.month, sub: `💰 $${stats.monthRev}`, color: '#2196F3' },
              { label: nextMonthLabel, value: stats.nextMonth, sub: `💰 $${stats.nextMonthRev}`, color: '#9C27B0' },
              { label: '待處理', value: stats.pending, sub: null, color: stats.pending > 0 ? '#f44336' : '#999', action: stats.pending > 0 },
              { label: '總預約數', value: stats.total, sub: null, color: '#5c4a3a' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', padding: '18px 16px', borderRadius: 12, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', borderLeft: `4px solid ${s.color}` }}>
                <p style={{ color: '#999', fontSize: 12, margin: '0 0 6px' }}>{s.label}</p>
                <p style={{ fontSize: 28, fontWeight: 'bold', color: s.color, margin: 0 }}>{s.value}</p>
                {s.sub && <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>{s.sub}</p>}
                {s.action && <button onClick={confirmAllPending} style={{ marginTop: 8, padding: '4px 12px', borderRadius: 4, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: font, fontWeight: 600 }}>✅ 一鍵全確認</button>}
              </div>))}
          </div>

          <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
            {[['list', '📋 列表模式'], ['schedule', '📅 月曆日程']].map(([k, l]) => (
              <button key={k} onClick={() => setViewMode(k)} style={{ padding: '12px 24px', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: viewMode === k ? 700 : 400, background: viewMode === k ? '#5c4a3a' : '#fff', color: viewMode === k ? '#fff' : '#5c4a3a', borderRadius: k === 'list' ? '10px 0 0 10px' : '0 10px 10px 0', boxShadow: viewMode === k ? '0 2px 8px rgba(92,74,58,0.3)' : '0 2px 10px rgba(0,0,0,0.05)' }}>{l}</button>
            ))}
          </div>

          {viewMode === 'list' && (<>
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: 12 }}><input type="text" placeholder="🔍 搜尋客人名稱或電話..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
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
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}><option value="all">全部狀態</option><option value="pending">待確認</option><option value="confirmed">已確認</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select>
                <select value={filterTech} onChange={e => setFilterTech(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}><option value="all">全部技師</option>{techList.map(t => <option key={t} value={t}>{t}</option>)}</select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#999', cursor: 'pointer' }}><input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> 自動刷新</label>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {hasFilters && <button onClick={clearFilters} style={{ padding: '6px 14px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#999', fontSize: 12, fontFamily: font }}>✕ 清除篩選</button>}
                  <button onClick={fetchBookings} style={{ padding: '6px 14px', background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄 刷新</button>
                </div>
              </div>
            </div>
            {hasFilters && <div style={{ padding: '10px 16px', marginBottom: 12, borderRadius: 8, background: '#FFF8E1', border: '1px solid #FFE082', fontSize: 13, color: '#F57F17' }}>🔍 篩選結果：{filteredBookings.length} / {allBookings.length} 筆</div>}
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: '#5c4a3a', fontSize: 17 }}>預約列表 ({filteredBookings.length})</h2>
                {autoRefresh && <span style={{ fontSize: 11, color: '#999' }}>🔄 每 30 秒自動刷新</span>}
              </div>
              {bkLoading ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>載入中...</p> : filteredBookings.length === 0 ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>{hasFilters ? '搵唔到符合條件嘅預約' : '暫無預約'}</p> : isMobile ? (
                <div style={{ padding: '12px 16px' }}>{filteredBookings.map(b => (
                  <div key={b.id} onClick={() => openBooking(b)} style={{ background: rowBg(b.status), borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid #e8e0d8', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div><span style={{ fontWeight: 700, fontSize: 15, color: '#5c4a3a' }}>{b.customer_name}</span><div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{b.customer_phone}</div></div>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#fff', background: statusColor(b.status), fontWeight: 600 }}>{statusText(b.status)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>📅 {b.booking_date}　🕐 {b.booking_time}　👤 {b.technician_label || '未指定'}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#5c4a3a' }}>{b.service_name}</span>
                      <span style={{ fontSize: 17, fontWeight: 700, color: '#5c4a3a' }}>${b.total_price}</span>
                    </div>
                    {b.status === 'pending' && <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                      <button onClick={e => { e.stopPropagation(); updateStatus(b.id, 'confirmed'); }} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: 600 }}>✅ 快速確認</button>
                    </div>}
                  </div>
                ))}</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead><tr style={{ background: '#f9f6f3' }}>{['日期', '時間', '服務', '客人', '電話', '技師', '金額', '狀態', '操作'].map(h => <th key={h} style={{ padding: '12px 10px', textAlign: 'left', color: '#5c4a3a', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>{h}</th>)}</tr></thead>
                    <tbody>{filteredBookings.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0', background: rowBg(b.status), cursor: 'pointer' }} onClick={() => openBooking(b)}>
                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{b.booking_date}<div style={{ fontSize: 11, color: '#999' }}>週{DAYS[new Date(b.booking_date + 'T00:00:00').getDay()]}</div></td>
                        <td style={{ padding: '12px 10px', fontWeight: 600 }}>{b.booking_time}</td>
                        <td style={{ padding: '12px 10px' }}>{b.service_name}{b.variant_label && <div style={{ fontSize: 12, color: '#999' }}>{b.variant_label}</div>}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 500 }}>{b.customer_name}</td>
                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{b.customer_phone}{b.customer_phone && <a href={waLink(b.customer_phone)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ marginLeft: 6, textDecoration: 'none', fontSize: 14 }}>💬</a>}</td>
                        <td style={{ padding: '12px 10px' }}>{b.technician_label || <span style={{ color: '#ccc' }}>-</span>}</td>
                        <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: 15 }}>${b.total_price}</td>
                        <td style={{ padding: '12px 10px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#fff', background: statusColor(b.status), fontWeight: 600 }}>{statusText(b.status)}</span></td>
                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
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

          {viewMode === 'schedule' && (<>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button onClick={prevSchedCal} style={navBtn}>◀</button>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#5c4a3a' }}>{schedYear}年 {schedMonth + 1}月</span>
                <button onClick={nextSchedCal} style={navBtn}>▶</button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <button onClick={schedToToday} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>📍 今日</button>
                <button onClick={() => { setSchedRefreshKey(k => k + 1); showToast('🔄 已刷新'); }} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font }}>🔄 刷新</button>
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#999', cursor: 'pointer', marginLeft: 'auto' }}><input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} /> 顯示已取消</label>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, color: '#999', flexWrap: 'wrap' }}>
                {staffList.map(s => <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4CAF50', display: 'inline-block', boxShadow: '0 0 0 1px #ccc' }} />{s.name}</span>)}
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ddd', display: 'inline-block', boxShadow: '0 0 0 1px #ccc' }} />未開放</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {DAYS.map((d, i) => <div key={`h${i}`} style={{ padding: '10px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: i === 0 || i === 6 ? '#c62828' : '#5c4a3a', background: '#f9f6f3', borderRadius: 6 }}>{d}</div>)}
                {schedCalDays.map((day, i) => {
                  if (!day) return <div key={`e${i}`} style={{ minHeight: isMobile ? 52 : 90 }} />;
                  const ds = toDS(schedYear, schedMonth, day); const isSel = ds === schedDate; const isToday = ds === todayStr;
                  const bk = monthBkStats[ds]; const avail = monthAvail[ds]; const isPast = ds < todayStr; const dow = new Date(ds + 'T00:00:00').getDay();
                  return (
                    <div key={`d${i}`} onClick={() => setSchedDate(ds)} style={{ minHeight: isMobile ? 52 : 90, padding: isMobile ? '4px 3px' : '6px 8px', borderRadius: 8, cursor: 'pointer', border: isSel ? '3px solid #FF9800' : '1px solid #e8e0d8', background: isSel ? '#FFF8E1' : isToday ? '#FFFDE7' : isPast ? '#fafafa' : '#fff', transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: isMobile ? 1 : 3, opacity: isPast ? 0.6 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: isToday || isSel ? 700 : 500, fontSize: isMobile ? 13 : 15, color: isToday ? '#FF9800' : (dow === 0 || dow === 6) ? '#c62828' : '#5c4a3a' }}>{day}</span>
                        {bk?.pending > 0 && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF9800' }} />}
                      </div>
                      {staffList.length > 0 && <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{staffList.map(s => <span key={s.id} title={s.name} style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8, borderRadius: '50%', background: avail?.[s.id] === 'available' ? '#4CAF50' : '#ddd' }} />)}</div>}
                      {bk && bk.total > 0 ? <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 600, color: '#5c4a3a', lineHeight: 1.3 }}>{bk.total} 個預約{!isMobile && <div style={{ fontWeight: 400, color: '#999', fontSize: 11 }}>${bk.revenue}</div>}</div> : (!isPast && avail && Object.values(avail).some(s => s === 'available')) ? <div style={{ fontSize: isMobile ? 9 : 11, color: '#a5d6a7' }}>{isMobile ? '✓' : '可預約'}</div> : null}
                    </div>);
                })}
              </div>
            </div>

            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#5c4a3a' }}>{schedDate}（星期{DAYS[new Date(schedDate + 'T00:00:00').getDay()]}）</div>
                  {schedDate === todayStr && <span style={{ padding: '2px 10px', background: '#FF9800', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>今日</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {dayStats.pending > 0 && <button onClick={confirmDayPending} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: 600 }}>✅ 確認當日全部 ({dayStats.pending})</button>}
                  <button onClick={() => loadDaySlots(schedDate)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '12px 16px', background: '#f9f6f3', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
                <span>📊 預約 <b style={{ color: '#5c4a3a', fontSize: 18 }}>{dayStats.total}</b></span>
                <span>💰 收入 <b style={{ color: '#5c4a3a', fontSize: 18 }}>${dayStats.revenue}</b></span>
                {dayStats.pending > 0 && <span style={{ color: '#FF9800' }}>⏳ 待確認 <b>{dayStats.pending}</b></span>}
                {dayStats.confirmed > 0 && <span style={{ color: '#4CAF50' }}>✅ 已確認 <b>{dayStats.confirmed}</b></span>}
                {dayStats.completed > 0 && <span style={{ color: '#2196F3' }}>✔️ 已完成 <b>{dayStats.completed}</b></span>}
              </div>
              {dayLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> :
               timetableTimes.length === 0 && dayBks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}><div style={{ fontSize: 40, marginBottom: 10 }}>📭</div><div style={{ fontSize: 14 }}>此日未有開放時段或預約</div><div style={{ fontSize: 12, marginTop: 6 }}>請到「🕐 時段管理」設定員工開放時段</div></div>
              ) : timetableStaff.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>未有員工</div>
              ) : (
                <div style={{ overflowX: 'auto', border: '1px solid #e8e0d8', borderRadius: 10 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: timetableStaff.length * 160 + 80 }}>
                    <thead><tr style={{ background: '#f9f6f3' }}>
                      <th style={{ padding: '12px 8px', borderBottom: '2px solid #e8e0d8', fontSize: 13, color: '#5c4a3a', fontWeight: 600, position: 'sticky', left: 0, background: '#f9f6f3', zIndex: 2, minWidth: 65, textAlign: 'center' }}>時間</th>
                      {timetableStaff.map(s => {
                        const cnt = dayBks.filter(b => (b.technician_label || '未指定') === s.name).length;
                        const slotCnt = s.id ? (daySlots[s.id]?.size || 0) : 0;
                        return <th key={s.name} style={{ padding: '12px 8px', borderBottom: '2px solid #e8e0d8', borderLeft: '1px solid #e8e0d8', fontSize: 14, color: '#5c4a3a', fontWeight: 700, minWidth: 150, textAlign: 'center' }}>{s.name}<div style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>{s.id && <span style={{ color: slotCnt > 0 ? '#4CAF50' : '#ccc' }}>{slotCnt} 時段</span>}{cnt > 0 && <span style={{ color: '#FF9800', marginLeft: 6 }}>{cnt} 預約</span>}</div></th>;
                      })}
                    </tr></thead>
                    <tbody>{timetableTimes.map((time, ti) => {
                      const isHour = time.endsWith(':00');
                      return (
                        <tr key={time} style={{ borderBottom: isHour ? '2px solid #e8e0d8' : '1px solid #f0ebe3' }}>
                          <td style={{ padding: '4px 6px', fontSize: 13, color: isHour ? '#5c4a3a' : '#bbb', fontWeight: isHour ? 700 : 400, position: 'sticky', left: 0, background: '#faf8f5', zIndex: 1, borderRight: '2px solid #e8e0d8', textAlign: 'center', verticalAlign: 'top', height: 52 }}>{time}</td>
                          {timetableStaff.map(s => {
                            const bks = timetableGrid[`${time}|${s.name}`] || [];
                            const hasSlot = s.id ? daySlots[s.id]?.has(time) : false;
                            return (
                              <td key={s.name} style={{ padding: '3px 5px', borderLeft: '1px solid #f0ebe3', verticalAlign: 'top', height: 52, background: bks.length > 0 ? 'transparent' : hasSlot ? '#f0faf0' : (ti % 2 === 0 ? '#fafafa' : '#f5f5f5') }}>
                                {bks.length > 0 ? bks.map(b => (
                                  <div key={b.id} onClick={() => openBooking(b)} style={{ padding: '5px 8px', borderRadius: 6, marginBottom: 2, cursor: 'pointer', borderLeft: `4px solid ${statusColor(b.status)}`, background: rowBg(b.status), fontSize: 12, lineHeight: 1.4 }} onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)'} onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: 700, color: '#5c4a3a', fontSize: 13 }}>{b.customer_name}</span>
                                      {b.status === 'pending' && <button onClick={e => { e.stopPropagation(); updateStatus(b.id, 'confirmed'); }} style={{ padding: '2px 8px', borderRadius: 4, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 10, fontFamily: font, fontWeight: 600 }}>✅</button>}
                                    </div>
                                    <div style={{ color: '#888', marginTop: 1 }}>{b.service_name}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                      <span style={{ color: statusColor(b.status), fontWeight: 600, fontSize: 11 }}>{statusText(b.status)}</span>
                                      <span style={{ fontWeight: 700, color: '#5c4a3a' }}>${b.total_price}</span>
                                    </div>
                                  </div>
                                )) : hasSlot ? <div style={{ color: '#c8e6c9', fontSize: 11, textAlign: 'center', paddingTop: 16 }}>空</div> : null}
                              </td>);
                          })}
                        </tr>);
                    })}</tbody>
                  </table>
                </div>
              )}
              <div style={{ marginTop: 10, fontSize: 11, color: '#999', display: 'flex', justifyContent: 'space-between' }}>
                <span>💡 點擊預約卡片查看詳情 / 改期</span>
                <span>🟢 可預約　⬜ 未開放</span>
              </div>
            </div>
          </>)}
        </>)}

        {tab === 'timeslots' && (<>
          <div style={{ ...card, background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
            <div style={{ fontSize: 14, color: '#2e7d32', lineHeight: 2 }}>💡 <b>使用流程：</b>選擇員工 → 月曆選日期 → 套用模板 → 按「<b>確認同步到前台</b>」<br />🔒 每個員工有獨立嘅時間表。同步後日程表月曆會即時更新。</div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><div style={sTitle}>👤 員工時間表</div><span style={{ fontSize: 12, color: '#999' }}>每個員工有獨立嘅時段設定</span></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              {staffList.map(s => <button key={s.id} onClick={() => switchStaff(s)} style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: activeStaff?.id === s.id ? 700 : 400, border: activeStaff?.id === s.id ? '2px solid #5c4a3a' : '2px solid #d0c8bc', background: activeStaff?.id === s.id ? '#5c4a3a' : '#fff', color: activeStaff?.id === s.id ? '#fff' : '#5c4a3a' }}>{s.name}{activeStaff?.id === s.id && ' ✓'}</button>)}
              {!showAddStaff ? <button onClick={() => setShowAddStaff(true)} style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: font, border: '2px dashed #c0b8aa', background: 'transparent', color: '#999' }}>＋ 新增員工</button> : (
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
                  <button onClick={saveStaffName} style={smallBtn('#5c4a3a', '#fff')}>儲存</button><button onClick={() => setEditStaffId(null)} style={smallBtn('#fff', '#999', '#ccc')}>取消</button>
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
                <div style={sTitle}>📅 選擇日期</div><div style={sDesc}>點日期查看「{activeStaff.name}」嘅時段，可多選後套用模板</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><button onClick={prevCal} style={navBtn}>◀</button><span style={{ fontSize: 17, fontWeight: 600, color: '#5c4a3a' }}>{calYear}年 {calMonth + 1}月</span><button onClick={nextCal} style={navBtn}>▶</button></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                  {DAYS.map((d, i) => <button key={`h${i}`} onClick={() => toggleWeekdayCol(i)} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: isColAllSel(i) ? '#5c4a3a' : '#f0ebe3', color: isColAllSel(i) ? '#fff' : '#5c4a3a', fontSize: 13, fontWeight: 600, fontFamily: font }}>{d}</button>)}
                  {calDays.map((day, i) => {
                    if (!day) return <div key={`e${i}`} />;
                    const ds = toDS(calYear, calMonth, day), sel = selDates.has(ds), isActive = ds === activeDate, isToday = ds === todayStr, hasPend = !!pending[ds];
                    return <button key={`d${i}`} onClick={() => toggleDate(day)} style={{ padding: '12px 4px', borderRadius: 8, cursor: 'pointer', position: 'relative', border: isActive ? '3px solid #FF9800' : sel ? '2px solid #5c4a3a' : '2px solid transparent', background: sel ? (isActive ? '#4a3a2a' : '#5c4a3a') : hasPend ? '#e8f5e9' : 'transparent', color: sel ? '#fff' : isToday ? '#FF9800' : '#666', fontSize: 14, fontWeight: isToday || sel || isActive ? 700 : 400, fontFamily: font }}>{day}{hasPend && !sel && <div style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, background: '#4CAF50', borderRadius: '50%' }} />}</button>;
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                  {[['平日', d => d >= 1 && d <= 5], ['週末', d => d === 0 || d === 6], ['全月', () => true]].map(([l, fn]) => <button key={l} onClick={() => selectByFilter(fn)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>{l}</button>)}
                  <button onClick={() => setSelDates(new Set())} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#999', cursor: 'pointer', fontSize: 12, fontFamily: font }}>清除選擇</button>
                </div>
                {selDates.size > 0 && <div style={{ marginTop: 14, padding: '10px 14px', background: '#f0ebe3', borderRadius: 8, fontSize: 13, color: '#5c4a3a' }}>已選 <b>{selDates.size}</b> 日</div>}
              </div>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a' }}>🕐 {activeStaff.name} — {activeDate}（週{DAYS[activeDow]}）</div>
                  <div style={{ display: 'flex', gap: 6 }}><button onClick={() => setAllTimes(true)} style={smallBtn('#e8f5e9', '#2e7d32')}>全開</button><button onClick={() => setAllTimes(false)} style={smallBtn('#ffebee', '#c62828')}>全關</button><button onClick={() => loadActiveFromDB(activeDate)} style={smallBtn('#f5f0eb', '#5c4a3a')}>🔄</button></div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: '#f9f6f3', border: '1px solid #e8e0d8' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
                    <span style={{ color: '#5c4a3a', fontWeight: 500 }}>範圍</span>
                    <select value={gridStart} onChange={e => setGridStart(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font }}>{ALL_TIMES_15.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <span style={{ color: '#999' }}>至</span>
                    <select value={gridEnd} onChange={e => setGridEnd(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font }}>{ALL_TIMES_15.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <button onClick={autoFitRange} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #a5d6a7', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 12, fontFamily: font }}>📐</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
                    <span style={{ color: '#5c4a3a', fontWeight: 500, fontSize: 13 }}>間隔</span>
                    {INTERVAL_OPTIONS.map(m => <button key={m} onClick={() => setGridInterval(m)} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: font, background: gridInterval === m ? '#5c4a3a' : '#e8e0d8', color: gridInterval === m ? '#fff' : '#5c4a3a', fontWeight: gridInterval === m ? 600 : 400 }}>{m}分</button>)}
                  </div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12, background: isInPending ? '#FFF3E0' : dbStatus === 'available' ? '#e8f5e9' : '#f5f5f5', color: isInPending ? '#E65100' : dbStatus === 'available' ? '#2e7d32' : '#999', border: `1px solid ${isInPending ? '#FFB74D' : dbStatus === 'available' ? '#a5d6a7' : '#e0e0e0'}` }}>
                  {isInPending ? `⏳ 未同步 — ${displayTimes.size}/${gridTimes.length} 時段開放` : dbStatus === 'available' ? `✅ 已同步 — ${displayTimes.size} 時段` : '🔒 未開放'}
                </div>
                {extraDbTimes.length > 0 && <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12, background: '#FFF8E1', border: '1px solid #FFE082', color: '#F57F17' }}>⚠️ {extraDbTimes.length} 個時段唔喺範圍內</div>}
                {gridLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${gridInterval >= 60 ? '80px' : '68px'}, 1fr))`, gap: 5, maxHeight: 480, overflowY: 'auto' }}>
                    {gridTimes.map(t => { const isOn = displayTimes.has(t); return <button key={t} onClick={() => toggleTime(t)} style={{ padding: '10px 4px', borderRadius: 6, border: `2px solid ${isOn ? '#5c4a3a' : '#e0d8cc'}`, background: isOn ? '#5c4a3a' : '#faf6f0', color: isOn ? '#fff' : '#c0b8aa', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font }}>{t}</button>; })}
                  </div>
                )}
              </div>
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}>
                <div style={sTitle}>⚡ 套用模板到「{activeStaff.name}」</div>
                {selDates.size > 0 ? <span style={{ fontSize: 12, color: '#4CAF50', fontWeight: 600 }}>已選 {selDates.size} 日</span> : <span style={{ fontSize: 12, color: '#c00' }}>請先選擇日期</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {templates.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#faf6f0', border: '1px solid #e8e0d8', opacity: selDates.size === 0 ? 0.5 : 1, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span><span style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', minWidth: 52 }}>{t.label}</span>
                    {t.from !== null ? <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1 1 auto', minWidth: 0 }}>
                      <select value={t.from} onChange={e => setTemplates(prev => prev.map((tt, idx) => idx === i ? { ...tt, from: e.target.value } : tt))} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}</select>
                      <span style={{ color: '#999', fontSize: 11 }}>–</span>
                      <select value={t.to} onChange={e => setTemplates(prev => prev.map((tt, idx) => idx === i ? { ...tt, to: e.target.value } : tt))} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}</select>
                    </div> : <span style={{ flex: '1 1 auto', fontSize: 12, color: '#999' }}>全日關閉</span>}
                    <button onClick={() => applyTemplateLocal(t)} disabled={selDates.size === 0} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontFamily: font, fontWeight: 600, background: selDates.size === 0 ? '#ddd' : '#5c4a3a', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer' }}>套用</button>
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed #d0c8bc', marginTop: 6, paddingTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#fff5f5', border: '1px solid #ffcdd2', opacity: selDates.size === 0 ? 0.5 : 1, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18 }}>🍽️</span><span style={{ fontSize: 13, fontWeight: 600, color: '#c62828', minWidth: 52 }}>休息</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1 1 auto', minWidth: 0 }}>
                      <select value={breakFrom} onChange={e => setBreakFrom(e.target.value)} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                      <span style={{ color: '#999', fontSize: 11 }}>–</span>
                      <select value={breakTo} onChange={e => setBreakTo(e.target.value)} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    </div>
                    <button onClick={applyBreakLocal} disabled={selDates.size === 0} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontFamily: font, fontWeight: 600, background: selDates.size === 0 ? '#ddd' : '#e53935', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer' }}>扣除</button>
                  </div>
                </div>
              </div>
            </div>
          </>)}
        </>)}

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

        {tab === 'templates' && (
          <div style={{
            background: '#fff', borderRadius: 14, padding: 20,
            margin: '0 auto', maxWidth: 800,
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#5c4a3a', fontSize: 18 }}>📝 WhatsApp 訊息模板</h3>
            <div style={{
              background: '#fff8e1', borderRadius: 10, padding: 12,
              marginBottom: 16, fontSize: 13
            }}>
              <strong>📌 可用變數（會自動替換成客人資料）：</strong><br/>
              <code>{'{customer_name}'}</code> 客人名 &nbsp;
              <code>{'{booking_date}'}</code> 日期 &nbsp;
              <code>{'{booking_time}'}</code> 時間 &nbsp;
              <code>{'{service_name}'}</code> 服務 &nbsp;
              <code>{'{technician_label}'}</code> 技師 &nbsp;
              <code>{'{total_price}'}</code> 價錢 &nbsp;
              <code>{'{old_date}'}</code> 原日期 &nbsp;
              <code>{'{old_time}'}</code> 原時間
            </div>

            {msgTemplates.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中... 或未有模板</p>
            ) : msgTemplates.map(tpl => (
              <div key={tpl.id} style={{
                marginBottom: 16, padding: 16, background: '#fafafa',
                borderRadius: 10, border: '1px solid #eee'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#5c4a3a' }}>{tpl.label}</div>
                <textarea
                  value={tpl.content}
                  onChange={e => setMsgTemplates(prev =>
                    prev.map(t => t.id === tpl.id ? { ...t, content: e.target.value } : t)
                  )}
                  style={{
                    width: '100%', minHeight: 120, padding: 10,
                    borderRadius: 8, border: '1px solid #ddd',
                    fontFamily: 'inherit', fontSize: 14, resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: '#999' }}>用 {'\\n'} 代表換行</span>
                  <button
                    onClick={() => saveTemplate(tpl.id, tpl.content)}
                    style={{
                      padding: '6px 20px', borderRadius: 8, border: 'none',
                      background: '#4CAF50', color: '#fff', cursor: 'pointer',
                      fontWeight: 600, fontFamily: font
                    }}
                  >💾 儲存</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
