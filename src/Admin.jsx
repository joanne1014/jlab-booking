import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

/* ═══ Module-level ═══ */
let authToken = null;
let onAuthExpired = null;

const apiCall = async (action, payload = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  const noTokenActions = ['login', 'recover', 'reset-via-token'];
  if (authToken && !noTokenActions.includes(action)) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  const res = await fetch('/api/admin', {
    method: 'POST', headers,
    body: JSON.stringify({ action, payload })
  });
  if (res.status === 401 && !noTokenActions.includes(action)) {
    authToken = null;
    try { sessionStorage.removeItem('jlab_token'); } catch (_) {}
    if (onAuthExpired) onAuthExpired();
    throw new Error('登入已過期');
  }
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
const PER_PAGE = 50;
const card = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 20 };
const sTitle = { fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 6 };
const sDesc = { fontSize: 13, color: '#999', marginBottom: 16 };
const font = "'Noto Serif TC', serif";
const toTimeStr = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

// ★ 修正：getLocalDate 放喺 module level
const getLocalDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

let realtimeClient = null;
if (typeof window !== 'undefined') {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const { createClient } = require('@supabase/supabase-js');
      realtimeClient = createClient(url, key);
    }
  } catch (_) {}
}

/* ═══ Component ═══ */
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
  const [schedDate, setSchedDate] = useState(getLocalDate());

  // ★ 修正：只保留一個 todayStr（用 getLocalDate）
  const [todayStr, setTodayStr] = useState(getLocalDate);

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
  const [activeDate, setActiveDate] = useState(getLocalDate());
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

  const [svcList, setSvcList] = useState([]);
  const [svcAddons, setSvcAddons] = useState([]);
  const [svcLoading, setSvcLoading] = useState(false);
  const [svcSubTab, setSvcSubTab] = useState('services');
  const [editSvc, setEditSvc] = useState(null);
  const [editSvcForm, setEditSvcForm] = useState({});
  const [editSvcVariants, setEditSvcVariants] = useState([]);
  const [editAddon, setEditAddon] = useState(null);
  const [editAddonForm, setEditAddonForm] = useState({});

  const [bkPage, setBkPage] = useState(0);
  const [dbLogs, setDbLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [custSearch, setCustSearch] = useState('');
  const [selectedCust, setSelectedCust] = useState(null);
  const [custBookings, setCustBookings] = useState([]);

  const [reminders, setReminders] = useState([]);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderLoading, setReminderLoading] = useState(false);

  const [userRole, setUserRole] = useState('owner');
  const [userStaffId, setUserStaffId] = useState(null);
  const isOwner = userRole === 'owner';

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [historyTab, setHistoryTab] = useState('changes');

  const bookingCountRef = useRef(0);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    onAuthExpired = () => { setAuth(false); showToast('⚠️ 登入已過期，請重新登入'); };
    return () => { onAuthExpired = null; };
  }, []);

  useEffect(() => {
    const checkDate = () => {
      const now = getLocalDate();
      setTodayStr(prev => {
        if (prev !== now) { showToast('📅 日期已跨日，自動刷新中...'); fetchBookings(); return now; }
        return prev;
      });
    };
    const id = setInterval(checkDate, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!auth || !autoRefresh) return;
    const id = setInterval(() => fetchBookings(), 30000);
    return () => clearInterval(id);
  }, [auth, autoRefresh]);

  useEffect(() => {
    if (!auth || !realtimeClient) return;
    const channel = realtimeClient
      .channel('bookings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAllBookings(prev => [payload.new, ...prev]);
          showToast(`🔔 新預約：${payload.new.customer_name} — ${payload.new.booking_date} ${payload.new.booking_time}`);
        }
        if (payload.eventType === 'UPDATE') {
          setAllBookings(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
        }
        if (payload.eventType === 'DELETE') {
          setAllBookings(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();
    return () => { realtimeClient.removeChannel(channel); };
  }, [auth]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
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
      setRecoveryToken(accessToken); setShowResetForm(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const handleResetNewPw = async () => { setResetPwError(''); if (!resetNewPw || resetNewPw.length < 6) { setResetPwError('新密碼至少要 6 個字元'); return; } if (resetNewPw !== resetConfirmPw) { setResetPwError('兩次密碼不一致'); return; } setResetPwLoading(true); try { await apiCall('reset-via-token', { token: recoveryToken, newPassword: resetNewPw }); showToast('✅ 密碼已重設，請重新登入'); setShowResetForm(false); setRecoveryToken(''); setResetNewPw(''); setResetConfirmPw(''); } catch (err) { setResetPwError(err.message || '重設失敗'); } setResetPwLoading(false); };

  const handleLogin = async (e) => { e.preventDefault(); setLoginError(''); setLoginLoading(true); try { const result = await apiCall('login', { email: loginEmail, password: pw }); authToken = result.access_token; try { sessionStorage.setItem('jlab_token', result.access_token); } catch (_) {} setAuth(true); try { const roles = await sbGet(`admin_users?email=eq.${encodeURIComponent(loginEmail)}`); if (roles && roles.length > 0) { setUserRole(roles[0].role || 'owner'); setUserStaffId(roles[0].staff_id || null); } else { setUserRole('owner'); } } catch (_) { setUserRole('owner'); } fetchBookings(); fetchBlocked(); fetchStaff(); fetchServices(); fetchAddons(); fetchLogs(); fetchCustomers(); apiCall('auto-backup').catch(() => {}); } catch (err) { setLoginError(err.message || '帳號或密碼錯誤'); } setLoginLoading(false); };

  useEffect(() => { const saved = sessionStorage.getItem('jlab_token'); if (saved) { authToken = saved; apiCall('verify').then(() => { setAuth(true); fetchBookings(); fetchBlocked(); fetchStaff(); fetchServices(); fetchAddons(); fetchLogs(); fetchCustomers(); apiCall('auto-backup').catch(() => {}); }).catch(() => { authToken = null; sessionStorage.removeItem('jlab_token'); }); } }, []);

  const logChange = (text) => { const id = Date.now(); const ts = new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); setChangeLog(prev => [{ id, text, ts }, ...prev].slice(0, 30)); try { sbPost('admin_logs', [{ action: text, admin_email: loginEmail || 'admin' }]); } catch (e) { console.error('Log save failed:', e); } };
  const fetchLogs = async () => { setLogLoading(true); try { const data = await sbGet('admin_logs?order=created_at.desc&limit=100'); setDbLogs(data || []); } catch (e) { console.error(e); } setLogLoading(false); };
  const fetchAuditLogs = async () => { setAuditLoading(true); try { const result = await apiCall('get-audit-logs', {}); setAuditLogs(result.data || []); } catch (e) { console.error(e); } setAuditLoading(false); };
  const openHistory = () => { setShowHistory(true); fetchLogs(); fetchAuditLogs(); };
  const handleChangePw = async () => { setCpError(''); setCpMsg(''); if (!cpOld) { setCpError('請輸入舊密碼'); return; } if (!cpNew || cpNew.length < 6) { setCpError('新密碼至少要 6 個字元'); return; } if (cpNew !== cpConfirm) { setCpError('兩次密碼不一致'); return; } setCpLoading(true); try { await apiCall('change-password', { oldPassword: cpOld, newPassword: cpNew }); setCpMsg('✅ 密碼已更改'); setCpOld(''); setCpNew(''); setCpConfirm(''); } catch (err) { setCpError(err.message || '更改失敗'); } setCpLoading(false); };

  const exportCSV = () => { const hdrs = ['日期', '時間', '客人', '電話', '服務', '技師', '金額', '狀態', '取消原因']; const rows = filteredBookings.map(b => [b.booking_date, b.booking_time, b.customer_name, b.customer_phone, b.service_name, b.technician_label || '', b.total_price, statusText(b.status), b.cancel_reason || '']); const BOM = '\uFEFF'; const csv = BOM + [hdrs, ...rows].map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `JLAB_預約_${todayStr}.csv`; a.click(); URL.revokeObjectURL(url); showToast('✅ 已匯出 CSV'); };

  const fetchCustomers = async () => { try { const data = await sbGet('customers?order=last_visit_date.desc.nullslast&limit=500'); setCustomers(data || []); } catch (_) {} };
  const viewCustomer = async (cust) => { setSelectedCust(cust); try { const bks = await sbGet(`bookings?customer_phone=eq.${encodeURIComponent(cust.phone)}&order=booking_date.desc&limit=50`); setCustBookings(bks || []); } catch (_) {} };
  const updateCustNotes = async (custId, notes) => { try { await apiCall('update-customer', { customerId: custId, notes }); setCustomers(prev => prev.map(c => c.id === custId ? { ...c, notes } : c)); if (selectedCust?.id === custId) setSelectedCust(prev => ({ ...prev, notes })); showToast('✅ 備註已更新'); } catch (_) { showToast('❌ 更新失敗'); } };
  const addCustTag = async (custId, tag) => { const cust = customers.find(c => c.id === custId); if (!cust || !tag.trim()) return; const newTags = [...new Set([...(cust.tags || []), tag.trim()])]; try { await sbPatch(`customers?id=eq.${custId}`, { tags: newTags }); setCustomers(prev => prev.map(c => c.id === custId ? { ...c, tags: newTags } : c)); if (selectedCust?.id === custId) setSelectedCust(prev => ({ ...prev, tags: newTags })); } catch (_) {} };
  const removeCustTag = async (custId, tag) => { const cust = customers.find(c => c.id === custId); if (!cust) return; const newTags = (cust.tags || []).filter(t => t !== tag); try { await sbPatch(`customers?id=eq.${custId}`, { tags: newTags }); setCustomers(prev => prev.map(c => c.id === custId ? { ...c, tags: newTags } : c)); if (selectedCust?.id === custId) setSelectedCust(prev => ({ ...prev, tags: newTags })); } catch (_) {} };
  const toggleBlacklist = async (custId, currentVal) => { try { await apiCall('update-customer', { customerId: custId, is_blacklisted: !currentVal }); setCustomers(prev => prev.map(c => c.id === custId ? { ...c, is_blacklisted: !currentVal } : c)); if (selectedCust?.id === custId) setSelectedCust(prev => ({ ...prev, is_blacklisted: !currentVal })); showToast(!currentVal ? '⚠️ 已加入黑名單' : '✅ 已移出黑名單'); } catch (_) { showToast('❌ 更新失敗'); } };
  const refreshCustomerStats = async () => { showToast('⏳ 正在更新客戶統計...'); try { await apiCall('refresh-customer-stats', {}); await fetchCustomers(); showToast('✅ 客戶統計已更新'); } catch (e) { showToast('❌ 更新失敗: ' + e.message); } };
  const filteredCustomers = useMemo(() => { if (!custSearch.trim()) return customers; const s = custSearch.trim().toLowerCase(); return customers.filter(c => (c.name||'').toLowerCase().includes(s) || (c.phone||'').includes(s) || (c.tags||[]).some(t => t.toLowerCase().includes(s))); }, [customers, custSearch]);
  const generateReminders = async () => { if (!reminderDate) return showToast('❌ 請選擇日期'); setReminderLoading(true); try { const bks = await sbGet(`bookings?booking_date=eq.${reminderDate}&status=in.(confirmed,pending)&order=booking_time`); const list = (bks || []).filter(b => b.customer_phone).map(b => { const phone = b.customer_phone.replace(/[^0-9]/g, ''); const fullPhone = phone.length <= 8 ? '852' + phone : phone; const msg = `${b.customer_name} 你好！提醒你 ${b.booking_date} ${b.booking_time} 有預約（${b.service_name || ''}）。如需更改請提前聯絡我哋 🙏`; return { bookingId: b.id, name: b.customer_name, phone: fullPhone, time: b.booking_time, service: b.service_name, message: msg, waLink: `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}` }; }); setReminders(list); showToast(`✅ 搵到 ${list.length} 個預約要提醒`); } catch (e) { showToast('❌ ' + e.message); } setReminderLoading(false); };

  const revenueData = useMemo(() => { const map = {}; allBookings.filter(b => b.status !== 'cancelled').forEach(b => { const d = b.booking_date; if (!d) return; if (!map[d]) map[d] = { date: d, revenue: 0, count: 0 }; map[d].revenue += b.total_price || 0; map[d].count++; }); return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).slice(-30); }, [allBookings]);
  const maxRevenue = useMemo(() => Math.max(...revenueData.map(d => d.revenue), 1), [revenueData]);
  const gridTimes = useMemo(() => { const times = []; let mins = toMins(gridStart); const end = toMins(gridEnd); while (mins <= end) { times.push(toTimeStr(mins)); mins += gridInterval; } return times; }, [gridStart, gridEnd, gridInterval]);
  const displayTimes = pending[activeDate] || dbTimes;
  const isInPending = !!pending[activeDate];
  const pendingCount = Object.keys(pending).length;
  const activeDow = activeDate ? new Date(activeDate + 'T00:00:00').getDay() : 0;
  const extraDbTimes = useMemo(() => { const gridSet = new Set(gridTimes); return [...(pending[activeDate] || dbTimes)].filter(t => !gridSet.has(t)).sort(); }, [gridTimes, dbTimes, pending, activeDate]);
  const techList = useMemo(() => staffList.map(s => s.name).sort(), [staffList]);
  const filteredBookings = useMemo(() => { let r = allBookings; if (filterDateFrom) r = r.filter(b => b.booking_date >= filterDateFrom); if (filterDateTo) r = r.filter(b => b.booking_date <= filterDateTo); if (filterStatus !== 'all') r = r.filter(b => b.status === filterStatus); if (filterTech !== 'all') r = r.filter(b => b.technician_label === filterTech); if (searchTerm.trim()) { const s = searchTerm.trim().toLowerCase(); r = r.filter(b => b.customer_name?.toLowerCase().includes(s) || b.customer_phone?.includes(s)); } return r; }, [allBookings, filterDateFrom, filterDateTo, filterStatus, filterTech, searchTerm]);
  const totalPages = Math.ceil(filteredBookings.length / PER_PAGE);
  const pagedBookings = useMemo(() => { const start = bkPage * PER_PAGE; return filteredBookings.slice(start, start + PER_PAGE); }, [filteredBookings, bkPage]);
  const nextMonthStr = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; }, []);
  const nextMonthLabel = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getMonth() + 1}月`; }, []);

  const stats = useMemo(() => { const today = todayStr; const monthPre = today.slice(0, 7); const active = allBookings.filter(b => b.status !== 'cancelled'); return { today: active.filter(b => b.booking_date === today).length, todayRev: active.filter(b => b.booking_date === today).reduce((s, b) => s + (b.total_price || 0), 0), month: active.filter(b => b.booking_date?.startsWith(monthPre)).length, monthRev: active.filter(b => b.booking_date?.startsWith(monthPre)).reduce((s, b) => s + (b.total_price || 0), 0), nextMonth: active.filter(b => b.booking_date?.startsWith(nextMonthStr)).length, nextMonthRev: active.filter(b => b.booking_date?.startsWith(nextMonthStr)).reduce((s, b) => s + (b.total_price || 0), 0), total: allBookings.length, pending: allBookings.filter(b => b.status === 'pending').length, }; }, [allBookings, todayStr, nextMonthStr]);

  const monthBkStats = useMemo(() => { const c = {}; allBookings.forEach(b => { const d = b.booking_date; if (!d) return; if (!c[d]) c[d] = { total: 0, pending: 0, revenue: 0 }; if (b.status === 'cancelled') return; c[d].total++; if (b.status === 'pending') c[d].pending++; c[d].revenue += b.total_price || 0; }); return c; }, [allBookings]);
  const dayBks = useMemo(() => { let bks = allBookings.filter(b => b.booking_date === schedDate); if (!showCancelled) bks = bks.filter(b => b.status !== 'cancelled'); return bks.sort((a, b) => (a.booking_time || '').localeCompare(b.booking_time || '')); }, [allBookings, schedDate, showCancelled]);
  const timetableTimes = useMemo(() => { const all = new Set(); Object.values(daySlots).forEach(s => s.forEach(t => all.add(t))); dayBks.forEach(b => { const t = b.booking_time?.slice(0, 5); if (t) all.add(t); }); return [...all].sort(); }, [daySlots, dayBks]);
  const timetableStaff = useMemo(() => { const list = staffList.map(s => ({ id: s.id, name: s.name })); const nameSet = new Set(list.map(n => n.name)); dayBks.forEach(b => { if (b.technician_label && !nameSet.has(b.technician_label)) { list.push({ id: null, name: b.technician_label }); nameSet.add(b.technician_label); } }); if (dayBks.some(b => !b.technician_label)) list.push({ id: null, name: '未指定' }); return list; }, [staffList, dayBks]);
  const timetableGrid = useMemo(() => { const g = {}; dayBks.forEach(b => { const tech = b.technician_label || '未指定'; const t = b.booking_time?.slice(0, 5); const k = `${t}|${tech}`; if (!g[k]) g[k] = []; g[k].push(b); }); return g; }, [dayBks]);
  const dayStats = useMemo(() => { const active = dayBks.filter(b => b.status !== 'cancelled'); return { total: active.length, revenue: active.reduce((s, b) => s + (b.total_price || 0), 0), pending: dayBks.filter(b => b.status === 'pending').length, confirmed: dayBks.filter(b => b.status === 'confirmed').length, completed: dayBks.filter(b => b.status === 'completed').length }; }, [dayBks]);
  const schedCalDays = useMemo(() => { const dow = new Date(schedYear, schedMonth, 1).getDay(); const total = new Date(schedYear, schedMonth + 1, 0).getDate(); const days = []; for (let i = 0; i < dow; i++) days.push(null); for (let d = 1; d <= total; d++) days.push(d); return days; }, [schedYear, schedMonth]);
  const reschedAvailTimes = useMemo(() => { const staffObj = staffList.find(s => s.name === reschedTech); if (!staffObj) return []; return [...(reschedSlots[staffObj.id] || [])].sort(); }, [reschedTech, reschedSlots, staffList]);
  const isTimeConflict = useMemo(() => { if (!reschedDate || !reschedTime || !reschedTech) return false; return allBookings.some(b => b.booking_date === reschedDate && b.booking_time?.slice(0, 5) === reschedTime && b.technician_label === reschedTech && b.status !== 'cancelled' && b.id !== selectedBooking?.id); }, [reschedDate, reschedTime, reschedTech, allBookings, selectedBooking]);

  const loadMonthAvail = useCallback(async (y, m) => { try { const s = `${y}-${String(m + 1).padStart(2, '0')}-01`; const e = `${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`; const data = await sbGet(`date_availability?available_date=gte.${s}&available_date=lte.${e}`); const map = {}; (data || []).forEach(a => { if (!map[a.available_date]) map[a.available_date] = {}; map[a.available_date][a.staff_id] = a.status; }); setMonthAvail(map); } catch (e) { console.error(e); } }, []);
  const loadDaySlots = useCallback(async (date) => { if (!date) return; setDayLoading(true); try { const data = await sbGet(`enabled_timeslots?slot_date=eq.${date}&order=slot_time`); const map = {}; (data || []).forEach(s => { const sid = s.staff_id; if (!map[sid]) map[sid] = new Set(); map[sid].add(s.slot_time?.slice(0, 5)); }); setDaySlots(map); } catch (e) { console.error(e); } setDayLoading(false); }, []);

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

  const [msgTemplates, setMsgTemplates] = useState([]);
  useEffect(() => { if (auth) { sbGet('notification_templates?order=id').then(data => { if (data) setMsgTemplates(data); }).catch(e => console.error('載入模板失敗', e)); } }, [auth]);
  const fillTemplate = (templateKey, booking, extras = {}) => { const tpl = msgTemplates.find(t => t.key === templateKey); if (!tpl) return ''; const vars = { customer_name: booking.customer_name || '', booking_date: booking.booking_date || '', booking_time: booking.booking_time || '', service_name: booking.service_name || '未指定', technician_label: booking.technician_label || '待定', total_price: booking.total_price || '—', old_date: extras.oldDate || '', old_time: extras.oldTime || '' }; return tpl.content.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? ''); };
  const sendWhatsApp = (phone, message) => { if (!phone) { showToast('⚠️ 呢個客人冇留電話號碼'); return; } const cleaned = phone.replace(/[^0-9]/g, ''); const num = cleaned.length <= 8 ? '852' + cleaned : cleaned; window.open(`https://wa.me/${num}?text=${encodeURIComponent(message)}`, '_blank'); };
  const saveTemplate = async (id, newContent) => { try { await sbPatch(`notification_templates?id=eq.${id}`, { content: newContent, updated_at: new Date().toISOString() }); setMsgTemplates(prev => prev.map(t => t.id === id ? { ...t, content: newContent } : t)); showToast('✅ 模板已儲存'); } catch (e) { showToast('❌ 儲存失敗'); } };

  const fetchServices = async () => { setSvcLoading(true); try { const data = await sbGet('services?order=sort_order,created_at'); setSvcList(data || []); } catch (e) { console.error(e); } setSvcLoading(false); };
  const fetchAddons = async () => { try { const data = await sbGet('service_addons?order=sort_order,created_at'); setSvcAddons(data || []); } catch (e) { console.error(e); } };
  const fetchBlocked = async () => { try { const data = await sbGet('blocked_dates?order=date.desc'); setBlocked(data || []); } catch (e) { console.error(e); } };
  const addBlockedDate = async () => { if (!newBD) return showToast('❌ 請選擇日期'); try { await sbPost('blocked_dates', [{ date: newBD, reason: newBR || '休息' }]); setNewBD(''); setNewBR(''); fetchBlocked(); logChange(`🚫 封鎖日期 ${newBD}（${newBR || '休息'}）`); showToast('✅ 已封鎖日期'); } catch (e) { showToast('❌ 新增失敗'); } };
  const removeBlockedDate = async (id) => { const bd = blocked.find(b => b.id === id); try { await sbDel(`blocked_dates?id=eq.${id}`); setBlocked(prev => prev.filter(b => b.id !== id)); logChange(`✅ 解除封鎖 ${bd?.date || ''}`); showToast('✅ 已移除'); } catch (e) { showToast('❌ 移除失敗'); } };

  const openEditSvc = async (svc) => { const form = svc ? { ...svc } : { name: '', description: '', base_price: 0, duration_minutes: 60, image_url: '', category: '', is_active: true, sort_order: svcList.length }; setEditSvcForm(form); if (svc?.id) { try { const v = await sbGet(`service_variants?service_id=eq.${svc.id}&order=sort_order`); setEditSvcVariants(v || []); } catch (_) { setEditSvcVariants([]); } } else { setEditSvcVariants([]); } setEditSvc(svc || 'new'); };
  const saveSvc = async () => { const f = editSvcForm; if (!f.name?.trim()) return showToast('❌ 請輸入服務名稱'); try { let serviceId = f.id; if (f.id) { const { id, created_at, ...rest } = f; await sbPatch(`services?id=eq.${id}`, rest); setSvcList(prev => prev.map(s => s.id === id ? { ...s, ...rest } : s)); } else { const { id, created_at, ...rest } = f; const data = await sbPost('services', [rest]); if (data?.length) { serviceId = data[0].id; setSvcList(prev => [...prev, ...data]); } } if (serviceId && editSvcVariants.length > 0) { if (f.id) { const origVars = await sbGet(`service_variants?service_id=eq.${serviceId}&select=id`) || []; const existIds = editSvcVariants.filter(v => v.id).map(v => v.id); const toDelete = origVars.map(v => v.id).filter(vid => !existIds.includes(vid)); for (const did of toDelete) await sbDel(`service_variants?id=eq.${did}`); } for (const v of editSvcVariants) { if (v.id) { const { id, created_at, ...rest } = v; await sbPatch(`service_variants?id=eq.${id}`, rest); } else { await sbPost('service_variants', [{ ...v, service_id: serviceId }]); } } } setEditSvc(null); showToast('✅ 已儲存服務'); fetchServices(); } catch (e) { showToast('❌ 儲存失敗：' + e.message); } };
  const deleteSvc = async (id) => { if (!window.confirm('確定刪除此服務？')) return; try { await sbDel(`service_variants?service_id=eq.${id}`); await sbDel(`services?id=eq.${id}`); setSvcList(prev => prev.filter(s => s.id !== id)); showToast('✅ 已刪除'); } catch (e) { showToast('❌ 刪除失敗'); } };
  const toggleSvcActive = async (svc) => { try { await sbPatch(`services?id=eq.${svc.id}`, { is_active: !svc.is_active }); setSvcList(prev => prev.map(s => s.id === svc.id ? { ...s, is_active: !svc.is_active } : s)); showToast(svc.is_active ? '已下架' : '已上架'); } catch (e) { showToast('❌ 更新失敗'); } };
  const openEditAddon = (addon) => { setEditAddonForm(addon ? { ...addon } : { name: '', price: 0, duration_minutes: 0, description: '', is_active: true, sort_order: svcAddons.length }); setEditAddon(addon || 'new'); };
  const saveAddon = async () => { const f = editAddonForm; if (!f.name?.trim()) return showToast('❌ 請輸入附加項目名稱'); try { if (f.id) { const { id, created_at, ...rest } = f; await sbPatch(`service_addons?id=eq.${id}`, rest); setSvcAddons(prev => prev.map(a => a.id === id ? { ...a, ...rest } : a)); } else { const data = await sbPost('service_addons', [f]); if (data?.length) setSvcAddons(prev => [...prev, ...data]); } setEditAddon(null); showToast('✅ 已儲存'); } catch (e) { showToast('❌ 儲存失敗'); } };
  const deleteAddon = async (id) => { if (!window.confirm('確定刪除？')) return; try { await sbDel(`service_addons?id=eq.${id}`); setSvcAddons(prev => prev.filter(a => a.id !== id)); showToast('✅ 已刪除'); } catch (e) { showToast('❌ 刪除失敗'); } };
  const toggleAddonActive = async (addon) => { try { await sbPatch(`service_addons?id=eq.${addon.id}`, { is_active: !addon.is_active }); setSvcAddons(prev => prev.map(a => a.id === addon.id ? { ...a, is_active: !addon.is_active } : a)); } catch (e) { showToast('❌ 更新失敗'); } };
  const moveSvc = async (idx, dir) => { const arr = [...svcList]; const ni = idx + dir; if (ni < 0 || ni >= arr.length) return; [arr[idx], arr[ni]] = [arr[ni], arr[idx]]; arr.forEach((s, i) => s.sort_order = i); setSvcList(arr); try { for (const s of arr) await sbPatch(`services?id=eq.${s.id}`, { sort_order: s.sort_order }); } catch (_) {} };

  const startResched = () => { if (!selectedBooking) return; setReschedMode(true); setReschedDate(selectedBooking.booking_date); setReschedTime(selectedBooking.booking_time?.slice(0, 5) || ''); setReschedTech(selectedBooking.technician_label || ''); loadReschedSlots(selectedBooking.booking_date); };
  const loadReschedSlots = async (date) => { try { const data = await sbGet(`enabled_timeslots?slot_date=eq.${date}&order=slot_time`); const map = {}; (data || []).forEach(s => { const sid = s.staff_id; if (!map[sid]) map[sid] = new Set(); map[sid].add(s.slot_time?.slice(0, 5)); }); setReschedSlots(map); } catch (e) { setReschedSlots({}); } };
  const handleReschedDateChange = (date) => { setReschedDate(date); setReschedTime(''); loadReschedSlots(date); };
  const saveResched = async () => { if (!selectedBooking || !reschedDate || !reschedTime) return showToast('❌ 請選擇日期同時間'); if (isTimeConflict) return showToast('❌ 此時段已有其他預約'); setReschedLoading(true); try { try { const conflictResult = await apiCall('check-conflict', { date: reschedDate, time: reschedTime, duration: selectedBooking.duration_minutes || 60, technician: reschedTech || selectedBooking.technician_label, excludeId: selectedBooking.id }); if (conflictResult.hasConflict) { setReschedLoading(false); return showToast('❌ 此時段與其他預約衝突（包含服務時長 + 緩衝時間）'); } } catch (conflictErr) { console.warn('Server conflict check skipped:', conflictErr.message); } const oldDate = selectedBooking.booking_date; const oldTime = selectedBooking.booking_time; const updates = { booking_date: reschedDate, booking_time: reschedTime }; if (reschedTech) updates.technician_label = reschedTech; await sbPatch(`bookings?id=eq.${selectedBooking.id}`, updates); const updatedBooking = { ...selectedBooking, ...updates }; setAllBookings(prev => prev.map(b => b.id === selectedBooking.id ? updatedBooking : b)); setSelectedBooking(updatedBooking); setReschedMode(false); logChange(`✏️ 改期 ${selectedBooking.customer_name}：${oldDate} ${oldTime} → ${reschedDate} ${reschedTime}`); showToast('✅ 已更改預約時間'); const ask = window.confirm('📲 要唔要 WhatsApp 通知客人改期？'); if (ask) { const msg = fillTemplate('rescheduled', updatedBooking, { oldDate, oldTime }); sendWhatsApp(selectedBooking.customer_phone, msg); } } catch (e) { showToast('❌ 更改失敗：' + e.message); } setReschedLoading(false); };

  const promptCancel = (booking, isModal = false) => { if (!booking) return; setCancelTarget({ booking, isModal }); setCancelReason(''); setShowCancelDialog(true); };
  const confirmCancel = async () => { if (!cancelTarget) return; setCancelLoading(true); const { booking, isModal } = cancelTarget; try { await apiCall('update-booking-status', { bookingId: booking.id, status: 'cancelled', cancel_reason: cancelReason || null }); const updated = { ...booking, status: 'cancelled', cancel_reason: cancelReason || null }; setAllBookings(prev => prev.map(b => b.id === booking.id ? updated : b)); if (isModal && selectedBooking?.id === booking.id) setSelectedBooking(updated); logChange(`❌ 取消 — ${booking.customer_name} ${booking.booking_date} ${booking.booking_time}${cancelReason ? ` (${cancelReason})` : ''}`); showToast('✅ 已取消預約'); setShowCancelDialog(false); const ask = window.confirm(`📲 要唔要 WhatsApp 通知 ${booking.customer_name}？`); if (ask) { const msg = fillTemplate('cancelled', updated); sendWhatsApp(booking.customer_phone, msg); } } catch (e) { showToast('❌ 取消失敗: ' + e.message); } setCancelLoading(false); };

  // ★ 修正：只有一個 updateStatus（包含客戶邏輯）
  const updateStatus = async (id, s) => {
    if (s === 'cancelled') { promptCancel(allBookings.find(x => x.id === id)); return; }
    const b = allBookings.find(x => x.id === id);
    try {
      await apiCall('update-booking-status', { bookingId: id, status: s });
      setAllBookings(prev => prev.map(x => x.id === id ? { ...x, status: s } : x));
      logChange(`${statusText(s)} — ${b?.customer_name} ${b?.booking_date} ${b?.booking_time}`);
      showToast(`✅ 狀態已更新為「${statusText(s)}」`);
      // ★ 確認/完成時自動新增客戶
      if ((s === 'confirmed' || s === 'completed') && b?.customer_phone) {
        try {
          const existing = await sbGet(`customers?phone=eq.${encodeURIComponent(b.customer_phone)}`);
          if (existing && existing.length > 0) {
            const cust = existing[0];
            await sbPatch(`customers?id=eq.${cust.id}`, { name: b.customer_name, total_visits: (cust.total_visits || 0) + (s === 'completed' ? 1 : 0), total_spent: (cust.total_spent || 0) + (s === 'completed' ? (b.total_price || 0) : 0), last_visit_date: b.booking_date });
          } else {
            await sbPost('customers', [{ name: b.customer_name, phone: b.customer_phone, total_visits: s === 'completed' ? 1 : 0, total_spent: s === 'completed' ? (b.total_price || 0) : 0, last_visit_date: b.booking_date, tags: [] }]);
          }
          fetchCustomers();
        } catch (_) {}
      }
    } catch (e) { showToast('❌ 更新失敗: ' + e.message); }
  };

  const deleteBooking = async (id) => { if (!window.confirm('確定要刪除？')) return; const b = allBookings.find(x => x.id === id); try { await sbDel(`bookings?id=eq.${id}`); setAllBookings(prev => prev.filter(x => x.id !== id)); logChange(`🗑️ 已刪除 — ${b?.customer_name} ${b?.booking_date} ${b?.booking_time}`); showToast('✅ 已刪除'); } catch (e) { console.error(e); } };

  // ★ 修正：modalUpdate 包含客戶邏輯
  const modalUpdate = async (s) => {
    if (!selectedBooking) return;
    if (s === 'cancelled') { promptCancel(selectedBooking, true); return; }
    try {
      await apiCall('update-booking-status', { bookingId: selectedBooking.id, status: s });
      const updated = { ...selectedBooking, status: s };
      setAllBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
      setSelectedBooking(updated);
      logChange(`${statusText(s)} — ${selectedBooking.customer_name} ${selectedBooking.booking_date} ${selectedBooking.booking_time}`);
      showToast(`✅ 狀態已更新為「${statusText(s)}」`);
      if (s === 'confirmed') { const ask = window.confirm(`📲 要唔要 WhatsApp 通知 ${selectedBooking.customer_name}？`); if (ask) { const msg = fillTemplate(s, updated); sendWhatsApp(selectedBooking.customer_phone, msg); } }
      // ★ 確認/完成時自動新增客戶
      if ((s === 'confirmed' || s === 'completed') && selectedBooking.customer_phone) {
        try {
          const phone = selectedBooking.customer_phone;
          const existing = await sbGet(`customers?phone=eq.${encodeURIComponent(phone)}`);
          if (existing && existing.length > 0) {
            const cust = existing[0];
            await sbPatch(`customers?id=eq.${cust.id}`, { name: selectedBooking.customer_name, total_visits: (cust.total_visits || 0) + (s === 'completed' ? 1 : 0), total_spent: (cust.total_spent || 0) + (s === 'completed' ? (selectedBooking.total_price || 0) : 0), last_visit_date: selectedBooking.booking_date });
          } else {
            await sbPost('customers', [{ name: selectedBooking.customer_name, phone: phone, total_visits: s === 'completed' ? 1 : 0, total_spent: s === 'completed' ? (selectedBooking.total_price || 0) : 0, last_visit_date: selectedBooking.booking_date, tags: [] }]);
          }
          fetchCustomers();
        } catch (custErr) { console.error('客戶建立失敗:', custErr); }
      }
    } catch (e) { showToast('❌ 更新失敗'); }
  };

  const modalDelete = async () => { if (!selectedBooking || !window.confirm('確定要刪除？')) return; try { logChange(`🗑️ 已刪除 — ${selectedBooking.customer_name} ${selectedBooking.booking_date} ${selectedBooking.booking_time}`); await sbDel(`bookings?id=eq.${selectedBooking.id}`); setAllBookings(prev => prev.filter(b => b.id !== selectedBooking.id)); closeBooking(); showToast('✅ 已刪除'); } catch (e) { console.error(e); } };
  const confirmAllPending = async () => { const pend = allBookings.filter(b => b.status === 'pending' && b.booking_date >= todayStr); if (!pend.length) return showToast('❌ 沒有待確認嘅預約'); if (!window.confirm(`確定確認全部 ${pend.length} 個待確認預約？`)) return; try { const ids = pend.map(b => b.id); await sbPatch(`bookings?id=in.(${ids.join(',')})`, { status: 'confirmed' }); setAllBookings(prev => prev.map(b => ids.includes(b.id) ? { ...b, status: 'confirmed' } : b)); logChange(`✅ 批量確認 ${pend.length} 個預約`); showToast(`✅ 已確認 ${pend.length} 個預約`); } catch (e) { showToast('❌ 確認失敗'); } };
  const confirmDayPending = async () => { const pend = dayBks.filter(b => b.status === 'pending'); if (!pend.length) return; if (!window.confirm(`確定確認 ${schedDate} 共 ${pend.length} 個待確認預約？`)) return; try { const ids = pend.map(b => b.id); await sbPatch(`bookings?id=in.(${ids.join(',')})`, { status: 'confirmed' }); setAllBookings(prev => prev.map(b => ids.includes(b.id) ? { ...b, status: 'confirmed' } : b)); logChange(`✅ 批量確認 ${schedDate} 共 ${pend.length} 個預約`); showToast(`✅ 已確認 ${pend.length} 個預約`); } catch (e) { showToast('❌ 確認失敗'); } };
  const setQuickDate = (type) => { const today = todayStr; if (type === 'today') { setFilterDateFrom(today); setFilterDateTo(today); } else if (type === 'tomorrow') { const t = new Date(Date.now() + 86400000).toISOString().split('T')[0]; setFilterDateFrom(t); setFilterDateTo(t); } else if (type === 'week') { setFilterDateFrom(today); setFilterDateTo(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]); } else if (type === 'month') { const y = new Date().getFullYear(), m = new Date().getMonth(); setFilterDateFrom(`${y}-${String(m + 1).padStart(2, '0')}-01`); setFilterDateTo(`${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`); } else if (type === 'nextMonth') { const nm = new Date().getMonth() + 1; const ny = nm > 11 ? new Date().getFullYear() + 1 : new Date().getFullYear(); const m = nm > 11 ? 0 : nm; setFilterDateFrom(`${ny}-${String(m + 1).padStart(2, '0')}-01`); setFilterDateTo(`${ny}-${String(m + 1).padStart(2, '0')}-${new Date(ny, m + 1, 0).getDate()}`); } setBkPage(0); };
  const clearFilters = () => { setSearchTerm(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterStatus('all'); setFilterTech('all'); setBkPage(0); };
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

  const fetchBookings = async () => { setBkLoading(true); try { const data = await sbGet('bookings?order=booking_date.desc,booking_time.desc&limit=1000'); setAllBookings(data || []); } catch (e) { console.error('fetchBookings error:', e); } setBkLoading(false); };

  /* ═══ RENDER — 以下同你原本一樣，冇改動 ═══ */
  // ... (JSX return 部分同你原本完全一樣，我唔再重複貼)
