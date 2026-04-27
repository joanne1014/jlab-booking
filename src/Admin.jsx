import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ═══ 全域變數（component 外面）═══
let authToken = null;
let onAuthExpired = null;

// ✅ FIX #1: 統一免 token 嘅 actions
const NO_AUTH_ACTIONS = ['login', 'recover', 'reset-via-token', 'recover-password'];

const apiCall = async (action, payload = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  // ✅ FIX #1: 用 array check 取代硬寫兩個 action
  if (authToken && !NO_AUTH_ACTIONS.includes(action)) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch('/api/admin', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, payload })
  });

  // ✅ FIX #1: 401 handler 同步更新
  if (res.status === 401 && !NO_AUTH_ACTIONS.includes(action)) {
    authToken = null;
    try { sessionStorage.removeItem('jlab_token'); } catch (_) {}
    if (onAuthExpired) onAuthExpired();
    throw new Error('登入已過期');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
};

// ✅ FIX #2: 刪除殘留 code，正確宣告 sbGet
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
  const [showHistory, setShowHistory] = useState(false);

  /* ═══ 前台管理 state ═══ */
  const [svcList, setSvcList] = useState([]);
  const [svcAddons, setSvcAddons] = useState([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [svcSubTab, setSvcSubTab] = useState('services');
  const [editSvc, setEditSvc] = useState(null);
  const [editSvcForm, setEditSvcForm] = useState({});
  const [editSvcVariants, setEditSvcVariants] = useState([]);
  const [editAddon, setEditAddon] = useState(null);
  const [editAddonForm, setEditAddonForm] = useState({});

  // ✅ FIX #3: todayStr 改做 state，過咗 12 點會自動更新
  const [todayStr, setTodayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const bookingCountRef = useRef(0);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  // ═══ 註冊 401 自動登出 callback ═══
  useEffect(() => {
    onAuthExpired = () => {
      setAuth(false);
      showToast('⚠️ 登入已過期，請重新登入');
    };
    return () => { onAuthExpired = null; };
  }, []);

  // ✅ FIX #3: 每分鐘檢查日期有冇跨日
  useEffect(() => {
    const id = setInterval(() => {
      setTodayStr(new Date().toISOString().split('T')[0]);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const toDS = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const navBtn = { padding: '8px 16px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, color: '#5c4a3a', fontFamily: font };
  const smallBtn = (bg, co, bd) => ({ padding: '6px 14px', borderRadius: 6, border: bd ? `1px solid ${bd}` : 'none', background: bg, color: co, cursor: 'pointer', fontSize: 12, fontFamily: font });
  const headerBtn = { padding: '8px 16px', background: 'transparent', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', color: '#666', fontFamily: font, fontSize: 13, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap' };

  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); h(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');
    if (accessToken && type === 'recovery') {
      setRecoveryToken(accessToken);
      setShowResetForm(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const handleResetNewPw = async () => {
    setResetPwError('');
    if (!resetNewPw || resetNewPw.length < 6) { setResetPwError('新密碼至少要 6 個字元'); return; }
    if (resetNewPw !== resetConfirmPw) { setResetPwError('兩次密碼不一致'); return; }
    setResetPwLoading(true);
    try {
      await apiCall('reset-via-token', { token: recoveryToken, newPassword: resetNewPw });
      showToast('✅ 密碼已重設，請重新登入');
      setShowResetForm(false); setRecoveryToken(''); setResetNewPw(''); setResetConfirmPw('');
    } catch (err) { setResetPwError(err.message || '重設失敗'); }
    setResetPwLoading(false);
  };

  useEffect(() => {
    const saved = sessionStorage.getItem('jlab_token');
    if (saved) {
      authToken = saved;
      apiCall('verify')
        .then(() => {
          setAuth(true);
          fetchBookings();
          fetchBlocked();
          fetchStaff();
          fetchServices();
          fetchAddons();
        })
        .catch(() => {
          authToken = null;
          sessionStorage.removeItem('jlab_token');
        });
    }
  }, []);

  // ✅ FIX #4: 新增 handleChangePw（之前 JSX 用到但冇定義）
  const handleChangePw = async () => {
    setCpError(''); setCpMsg('');
    if (!cpOld) { setCpError('請輸入舊密碼'); return; }
    if (!cpNew || cpNew.length < 6) { setCpError('新密碼至少要 6 個字元'); return; }
    if (cpNew !== cpConfirm) { setCpError('兩次密碼不一致'); return; }
    setCpLoading(true);
    try {
      await apiCall('change-password', { oldPassword: cpOld, newPassword: cpNew });
      setCpMsg('✅ 密碼已更改成功');
      setCpOld(''); setCpNew(''); setCpConfirm('');
    } catch (err) {
      setCpError(err.message || '更改失敗');
    }
    setCpLoading(false);
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
  const nextMonthLabel = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getMonth() + 1}月`; }, []);

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

  /* ═══ WhatsApp 通知模板 ═══ */
  const [msgTemplates, setMsgTemplates] = useState([]);
  useEffect(() => {
    if (auth) { sbGet('notification_templates?order=id').then(data => { if (data) setMsgTemplates(data); }).catch(e => console.error('載入模板失敗', e)); }
  }, [auth]);
  const fillTemplate = (templateKey, booking, extras = {}) => {
    const tpl = msgTemplates.find(t => t.key === templateKey);
    if (!tpl) return '';
    const vars = { customer_name: booking.customer_name || '', booking_date: booking.booking_date || '', booking_time: booking.booking_time || '', service_name: booking.service_name || '未指定', technician_label: booking.technician_label || '待定', total_price: booking.total_price || '—', old_date: extras.oldDate || '', old_time: extras.oldTime || '' };
    return tpl.content.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
  };
  const sendWhatsApp = (phone, message) => {
    if (!phone) { showToast('⚠️ 呢個客人冇留電話號碼'); return; }
    const cleaned = phone.replace(/[^0-9]/g, '');
    const num = cleaned.length <= 8 ? '852' + cleaned : cleaned;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank');
  };
  const saveTemplate = async (id, newContent) => {
    try { await sbPatch(`notification_templates?id=eq.${id}`, { content: newContent, updated_at: new Date().toISOString() }); setMsgTemplates(prev => prev.map(t => t.id === id ? { ...t, content: newContent } : t)); showToast('✅ 模板已儲存'); } catch (e) { showToast('❌ 儲存失敗'); }
  };

  /* ═══ 前台管理 functions ═══ */
  const fetchServices = async () => {
    setSvcLoading(true);
    try { const data = await sbGet('services?order=sort_order,created_at'); setSvcList(data || []); } catch (e) { console.error(e); }
    setSvcLoading(false);
  };
  const fetchAddons = async () => {
    try { const data = await sbGet('service_addons?order=sort_order,created_at'); setSvcAddons(data || []); } catch (e) { console.error(e); }
  };
  const openEditSvc = async (svc) => {
    const form = svc ? { ...svc } : { name: '', description: '', base_price: 0, duration_minutes: 60, image_url: '', category: '', is_active: true, sort_order: svcList.length };
    setEditSvcForm(form);
    if (svc?.id) {
      try { const v = await sbGet(`service_variants?service_id=eq.${svc.id}&order=sort_order`); setEditSvcVariants(v || []); } catch (_) { setEditSvcVariants([]); }
    } else { setEditSvcVariants([]); }
    setEditSvc(svc || 'new');
  };

  // ✅ FIX #5: 修正 saveSvc — 新增服務時 variants 都會儲存
  const saveSvc = async () => {
    const f = editSvcForm;
    if (!f.name?.trim()) return showToast('❌ 請輸入服務名稱');
    try {
      let serviceId = f.id; // 如果係 edit，已有 id

      if (f.id) {
        // 更新現有服務
        const { id, created_at, ...rest } = f;
        await sbPatch(`services?id=eq.${id}`, rest);
        setSvcList(prev => prev.map(s => s.id === id ? { ...s, ...rest } : s));
      } else {
        // 新增服務 → 攞返新 ID
        const { id, created_at, ...rest } = f;
        const data = await sbPost('services', [rest]);
        if (data?.length) {
          serviceId = data[0].id;
          setSvcList(prev => [...prev, ...data]);
        }
      }

      // 儲存 variants（新增 + 編輯都處理）
      if (serviceId) {
        // 刪除已移除嘅 variants（只有 edit 時需要）
        if (f.id) {
          const existIds = editSvcVariants.filter(v => v.id).map(v => v.id);
          const origIds = (await sbGet(`service_variants?service_id=eq.${f.id}&select=id`) || []).map(v => v.id);
          const toDelete = origIds.filter(oid => !existIds.includes(oid));
          for (const did of toDelete) await sbDel(`service_variants?id=eq.${did}`);
        }
        // upsert variants
        for (const v of editSvcVariants) {
          if (v.id) {
            const { id, created_at, ...rest } = v;
            await sbPatch(`service_variants?id=eq.${id}`, rest);
          } else {
            await sbPost('service_variants', [{ ...v, service_id: serviceId }]);
          }
        }
      }

      setEditSvc(null);
      showToast('✅ 已儲存服務');
      fetchServices();
    } catch (e) { showToast('❌ 儲存失敗：' + e.message); }
  };

  const deleteSvc = async (id) => {
    if (!window.confirm('確定刪除此服務？相關嘅選項變體都會一併刪除。')) return;
    try {
      await sbDel(`service_variants?service_id=eq.${id}`);
      await sbDel(`services?id=eq.${id}`);
      setSvcList(prev => prev.filter(s => s.id !== id));
      showToast('✅ 已刪除');
    } catch (e) { showToast('❌ 刪除失敗'); }
  };
  const toggleSvcActive = async (svc) => {
    try {
      await sbPatch(`services?id=eq.${svc.id}`, { is_active: !svc.is_active });
      setSvcList(prev => prev.map(s => s.id === svc.id ? { ...s, is_active: !svc.is_active } : s));
      showToast(svc.is_active ? '已下架' : '已上架');
    } catch (e) { showToast('❌ 更新失敗'); }
  };
  const openEditAddon = (addon) => {
    setEditAddonForm(addon ? { ...addon } : { name: '', price: 0, description: '', is_active: true, sort_order: svcAddons.length });
    setEditAddon(addon || 'new');
  };
  const saveAddon = async () => {
    const f = editAddonForm;
    if (!f.name?.trim()) return showToast('❌ 請輸入附加項目名稱');
    try {
      if (f.id) { const { id, created_at, ...rest } = f; await sbPatch(`service_addons?id=eq.${id}`, rest); setSvcAddons(prev => prev.map(a => a.id === id ? { ...a, ...rest } : a)); }
      else { const data = await sbPost('service_addons', [f]); if (data?.length) setSvcAddons(prev => [...prev, ...data]); }
      setEditAddon(null); showToast('✅ 已儲存');
    } catch (e) { showToast('❌ 儲存失敗'); }
  };
  const deleteAddon = async (id) => {
    if (!window.confirm('確定刪除此附加項目？')) return;
    try { await sbDel(`service_addons?id=eq.${id}`); setSvcAddons(prev => prev.filter(a => a.id !== id)); showToast('✅ 已刪除'); } catch (e) { showToast('❌ 刪除失敗'); }
  };
  const toggleAddonActive = async (addon) => {
    try { await sbPatch(`service_addons?id=eq.${addon.id}`, { is_active: !addon.is_active }); setSvcAddons(prev => prev.map(a => a.id === addon.id ? { ...a, is_active: !addon.is_active } : a)); } catch (e) { showToast('❌ 更新失敗'); }
  };
  const moveSvc = async (idx, dir) => {
    const arr = [...svcList];
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    arr.forEach((s, i) => s.sort_order = i);
    setSvcList(arr);
    try { for (const s of arr) await sbPatch(`services?id=eq.${s.id}`, { sort_order: s.sort_order }); } catch (_) {}
  };

  /* ═══ Booking actions ═══ */
  const startResched = () => { if (!selectedBooking) return; setReschedMode(true); setReschedDate(selectedBooking.booking_date); setReschedTime(selectedBooking.booking_time?.slice(0, 5) || ''); setReschedTech(selectedBooking.technician_label || ''); loadReschedSlots(selectedBooking.booking_date); };
  const loadReschedSlots = async (date) => { try { const data = await sbGet(`enabled_timeslots?slot_date=eq.${date}&order=slot_time`); const map = {}; (data || []).forEach(s => { const sid = s.staff_id; if (!map[sid]) map[sid] = new Set(); map[sid].add(s.slot_time?.slice(0, 5)); }); setReschedSlots(map); } catch (e) { setReschedSlots({}); } };
  const handleReschedDateChange = (date) => { setReschedDate(date); setReschedTime(''); loadReschedSlots(date); };
  const saveResched = async () => {
    if (!selectedBooking || !reschedDate || !reschedTime) return showToast('❌ 請選擇日期同時間');
    if (isTimeConflict) return showToast('❌ 此時段已有其他預約');
    setReschedLoading(true);
    try {
      const oldDate = selectedBooking.booking_date; const oldTime = selectedBooking.booking_time;
      const updates = { booking_date: reschedDate, booking_time: reschedTime };
      if (reschedTech) updates.technician_label = reschedTech;
      await sbPatch(`bookings?id=eq.${selectedBooking.id}`, updates);
      const updatedBooking = { ...selectedBooking, ...updates };
      setAllBookings(prev => prev.map(b => b.id === selectedBooking.id ? updatedBooking : b));
      setSelectedBooking(updatedBooking); setReschedMode(false);
      logChange(`✏️ 改期 ${selectedBooking.customer_name}：${oldDate} ${oldTime} → ${reschedDate} ${reschedTime}`);
      showToast('✅ 已更改預約時間');
      const ask = window.confirm('📲 要唔要 WhatsApp 通知客人改期？');
      if (ask) { const msg = fillTemplate('rescheduled', updatedBooking, { oldDate, oldTime }); sendWhatsApp(selectedBooking.customer_phone, msg); }
    } catch (e) { showToast('❌ 更改失敗'); }
    setReschedLoading(false);
  };
  const updateStatus = async (id, s) => {
    const b = allBookings.find(x => x.id === id);
    try { await sbPatch(`bookings?id=eq.${id}`, { status: s }); setAllBookings(prev => prev.map(x => x.id === id ? { ...x, status: s } : x)); logChange(`${statusText(s)} — ${b?.customer_name} ${b?.booking_date} ${b?.booking_time}`); showToast(`✅ 狀態已更新為「${statusText(s)}」`); } catch (e) { showToast('❌ 更新失敗'); }
  };
  const deleteBooking = async (id) => {
    if (!window.confirm('確定要刪除？')) return;
    const b = allBookings.find(x => x.id === id);
    try { await sbDel(`bookings?id=eq.${id}`); setAllBookings(prev => prev.filter(x => x.id !== id)); logChange(`🗑️ 已刪除 — ${b?.customer_name} ${b?.booking_date} ${b?.booking_time}`); showToast('✅ 已刪除'); } catch (e) { console.error(e); }
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
      if (s === 'confirmed' || s === 'cancelled') {
        const ask = window.confirm(`📲 要唔要 WhatsApp 通知 ${selectedBooking.customer_name}？`);
        if (ask) { const msg = fillTemplate(s, updated); sendWhatsApp(selectedBooking.customer_phone, msg); }
      }
    } catch (e) { showToast('❌ 更新失敗'); }
  };
  const modalDelete = async () => {
    if (!selectedBooking || !window.confirm('確定要刪除？')) return;
    try { logChange(`🗑️ 已刪除 — ${selectedBooking.customer_name} ${selectedBooking.booking_date} ${selectedBooking.booking_time}`); await sbDel(`bookings?id=eq.${selectedBooking.id}`); setAllBookings(prev => prev.filter(b => b.id !== selectedBooking.id)); closeBooking(); showToast('✅ 已刪除'); } catch (e) { console.error(e); }
  };
  const confirmAllPending = async () => {
    const pend = allBookings.filter(b => b.status === 'pending' && b.booking_date >= todayStr);
    if (!pend.length) return showToast('❌ 沒有待確認嘅預約');
    if (!window.confirm(`確定確認全部 ${pend.length} 個待確認預約？`)) return;
    try { const ids = pend.map(b => b.id); await sbPatch(`bookings?id=in.(${ids.join(',')})`, { status: 'confirmed' }); setAllBookings(prev => prev.map(b => ids.includes(b.id) ? { ...b, status: 'confirmed' } : b)); logChange(`✅ 批量確認 ${pend.length} 個預約`); showToast(`✅ 已確認 ${pend.length} 個預約`); } catch (e) { showToast('❌ 確認失敗'); }
  };
  const confirmDayPending = async () => {
    const pend = dayBks.filter(b => b.status === 'pending');
    if (!pend.length) return;
    if (!window.confirm(`確定確認 ${schedDate} 共 ${pend.length} 個待確認預約？`)) return;
    try { const ids = pend.map(b => b.id); await sbPatch(`bookings?id=in.(${ids.join(',')})`, { status: 'confirmed' }); setAllBookings(prev => prev.map(b => ids.includes(b.id) ? { ...b, status: 'confirmed' } : b)); logChange(`✅ 批量確認 ${schedDate} 共 ${pend.length} 個預約`); showToast(`✅ 已確認 ${pend.length} 個預約`); } catch (e) { showToast('❌ 確認失敗'); }
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
  const addStaff = async () => { const name = newStaffName.trim(); if (!name) return; try { const data = await sbPost('staff', [{ name, sort_order: staffList.length, is_active: true }]); if (data && data.length > 0) { setStaffList(prev => [...prev, ...data]); if (!activeStaff) setActiveStaff(data[0]); } setNewStaffName(''); setShowAddStaff(false); showToast('✅ 已新增員工'); } catch (e) { showToast('❌ 新增失敗'); } };
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

  const syncPending = async () => { if (!activeStaff) return; const entries = Object.entries(pending); if (!entries.length) return; if (!window.confirm(`確定將「${activeStaff.name}」嘅 ${entries.length} 個日期同步到前台？`)) return; setBatchLoading(true); try { const dates = entries.map(([d]) => d); const sid = activeStaff.id; await sbDel(`date_availability?available_date=in.(${dates.join(',')})&staff_id=eq.${sid}`); await sbDel(`enabled_timeslots?slot_date=in.(${dates.join(',')})&staff_id=eq.${sid}`); try { await sbDel(`disabled_timeslots?slot_date=in.(${dates.join(',')})`); } catch (_) {} await sbPost('date_availability', entries.map(([d, times]) => ({ available_date: d, status: times.size > 0 ? 'available' : 'closed', staff_id: sid }))); const enabledRows = []; entries.forEach(([d, times]) => { [...times].forEach(t => { enabledRows.push({ slot_date: d, slot_time: t, staff_id: sid }); }); }); if (enabledRows.length > 0) { for (let i = 0; i < enabledRows.length; i += 500) await sbPost('enabled_timeslots', enabledRows.slice(i, i + 500)); } setPending({}); setSelDates(new Set()); setSchedRefreshKey(k => k + 1); showToast(`✅ 成功同步「${activeStaff.name}」嘅 ${dates.length} 個日期！`); loadActiveFromDB(activeDate); } catch (e) { console.error(e); showToast('❌ 同步失敗：' + e.message); } setBatchLoading(false); };
  const removePendingDate = (d) => { setPending(prev => { const n = { ...prev }; delete n[d]; return n; }); };

  const fetchBookings = async () => { setBkLoading(true); try { const data = await sbGet('bookings?order=booking_date.desc,booking_time.desc&limit=1000'); setAllBookings(data || []); } catch (e) { console.error(e); } setBkLoading(false); };
  useEffect(() => { bookingCountRef.current = allBookings.length; }, [allBookings.length]);
  useEffect(() => { if (!auth || !autoRefresh) return; const id = setInterval(async () => { try { const data = await sbGet('bookings?order=booking_date.desc,booking_time.desc&limit=1000'); if (data && data.length > bookingCountRef.current && bookingCountRef.current > 0) showToast(`🔔 有 ${data.length - bookingCountRef.current} 個新預約！`); setAllBookings(data || []); } catch (_) {} }, 30000); return () => clearInterval(id); }, [auth, autoRefresh]);

  const fetchBlocked = async () => { try { setBlocked(await sbGet('blocked_dates?order=date') || []); } catch (e) { console.error(e); } };
  // ✅ FIX #6: addBlocked 改用 array 傳入（同其他 sbPost 一致）
  const addBlocked = async () => { if (!newBD) return; try { const d = await sbPost('blocked_dates', [{ date: newBD, reason: newBR }]); setBlocked(prev => [...prev, ...d].sort((a, b) => a.date.localeCompare(b.date))); setNewBD(''); setNewBR(''); } catch (e) { console.error(e); } };
  const removeBlocked = async (id) => { try { await sbDel(`blocked_dates?id=eq.${id}`); setBlocked(prev => prev.filter(b => b.id !== id)); } catch (e) { console.error(e); } };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const result = await apiCall('login', { email: loginEmail, password: pw });
      if (result.access_token) {
        authToken = result.access_token;
        sessionStorage.setItem('jlab_token', authToken);
      }
      setAuth(true);
      fetchBookings();
      fetchBlocked();
      fetchStaff();
      fetchServices();
      fetchAddons();
    } catch (err) {
      setLoginError(err.message || '帳號或密碼錯誤');
    }
    setLoginLoading(false);
  };

  /* ═══ RENDER ═══ */

  if (!auth && showResetForm) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#f5f0eb,#e8e0d8)', fontFamily: font }}>
      <div style={{ background: '#fff', padding: '60px 40px', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: 400, width: '90%' }}>
        <h1 style={{ fontSize: 24, color: '#5c4a3a', marginBottom: 8 }}>J.LAB</h1>
        <p style={{ color: '#FF9800', fontSize: 16, marginBottom: 30, fontWeight: 600 }}>🔑 重設密碼</p>
        {resetPwError && <div style={{ padding: '10px 16px', background: '#FFEBEE', color: '#c62828', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>❌ {resetPwError}</div>}
        <input type="password" placeholder="新密碼（至少 6 個字元）" value={resetNewPw} onChange={e => { setResetNewPw(e.target.value); setResetPwError(''); }} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 12, boxSizing: 'border-box', textAlign: 'center' }} />
        <input type="password" placeholder="確認新密碼" value={resetConfirmPw} onChange={e => { setResetConfirmPw(e.target.value); setResetPwError(''); }} onKeyDown={e => e.key === 'Enter' && handleResetNewPw()} style={{ width: '100%', padding: '14px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 16, marginBottom: 20, boxSizing: 'border-box', textAlign: 'center' }} />
        <button onClick={handleResetNewPw} disabled={resetPwLoading} style={{ width: '100%', padding: 14, background: resetPwLoading ? '#a89888' : '#FF9800', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: resetPwLoading ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 600 }}>{resetPwLoading ? '處理中...' : '確認重設密碼'}</button>
        <button type="button" onClick={() => { setShowResetForm(false); setRecoveryToken(''); }} style={{ background: 'none', border: 'none', color: '#999', fontSize: 13, marginTop: 16, cursor: 'pointer', textDecoration: 'underline', fontFamily: font }}>返回登入</button>
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
        <button type="button" onClick={async () => {
          if (!loginEmail) { setLoginError('請先輸入 Email'); return; }
          setLoginError(''); setResetMsg('');
          try { await apiCall('recover', { email: loginEmail, redirectUrl: window.location.origin + window.location.pathname }); setResetMsg('重設密碼連結已發送到你嘅 Email，請查收。'); } catch (err) { setLoginError('發送失敗：' + (err.message || '請稍後再試')); }
        }} style={{ background: 'none', border: 'none', color: '#999', fontSize: 13, marginTop: 16, cursor: 'pointer', textDecoration: 'underline', fontFamily: font }}>忘記密碼？</button>
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
            {reschedMode && (
              <div style={{ marginTop: 20, padding: 16, background: '#FFF3E0', borderRadius: 10, border: '1px solid #FFB74D' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E65100', marginBottom: 12 }}>✏️ 更改預約時間</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 13, color: '#5c4a3a', minWidth: 45 }}>日期：</span><input type="date" value={reschedDate} onChange={e => handleReschedDateChange(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, flex: 1 }} /></div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 13, color: '#5c4a3a', minWidth: 45 }}>技師：</span><select value={reschedTech} onChange={e => { setReschedTech(e.target.value); setReschedTime(''); }} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, flex: 1, fontFamily: font }}><option value="">選擇技師</option>{staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 13, color: '#5c4a3a', minWidth: 45 }}>時間：</span>{reschedAvailTimes.length > 0 ? (<select value={reschedTime} onChange={e => setReschedTime(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, flex: 1, fontFamily: font }}><option value="">選擇時間</option>{reschedAvailTimes.map(t => <option key={t} value={t}>{t}{allBookings.some(b => b.booking_date === reschedDate && b.booking_time?.slice(0,5) === t && b.technician_label === reschedTech && b.status !== 'cancelled' && b.id !== selectedBooking.id) ? ' ⚠️' : ''}</option>)}</select>) : (<div style={{ fontSize: 12, color: '#999', flex: 1 }}>{reschedTech ? '此技師當日未有開放時段' : '請先選擇技師'}</div>)}</div>
                  {isTimeConflict && <div style={{ padding: '8px 12px', background: '#FFEBEE', borderRadius: 6, fontSize: 12, color: '#c62828' }}>⚠️ 此時段已有其他預約</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={saveResched} disabled={!reschedDate || !reschedTime || reschedLoading} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: reschedDate && reschedTime ? '#FF9800' : '#ddd', color: '#fff', cursor: reschedDate && reschedTime ? 'pointer' : 'not-allowed', fontSize: 14, fontFamily: font, fontWeight: 600 }}>{reschedLoading ? '處理中...' : '✅ 確認改期'}</button>
                  <button onClick={() => setReschedMode(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: font }}>取消</button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f0ebe3', flexWrap: 'wrap' }}>
              {selectedBooking.status === 'pending' && <button onClick={() => modalUpdate('confirmed')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✅ 確認預約</button>}
              {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && <button onClick={() => modalUpdate('completed')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2196F3', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✔️ 完成</button>}
              {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && <button onClick={() => modalUpdate('cancelled')} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ef9a9a', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 14, fontFamily: font }}>❌ 取消</button>}
              {!reschedMode && selectedBooking.status !== 'cancelled' && <button onClick={startResched} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #FFB74D', background: '#FFF3E0', color: '#E65100', cursor: 'pointer', fontSize: 14, fontFamily: font }}>✏️ 改期</button>}
              {selectedBooking.customer_phone && <button onClick={() => { const msg = fillTemplate('reminder', selectedBooking); sendWhatsApp(selectedBooking.customer_phone, msg || `${selectedBooking.customer_name} 你好！關於你 ${selectedBooking.booking_date} ${selectedBooking.booking_time} 嘅預約，如有任何疑問歡迎聯絡我哋。\n— J.LAB`); }} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #25D366', background: '#E8F5E9', color: '#25D366', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>📲 通知客人</button>}
              <div style={{ flex: 1 }} />
              <button onClick={modalDelete} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fafafa', color: '#999', cursor: 'pointer', fontSize: 14, fontFamily: font }}>🗑️</button>
            </div>
          </div>
        </div>
      )}

      {editSvc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setEditSvc(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>{editSvcForm.id ? '✏️ 編輯服務' : '➕ 新增服務'}</h3>
              <button onClick={() => setEditSvc(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>服務名稱 *</label><input value={editSvcForm.name || ''} onChange={e => setEditSvcForm(p => ({ ...p, name: e.target.value }))} placeholder="例：
