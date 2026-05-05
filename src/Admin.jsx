import ThemeEditor from './components/ThemeEditor';
import ReportsPanel from './components/ReportsPanel'; 
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
const headerBtn = { padding: '8px 14px', borderRadius: 8, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font };
const navBtn = { padding: '8px 14px', borderRadius: 8, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 16, fontFamily: font };
const smallBtn = (bg, color, border) => ({ padding: '5px 12px', borderRadius: 6, border: border ? `1px solid ${border}` : 'none', background: bg, color: color, cursor: 'pointer', fontSize: 12, fontFamily: font });
const toDS = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const toTimeStr = (mins) => `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

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
// ★ 客戶檔案系統
  const [custProfileTab, setCustProfileTab] = useState('info');
  const [custEditing, setCustEditing] = useState(false);
  const [showAddCust, setShowAddCust] = useState(false);
const [newCust, setNewCust] = useState({ name: '', phone: '', email: '', notes: '' });
  const [custServiceRecords, setCustServiceRecords] = useState([]);
  const [custConsumption, setCustConsumption] = useState([]);
  const [custPackages, setCustPackages] = useState([]);
  const [custPointsLog, setCustPointsLog] = useState([]);
  const [custExpandedRecord, setCustExpandedRecord] = useState(null);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({});
// ★ 月曆 + 營業時間 + 預覽
const [calSelectedDate, setCalSelectedDate] = useState(null);
const [businessHours, setBusinessHours] = useState([]);
const [bhEditing, setBhEditing] = useState(false);
const [previewUrl, setPreviewUrl] = useState('https://jlab-booking.vercel.app/booking');
  const [allPackages, setAllPackages] = useState([]);
  const [packageTypes, setPackageTypes] = useState([]);
  const [pkgLoading, setPkgLoading] = useState(false);
  const [showAddPkg, setShowAddPkg] = useState(false);
  const [newPkg, setNewPkg] = useState({});
  const [pkgFilter, setPkgFilter] = useState('active');
  const [showDeduct, setShowDeduct] = useState(null);
  const [deductNote, setDeductNote] = useState('');
  const [showAddPkgType, setShowAddPkgType] = useState(false);
  const [newPkgType, setNewPkgType] = useState({});
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
  // ★ 收據系統
  const [receiptList, setReceiptList] = useState([]);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptFilter, setReceiptFilter] = useState('all');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [showNewReceipt, setShowNewReceipt] = useState(false);
  const [newReceipt, setNewReceipt] = useState({ customer_name: '', customer_phone: '', staff_name: '', items: [], payment_method: '', discount_type: 'none', discount_value: 0, remarks: '' });
  const [newReceiptItem, setNewReceiptItem] = useState({ name: '', qty: 1, price: 0 });
  const [receiptSending, setReceiptSending] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const bookingCountRef = useRef(0);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

// ═══ useEffect 1: onAuthExpired ═══
useEffect(() => {
  let expired = false;
  onAuthExpired = () => {
    if (expired) return;
    expired = true;
    setAuth(false);
    showToast('⚠️ 登入已過期，請重新登入');
  };
  }, []);   // 
// ═══ useEffect 2: 跨日檢查 ═══
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

// ═══ useEffect 3: 自動刷新 ═══
useEffect(() => {
  if (!auth || !autoRefresh) return;
  const id = setInterval(() => fetchBookings(), 30000);
  return () => clearInterval(id);
}, [auth, autoRefresh]);

// ═══ useEffect 4: Realtime ═══
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

// ═══ useEffect 5: Service Worker ═══
useEffect(() => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}, []);

// ═══ useEffect 6: Recovery URL ═══
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
  
  const handleResetNewPw = async () => { setResetPwError(''); if (!resetNewPw || resetNewPw.length < 6) { setResetPwError('新密碼至少要 6 個字元'); return; } if (resetNewPw !== resetConfirmPw) { setResetPwError('兩次密碼不一致'); return; } setResetPwLoading(true); try { await apiCall('reset-via-token', { token: recoveryToken, newPassword: resetNewPw }); showToast('✅ 密碼已重設，請重新登入'); setShowResetForm(false); setRecoveryToken(''); setResetNewPw(''); setResetConfirmPw(''); } catch (err) { setResetPwError(err.message || '重設失敗'); } setResetPwLoading(false); };

  const handleLogin = async (e) => { e.preventDefault(); setLoginError(''); setLoginLoading(true); try { const result = await apiCall('login', { email: loginEmail, password: pw }); authToken = result.access_token; try { sessionStorage.setItem('jlab_token', result.access_token); } catch (_) {} setAuth(true); try { const roles = await sbGet(`admin_users?email=eq.${encodeURIComponent(loginEmail)}`); if (roles && roles.length > 0) { setUserRole(roles[0].role || 'owner'); setUserStaffId(roles[0].staff_id || null); } else { setUserRole('owner'); } } catch (_) { setUserRole('owner'); } fetchBookings(); fetchReceipts();fetchBlocked(); fetchStaff(); fetchServices(); fetchAddons(); fetchLogs(); fetchCustomers(); fetchPackageTypes(); fetchAllPackages(); fetchBusinessHours();; apiCall('auto-backup').catch(() => {}); } catch (err) { setLoginError(err.message || '帳號或密碼錯誤'); } setLoginLoading(false); };

 useEffect(() => {
  const saved = sessionStorage.getItem('jlab_token');
  if (saved) {
    authToken = saved;
    apiCall('verify').then(() => {
      setAuth(true);
      fetchBookings();
      fetchReceipts();
      fetchBlocked();
      fetchStaff();
      fetchServices();
      fetchAddons();
      fetchLogs();
      fetchCustomers();
      fetchPackageTypes();
      fetchAllPackages();
      fetchBusinessHours();
      apiCall('auto-backup').catch(() => {});
    }).catch(() => {
      authToken = null;
      sessionStorage.removeItem('jlab_token');
    });
  }
}, []);
  const logChange = (text) => { const id = Date.now(); const ts = new Date().toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); setChangeLog(prev => [{ id, text, ts }, ...prev].slice(0, 30)); try { sbPost('admin_logs', [{ action: text, admin_email: loginEmail || 'admin' }]); } catch (e) { console.error('Log save failed:', e); } };
  const fetchLogs = async () => { setLogLoading(true); try { const data = await sbGet('admin_logs?order=created_at.desc&limit=100'); setDbLogs(data || []); } catch (e) { console.error(e); } setLogLoading(false); };
  const fetchAuditLogs = async () => { setAuditLoading(true); try { const result = await apiCall('get-audit-logs', {}); setAuditLogs(result.data || []); } catch (e) { console.error(e); } setAuditLoading(false); };
  const openHistory = () => { setShowHistory(true); fetchLogs(); fetchAuditLogs(); };
  const handleChangePw = async () => { setCpError(''); setCpMsg(''); if (!cpOld) { setCpError('請輸入舊密碼'); return; } if (!cpNew || cpNew.length < 6) { setCpError('新密碼至少要 6 個字元'); return; } if (cpNew !== cpConfirm) { setCpError('兩次密碼不一致'); return; } setCpLoading(true); try { await apiCall('change-password', { oldPassword: cpOld, newPassword: cpNew }); setCpMsg('✅ 密碼已更改'); setCpOld(''); setCpNew(''); setCpConfirm(''); } catch (err) { setCpError(err.message || '更改失敗'); } setCpLoading(false); };

  const exportCSV = () => { const hdrs = ['日期', '時間', '客人', '電話', '服務', '技師', '金額', '狀態', '取消原因']; const rows = filteredBookings.map(b => [b.booking_date, b.booking_time, b.customer_name, b.customer_phone, b.service_name, b.technician_label || '', b.total_price, statusText(b.status), b.cancel_reason || '']); const BOM = '\uFEFF'; const csv = BOM + [hdrs, ...rows].map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `JLAB_預約_${todayStr}.csv`; a.click(); URL.revokeObjectURL(url); showToast('✅ 已匯出 CSV'); };

  const fetchCustomers = async () => { try { const data = await sbGet('customers?order=last_visit_date.desc.nullslast&limit=500'); setCustomers(data || []); } catch (_) {} };
 const addCustomer = async () => {
  if (!newCust.name || !newCust.phone) return showToast('❌ 請填寫姓名同電話');
  try {
    await apiCall('add-customer', newCust);
    await fetchCustomers();
    setShowAddCust(false);
    setNewCust({ name: '', phone: '', email: '', notes: '' });
    showToast('✅ 客戶已新增');
    logChange(`👤 新增客戶 ${newCust.name} (${newCust.phone})`);
  } catch (e) { showToast('❌ 新增失敗：' + e.message); }
};

const deleteCustomer = async (id) => {
  const cust = customers.find(c => c.id === id);
  if (!window.confirm(`確定刪除「${cust?.name}」？此操作無法復原。`)) return;
  try {
    await apiCall('delete-customer', { id });
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSelectedCust(null);
    showToast('✅ 客戶已刪除');
    logChange(`🗑️ 刪除客戶 ${cust?.name}`);
  } catch (e) { showToast('❌ 刪除失敗：' + e.message); }
};
  const viewCustomer = async (cust) => {
    setSelectedCust(cust);
    setCustProfileTab('info');
    setCustEditing(false);
    setCustExpandedRecord(null);
    setShowAddRecord(false);
    try { const bks = await sbGet(`bookings?customer_phone=eq.${encodeURIComponent(cust.phone)}&order=booking_date.desc&limit=50`); setCustBookings(bks || []); } catch (_) { setCustBookings([]); }
    try { const records = await sbGet(`service_records?customer_phone=eq.${encodeURIComponent(cust.phone)}&order=service_date.desc`); setCustServiceRecords(records || []); } catch (_) { setCustServiceRecords([]); }
    try { const consumption = await sbGet(`consumption_records?customer_phone=eq.${encodeURIComponent(cust.phone)}&order=created_at.desc`); setCustConsumption(consumption || []); } catch (_) { setCustConsumption([]); }
    try { const pkgs = await sbGet(`customer_packages?customer_phone=eq.${encodeURIComponent(cust.phone)}&status=eq.active`); setCustPackages(pkgs || []); } catch (_) { setCustPackages([]); }
    try { const pts = await sbGet(`points_log?customer_phone=eq.${encodeURIComponent(cust.phone)}&order=created_at.desc&limit=20`); setCustPointsLog(pts || []); } catch (_) { setCustPointsLog([]); }
  };
  // ★ 營業時間函數
  const fetchBusinessHours = async () => {
    try { const data = await sbGet('business_hours?order=day_of_week'); setBusinessHours(data || []); } catch (_) {}
  };
  const saveBusinessHours = async () => {
    try {
      for (const bh of businessHours) {
        await sbPatch(`business_hours?id=eq.${bh.id}`, { is_open: bh.is_open, open_time: bh.open_time, close_time: bh.close_time });
      }
      showToast('✅ 營業時間已儲存');
      setBhEditing(false);
      logChange('🕐 更新營業時間');
    } catch (e) { showToast('❌ 儲存失敗：' + e.message); }
  };
  // ★ 收據 Functions
  const fetchReceipts = async () => {
    setReceiptLoading(true);
    try {
      let query = 'receipts?order=created_at.desc&limit=200';
      if (receiptFilter !== 'all') query += `&status=eq.${receiptFilter}`;
      if (receiptSearch) query += `&or=(receipt_no.ilike.%${receiptSearch}%,customer_name.ilike.%${receiptSearch}%)`;
      const data = await sbGet(query);
      setReceiptList(data || []);
    } catch (e) { console.error(e); }
    setReceiptLoading(false);
  };

  const createReceipt = async () => {
    if (!newReceipt.customer_name || newReceipt.items.length === 0) return showToast('❌ 請填寫客戶名同至少一項服務');
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReceipt)
      });
      const data = await res.json();
      if (res.ok) {
        setReceiptList(prev => [data, ...prev]);
        setShowNewReceipt(false);
        setNewReceipt({ customer_name: '', customer_phone: '', staff_name: '', items: [], payment_method: '', discount_type: 'none', discount_value: 0, remarks: '' });
        showToast('✅ 收據已建立：' + data.receipt_no);
        logChange(`🧾 新增收據 ${data.receipt_no} — ${data.customer_name} $${data.total}`);
      } else { showToast('❌ ' + (data.error || '建立失敗')); }
    } catch (e) { showToast('❌ ' + e.message); }
  };

  const markReceiptPaid = async (receipt) => {
    try {
      await sbPatch(`receipts?id=eq.${receipt.id}`, { status: 'paid', paid_at: new Date().toISOString() });
      setReceiptList(prev => prev.map(r => r.id === receipt.id ? { ...r, status: 'paid', paid_at: new Date().toISOString() } : r));
      showToast('✅ 已標記為已付');
      logChange(`💰 收據 ${receipt.receipt_no} 已付清`);
    } catch (e) { showToast('❌ 更新失敗'); }
  };

  const sendReceiptWhatsApp = async (receipt) => {
    setReceiptSending(receipt.id);
    try {
      const res = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_id: receipt.id,
          method: 'whatsapp',
          phone: receipt.customer_phone ? '852' + receipt.customer_phone.replace(/[^0-9]/g, '') : '',
        })
      });
      const data = await res.json();
      if (data.success && data.wa_link) {
        window.open(data.wa_link, '_blank');
        showToast('✅ 已開啟 WhatsApp');
      } else { showToast('❌ ' + (data.error || '發送失敗')); }
    } catch (e) { showToast('❌ ' + e.message); }
    setReceiptSending(null);
  };

  const printReceipt = async (receipt) => {
    try {
      const res = await fetch('/api/receipt-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_id: receipt.id })
      });
      const data = await res.json();
      if (data.html) {
        const w = window.open('', '', 'width=420,height=700');
        w.document.write(data.html);
        w.document.close();
        setTimeout(() => w.print(), 600);
      }
    } catch (e) { showToast('❌ 列印失敗'); }
  };

  const deleteReceipt = async (id) => {
    if (!window.confirm('確定刪除此收據？')) return;
    try {
      await sbDel(`receipts?id=eq.${id}`);
      setReceiptList(prev => prev.filter(r => r.id !== id));
      showToast('✅ 已刪除');
    } catch (e) { showToast('❌ 刪除失敗'); }
  };

  const addReceiptItem = () => {
    if (!newReceiptItem.name || !newReceiptItem.price) return showToast('❌ 請填寫項目名同價格');
    setNewReceipt(prev => ({ ...prev, items: [...prev.items, { ...newReceiptItem }] }));
    setNewReceiptItem({ name: '', qty: 1, price: 0 });
  };

  const removeReceiptItem = (idx) => {
    setNewReceipt(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const receiptSubtotal = useMemo(() => newReceipt.items.reduce((s, i) => s + i.price * i.qty, 0), [newReceipt.items]);
  const receiptDiscount = useMemo(() => {
    if (newReceipt.discount_type === 'percent') return Math.round(receiptSubtotal * (newReceipt.discount_value / 100));
    if (newReceipt.discount_type === 'fixed') return newReceipt.discount_value || 0;
    return 0;
  }, [receiptSubtotal, newReceipt.discount_type, newReceipt.discount_value]);
  const receiptTotal = receiptSubtotal - receiptDiscount;

  const filteredReceipts = useMemo(() => {
    let r = receiptList;
    if (receiptFilter !== 'all') r = r.filter(x => x.status === receiptFilter);
    if (receiptSearch.trim()) {
      const s = receiptSearch.trim().toLowerCase();
      r = r.filter(x => (x.receipt_no || '').toLowerCase().includes(s) || (x.customer_name || '').toLowerCase().includes(s) || (x.customer_phone || '').includes(s));
    }
    return r;
  }, [receiptList, receiptFilter, receiptSearch]);
  // ★ 月曆輔助函數
  const getCalendarDays = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };
const getBookingsForDate = (day) => {
  if (!day) return [];
  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return allBookings.filter(b => b.booking_date === dateStr && b.status !== 'cancelled');
};
  const calMonthName = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); setCalSelectedDate(null); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); setCalSelectedDate(null); };
  const fetchPackageTypes = async () => {
    try { const data = await sbGet('package_types?order=created_at'); setPackageTypes(data || []); } catch (_) {}
  };
  const fetchAllPackages = async () => {
    setPkgLoading(true);
    try { const data = await sbGet('customer_packages?order=created_at.desc'); setAllPackages(data || []); } catch (_) {}
    setPkgLoading(false);
  };
  const addPackageToCustomer = async () => {
    if (!newPkg.customer_phone || !newPkg.package_name || !newPkg.total_sessions) return showToast('❌ 請填寫完整資料');
    try {
      const record = { customer_phone: newPkg.customer_phone, package_name: newPkg.package_name, total_sessions: parseInt(newPkg.total_sessions), used_sessions: 0, status: 'active', purchased_date: getLocalDate(), expiry_date: newPkg.expiry_date || null, price_paid: parseFloat(newPkg.price_paid) || 0, package_type_id: newPkg.package_type_id || null, notes: newPkg.notes || '' };
      const data = await sbPost('customer_packages', [record]);
      if (data && data.length > 0) setAllPackages(prev => [data[0], ...prev]);
      setShowAddPkg(false); setNewPkg({});
      showToast('✅ 套票已新增');
      logChange(`🎫 新增套票「${record.package_name}」給 ${record.customer_phone}`);
    } catch (e) { showToast('❌ 新增失敗：' + e.message); }
  };
  const deductSession = async (pkg) => {
    if (pkg.used_sessions >= pkg.total_sessions) return showToast('❌ 套票已用完');
    try {
      await sbPatch(`customer_packages?id=eq.${pkg.id}`, { used_sessions: pkg.used_sessions + 1, status: (pkg.used_sessions + 1 >= pkg.total_sessions) ? 'completed' : 'active' });
      setAllPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, used_sessions: p.used_sessions + 1, status: (p.used_sessions + 1 >= p.total_sessions) ? 'completed' : 'active' } : p));
      if (selectedCust) setCustPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, used_sessions: p.used_sessions + 1, status: (p.used_sessions + 1 >= p.total_sessions) ? 'completed' : 'active' } : p));
      setShowDeduct(null);
      showToast(`✅ 已扣 1 次（剩餘 ${pkg.total_sessions - pkg.used_sessions - 1} 次）`);
      logChange(`🎫 扣次「${pkg.package_name}」${pkg.customer_phone}（${pkg.used_sessions + 1}/${pkg.total_sessions}）`);
    } catch (e) { showToast('❌ 扣次失敗：' + e.message); }
  };
  const cancelPackage = async (pkg) => {
    if (!window.confirm(`確定取消「${pkg.package_name}」？`)) return;
    try { await sbPatch(`customer_packages?id=eq.${pkg.id}`, { status: 'cancelled' }); setAllPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, status: 'cancelled' } : p)); showToast('✅ 套票已取消'); } catch (e) { showToast('❌ 失敗'); }
  };
  const saveNewPkgType = async () => {
    if (!newPkgType.name || !newPkgType.sessions) return showToast('❌ 請填寫名稱同次數');
    try { const data = await sbPost('package_types', [{ name: newPkgType.name, sessions: parseInt(newPkgType.sessions), price: parseFloat(newPkgType.price) || 0, validity_days: parseInt(newPkgType.validity_days) || 365, description: newPkgType.description || '' }]); if (data && data.length > 0) setPackageTypes(prev => [...prev, ...data]); setShowAddPkgType(false); setNewPkgType({}); showToast('✅ 套票類型已新增'); } catch (e) { showToast('❌ 失敗：' + e.message); }
  };
  const deletePkgType = async (id) => {
    if (!window.confirm('確定刪除此套票類型？')) return;
    try { await sbDel(`package_types?id=eq.${id}`); setPackageTypes(prev => prev.filter(p => p.id !== id)); showToast('✅ 已刪除'); } catch (e) { showToast('❌ 失敗'); }
  };
  const selectPkgType = (pt) => {
    const expiry = new Date(); expiry.setDate(expiry.getDate() + (pt.validity_days || 365));
    setNewPkg(prev => ({ ...prev, package_name: pt.name, total_sessions: pt.sessions, price_paid: pt.price, package_type_id: pt.id, expiry_date: expiry.toISOString().split('T')[0] }));
  };
  const filteredPackages = useMemo(() => { if (pkgFilter === 'all') return allPackages; return allPackages.filter(p => p.status === pkgFilter); }, [allPackages, pkgFilter]);
  const saveCustomerProfile = async () => {
    if (!selectedCust) return;
    try {
      const { id, created_at, ...fields } = selectedCust;
      await sbPatch(`customers?id=eq.${id}`, { ...fields, updated_at: new Date().toISOString() });
      setCustomers(prev => prev.map(c => c.id === id ? selectedCust : c));
      setCustEditing(false);
      showToast('✅ 客戶資料已儲存');
    } catch (e) { showToast('❌ 儲存失敗：' + e.message); }
  };

  const saveServiceRecord = async () => {
    if (!selectedCust || !newRecord.service_date) return showToast('❌ 請填寫服務日期');
    try {
      const record = { ...newRecord, customer_phone: selectedCust.phone };
      const data = await sbPost('service_records', [record]);
      if (data && data.length > 0) setCustServiceRecords(prev => [data[0], ...prev]);
      setShowAddRecord(false);
      setNewRecord({});
      showToast('✅ 服務記錄已新增');
    } catch (e) { showToast('❌ 新增失敗：' + e.message); }
  };
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

 useEffect(() => { if (auth && tab === 'calendar') loadMonthAvail(schedYear, schedMonth); }, [auth, tab, schedYear, schedMonth, schedRefreshKey, loadMonthAvail]);
useEffect(() => { if (auth && tab === 'calendar' && schedDate) loadDaySlots(schedDate); }, [auth, tab, schedDate, schedRefreshKey, loadDaySlots]);

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

  const updateStatus = async (id, s) => {
    if (s === 'cancelled') { promptCancel(allBookings.find(x => x.id === id)); return; }
    const b = allBookings.find(x => x.id === id);
    try {
      await apiCall('update-booking-status', { bookingId: id, status: s });
      setAllBookings(prev => prev.map(x => x.id === id ? { ...x, status: s } : x));
      logChange(`${statusText(s)} — ${b?.customer_name} ${b?.booking_date} ${b?.booking_time}`);
      showToast(`✅ 狀態已更新為「${statusText(s)}」`);
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
        <button type="button" onClick={async () => { if (!loginEmail) { setLoginError('請先輸入 Email'); return; } setLoginError(''); setResetMsg(''); try { await apiCall('recover', { email: loginEmail, redirectUrl: window.location.origin + window.location.pathname }); setResetMsg('重設密碼連結已發送到你嘅 Email，請查收。'); } catch (err) { setLoginError('發送失敗：' + (err.message || '請稍後再試')); } }} style={{ background: 'none', border: 'none', color: '#999', fontSize: 13, marginTop: 16, cursor: 'pointer', textDecoration: 'underline', fontFamily: font }}>忘記密碼？</button>
      </form>
    </div>
  );

  const actBtn = (emoji, bg, bd, onClick, title) => (<button onClick={onClick} title={title} style={{ padding: '5px 9px', background: bg, border: `1px solid ${bd}`, borderRadius: 6, cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: font }}>{emoji}</button>);

  const PaginationBar = () => totalPages > 1 ? (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px', alignItems: 'center', borderTop: '1px solid #eee' }}>
      <button onClick={() => setBkPage(0)} disabled={bkPage === 0} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: bkPage === 0 ? '#ccc' : '#5c4a3a', cursor: bkPage === 0 ? 'default' : 'pointer', fontSize: 12, fontFamily: font }}>⏮</button>
      <button onClick={() => setBkPage(p => Math.max(0, p - 1))} disabled={bkPage === 0} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: bkPage === 0 ? '#ccc' : '#5c4a3a', cursor: bkPage === 0 ? 'default' : 'pointer', fontSize: 12, fontFamily: font }}>◀ 上一頁</button>
      <span style={{ fontSize: 13, color: '#5c4a3a', padding: '0 8px' }}>{bkPage + 1} / {totalPages}（共 {filteredBookings.length} 筆）</span>
      <button onClick={() => setBkPage(p => Math.min(totalPages - 1, p + 1))} disabled={bkPage >= totalPages - 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: bkPage >= totalPages - 1 ? '#ccc' : '#5c4a3a', cursor: bkPage >= totalPages - 1 ? 'default' : 'pointer', fontSize: 12, fontFamily: font }}>下一頁 ▶</button>
      <button onClick={() => setBkPage(totalPages - 1)} disabled={bkPage >= totalPages - 1} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: bkPage >= totalPages - 1 ? '#ccc' : '#5c4a3a', cursor: bkPage >= totalPages - 1 ? 'default' : 'pointer', fontSize: 12, fontFamily: font }}>⏭</button>
    </div>
  ) : null;

const allTabs = [
  { key: 'bookings', label: `📋 預約${stats.pending > 0 ? ` (${stats.pending})` : ''}`, show: true },
  { key: 'timeslots', label: '🕐 時段', show: true },
  { key: 'customers', label: '👥 客戶', show: true },
  { key: 'calendar', label: '📅 月曆', show: true },
  { key: 'packages', label: '🎫 套票', show: true },
  { key: 'receipts', label: '🧾 收據', show: true },
  { key: 'reminders', label: '📱 提醒', show: true },
  { key: 'reports', label: '📊 報表', show: isOwner },
  { key: 'frontend', label: '🎨 前台管理', show: isOwner },
  { key: 'templates', label: '📝 訊息模板', show: isOwner },
  { key: 'hours', label: '🕐 營業時間', show: true },
].filter(t => t.show);

  // ★ NEW — 審計日誌 action 名稱中文化
  const auditActionText = (a) => {
    if (a === 'booking_confirmed') return '✅ 確認預約';
    if (a === 'booking_completed') return '✔️ 完成預約';
    if (a === 'booking_cancelled') return '❌ 取消預約';
    if (a === 'customer_blacklist_toggle') return '🚫 黑名單切換';
    if (a === 'customer_notes_update') return '📝 客戶備註更新';
    return a;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', fontFamily: font }}>
      {toast && <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#5c4a3a', color: '#fff', padding: '12px 28px', borderRadius: 8, fontSize: 14, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast}</div>}
      {batchLoading && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: '#fff', padding: '30px 40px', borderRadius: 12, textAlign: 'center' }}><div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div><div style={{ fontSize: 14, color: '#5c4a3a' }}>處理中...</div></div></div>}

      {/* ═══ ★ NEW — 取消原因對話框 ═══ */}
      {showCancelDialog && cancelTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowCancelDialog(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', color: '#c62828', fontSize: 18 }}>❌ 取消預約</h3>
            <div style={{ fontSize: 14, color: '#5c4a3a', marginBottom: 16, padding: '10px 14px', background: '#FFF8E1', borderRadius: 8 }}>
              <div style={{ fontWeight: 700 }}>{cancelTarget.booking.customer_name}</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{cancelTarget.booking.booking_date} {cancelTarget.booking.booking_time} — {cancelTarget.booking.service_name}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 6, display: 'block' }}>取消原因（可選）</label>
              <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: font, marginBottom: 8, boxSizing: 'border-box' }}>
                <option value="">— 選擇原因 —</option>
                <option value="客人要求取消">客人要求取消</option>
                <option value="客人甩底 no-show">客人甩底 no-show</option>
                <option value="時間衝突">時間衝突</option>
                <option value="技師請假">技師請假</option>
                <option value="其他">其他</option>
              </select>
              {cancelReason === '其他' && (
                <input type="text" placeholder="請輸入原因..." onChange={e => setCancelReason(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, fontFamily: font, boxSizing: 'border-box' }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCancelDialog(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: font }}>返回</button>
              <button onClick={confirmCancel} disabled={cancelLoading} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: cancelLoading ? '#e0a0a0' : '#c62828', color: '#fff', cursor: cancelLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>{cancelLoading ? '處理中...' : '確認取消'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Booking Detail Modal ═══ */}
      {selectedBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={closeBooking}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>預約詳情</h3><button onClick={closeBooking} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button></div>
            <div style={{ marginBottom: 16 }}><span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, color: '#fff', background: statusColor(selectedBooking.status), fontWeight: 600 }}>{statusText(selectedBooking.status)}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#5c4a3a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>👤</span><div style={{ fontWeight: 700, fontSize: 16 }}>{selectedBooking.customer_name}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>📱</span><div>{selectedBooking.customer_phone}{selectedBooking.customer_phone && <a href={waLink(selectedBooking.customer_phone)} target="_blank" rel="noreferrer" style={{ marginLeft: 10, textDecoration: 'none', padding: '3px 10px', background: '#25D366', color: '#fff', borderRadius: 6, fontSize: 12 }}>💬 WhatsApp</a>}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>📅</span><div>{selectedBooking.booking_date}（週{DAYS[new Date(selectedBooking.booking_date + 'T00:00:00').getDay()]}）　{selectedBooking.booking_time}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>🎨</span><div>{selectedBooking.service_name}{selectedBooking.variant_label && <span style={{ color: '#999' }}> · {selectedBooking.variant_label}</span>}{selectedBooking.addon_names?.length > 0 && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>+ {selectedBooking.addon_names.join('、')}</div>}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 18 }}>💰</span><div style={{ fontSize: 22, fontWeight: 700 }}>${selectedBooking.total_price}</div></div>
              {(selectedBooking.notes || selectedBooking.remarks || selectedBooking.customer_notes) && <div style={{ padding: '10px 14px', background: '#FFF8E1', borderRadius: 8, fontSize: 13, color: '#F57F17' }}>📝 {selectedBooking.notes || selectedBooking.remarks || selectedBooking.customer_notes}</div>}
              {/* ★ NEW — 顯示取消原因 */}
              {selectedBooking.status === 'cancelled' && selectedBooking.cancel_reason && <div style={{ padding: '10px 14px', background: '#FFEBEE', borderRadius: 8, fontSize: 13, color: '#c62828' }}>❌ 取消原因：{selectedBooking.cancel_reason}</div>}
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
              {selectedBooking.customer_phone && <button onClick={() => { const msg = fillTemplate('reminder', selectedBooking) || `${selectedBooking.customer_name} 你好！關於你 ${selectedBooking.booking_date} ${selectedBooking.booking_time} 嘅預約，如有任何疑問歡迎聯絡我哋。\n— J.LAB`; sendWhatsApp(selectedBooking.customer_phone, msg); }} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #25D366', background: '#E8F5E9', color: '#25D366', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>📲 通知客人</button>}
              <div style={{ flex: 1 }} />
              <button onClick={modalDelete} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fafafa', color: '#999', cursor: 'pointer', fontSize: 14, fontFamily: font }}>🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Service Modal ═══ */}
      {editSvc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setEditSvc(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>{editSvcForm.id ? '✏️ 編輯服務' : '➕ 新增服務'}</h3><button onClick={() => setEditSvc(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>服務名稱 *</label><input value={editSvcForm.name || ''} onChange={e => setEditSvcForm(p => ({ ...p, name: e.target.value }))} placeholder="例：凝膠美甲" style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>描述</label><textarea value={editSvcForm.description || ''} onChange={e => setEditSvcForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font, resize: 'vertical' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>基本價格 ($)</label><input type="number" value={editSvcForm.base_price || 0} onChange={e => setEditSvcForm(p => ({ ...p, base_price: +e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
                <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>時長（分鐘）</label><input type="number" value={editSvcForm.duration_minutes || 60} onChange={e => setEditSvcForm(p => ({ ...p, duration_minutes: +e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>分類</label><input value={editSvcForm.category || ''} onChange={e => setEditSvcForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
                <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>圖片 URL</label><input value={editSvcForm.image_url || ''} onChange={e => setEditSvcForm(p => ({ ...p, image_url: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={editSvcForm.is_active !== false} onChange={e => setEditSvcForm(p => ({ ...p, is_active: e.target.checked }))} /><span style={{ fontSize: 13 }}>上架中</span></label>
              <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>📋 服務選項</span><button onClick={() => setEditSvcVariants(prev => [...prev, { label: '', price: 0, is_active: true, sort_order: prev.length }])} style={{ padding: '4px 12px', borderRadius: 6, border: '1px dashed #b8956a', background: 'transparent', color: '#b8956a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>+ 新增</button></div>
                {editSvcVariants.map((v, vi) => (<div key={vi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, padding: '8px 12px', background: '#faf6f0', borderRadius: 8 }}><input value={v.label} onChange={e => { const a = [...editSvcVariants]; a[vi] = { ...a[vi], label: e.target.value }; setEditSvcVariants(a); }} placeholder="名稱" style={{ flex: 2, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }} /><div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}><span style={{ fontSize: 13, color: '#999' }}>$</span><input type="number" value={v.price || 0} onChange={e => { const a = [...editSvcVariants]; a[vi] = { ...a[vi], price: +e.target.value }; setEditSvcVariants(a); }} style={{ width: '100%', padding: '8px 6px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} /></div><button onClick={() => setEditSvcVariants(prev => prev.filter((_, i) => i !== vi))} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 12 }}>✕</button></div>))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}><button onClick={() => setEditSvc(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: font }}>取消</button><button onClick={saveSvc} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: '#5c4a3a', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>💾 儲存</button></div>
          </div>
        </div>
      )}

      {editAddon && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setEditAddon(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>{editAddonForm.id ? '✏️ 編輯附加項目' : '➕ 新增附加項目'}</h3><button onClick={() => setEditAddon(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>名稱 *</label><input value={editAddonForm.name || ''} onChange={e => setEditAddonForm(p => ({ ...p, name: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>價格 ($)</label><input type="number" value={editAddonForm.price || 0} onChange={e => setEditAddonForm(p => ({ ...p, price: +e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>時間長度（分鐘）</label><input type="number" value={editAddonForm.duration_minutes || 0} onChange={e => setEditAddonForm(p => ({ ...p, duration_minutes: +e.target.value }))} placeholder="例：15" style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>描述</label><input value={editAddonForm.description || ''} onChange={e => setEditAddonForm(p => ({ ...p, description: e.target.value }))} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}><input type="checkbox" checked={editAddonForm.is_active !== false} onChange={e => setEditAddonForm(p => ({ ...p, is_active: e.target.checked }))} /><span style={{ fontSize: 13 }}>啟用中</span></label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}><button onClick={() => setEditAddon(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: font }}>取消</button><button onClick={saveAddon} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: '#5c4a3a', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>💾 儲存</button></div>
          </div>
        </div>
      )}

      {/* ═══ Header ═══ */}
      <div style={{ background: '#fff', padding: isMobile ? '16px 16px' : '20px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div><h1 style={{ fontSize: isMobile ? 17 : 20, color: '#5c4a3a', margin: 0 }}>J.LAB 管理後台</h1><p style={{ color: '#999', fontSize: 11, margin: '4px 0 0', letterSpacing: 1 }}>ADMIN DASHBOARD {!isOwner && <span style={{ color: '#FF9800' }}>（員工模式）</span>}</p></div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={openHistory} style={headerBtn}>🔍 {!isMobile && '歷史'}</button>
          <button onClick={() => { setShowChangePw(true); setCpOld(''); setCpNew(''); setCpConfirm(''); setCpMsg(''); setCpError(''); }} style={headerBtn}>🔑{!isMobile && ' 密碼'}</button>
          <button onClick={() => { setAuth(false); authToken = null; sessionStorage.removeItem('jlab_token'); showToast('已登出'); }} style={headerBtn}>登出</button>
        </div>
      </div>

      {/* ═══ ★ MODIFIED — History Modal（加審計日誌 Tab）═══ */}
      {showHistory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setShowHistory(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 24, width: '90%', maxWidth: 560, maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: font }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h3 style={{ margin: 0, fontSize: 18, color: '#3e2f1c' }}>📋 操作記錄</h3><button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>✕</button></div>
            {/* ★ NEW — 兩個 Tab 切換 */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
              {[['changes', '📝 操作日誌'], ['audit', '🔍 審計記錄']].map(([k, l]) => (
                <button key={k} onClick={() => { setHistoryTab(k); if (k === 'audit' && auditLogs.length === 0) fetchAuditLogs(); }} style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: historyTab === k ? 700 : 400, background: historyTab === k ? '#5c4a3a' : '#f5f0eb', color: historyTab === k ? '#fff' : '#5c4a3a', borderRadius: k === 'changes' ? '8px 0 0 8px' : '0 8px 8px 0' }}>{l}</button>
              ))}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {historyTab === 'changes' && (<>
                {logLoading ? <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>載入中...</p> : dbLogs.length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>暫無操作記錄</p> : dbLogs.map(log => (
                  <div key={log.id} style={{ padding: '12px 16px', marginBottom: 8, background: '#faf8f5', borderRadius: 10, borderLeft: '3px solid #b8956a' }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{new Date(log.created_at).toLocaleString('zh-HK')}{log.admin_email && <span style={{ marginLeft: 8 }}>by {log.admin_email}</span>}</div>
                    <div style={{ fontSize: 14, color: '#3e2f1c' }}>{log.action}</div>
                  </div>
                ))}
              </>)}
              {/* ★ NEW — 審計記錄 Tab */}
              {historyTab === 'audit' && (<>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><button onClick={fetchAuditLogs} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄 刷新</button></div>
                {auditLoading ? <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>載入中...</p> : auditLogs.length === 0 ? <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>暫無審計記錄</p> : auditLogs.map(log => (
                  <div key={log.id} style={{ padding: '12px 16px', marginBottom: 8, background: '#f5f8ff', borderRadius: 10, borderLeft: `3px solid ${log.action?.includes('cancel') ? '#f44336' : log.action?.includes('confirm') ? '#4CAF50' : '#2196F3'}` }}>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>{new Date(log.performed_at).toLocaleString('zh-HK')}</div>
                    <div style={{ fontSize: 14, color: '#3e2f1c', fontWeight: 600 }}>{auditActionText(log.action)}</div>
                    {log.details && (log.details.cancel_reason || log.details.notes) && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{log.details.cancel_reason && `原因：${log.details.cancel_reason}`}{log.details.notes && `備註：${log.details.notes}`}</div>}
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>{log.target_type} #{log.target_id}</div>
                  </div>
                ))}
              </>)}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Change Password Modal ═══ */}
      {showChangePw && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowChangePw(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}><h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>🔑 更改密碼</h3><button onClick={() => setShowChangePw(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button></div>
            {cpMsg && <div style={{ padding: '12px 16px', background: '#E8F5E9', color: '#2e7d32', borderRadius: 8, fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>{cpMsg}</div>}
            {cpError && <div style={{ padding: '12px 16px', background: '#FFEBEE', color: '#c62828', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>❌ {cpError}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>舊密碼</label><input type="password" value={cpOld} onChange={e => setCpOld(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>新密碼</label><input type="password" value={cpNew} onChange={e => setCpNew(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
              <div><label style={{ fontSize: 13, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>確認新密碼</label><input type="password" value={cpConfirm} onChange={e => setCpConfirm(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
            </div>
            <button onClick={handleChangePw} disabled={cpLoading} style={{ width: '100%', padding: 14, background: cpLoading ? '#a89888' : '#5c4a3a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: cpLoading ? 'not-allowed' : 'pointer', fontFamily: font, fontWeight: 600, marginTop: 20 }}>{cpLoading ? '處理中...' : '確認更改'}</button>
          </div>
        </div>
      )}

      {/* ═══ Tab Bar ═══ */}
      <div style={{ background: '#fff', borderTop: '1px solid #f0ebe3', padding: '0 16px', display: 'flex', gap: 0, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
        {allTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '14px 18px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #5c4a3a' : '2px solid transparent', fontSize: 13, color: tab === t.key ? '#5c4a3a' : '#999', fontWeight: tab === t.key ? 600 : 400, cursor: 'pointer', fontFamily: font, whiteSpace: 'nowrap' }}>{t.label}</button>
        ))}
      </div>

      {/* ═══ Pending Sync Bar ═══ */}
      {pendingCount > 0 && tab === 'timeslots' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)', borderBottom: '2px solid #FFB74D' }}>
          <div style={{ padding: '14px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ color: '#E65100', fontSize: 14, fontWeight: 600 }}>⏳「{activeStaff?.name}」{pendingCount} 個日期待同步</span><button onClick={() => setShowPendingList(!showPendingList)} style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #FFB74D', borderRadius: 4, color: '#E65100', cursor: 'pointer', fontSize: 12, fontFamily: font }}>{showPendingList ? '收起 ▲' : '查看 ▼'}</button></div>
            <div style={{ display: 'flex', gap: 8 }}><button onClick={() => { setPending({}); showToast('已清除'); setShowPendingList(false); }} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#666', fontFamily: font }}>取消全部</button><button onClick={syncPending} style={{ padding: '8px 24px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: font }}>✅ 確認同步到前台</button></div>
          </div>
          {showPendingList && (<div style={{ padding: '0 30px 14px', maxHeight: 240, overflowY: 'auto' }}><div style={{ background: '#fff', borderRadius: 8, overflow: 'hidden' }}>{Object.entries(pending).sort(([a], [b]) => a.localeCompare(b)).map(([date, times]) => (<div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f5f0eb' }}><div style={{ fontSize: 13 }}><span style={{ color: '#5c4a3a', fontWeight: 600 }}>{date}</span><span style={{ color: '#999', marginLeft: 6 }}>週{DAYS[new Date(date + 'T00:00:00').getDay()]}</span><span style={{ color: times.size > 0 ? '#4CAF50' : '#f44336', marginLeft: 10, fontSize: 12 }}>{times.size > 0 ? `${times.size} 個時段` : '全日關閉'}</span></div><button onClick={() => removePendingDate(date)} style={smallBtn('#ffebee', '#c62828', '#ffcdd2')}>移除</button></div>))}</div></div>)}
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>

        {/* ═══ BOOKINGS TAB（原有，加上取消原因顯示）═══ */}
      {tab === 'bookings' && (<>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {[{ label: '今日', value: stats.today, sub: `$${stats.todayRev}`, color: '#FF9800' }, { label: '本月', value: stats.month, sub: `$${stats.monthRev}`, color: '#2196F3' }, { label: nextMonthLabel, value: stats.nextMonth, sub: `$${stats.nextMonthRev}`, color: '#9C27B0' }, { label: '待處理', value: stats.pending, sub: null, color: stats.pending > 0 ? '#f44336' : '#999', action: stats.pending > 0 }, { label: '總數', value: stats.total, sub: null, color: '#5c4a3a' }].map((s, i) => (
              <div key={i} style={{ background: '#fff', padding: '10px 14px', borderRadius: 10, textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', borderLeft: `3px solid ${s.color}`, flex: '1 0 90px', minWidth: 90 }}>
                <p style={{ color: '#999', fontSize: 11, margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 'bold', color: s.color, margin: 0, lineHeight: 1.2 }}>{s.value}</p>
                {s.sub && <p style={{ fontSize: 11, color: '#bbb', margin: '2px 0 0' }}>💰{s.sub}</p>}
                {s.action && <button onClick={confirmAllPending} style={{ marginTop: 4, padding: '3px 10px', borderRadius: 4, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 10, fontFamily: font, fontWeight: 600 }}>✅ 全確認</button>}
              </div>
            ))}
          </div>

          {revenueData.length > 2 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a', marginBottom: 12 }}>📊 近期收入趨勢</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100, overflowX: 'auto' }}>
                {revenueData.map(d => (
                  <div key={d.date} style={{ flex: '1 0 18px', minWidth: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: 9, color: '#999', marginBottom: 2 }} title={`${d.date}: $${d.revenue} (${d.count}單)`}>${d.revenue}</div>
                    <div style={{ width: '80%', background: '#b8956a', borderRadius: '4px 4px 0 0', height: `${Math.max((d.revenue / maxRevenue) * 100, 3)}%`, minHeight: 3, transition: 'height 0.3s' }} />
                    <div style={{ fontSize: 8, color: '#aaa', marginTop: 2 }}>{d.date.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 12, marginBottom: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: 10 }}><input type="text" placeholder="🔍 搜尋客人名稱或電話..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setBkPage(0); }} style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} /></div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <span style={{ color: '#5c4a3a', fontWeight: 600, fontSize: 13 }}>日期：</span>
              <input type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setBkPage(0); }} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
              <span style={{ color: '#999', fontSize: 12 }}>至</span>
              <input type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setBkPage(0); }} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
              <div style={{ display: 'flex', gap: 4 }}>{[['今日', 'today'], ['明日', 'tomorrow'], ['本週', 'week'], ['本月', 'month'], ['下月', 'nextMonth']].map(([l, k]) => (<button key={k} onClick={() => setQuickDate(k)} style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 11, fontFamily: font }}>{l}</button>))}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setBkPage(0); }} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}><option value="all">全部狀態</option><option value="pending">待確認</option><option value="confirmed">已確認</option><option value="completed">已完成</option><option value="cancelled">已取消</option></select>
              <select value={filterTech} onChange={e => { setFilterTech(e.target.value); setBkPage(0); }} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}><option value="all">全部技師</option>{techList.map(t => <option key={t} value={t}>{t}</option>)}</select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#999', cursor: 'pointer' }}><input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /> 自動刷新</label>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {hasFilters && <button onClick={clearFilters} style={{ padding: '6px 14px', background: '#f5f0eb', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#999', fontSize: 12, fontFamily: font }}>✕ 清除</button>}
                <button onClick={fetchBookings} style={{ padding: '6px 14px', background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄 刷新</button>
              </div>
            </div>
          </div>
          {hasFilters && <div style={{ padding: '8px 14px', marginBottom: 12, borderRadius: 8, background: '#FFF8E1', border: '1px solid #FFE082', fontSize: 13, color: '#F57F17' }}>🔍 篩選結果：{filteredBookings.length} / {allBookings.length} 筆</div>}
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#5c4a3a', fontSize: 16 }}>預約列表 ({filteredBookings.length})</h2>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={exportCSV} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>📥 匯出 CSV</button>
                {autoRefresh && <span style={{ fontSize: 11, color: '#999' }}>🔄 30秒刷新</span>}
              </div>
            </div>
            {bkLoading ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>載入中...</p> : filteredBookings.length === 0 ? <p style={{ padding: 40, textAlign: 'center', color: '#999' }}>{hasFilters ? '搵唔到符合條件嘅預約' : '暫無預約'}</p> : isMobile ? (
              <div style={{ padding: '12px 16px' }}>{pagedBookings.map(b => (
                <div key={b.id} onClick={() => openBooking(b)} style={{ background: rowBg(b.status), borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid #e8e0d8', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}><div><span style={{ fontWeight: 700, fontSize: 15, color: '#5c4a3a' }}>{b.customer_name}</span><div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>{b.customer_phone}</div></div><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#fff', background: statusColor(b.status), fontWeight: 600 }}>{statusText(b.status)}</span></div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>📅 {b.booking_date}　🕐 {b.booking_time}　👤 {b.technician_label || '未指定'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 13, color: '#5c4a3a' }}>{b.service_name}</span><span style={{ fontSize: 17, fontWeight: 700, color: '#5c4a3a' }}>${b.total_price}</span></div>
                  {b.cancel_reason && <div style={{ fontSize: 11, color: '#c62828', marginTop: 4 }}>❌ {b.cancel_reason}</div>}
                  {b.status === 'pending' && <div style={{ marginTop: 8, display: 'flex', gap: 6 }}><button onClick={e => { e.stopPropagation(); updateStatus(b.id, 'confirmed'); }} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: 600 }}>✅ 快速確認</button></div>}
                </div>
              ))}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead><tr style={{ background: '#f9f6f3' }}>{['日期', '時間', '服務', '客人', '電話', '技師', '金額', '狀態', '操作'].map(h => <th key={h} style={{ padding: '12px 10px', textAlign: 'left', color: '#5c4a3a', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 13 }}>{h}</th>)}</tr></thead>
                  <tbody>{pagedBookings.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0', background: rowBg(b.status), cursor: 'pointer' }} onClick={() => openBooking(b)}>
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{b.booking_date}<div style={{ fontSize: 11, color: '#999' }}>週{DAYS[new Date(b.booking_date + 'T00:00:00').getDay()]}</div></td>
                      <td style={{ padding: '12px 10px', fontWeight: 600 }}>{b.booking_time}</td>
                      <td style={{ padding: '12px 10px' }}>{b.service_name}{b.variant_label && <div style={{ fontSize: 12, color: '#999' }}>{b.variant_label}</div>}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 500 }}>{b.customer_name}</td>
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>{b.customer_phone}{b.customer_phone && <a href={waLink(b.customer_phone)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ marginLeft: 6, textDecoration: 'none', fontSize: 14 }}>💬</a>}</td>
                      <td style={{ padding: '12px 10px' }}>{b.technician_label || <span style={{ color: '#ccc' }}>-</span>}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', fontSize: 15 }}>${b.total_price}</td>
                      <td style={{ padding: '12px 10px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, color: '#fff', background: statusColor(b.status), fontWeight: 600 }}>{statusText(b.status)}</span>{b.cancel_reason && <div style={{ fontSize: 10, color: '#c62828', marginTop: 2 }}>{b.cancel_reason}</div>}</td>
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
            <PaginationBar />
          </div>
        </>)}

        {/* ═══ TIMESLOTS TAB（加封鎖日期管理）═══ */}
        {tab === 'timeslots' && (<>
          <div style={{ ...card, background: '#e8f5e9', border: '1px solid #a5d6a7', padding: 16 }}><div style={{ fontSize: 13, color: '#2e7d32', lineHeight: 2 }}>💡 <b>流程：</b>選員工 → 月曆選日期 → 套用模板 → 按「確認同步到前台」</div></div>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><div style={sTitle}>👤 員工時間表</div></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              {staffList.map(s => <button key={s.id} onClick={() => switchStaff(s)} style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: activeStaff?.id === s.id ? 700 : 400, border: activeStaff?.id === s.id ? '2px solid #5c4a3a' : '2px solid #d0c8bc', background: activeStaff?.id === s.id ? '#5c4a3a' : '#fff', color: activeStaff?.id === s.id ? '#fff' : '#5c4a3a' }}>{s.name}{activeStaff?.id === s.id && ' ✓'}</button>)}
              {!showAddStaff ? <button onClick={() => setShowAddStaff(true)} style={{ padding: '10px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontFamily: font, border: '2px dashed #c0b8aa', background: 'transparent', color: '#999' }}>＋ 新增</button> : (<div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="text" placeholder="名稱..." value={newStaffName} onChange={e => setNewStaffName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStaff()} autoFocus style={{ padding: '8px 14px', border: '2px solid #5c4a3a', borderRadius: 8, fontSize: 14, fontFamily: font, width: 120 }} /><button onClick={addStaff} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#5c4a3a', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font }}>確定</button><button onClick={() => { setShowAddStaff(false); setNewStaffName(''); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#999', cursor: 'pointer', fontSize: 13, fontFamily: font }}>取消</button></div>)}
            </div>
            {activeStaff && (<div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 16px', background: '#f9f6f3', borderRadius: 8 }}><span style={{ fontSize: 13, color: '#999' }}>管理：</span>{editStaffId === activeStaff.id ? (<><input type="text" value={editStaffName} onChange={e => setEditStaffName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveStaffName()} autoFocus style={{ padding: '6px 12px', border: '2px solid #5c4a3a', borderRadius: 6, fontSize: 14, fontFamily: font, width: 130 }} /><button onClick={saveStaffName} style={smallBtn('#5c4a3a', '#fff')}>儲存</button><button onClick={() => setEditStaffId(null)} style={smallBtn('#fff', '#999', '#ccc')}>取消</button></>) : (<><span style={{ fontSize: 16, fontWeight: 700, color: '#5c4a3a' }}>{activeStaff.name}</span><button onClick={() => { setEditStaffId(activeStaff.id); setEditStaffName(activeStaff.name); }} style={smallBtn('#fff', '#5c4a3a', '#d0c8bc')}>✏️ 改名</button>{staffList.length > 1 && <button onClick={() => removeStaff(activeStaff.id)} style={smallBtn('#ffebee', '#c62828', '#ffcdd2')}>🗑️</button>}</>)}</div>)}
          </div>
          {activeStaff && (<>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              <div style={card}>
                <div style={sTitle}>📅 選擇日期</div><div style={sDesc}>點日期查看「{activeStaff.name}」嘅時段</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><button onClick={prevCal} style={navBtn}>◀</button><span style={{ fontSize: 17, fontWeight: 600, color: '#5c4a3a' }}>{calYear}年 {calMonth + 1}月</span><button onClick={nextCal} style={navBtn}>▶</button></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                  {DAYS.map((d, i) => <button key={`h${i}`} onClick={() => toggleWeekdayCol(i)} style={{ padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: isColAllSel(i) ? '#5c4a3a' : '#f0ebe3', color: isColAllSel(i) ? '#fff' : '#5c4a3a', fontSize: 13, fontWeight: 600, fontFamily: font }}>{d}</button>)}
                  {calDays.map((day, i) => { if (!day) return <div key={`e${i}`} />; const ds = toDS(calYear, calMonth, day), sel = selDates.has(ds), isActive = ds === activeDate, isToday = ds === todayStr, hasPend = !!pending[ds]; return <button key={`d${i}`} onClick={() => toggleDate(day)} style={{ padding: '12px 4px', borderRadius: 8, cursor: 'pointer', position: 'relative', border: isActive ? '3px solid #FF9800' : sel ? '2px solid #5c4a3a' : '2px solid transparent', background: sel ? (isActive ? '#4a3a2a' : '#5c4a3a') : hasPend ? '#e8f5e9' : 'transparent', color: sel ? '#fff' : isToday ? '#FF9800' : '#666', fontSize: 14, fontWeight: isToday || sel || isActive ? 700 : 400, fontFamily: font }}>{day}{hasPend && !sel && <div style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, background: '#4CAF50', borderRadius: '50%' }} />}</button>; })}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>{[['平日', d => d >= 1 && d <= 5], ['週末', d => d === 0 || d === 6], ['全月', () => true]].map(([l, fn]) => <button key={l} onClick={() => selectByFilter(fn)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>{l}</button>)}<button onClick={() => setSelDates(new Set())} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#999', cursor: 'pointer', fontSize: 12, fontFamily: font }}>清除</button></div>
                {selDates.size > 0 && <div style={{ marginTop: 14, padding: '8px 14px', background: '#f0ebe3', borderRadius: 8, fontSize: 13, color: '#5c4a3a' }}>已選 <b>{selDates.size}</b> 日</div>}
              </div>
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}><div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a' }}>🕐 {activeStaff.name} — {activeDate}（週{DAYS[activeDow]}）</div><div style={{ display: 'flex', gap: 6 }}><button onClick={() => setAllTimes(true)} style={smallBtn('#e8f5e9', '#2e7d32')}>全開</button><button onClick={() => setAllTimes(false)} style={smallBtn('#ffebee', '#c62828')}>全關</button><button onClick={() => loadActiveFromDB(activeDate)} style={smallBtn('#f5f0eb', '#5c4a3a')}>🔄</button></div></div>
                <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, background: '#f9f6f3', border: '1px solid #e8e0d8' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}><span style={{ color: '#5c4a3a', fontWeight: 500 }}>範圍</span><select value={gridStart} onChange={e => setGridStart(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font }}>{ALL_TIMES_15.map(t => <option key={t} value={t}>{t}</option>)}</select><span style={{ color: '#999' }}>至</span><select value={gridEnd} onChange={e => setGridEnd(e.target.value)} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 13, fontFamily: font }}>{ALL_TIMES_15.map(t => <option key={t} value={t}>{t}</option>)}</select><button onClick={autoFitRange} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #a5d6a7', background: '#e8f5e9', color: '#2e7d32', cursor: 'pointer', fontSize: 12, fontFamily: font }}>📐</button></div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}><span style={{ color: '#5c4a3a', fontWeight: 500, fontSize: 13 }}>間隔</span>{INTERVAL_OPTIONS.map(m => <button key={m} onClick={() => setGridInterval(m)} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: font, background: gridInterval === m ? '#5c4a3a' : '#e8e0d8', color: gridInterval === m ? '#fff' : '#5c4a3a', fontWeight: gridInterval === m ? 600 : 400 }}>{m}分</button>)}</div>
                </div>
                <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12, background: isInPending ? '#FFF3E0' : dbStatus === 'available' ? '#e8f5e9' : '#f5f5f5', color: isInPending ? '#E65100' : dbStatus === 'available' ? '#2e7d32' : '#999', border: `1px solid ${isInPending ? '#FFB74D' : dbStatus === 'available' ? '#a5d6a7' : '#e0e0e0'}` }}>{isInPending ? `⏳ 未同步 — ${displayTimes.size}/${gridTimes.length} 時段` : dbStatus === 'available' ? `✅ 已同步 — ${displayTimes.size} 時段` : '🔒 未開放'}</div>
                {gridLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : (<div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${gridInterval >= 60 ? '80px' : '68px'}, 1fr))`, gap: 5, maxHeight: 480, overflowY: 'auto' }}>{gridTimes.map(t => { const isOn = displayTimes.has(t); return <button key={t} onClick={() => toggleTime(t)} style={{ padding: '10px 4px', borderRadius: 6, border: `2px solid ${isOn ? '#5c4a3a' : '#e0d8cc'}`, background: isOn ? '#5c4a3a' : '#faf6f0', color: isOn ? '#fff' : '#c0b8aa', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font }}>{t}</button>; })}</div>)}
              </div>
            </div>
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 6 }}><div style={sTitle}>⚡ 套用模板到「{activeStaff.name}」</div>{selDates.size > 0 ? <span style={{ fontSize: 12, color: '#4CAF50', fontWeight: 600 }}>已選 {selDates.size} 日</span> : <span style={{ fontSize: 12, color: '#c00' }}>請先選擇日期</span>}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {templates.map((t, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#faf6f0', border: '1px solid #e8e0d8', opacity: selDates.size === 0 ? 0.5 : 1, flexWrap: 'wrap' }}><span style={{ fontSize: 18 }}>{t.icon}</span><span style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', minWidth: 52 }}>{t.label}</span>{t.from !== null ? <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1 1 auto', minWidth: 0 }}><select value={t.from} onChange={e => setTemplates(prev => prev.map((tt, idx) => idx === i ? { ...tt, from: e.target.value } : tt))} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}</select><span style={{ color: '#999', fontSize: 11 }}>–</span><select value={t.to} onChange={e => setTemplates(prev => prev.map((tt, idx) => idx === i ? { ...tt, to: e.target.value } : tt))} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(time => <option key={time} value={time}>{time}</option>)}</select></div> : <span style={{ flex: '1 1 auto', fontSize: 12, color: '#999' }}>全日關閉</span>}<button onClick={() => applyTemplateLocal(t)} disabled={selDates.size === 0} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontFamily: font, fontWeight: 600, background: selDates.size === 0 ? '#ddd' : '#5c4a3a', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer' }}>套用</button></div>))}
                <div style={{ borderTop: '1px dashed #d0c8bc', marginTop: 6, paddingTop: 10 }}><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#fff5f5', border: '1px solid #ffcdd2', opacity: selDates.size === 0 ? 0.5 : 1, flexWrap: 'wrap' }}><span style={{ fontSize: 18 }}>🍽️</span><span style={{ fontSize: 13, fontWeight: 600, color: '#c62828', minWidth: 52 }}>休息</span><div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: '1 1 auto', minWidth: 0 }}><select value={breakFrom} onChange={e => setBreakFrom(e.target.value)} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}</select><span style={{ color: '#999', fontSize: 11 }}>–</span><select value={breakTo} onChange={e => setBreakTo(e.target.value)} style={{ padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12, fontFamily: font, flex: '1 1 0', minWidth: 0 }}>{ALL_TIMES.map(t => <option key={t} value={t}>{t}</option>)}</select></div><button onClick={applyBreakLocal} disabled={selDates.size === 0} style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontFamily: font, fontWeight: 600, background: selDates.size === 0 ? '#ddd' : '#e53935', color: '#fff', cursor: selDates.size === 0 ? 'not-allowed' : 'pointer' }}>扣除</button></div></div>
              </div>
            </div>

            {/* ★ NEW — 封鎖日期管理 */}
            <div style={card}>
              <div style={sTitle}>🚫 封鎖日期（全店休息）</div>
              <div style={sDesc}>封鎖嘅日期所有員工都唔會開放預約</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="date" value={newBD} onChange={e => setNewBD(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14 }} />
                <input type="text" placeholder="原因（例：公眾假期）" value={newBR} onChange={e => setNewBR(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, fontFamily: font, flex: 1, minWidth: 120 }} />
                <button onClick={addBlockedDate} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#c62828', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>🚫 封鎖</button>
              </div>
              {blocked.length === 0 ? <div style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 20 }}>暫無封鎖日期</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {blocked.map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FFEBEE', borderRadius: 8, border: '1px solid #ffcdd2' }}>
                      <div><span style={{ fontWeight: 600, color: '#c62828' }}>{b.date}</span><span style={{ color: '#999', marginLeft: 8, fontSize: 13 }}>（週{DAYS[new Date(b.date + 'T00:00:00').getDay()]}）</span>{b.reason && <span style={{ marginLeft: 8, fontSize: 12, color: '#888' }}>{b.reason}</span>}</div>
                      <button onClick={() => removeBlockedDate(b.id)} style={smallBtn('#fff', '#c62828', '#ffcdd2')}>移除</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>)}
        </>)}

        {/* ═══ ★ MODIFIED — CUSTOMERS TAB（加黑名單 + 刷新統計）═══ */}
       {/* ═══ CUSTOMERS TAB ═══ */}
        {tab === 'customers' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <input type="text" placeholder="🔍 搜尋客人名 / 電話 / 標籤..." value={custSearch} onChange={e => setCustSearch(e.target.value)} style={{ flex: 1, minWidth: 200, padding: '10px 14px', border: '1px solid #d0c8bc', borderRadius: 8, fontSize: 14, fontFamily: font }} />
              <button onClick={refreshCustomerStats} style={{ padding: '10px 16px', background: '#FF9800', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>📊 刷新統計</button>
<button onClick={() => { setShowAddCust(true); setNewCust({ name: '', phone: '', email: '', notes: '' }); }} style={{ padding: '10px 16px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>+ 新增客戶</button>
<button onClick={fetchCustomers} style={{ ... }}>🔄</button>
</div>
{showAddCust && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowAddCust(false)}>
    <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: '#5c4a3a', fontSize: 18 }}>👤 新增客戶</h3>
        <button onClick={() => setShowAddCust(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>姓名 *</label>
          <input value={newCust.name} onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))} placeholder="例：陳小姐" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>電話 *</label>
          <input value={newCust.phone} onChange={e => setNewCust(p => ({ ...p, phone: e.target.value }))} placeholder="例：91234567" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>Email</label>
          <input value={newCust.email} onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))} placeholder="可選" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#5c4a3a', fontWeight: 600, marginBottom: 4, display: 'block' }}>備註</label>
          <textarea value={newCust.notes} onChange={e => setNewCust(p => ({ ...p, notes: e.target.value }))} placeholder="過敏、喜好等..." rows={3} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: font, resize: 'vertical' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
        <button onClick={() => setShowAddCust(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: font }}>取消</button>
        <button onClick={addCustomer} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✅ 儲存客戶</button>
      </div>
    </div>
  </div>
)}
              {selectedCust ? (
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <button onClick={() => { setSelectedCust(null); setCustBookings([]); setCustEditing(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#b8956a', fontFamily: font }}>← 返回列表</button>
                  <button onClick={() => setCustEditing(!custEditing)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: custEditing ? '#5c4a3a' : '#faf6f0', color: custEditing ? '#fff' : '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>{custEditing ? '✏️ 編輯中' : '✏️ 編輯'}</button>
                </div>

                {/* Summary */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px 20px', background: '#f9f6f3', borderRadius: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #b8956a, #d4a574)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{selectedCust.name?.[0] || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#5c4a3a' }}>{selectedCust.name}</span>
                      {selectedCust.is_blacklisted && <span style={{ padding: '2px 8px', background: '#FFEBEE', color: '#c62828', borderRadius: 6, fontSize: 11 }}>🚫 黑名單</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>📞 {selectedCust.phone}{selectedCust.instagram && <span style={{ marginLeft: 10, color: '#9b59b6' }}>📷 {selectedCust.instagram}</span>}</div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
                  {[
                    { label: '到訪', value: selectedCust.total_visits || 0, color: '#5c4a3a' },
                    { label: '總消費', value: `$${selectedCust.total_spent || 0}`, color: '#2196F3' },
                    { label: '積分', value: selectedCust.total_points || 0, color: '#FF9800' },
                    { label: '套票', value: custPackages.length, color: '#9C27B0' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center', padding: '10px 6px', background: '#f9f6f3', borderRadius: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: '#999' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Profile Tabs */}
                <div style={{ display: 'flex', gap: 0, marginBottom: 16, background: '#f5f0eb', borderRadius: 8, padding: 3 }}>
                  {[{ id: 'info', label: '👤 資料' }, { id: 'preference', label: '💜 偏好' }, { id: 'records', label: '📋 記錄' }, { id: 'finance', label: '💰 消費' }].map(t => (
                    <button key={t.id} onClick={() => setCustProfileTab(t.id)} style={{ flex: 1, padding: '10px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: custProfileTab === t.id ? 700 : 400, background: custProfileTab === t.id ? '#5c4a3a' : 'transparent', color: custProfileTab === t.id ? '#fff' : '#5c4a3a' }}>{t.label}</button>
                  ))}
                </div>

                {/* INFO TAB */}
                {custProfileTab === 'info' && (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                      {[{ label: '姓名', key: 'name' }, { label: '電話', key: 'phone', readonly: true }, { label: '生日', key: 'birthday', placeholder: 'MM-DD' }, { label: 'Instagram', key: 'instagram', placeholder: '@username' }].map(f => (
                        <div key={f.key}>
                          <label style={{ fontSize: 11, color: '#999', marginBottom: 4, display: 'block' }}>{f.label}</label>
                          {custEditing && !f.readonly ? <input value={selectedCust[f.key] || ''} onChange={e => setSelectedCust(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder || ''} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: font }} /> : <div style={{ fontSize: 14, fontWeight: 500, color: '#5c4a3a', padding: '8px 0' }}>{selectedCust[f.key] || '—'}</div>}
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid #f0ebe3', paddingTop: 16, marginBottom: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a', marginBottom: 10 }}>✨ 皮膚 / 睫毛狀態</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {[{ label: '膚質', key: 'skin_type', opts: ['', '油性', '乾性', '混合', '敏感'] }, { label: '眼型', key: 'eye_type', opts: ['', '單眼皮', '雙眼皮', '內雙'] }, { label: '睫毛狀態', key: 'lash_condition', opts: ['', '短而稀', '中等', '長而密'] }].map(f => (
                          <div key={f.key}>
                            <label style={{ fontSize: 11, color: '#999', marginBottom: 4, display: 'block' }}>{f.label}</label>
                            {custEditing ? <select value={selectedCust[f.key] || ''} onChange={e => setSelectedCust(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font, boxSizing: 'border-box' }}>{f.opts.map(o => <option key={o} value={o}>{o || '— 選擇 —'}</option>)}</select> : <div style={{ fontSize: 14, color: '#5c4a3a', padding: '8px 0' }}>{selectedCust[f.key] || '—'}</div>}
                          </div>
                        ))}
                        <div>
                          <label style={{ fontSize: 11, color: '#999', marginBottom: 4, display: 'block' }}>過敏史</label>
                          {custEditing ? <input value={selectedCust.allergy_history || ''} onChange={e => setSelectedCust(prev => ({ ...prev, allergy_history: e.target.value, has_allergy: !!e.target.value }))} placeholder="無 / 詳情..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: font }} /> : <div style={{ fontSize: 14, color: selectedCust.has_allergy ? '#c62828' : '#5c4a3a', padding: '8px 0' }}>{selectedCust.allergy_history || '無'}</div>}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 11, color: '#999', marginBottom: 6, display: 'block' }}>標籤</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(selectedCust.tags || []).map(tag => (<span key={tag} style={{ background: '#f5f0eb', color: '#5c4a3a', padding: '3px 10px', borderRadius: 12, fontSize: 12 }}>{tag}{custEditing && <span onClick={() => removeCustTag(selectedCust.id, tag)} style={{ cursor: 'pointer', marginLeft: 4, color: '#c62828' }}>✕</span>}</span>))}
                        <input placeholder="+ 標籤 ↵" onKeyDown={e => { if (e.key === 'Enter' && e.target.value.trim()) { addCustTag(selectedCust.id, e.target.value); e.target.value = ''; } }} style={{ border: '1px dashed #d0c8bc', borderRadius: 12, padding: '3px 10px', fontSize: 12, width: 80, fontFamily: font }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 11, color: '#999', marginBottom: 4, display: 'block' }}>備註</label>
                      <textarea value={selectedCust.notes || ''} onChange={e => setSelectedCust(prev => ({ ...prev, notes: e.target.value }))} placeholder="備註..." rows={3} style={{ width: '100%', padding: 10, border: '1px solid #d0c8bc', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: font }} readOnly={!custEditing} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {custEditing && <button onClick={saveCustomerProfile} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>💾 儲存資料</button>}
                      <button onClick={() => toggleBlacklist(selectedCust.id, selectedCust.is_blacklisted)} style={{ padding: '10px 16px', borderRadius: 8, border: `1px solid ${selectedCust.is_blacklisted ? '#a5d6a7' : '#ffcdd2'}`, background: selectedCust.is_blacklisted ? '#E8F5E9' : '#FFEBEE', color: selectedCust.is_blacklisted ? '#2e7d32' : '#c62828', cursor: 'pointer', fontSize: 13, fontFamily: font }}>{selectedCust.is_blacklisted ? '✅ 解除黑名單' : '🚫 黑名單'}</button>
                  <button onClick={() => {
  setShowNewReceipt(true);
  setNewReceipt(prev => ({
    ...prev,
    customer_name: selectedCust.name || '',
    customer_phone: selectedCust.phone || '',
  }));
  setTab('receipts');
}} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#FF9800', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>
  🧾 出單
</button>

                      <button onClick={() => deleteCustomer(selectedCust.id)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ffcdd2', background: '#FFEBEE', color: '#c62828', cursor: 'pointer', fontSize: 13, fontFamily: font }}>🗑️ 刪除客戶</button>
                    </div>
                  </div>
                )}

                {/* PREFERENCE TAB */}
                {custProfileTab === 'preference' && (
                  <div>
                    <div style={{ padding: 14, background: '#fdf2f8', borderRadius: 10, marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: '#ec4899', fontWeight: 600 }}>喜歡款式</label>
                      {custEditing ? (
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          {['自然', '濃密', '飛揚', '貓眼', '芭比', '眼線感'].map(s => (
                            <button key={s} onClick={() => setSelectedCust(prev => ({ ...prev, preferred_style: s }))} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontFamily: font, border: 'none', cursor: 'pointer', background: selectedCust.preferred_style === s ? '#ec4899' : '#fff', color: selectedCust.preferred_style === s ? '#fff' : '#666' }}>{s}</button>
                          ))}
                        </div>
                      ) : <div style={{ fontSize: 16, fontWeight: 700, color: '#5c4a3a', marginTop: 4 }}>{selectedCust.preferred_style || '未設定'}</div>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <div style={{ padding: 12, background: '#f3e8ff', borderRadius: 10 }}>
                        <label style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>常用捲度</label>
                        {custEditing ? <select value={selectedCust.preferred_curl || ''} onChange={e => setSelectedCust(prev => ({ ...prev, preferred_curl: e.target.value }))} style={{ width: '100%', marginTop: 6, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}><option value="">-</option>{['J','B','C','CC','D','DD','L','M'].map(v => <option key={v} value={v}>{v}</option>)}</select> : <div style={{ fontSize: 20, fontWeight: 700, color: '#5c4a3a', marginTop: 4 }}>{selectedCust.preferred_curl || '—'}</div>}
                      </div>
                      <div style={{ padding: 12, background: '#dbeafe', borderRadius: 10 }}>
                        <label style={{ fontSize: 11, color: '#2563eb', fontWeight: 600 }}>常用粗度</label>
                        {custEditing ? <select value={selectedCust.preferred_thickness || ''} onChange={e => setSelectedCust(prev => ({ ...prev, preferred_thickness: e.target.value }))} style={{ width: '100%', marginTop: 6, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }}><option value="">-</option>{['0.03','0.05','0.07','0.10','0.12','0.15','0.20'].map(v => <option key={v} value={v}>{v}</option>)}</select> : <div style={{ fontSize: 20, fontWeight: 700, color: '#5c4a3a', marginTop: 4 }}>{selectedCust.preferred_thickness || '—'}</div>}
                      </div>
                      <div style={{ padding: 12, background: '#dcfce7', borderRadius: 10 }}>
                        <label style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>常用長度</label>
                        {custEditing ? <input value={selectedCust.preferred_length || ''} onChange={e => setSelectedCust(prev => ({ ...prev, preferred_length: e.target.value }))} placeholder="e.g. 9-12mm" style={{ width: '100%', marginTop: 6, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font, boxSizing: 'border-box' }} /> : <div style={{ fontSize: 16, fontWeight: 700, color: '#5c4a3a', marginTop: 4 }}>{selectedCust.preferred_length || '—'}</div>}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: '#f9f6f3', borderRadius: 10 }}>
                      <label style={{ fontSize: 11, color: '#5c4a3a', fontWeight: 600 }}>其他偏好備註</label>
                      {custEditing ? <textarea value={selectedCust.other_preferences || ''} onChange={e => setSelectedCust(prev => ({ ...prev, other_preferences: e.target.value }))} rows={2} style={{ width: '100%', marginTop: 6, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font, resize: 'none', boxSizing: 'border-box' }} /> : <div style={{ fontSize: 13, color: '#5c4a3a', marginTop: 4 }}>{selectedCust.other_preferences || '無'}</div>}
                    </div>
                    {custEditing && <button onClick={saveCustomerProfile} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>💾 儲存偏好</button>}
                  </div>
                )}

                {/* RECORDS TAB */}
                {custProfileTab === 'records' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>📋 服務記錄 ({custServiceRecords.length})</span>
                      <button onClick={() => { setShowAddRecord(true); setNewRecord({ service_date: getLocalDate(), staff_name: '', service_name: '', curl_used: '', thickness_used: '', length_used: '', satisfaction: 0, notes: '' }); }} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#5c4a3a', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: font }}>+ 新增記錄</button>
                    </div>
                    {showAddRecord && (
                      <div style={{ padding: 16, background: '#FFFDE7', borderRadius: 10, border: '1px solid #FFF176', marginBottom: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#F57F17', marginBottom: 12 }}>➕ 新增服務記錄</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div><label style={{ fontSize: 11, color: '#666' }}>日期 *</label><input type="date" value={newRecord.service_date || ''} onChange={e => setNewRecord(p => ({ ...p, service_date: e.target.value }))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} /></div>
                          <div><label style={{ fontSize: 11, color: '#666' }}>技師</label><select value={newRecord.staff_name || ''} onChange={e => setNewRecord(p => ({ ...p, staff_name: e.target.value }))} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font, boxSizing: 'border-box' }}><option value="">選擇</option>{staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                          <div><label style={{ fontSize: 11, color: '#666' }}>服務</label><input value={newRecord.service_name || ''} onChange={e => setNewRecord(p => ({ ...p, service_name: e.target.value }))} placeholder="例：自然美睫" style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font, boxSizing: 'border-box' }} /></div>
                          <div><label style={{ fontSize: 11, color: '#666' }}>捲度</label><input value={newRecord.curl_used || ''} onChange={e => setNewRecord(p => ({ ...p, curl_used: e.target.value }))} placeholder="C+D" style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} /></div>
                          <div><label style={{ fontSize: 11, color: '#666' }}>粗度</label><input value={newRecord.thickness_used || ''} onChange={e => setNewRecord(p => ({ ...p, thickness_used: e.target.value }))} placeholder="0.07" style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} /></div>
                          <div><label style={{ fontSize: 11, color: '#666' }}>長度</label><input value={newRecord.length_used || ''} onChange={e => setNewRecord(p => ({ ...p, length_used: e.target.value }))} placeholder="10-12mm" style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} /></div>
                          <div><label style={{ fontSize: 11, color: '#666' }}>滿意度</label><div style={{ display: 'flex', gap: 4, marginTop: 4 }}>{[1,2,3,4,5].map(s => <button key={s} onClick={() => setNewRecord(p => ({ ...p, satisfaction: s }))} style={{ padding: '6px 10px', borderRadius: 4, border: 'none', cursor: 'pointer', background: (newRecord.satisfaction || 0) >= s ? '#FFC107' : '#eee', color: (newRecord.satisfaction || 0) >= s ? '#fff' : '#999', fontSize: 13 }}>★</button>)}</div></div>
                        </div>
                        <div style={{ marginBottom: 10 }}><label style={{ fontSize: 11, color: '#666' }}>備註</label><textarea value={newRecord.notes || ''} onChange={e => setNewRecord(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font, resize: 'none', boxSizing: 'border-box' }} /></div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={saveServiceRecord} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>💾 儲存</button>
                          <button onClick={() => setShowAddRecord(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 13, fontFamily: font }}>取消</button>
                        </div>
                      </div>
                    )}
                    {custServiceRecords.length === 0 ? <div style={{ textAlign: 'center', padding: 30, color: '#999' }}>暫無服務記錄</div> : custServiceRecords.map(r => (
                      <div key={r.id} style={{ border: '1px solid #e8e0d8', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                        <div onClick={() => setCustExpandedRecord(custExpandedRecord === r.id ? null : r.id)} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf8f5' }}>
                          <div><div style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>{r.service_name || '未命名'}</div><div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{r.service_date} · {r.staff_name || '未指定'}</div></div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ display: 'flex' }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 11, color: s <= (r.satisfaction || 0) ? '#FFC107' : '#ddd' }}>★</span>)}</div><span style={{ fontSize: 12, color: '#999' }}>{custExpandedRecord === r.id ? '▲' : '▼'}</span></div>
                        </div>
                        {custExpandedRecord === r.id && (
                          <div style={{ padding: '12px 14px', borderTop: '1px solid #e8e0d8' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                              <div style={{ textAlign: 'center', padding: 8, background: '#f5f0eb', borderRadius: 6 }}><div style={{ fontSize: 10, color: '#999' }}>捲度</div><div style={{ fontSize: 14, fontWeight: 700 }}>{r.curl_used || '—'}</div></div>
                              <div style={{ textAlign: 'center', padding: 8, background: '#f5f0eb', borderRadius: 6 }}><div style={{ fontSize: 10, color: '#999' }}>粗度</div><div style={{ fontSize: 14, fontWeight: 700 }}>{r.thickness_used || '—'}</div></div>
                              <div style={{ textAlign: 'center', padding: 8, background: '#f5f0eb', borderRadius: 6 }}><div style={{ fontSize: 10, color: '#999' }}>長度</div><div style={{ fontSize: 14, fontWeight: 700 }}>{r.length_used || '—'}</div></div>
                            </div>
                            {r.notes && <div style={{ padding: '8px 10px', background: '#FFFDE7', borderRadius: 6, fontSize: 12, color: '#F57F17' }}>📝 {r.notes}</div>}
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid #f0ebe3', marginTop: 16, paddingTop: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a', marginBottom: 8 }}>📅 預約記錄 ({custBookings.length})</div>
                      {custBookings.slice(0, 10).map(b => (
                        <div key={b.id} style={{ padding: '8px 12px', borderBottom: '1px solid #f0ebe3', fontSize: 13 }}>
                          <span style={{ color: '#5c4a3a', fontWeight: 600 }}>{b.booking_date} {b.booking_time}</span> — {b.service_name} <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 8, fontSize: 11, background: statusColor(b.status), color: '#fff' }}>{statusText(b.status)}</span> <span style={{ fontWeight: 700 }}>${b.total_price || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FINANCE TAB */}
                {custProfileTab === 'finance' && (
                  <div>
                    {custPackages.map(pkg => (
                      <div key={pkg.id} style={{ padding: 14, background: 'linear-gradient(135deg, #5c4a3a, #b8956a)', borderRadius: 10, color: '#fff', marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div><div style={{ fontSize: 11, opacity: 0.7 }}>套票餘額</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{pkg.package_name}</div></div>
                          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 700 }}>{pkg.total_sessions - pkg.used_sessions}</div><div style={{ fontSize: 11, opacity: 0.7 }}>剩餘 / {pkg.total_sessions} 次</div></div>
                        </div>
                        <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 6 }}><div style={{ background: '#fff', borderRadius: 4, height: 6, width: `${(pkg.used_sessions / pkg.total_sessions) * 100}%` }} /></div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FFF8E1', borderRadius: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 14, color: '#F57F17', fontWeight: 600 }}>🎁 目前積分</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#FF8F00' }}>{selectedCust.total_points || 0} 分</span>
                    </div>
                    {custPointsLog.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', marginBottom: 8 }}>積分記錄</div>
                        {custPointsLog.slice(0, 5).map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f0eb', fontSize: 12 }}>
                            <span style={{ color: '#666' }}>{p.description || p.type}</span>
                            <span style={{ fontWeight: 700, color: p.points > 0 ? '#4CAF50' : '#f44336' }}>{p.points > 0 ? '+' : ''}{p.points}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', marginBottom: 8 }}>💰 消費明細 ({custConsumption.length})</div>
                      {custConsumption.length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: '#999', fontSize: 13 }}>暫無消費記錄</div> : custConsumption.map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #f0ebe3' }}>
                          <div><div style={{ fontSize: 13, fontWeight: 500, color: '#5c4a3a' }}>{item.description || '消費'}</div><div style={{ fontSize: 11, color: '#999' }}>{item.created_at?.slice(0, 10)} · {item.payment_method || 'cash'}</div></div>
                          <span style={{ fontSize: 15, fontWeight: 700, color: '#5c4a3a' }}>${item.amount || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: 14, color: '#5c4a3a', fontWeight: 600 }}>👥 客戶列表（{filteredCustomers.length}）</div>
                {filteredCustomers.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>暫無客戶資料</div> : filteredCustomers.slice(0, 100).map(c => (
                  <div key={c.id} onClick={() => viewCustomer(c)} style={{ padding: '12px 16px', borderBottom: '1px solid #f0ebe3', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: c.is_blacklisted ? '#FFF8F8' : '#fff' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#5c4a3a', fontSize: 14 }}>{c.name}{c.is_blacklisted && <span style={{ marginLeft: 6, fontSize: 10, color: '#c62828' }}>🚫</span>}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>📞 {c.phone || '—'} ｜ {c.total_visits || 0} 次 ｜ ${c.total_spent || 0}</div>
                      {(c.tags || []).length > 0 && <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>{c.tags.slice(0, 5).map(t => <span key={t} style={{ background: '#f5f0eb', color: '#5c4a3a', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>{t}</span>)}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: '#bbb', whiteSpace: 'nowrap' }}>{c.last_visit_date || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ═══ CALENDAR TAB ═══ */}
{tab === 'calendar' && (<>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><button onClick={prevSchedCal} style={navBtn}>◀</button><span style={{ fontSize: 20, fontWeight: 700, color: '#5c4a3a' }}>{schedYear}年 {schedMonth + 1}月</span><button onClick={nextSchedCal} style={navBtn}>▶</button></div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}><button onClick={schedToToday} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>📍 今日</button><button onClick={() => { setSchedRefreshKey(k => k + 1); showToast('🔄 已刷新'); }} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font }}>🔄</button><label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#999', cursor: 'pointer', marginLeft: 'auto' }}><input type="checkbox" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} /> 顯示已取消</label></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {DAYS.map((d, i) => <div key={`h${i}`} style={{ padding: '10px 0', textAlign: 'center', fontSize: 13, fontWeight: 600, color: i === 0 || i === 6 ? '#c62828' : '#5c4a3a', background: '#f9f6f3', borderRadius: 6 }}>{d}</div>)}
              {schedCalDays.map((day, i) => {
                if (!day) return <div key={`e${i}`} style={{ minHeight: isMobile ? 52 : 90 }} />;
                const ds = toDS(schedYear, schedMonth, day); const isSel = ds === schedDate; const isToday = ds === todayStr;
                const bk = monthBkStats[ds]; const avail = monthAvail[ds]; const isPast = ds < todayStr; const dow = new Date(ds + 'T00:00:00').getDay();
                return (<div key={`d${i}`} onClick={() => setSchedDate(ds)} style={{ minHeight: isMobile ? 52 : 90, padding: isMobile ? '4px 3px' : '6px 8px', borderRadius: 8, cursor: 'pointer', border: isSel ? '3px solid #FF9800' : '1px solid #e8e0d8', background: isSel ? '#FFF8E1' : isToday ? '#FFFDE7' : isPast ? '#fafafa' : '#fff', display: 'flex', flexDirection: 'column', gap: isMobile ? 1 : 3, opacity: isPast ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: isToday || isSel ? 700 : 500, fontSize: isMobile ? 13 : 15, color: isToday ? '#FF9800' : (dow === 0 || dow === 6) ? '#c62828' : '#5c4a3a' }}>{day}</span>{bk?.pending > 0 && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF9800' }} />}</div>
                  {staffList.length > 0 && <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{staffList.map(s => <span key={s.id} title={s.name} style={{ width: isMobile ? 6 : 8, height: isMobile ? 6 : 8, borderRadius: '50%', background: avail?.[s.id] === 'available' ? '#4CAF50' : '#ddd' }} />)}</div>}
                  {bk && bk.total > 0 ? <div style={{ fontSize: isMobile ? 10 : 12, fontWeight: 600, color: '#5c4a3a', lineHeight: 1.3 }}>{bk.total} 預約{!isMobile && <div style={{ fontWeight: 400, color: '#999', fontSize: 11 }}>${bk.revenue}</div>}</div> : null}
                </div>);
              })}
            </div>
          </div>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div><div style={{ fontSize: 18, fontWeight: 700, color: '#5c4a3a' }}>{schedDate}（星期{DAYS[new Date(schedDate + 'T00:00:00').getDay()]}）</div>{schedDate === todayStr && <span style={{ padding: '2px 10px', background: '#FF9800', color: '#fff', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>今日</span>}</div>
              <div style={{ display: 'flex', gap: 8 }}>{dayStats.pending > 0 && <button onClick={confirmDayPending} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: 600 }}>✅ 確認當日全部 ({dayStats.pending})</button>}<button onClick={() => loadDaySlots(schedDate)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄</button></div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 14px', background: '#f9f6f3', borderRadius: 8, fontSize: 13, marginBottom: 16 }}><span>📊 <b>{dayStats.total}</b></span><span>💰 <b>${dayStats.revenue}</b></span>{dayStats.pending > 0 && <span style={{ color: '#FF9800' }}>⏳ {dayStats.pending}</span>}{dayStats.confirmed > 0 && <span style={{ color: '#4CAF50' }}>✅ {dayStats.confirmed}</span>}{dayStats.completed > 0 && <span style={{ color: '#2196F3' }}>✔️ {dayStats.completed}</span>}</div>
            {dayLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : timetableTimes.length === 0 && dayBks.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}><div style={{ fontSize: 40, marginBottom: 10 }}>📭</div><div style={{ fontSize: 14 }}>此日未有開放時段或預約</div></div>) : (
              <div style={{ overflowX: 'auto', border: '1px solid #e8e0d8', borderRadius: 10 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: timetableStaff.length * 160 + 80 }}>
                  <thead><tr style={{ background: '#f9f6f3' }}>
                    <th style={{ padding: '12px 8px', borderBottom: '2px solid #e8e0d8', fontSize: 13, color: '#5c4a3a', fontWeight: 600, position: 'sticky', left: 0, background: '#f9f6f3', zIndex: 2, minWidth: 65, textAlign: 'center' }}>時間</th>
                    {timetableStaff.map(s => { const cnt = dayBks.filter(b => (b.technician_label || '未指定') === s.name).length; const slotCnt = s.id ? (daySlots[s.id]?.size || 0) : 0; return <th key={s.name} style={{ padding: '12px 8px', borderBottom: '2px solid #e8e0d8', borderLeft: '1px solid #e8e0d8', fontSize: 14, color: '#5c4a3a', fontWeight: 700, minWidth: 150, textAlign: 'center' }}>{s.name}<div style={{ fontSize: 11, fontWeight: 400, marginTop: 2 }}>{s.id && <span style={{ color: slotCnt > 0 ? '#4CAF50' : '#ccc' }}>{slotCnt} 時段</span>}{cnt > 0 && <span style={{ color: '#FF9800', marginLeft: 6 }}>{cnt} 預約</span>}</div></th>; })}
                  </tr></thead>
                  <tbody>{timetableTimes.map((time, ti) => {
                    const isHour = time.endsWith(':00');
                    return (<tr key={time} style={{ borderBottom: isHour ? '2px solid #e8e0d8' : '1px solid #f0ebe3' }}>
                      <td style={{ padding: '4px 6px', fontSize: 13, color: isHour ? '#5c4a3a' : '#bbb', fontWeight: isHour ? 700 : 400, position: 'sticky', left: 0, background: '#faf8f5', zIndex: 1, borderRight: '2px solid #e8e0d8', textAlign: 'center', verticalAlign: 'top', height: 52 }}>{time}</td>
                      {timetableStaff.map(s => {
                        const bks = timetableGrid[`${time}|${s.name}`] || [];
                        const hasSlot = s.id ? daySlots[s.id]?.has(time) : false;
                        return (<td key={s.name} style={{ padding: '3px 5px', borderLeft: '1px solid #f0ebe3', verticalAlign: 'top', height: 52, background: bks.length > 0 ? 'transparent' : hasSlot ? '#f0faf0' : (ti % 2 === 0 ? '#fafafa' : '#f5f5f5') }}>
                          {bks.length > 0 ? bks.map(b => (<div key={b.id} onClick={() => openBooking(b)} style={{ padding: '5px 8px', borderRadius: 6, marginBottom: 2, cursor: 'pointer', borderLeft: `4px solid ${statusColor(b.status)}`, background: rowBg(b.status), fontSize: 12, lineHeight: 1.4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: 700, color: '#5c4a3a', fontSize: 13 }}>{b.customer_name}</span>{b.status === 'pending' && <button onClick={e => { e.stopPropagation(); updateStatus(b.id, 'confirmed'); }} style={{ padding: '2px 8px', borderRadius: 4, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 10, fontFamily: font }}>✅</button>}</div>
                            <div style={{ color: '#888', marginTop: 1 }}>{b.service_name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}><span style={{ color: statusColor(b.status), fontWeight: 600, fontSize: 11 }}>{statusText(b.status)}</span><span style={{ fontWeight: 700, color: '#5c4a3a' }}>${b.total_price}</span></div>
                          </div>)) : hasSlot ? <div style={{ color: '#c8e6c9', fontSize: 11, textAlign: 'center', paddingTop: 16 }}>空</div> : null}
                        </td>);
                      })}
                    </tr>);
                  })}</tbody>
                </table>
              </div>
            )}
          </div>
        </>)}
         
        {/* ═══ BUSINESS HOURS TAB ═══ */}
        {tab === 'hours' && (
          <div>
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#5c4a3a' }}>🕐 全店營業時間</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {bhEditing ? (
                    <>
                      <button onClick={saveBusinessHours} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>💾 儲存</button>
                      <button onClick={() => { setBhEditing(false); fetchBusinessHours(); }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 13, fontFamily: font }}>取消</button>
                    </>
                  ) : (
                    <button onClick={() => setBhEditing(true)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font }}>✏️ 編輯</button>
                  )}
                </div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>呢個設定會顯示喺前台畀客人睇，方便佢哋知道你幾時營業。</div>
                {businessHours.map((bh, idx) => (
                  <div key={bh.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f5f0eb' }}>
                    <div style={{ width: 70, fontWeight: 600, fontSize: 14, color: '#5c4a3a' }}>{bh.day_name}</div>
                    {bhEditing ? (
                      <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="checkbox" checked={bh.is_open} onChange={e => setBusinessHours(prev => prev.map((h, i) => i === idx ? { ...h, is_open: e.target.checked } : h))} style={{ width: 18, height: 18 }} />
                          <span style={{ fontSize: 12, color: bh.is_open ? '#2e7d32' : '#c62828' }}>{bh.is_open ? '營業' : '休息'}</span>
                        </label>
                        {bh.is_open && (
                          <>
                            <input type="time" value={bh.open_time} onChange={e => setBusinessHours(prev => prev.map((h, i) => i === idx ? { ...h, open_time: e.target.value } : h))} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                            <span style={{ color: '#999' }}>至</span>
                            <input type="time" value={bh.close_time} onChange={e => setBusinessHours(prev => prev.map((h, i) => i === idx ? { ...h, close_time: e.target.value } : h))} style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                          </>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 14, color: bh.is_open ? '#5c4a3a' : '#c62828', fontWeight: bh.is_open ? 400 : 600 }}>
                        {bh.is_open ? `${bh.open_time} - ${bh.close_time}` : '🔴 休息'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 前台預覽效果 */}
            <div style={{ marginTop: 20, background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a', marginBottom: 12 }}>👁️ 客人會見到嘅效果：</div>
              <div style={{ background: '#f9f6f3', borderRadius: 12, padding: 20, border: '1px solid #e8e0d8' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#5c4a3a', marginBottom: 12 }}>🕐 營業時間</div>
                {businessHours.map(bh => (
                  <div key={bh.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: bh.is_open ? '#333' : '#999' }}>
                    <span>{bh.day_name}</span>
                    <span style={{ fontWeight: bh.is_open ? 600 : 400 }}>{bh.is_open ? `${bh.open_time} - ${bh.close_time}` : '休息'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* ═══ PACKAGES TAB ═══ */}
        {tab === 'packages' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={pkgFilter} onChange={e => setPkgFilter(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #d0c8bc', borderRadius: 8, fontSize: 13, fontFamily: font }}>
                <option value="active">使用中</option>
                <option value="completed">已用完</option>
                <option value="cancelled">已取消</option>
                <option value="all">全部</option>
              </select>
              <div style={{ flex: 1 }} />
              <button onClick={() => { setShowAddPkgType(!showAddPkgType); setNewPkgType({}); }} style={{ padding: '10px 16px', background: '#f5f0eb', color: '#5c4a3a', border: '1px solid #d0c8bc', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: font }}>⚙️ 管理類型</button>
              <button onClick={() => { setShowAddPkg(true); setNewPkg({}); }} style={{ padding: '10px 16px', background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>+ 新增套票</button>
            </div>
            {showAddPkgType && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #e8e0d8' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a', marginBottom: 12 }}>⚙️ 套票類型模板</div>
                {packageTypes.map(pt => (
                  <div key={pt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #f0ebe3' }}>
                    <div><span style={{ fontWeight: 600, color: '#5c4a3a' }}>{pt.name}</span><span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>{pt.sessions}次 · ${pt.price} · {pt.validity_days}日</span></div>
                    <button onClick={() => deletePkgType(pt.id)} style={{ padding: '4px 10px', borderRadius: 4, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 11, fontFamily: font }}>刪除</button>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: 12, background: '#f9f6f3', borderRadius: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', marginBottom: 8 }}>➕ 新增類型</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
                    <input value={newPkgType.name || ''} onChange={e => setNewPkgType(p => ({ ...p, name: e.target.value }))} placeholder="名稱" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }} />
                    <input type="number" value={newPkgType.sessions || ''} onChange={e => setNewPkgType(p => ({ ...p, sessions: e.target.value }))} placeholder="次數" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                    <input type="number" value={newPkgType.price || ''} onChange={e => setNewPkgType(p => ({ ...p, price: e.target.value }))} placeholder="價格" style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                    <button onClick={saveNewPkgType} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>儲存</button>
                  </div>
                </div>
              </div>
            )}
            {showAddPkg && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '2px solid #FFB74D' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#E65100', marginBottom: 14 }}>🎫 新增套票給客戶</div>
                {packageTypes.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, color: '#666', marginBottom: 6, display: 'block' }}>快速選擇套票類型：</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {packageTypes.filter(pt => pt.is_active !== false).map(pt => (
                        <button key={pt.id} onClick={() => selectPkgType(pt)} style={{ padding: '8px 14px', borderRadius: 8, border: newPkg.package_type_id === pt.id ? '2px solid #5c4a3a' : '1px solid #d0c8bc', background: newPkg.package_type_id === pt.id ? '#f5f0eb' : '#fff', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>{pt.name}<br /><span style={{ fontSize: 11, color: '#999' }}>{pt.sessions}次 · ${pt.price}</span></button>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div><label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>客戶電話 *</label><input value={newPkg.customer_phone || ''} onChange={e => setNewPkg(p => ({ ...p, customer_phone: e.target.value }))} placeholder="例：91234567" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: font }} /></div>
                  <div><label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>套票名稱 *</label><input value={newPkg.package_name || ''} onChange={e => setNewPkg(p => ({ ...p, package_name: e.target.value }))} placeholder="例：美睫10次卡" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: font }} /></div>
                  <div><label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>總次數 *</label><input type="number" value={newPkg.total_sessions || ''} onChange={e => setNewPkg(p => ({ ...p, total_sessions: e.target.value }))} placeholder="10" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>收費金額</label><input type="number" value={newPkg.price_paid || ''} onChange={e => setNewPkg(p => ({ ...p, price_paid: e.target.value }))} placeholder="2500" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>到期日</label><input type="date" value={newPkg.expiry_date || ''} onChange={e => setNewPkg(p => ({ ...p, expiry_date: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} /></div>
                  <div><label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>備註</label><input value={newPkg.notes || ''} onChange={e => setNewPkg(p => ({ ...p, notes: e.target.value }))} placeholder="可選" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', fontFamily: font }} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addPackageToCustomer} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✅ 確認新增</button>
                  <button onClick={() => setShowAddPkg(false)} style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 13, fontFamily: font }}>取消</button>
                </div>
              </div>
            )}
            {showDeduct && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowDeduct(null)}>
                <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                  <h3 style={{ margin: '0 0 16px', color: '#5c4a3a', fontSize: 18 }}>🎫 確認扣次</h3>
                  <div style={{ padding: 14, background: '#f9f6f3', borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>{showDeduct.package_name}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>📞 {showDeduct.customer_phone}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#FF9800', marginTop: 8 }}>{showDeduct.used_sessions} / {showDeduct.total_sessions} 次已用</div>
                    <div style={{ fontSize: 13, color: '#4CAF50', marginTop: 4 }}>扣除後剩餘：{showDeduct.total_sessions - showDeduct.used_sessions - 1} 次</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowDeduct(null)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: font }}>取消</button>
                    <button onClick={() => deductSession(showDeduct)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#FF9800', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600 }}>確認扣 1 次</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a' }}>🎫 套票列表（{filteredPackages.length}）</span>
                <button onClick={fetchAllPackages} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄 刷新</button>
              </div>
              {pkgLoading ? <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>載入中...</div> : filteredPackages.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>暫無套票</div> : filteredPackages.map(pkg => (
                <div key={pkg.id} style={{ padding: '14px 16px', borderBottom: '1px solid #f0ebe3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>{pkg.package_name}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: pkg.status === 'active' ? '#E8F5E9' : pkg.status === 'completed' ? '#E3F2FD' : '#FFEBEE', color: pkg.status === 'active' ? '#2e7d32' : pkg.status === 'completed' ? '#1565C0' : '#c62828' }}>{pkg.status === 'active' ? '使用中' : pkg.status === 'completed' ? '已用完' : '已取消'}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>📞 {pkg.customer_phone}{pkg.purchased_date && <span style={{ marginLeft: 8 }}>📅 {pkg.purchased_date}</span>}{pkg.expiry_date && <span style={{ marginLeft: 8, color: new Date(pkg.expiry_date) < new Date() ? '#c62828' : '#999' }}>⏰ 到期 {pkg.expiry_date}</span>}</div>
                    {pkg.notes && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>📝 {pkg.notes}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 700, color: pkg.status === 'active' ? '#FF9800' : '#999' }}>{pkg.total_sessions - pkg.used_sessions}</div>
                      <div style={{ fontSize: 10, color: '#999' }}>剩餘 / {pkg.total_sessions}</div>
                    </div>
                    <div style={{ width: 60, height: 6, background: '#eee', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', background: pkg.status === 'active' ? '#FF9800' : '#999', borderRadius: 3, width: `${(pkg.used_sessions / pkg.total_sessions) * 100}%` }} /></div>
                    {pkg.status === 'active' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setShowDeduct(pkg)} style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#FF9800', color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: 600 }}>-1 扣次</button>
                        <button onClick={() => cancelPackage(pkg)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 11, fontFamily: font }}>取消</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ═══ REMINDERS TAB ═══ */}
        {tab === 'reminders' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 14px', color: '#5c4a3a', fontSize: 17 }}>📱 WhatsApp 提醒</h3>
            <div style={{ padding: '12px 16px', background: '#e8f5e9', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#2e7d32' }}>選擇日期，系統會列出當日所有預約，你可以逐個發送 WhatsApp 提醒。</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #d0c8bc', borderRadius: 8, fontSize: 14 }} />
              <button onClick={() => { const t = new Date(); t.setDate(t.getDate() + 1); setReminderDate(t.toISOString().split('T')[0]); }} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font }}>明日</button>
              <button onClick={generateReminders} disabled={reminderLoading} style={{ padding: '10px 20px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: font, fontWeight: 600, opacity: reminderLoading ? 0.6 : 1 }}>{reminderLoading ? '⏳ 載入中...' : '📱 生成提醒列表'}</button>
            </div>
            {reminders.length > 0 && (
              <div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>共 {reminders.length} 個預約需要提醒：</div>
                {reminders.map(r => (
                  <div key={r.bookingId} style={{ padding: '12px 16px', borderBottom: '1px solid #f0ebe3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#5c4a3a', fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{r.time} — {r.service} ｜ 📞 {r.phone}</div>
                    </div>
                    <a href={r.waLink} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', background: '#25D366', color: '#fff', border: 'none', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, fontFamily: font }}>📱 WhatsApp</a>
                  </div>
                ))}
              </div>
            )}
            {reminders.length === 0 && reminderDate && !reminderLoading && <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 30 }}>呢日冇需要提醒嘅預約</div>}
          </div>
        )}

        {/* ═══ FRONTEND TAB ═══ */}
        {tab === 'frontend' && (<>
          <div style={{ ...card, background: '#e8f5e9', border: '1px solid #a5d6a7', padding: 16 }}><div style={{ fontSize: 13, color: '#2e7d32', lineHeight: 1.8 }}>🎨 <b>前台管理：</b>喺呢度編輯客人睇到嘅服務項目、價錢、附加項目等。</div></div>
          <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>{[['services', '🎨 服務項目'], ['addons', '➕ 附加項目'], ['theme', '🖌️ 主題設定']].map(([k, l]) => (<button key={k} onClick={() => setSvcSubTab(k)} style={{ padding: '10px 24px', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: svcSubTab === k ? 700 : 400, background: svcSubTab === k ? '#5c4a3a' : '#fff', color: svcSubTab === k ? '#fff' : '#5c4a3a', borderRadius: k === 'services' ? '10px 0 0 10px' : k === 'theme' ? '0 10px 10px 0' : '0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>{l}</button>))}</div>
          {svcSubTab === 'services' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h2 style={{ margin: 0, color: '#5c4a3a', fontSize: 17 }}>🎨 服務項目 ({svcList.length})</h2><div style={{ display: 'flex', gap: 8 }}><button onClick={fetchServices} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font }}>🔄</button><button onClick={() => openEditSvc(null)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#5c4a3a', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>➕ 新增服務</button></div></div>
              {svcLoading ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : svcList.length === 0 ? (<div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}><div style={{ fontSize: 40, marginBottom: 10 }}>🎨</div><div>未有服務項目</div></div>) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{svcList.map((svc, idx) => (
                  <div key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: svc.is_active ? '#fff' : '#fafafa', borderRadius: 10, border: `1px solid ${svc.is_active ? '#e8e0d8' : '#eee'}`, opacity: svc.is_active ? 1 : 0.6 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><button onClick={() => moveSvc(idx, -1)} disabled={idx === 0} style={{ padding: '2px 6px', border: 'none', background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer', fontSize: 10, color: idx === 0 ? '#ddd' : '#999' }}>▲</button><button onClick={() => moveSvc(idx, 1)} disabled={idx === svcList.length - 1} style={{ padding: '2px 6px', border: 'none', background: 'transparent', cursor: idx === svcList.length - 1 ? 'default' : 'pointer', fontSize: 10, color: idx === svcList.length - 1 ? '#ddd' : '#999' }}>▼</button></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ fontWeight: 700, fontSize: 15, color: '#5c4a3a' }}>{svc.name}</span>{svc.category && <span style={{ padding: '2px 8px', background: '#f0ebe3', borderRadius: 4, fontSize: 11, color: '#999' }}>{svc.category}</span>}{!svc.is_active && <span style={{ padding: '2px 8px', background: '#ffebee', borderRadius: 4, fontSize: 11, color: '#c62828' }}>已下架</span>}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 13 }}><span style={{ fontWeight: 700, color: '#5c4a3a' }}>${svc.base_price}</span>{svc.duration_minutes && <span style={{ color: '#999' }}>⏱ {svc.duration_minutes}分鐘</span>}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}><button onClick={() => toggleSvcActive(svc)} style={smallBtn(svc.is_active ? '#FFF3E0' : '#E8F5E9', svc.is_active ? '#E65100' : '#2e7d32', svc.is_active ? '#FFB74D' : '#a5d6a7')}>{svc.is_active ? '下架' : '上架'}</button><button onClick={() => openEditSvc(svc)} style={smallBtn('#fff', '#5c4a3a', '#d0c8bc')}>✏️</button><button onClick={() => deleteSvc(svc.id)} style={smallBtn('#ffebee', '#c62828', '#ffcdd2')}>🗑️</button></div>
                  </div>
                ))}</div>
              )}
            </div>
          )}
          {svcSubTab === 'addons' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h2 style={{ margin: 0, color: '#5c4a3a', fontSize: 17 }}>➕ 附加項目 ({svcAddons.length})</h2><div style={{ display: 'flex', gap: 8 }}><button onClick={fetchAddons} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 13, fontFamily: font }}>🔄</button><button onClick={() => openEditAddon(null)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#5c4a3a', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>➕ 新增</button></div></div>
              {svcAddons.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}><div style={{ fontSize: 40, marginBottom: 10 }}>➕</div><div>未有附加項目</div></div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{svcAddons.map(addon => (
                  <div key={addon.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: addon.is_active ? '#fff' : '#fafafa', borderRadius: 10, border: '1px solid #e8e0d8', opacity: addon.is_active ? 1 : 0.6 }}>
                    <div><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 600, fontSize: 14, color: '#5c4a3a' }}>{addon.name}</span><span style={{ fontWeight: 700, color: '#5c4a3a' }}>+${addon.price}</span>{!addon.is_active && <span style={{ padding: '2px 8px', background: '#ffebee', borderRadius: 4, fontSize: 11, color: '#c62828' }}>停用</span>}</div>{addon.description && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{addon.description}</div>}</div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}><button onClick={() => toggleAddonActive(addon)} style={smallBtn(addon.is_active ? '#FFF3E0' : '#E8F5E9', addon.is_active ? '#E65100' : '#2e7d32', addon.is_active ? '#FFB74D' : '#a5d6a7')}>{addon.is_active ? '停用' : '啟用'}</button><button onClick={() => openEditAddon(addon)} style={smallBtn('#fff', '#5c4a3a', '#d0c8bc')}>✏️</button><button onClick={() => deleteAddon(addon.id)} style={smallBtn('#ffebee', '#c62828', '#ffcdd2')}>🗑️</button></div>
                  </div>
                ))}</div>
              )}
            </div>
          )}
          {svcSubTab === 'theme' && (
            <div style={card}>
              <ThemeEditor />
{/* 即時預覽 */}
            <div style={{ marginTop: 20, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#5c4a3a' }}>👁️ 前台即時預覽</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} placeholder="輸入你嘅前台網址 例：https://your-site.vercel.app" style={{ width: 300, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, fontFamily: font }} />
                  <button onClick={() => { const f = document.getElementById('preview-frame'); if (f) f.src = f.src; }} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d0c8bc', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 12, fontFamily: font }}>🔄 刷新</button>
                </div>
              </div>
              {previewUrl ? (
                <div style={{ position: 'relative', width: '100%', height: 600, background: '#f5f5f5' }}>
                  <iframe id="preview-frame" src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="前台預覽" />
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 13 }}>
                  ☝️ 請喺上面輸入你嘅前台 Booking 頁面網址<br />
                  <span style={{ fontSize: 11, marginTop: 8, display: 'block' }}>例如：https://your-app.vercel.app/booking</span>
                </div>
              )}
            </div>
              
            </div>
          )}
        </>)}

        {/* ═══ TEMPLATES TAB ═══ */}
        {tab === 'reports' && (
  <ReportsPanel />
)}
       {/* ═══ RECEIPTS TAB ═══ */}
        {tab === 'receipts' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" placeholder="🔍 搜尋單號 / 客戶..." value={receiptSearch} onChange={e => setReceiptSearch(e.target.value)} style={{ flex: 1, minWidth: 180, padding: '10px 14px', border: '1px solid #d0c8bc', borderRadius: 8, fontSize: 14, fontFamily: font }} />
              <select value={receiptFilter} onChange={e => setReceiptFilter(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #d0c8bc', borderRadius: 8, fontSize: 13, fontFamily: font }}>
                <option value="all">全部</option>
                <option value="paid">已付</option>
                <option value="unpaid">未付</option>
                <option value="cancelled">已取消</option>
              </select>
              <button onClick={fetchReceipts} style={{ padding: '10px 14px', background: '#f5f0eb', border: '1px solid #d0c8bc', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: font, color: '#5c4a3a' }}>🔄</button>
              <button onClick={() => setShowNewReceipt(true)} style={{ padding: '10px 18px', background: '#5c4a3a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: font, fontWeight: 600 }}>+ 新收據</button>
            </div>

            {/* 快速統計 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              {[
                { label: '今日收入', value: `$${receiptList.filter(r => r.status === 'paid' && r.created_at?.startsWith(todayStr)).reduce((s, r) => s + (parseFloat(r.total) || 0), 0)}`, color: '#4CAF50' },
                { label: '未付款', value: receiptList.filter(r => r.status === 'unpaid').length, color: '#FF9800' },
                { label: '總收據', value: receiptList.length, color: '#5c4a3a' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: '#fff', padding: '12px 14px', borderRadius: 10, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 11, color: '#999' }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* 新建收據表單 */}
            {showNewReceipt && (
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, marginBottom: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '2px solid #FFB74D' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, color: '#E65100', fontSize: 17 }}>🧾 新建收據</h3>
                  <button onClick={() => setShowNewReceipt(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>客戶名 *</label>
                    <input value={newReceipt.customer_name} onChange={e => setNewReceipt(p => ({ ...p, customer_name: e.target.value }))} placeholder="陳小姐" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: font }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>電話</label>
                    <input value={newReceipt.customer_phone} onChange={e => setNewReceipt(p => ({ ...p, customer_phone: e.target.value }))} placeholder="91234567" style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>服務員</label>
                    <select value={newReceipt.staff_name} onChange={e => setNewReceipt(p => ({ ...p, staff_name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: font, boxSizing: 'border-box' }}>
                      <option value="">選擇</option>
                      {staffList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* 項目列表 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5c4a3a', marginBottom: 8, display: 'block' }}>📋 服務項目</label>
                  {newReceipt.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#f9f6f3', borderRadius: 8, marginBottom: 6 }}>
                      <span style={{ flex: 2, fontSize: 13, fontWeight: 500, color: '#5c4a3a' }}>{item.name}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>×{item.qty}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#5c4a3a' }}>${item.price * item.qty}</span>
                      <button onClick={() => removeReceiptItem(idx)} style={{ padding: '4px 8px', border: 'none', background: '#ffebee', color: '#c62828', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>✕</button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                    <input value={newReceiptItem.name} onChange={e => setNewReceiptItem(p => ({ ...p, name: e.target.value }))} placeholder="服務名稱" style={{ flex: 2, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontFamily: font }} />
                    <input type="number" value={newReceiptItem.qty} onChange={e => setNewReceiptItem(p => ({ ...p, qty: Math.max(1, +e.target.value) }))} style={{ width: 50, padding: '8px 6px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, textAlign: 'center' }} />
                    <input type="number" value={newReceiptItem.price || ''} onChange={e => setNewReceiptItem(p => ({ ...p, price: +e.target.value }))} placeholder="$" style={{ width: 80, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                    <button onClick={addReceiptItem} style={{ padding: '8px 14px', border: 'none', background: '#5c4a3a', color: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: font, fontWeight: 600 }}>+</button>
                  </div>
                  {/* 快速選擇服務 */}
                  {svcList.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>⚡ 快速加入：</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {svcList.filter(s => s.is_active).slice(0, 8).map(s => (
                          <button key={s.id} onClick={() => { setNewReceipt(prev => ({ ...prev, items: [...prev.items, { name: s.name, qty: 1, price: s.base_price }] })); }} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e8e0d8', background: '#faf6f0', color: '#5c4a3a', cursor: 'pointer', fontSize: 11, fontFamily: font }}>{s.name} ${s.base_price}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 折扣 + 付款方式 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>折扣類型</label>
                    <select value={newReceipt.discount_type} onChange={e => setNewReceipt(p => ({ ...p, discount_type: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: font, boxSizing: 'border-box' }}>
                      <option value="none">無折扣</option>
                      <option value="percent">百分比 %</option>
                      <option value="fixed">固定金額 $</option>
                    </select>
                  </div>
                  {newReceipt.discount_type !== 'none' && (
                    <div>
                      <label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>折扣值</label>
                      <input type="number" value={newReceipt.discount_value || ''} onChange={e => setNewReceipt(p => ({ ...p, discount_value: +e.target.value }))} placeholder={newReceipt.discount_type === 'percent' ? '10' : '50'} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>付款方式</label>
                    <select value={newReceipt.payment_method} onChange={e => setNewReceipt(p => ({ ...p, payment_method: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, fontFamily: font, boxSizing: 'border-box' }}>
                      <option value="">— 選擇 —</option>
                      <option value="現金">現金</option>
                      <option value="轉數快">轉數快</option>
                      <option value="Payme">Payme</option>
                      <option value="信用卡">信用卡</option>
                      <option value="八達通">八達通</option>
                    </select>
                  </div>
                </div>

                {/* 備註 */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#666', marginBottom: 4, display: 'block' }}>備註</label>
                  <input value={newReceipt.remarks} onChange={e => setNewReceipt(p => ({ ...p, remarks: e.target.value }))} placeholder="可選..." style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: font }} />
                </div>

                {/* 金額總結 */}
                <div style={{ padding: '14px 18px', background: '#f9f6f3', borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888', marginBottom: 6 }}>
                    <span>小計</span><span>${receiptSubtotal}</span>
                  </div>
                  {receiptDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#c06060', marginBottom: 6 }}>
                      <span>折扣</span><span>-${receiptDiscount}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, color: '#5c4a3a', paddingTop: 8, borderTop: '2px solid #e8e0d8' }}>
                    <span>總計</span><span>${receiptTotal}</span>
                  </div>
                </div>

                {/* 動作按鈕 */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setNewReceipt(p => ({ ...p, status: 'paid' })); createReceipt(); }} disabled={newReceipt.items.length === 0} style={{ padding: '12px 24px', borderRadius: 8, border: 'none', background: newReceipt.items.length > 0 ? '#4CAF50' : '#ddd', color: '#fff', cursor: newReceipt.items.length > 0 ? 'pointer' : 'not-allowed', fontSize: 14, fontFamily: font, fontWeight: 600 }}>✅ 建立（已付）</button>
                  <button onClick={() => { setNewReceipt(p => ({ ...p, status: 'unpaid' })); createReceipt(); }} disabled={newReceipt.items.length === 0} style={{ padding: '12px 24px', borderRadius: 8, border: '1px solid #FFB74D', background: '#FFF3E0', color: '#E65100', cursor: newReceipt.items.length > 0 ? 'pointer' : 'not-allowed', fontSize: 14, fontFamily: font, fontWeight: 600 }}>📋 建立（未付）</button>
                  <button onClick={() => setShowNewReceipt(false)} style={{ padding: '12px 16px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14, fontFamily: font }}>取消</button>
                </div>
              </div>
            )}

            {/* 收據列表 */}
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: 15, fontWeight: 600, color: '#5c4a3a' }}>🧾 收據列表（{filteredReceipts.length}）</div>
              {receiptLoading ? <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>載入中...</div> : filteredReceipts.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>暫無收據</div> : (
                isMobile ? (
                  <div style={{ padding: '12px 16px' }}>
                    {filteredReceipts.map(r => (
                      <div key={r.id} style={{ background: r.status === 'paid' ? '#f0fdf4' : '#fffbeb', borderRadius: 10, padding: 14, marginBottom: 10, border: '1px solid #e8e0d8' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, color: '#999' }}>{r.receipt_no}</div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#5c4a3a' }}>{r.customer_name}</div>
                          </div>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: r.status === 'paid' ? '#E8F5E9' : r.status === 'cancelled' ? '#FFEBEE' : '#FFF3E0', color: r.status === 'paid' ? '#2e7d32' : r.status === 'cancelled' ? '#c62828' : '#E65100' }}>{r.status === 'paid' ? '已付' : r.status === 'cancelled' ? '已取消' : '未付'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: '#888' }}>{new Date(r.created_at).toLocaleDateString('zh-HK')} · {r.staff_name || ''}</span>
                          <span style={{ fontSize: 20, fontWeight: 700, color: '#5c4a3a' }}>${r.total}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {r.status === 'unpaid' && <button onClick={() => markReceiptPaid(r)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: font, fontWeight: 600 }}>💰 收款</button>}
                          <button onClick={() => sendReceiptWhatsApp(r)} disabled={receiptSending === r.id} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#25D366', color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: font }}>📱 WA</button>
                          <button onClick={() => printReceipt(r)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#5c4a3a', cursor: 'pointer', fontSize: 11, fontFamily: font }}>🖨️</button>
                          <button onClick={() => deleteReceipt(r.id)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #ffcdd2', background: '#ffebee', color: '#c62828', cursor: 'pointer', fontSize: 11 }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f9f6f3' }}>
                          {['單號', '日期', '客戶', '服務員', '項目', '金額', '狀態', '操作'].map(h => (
                            <th key={h} style={{ padding: '12px 10px', textAlign: 'left', color: '#5c4a3a', fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredReceipts.map(r => (
                          <tr key={r.id} style={{ borderBottom: '1px solid #f0ebe3', background: r.status === 'paid' ? '#fafff8' : r.status === 'unpaid' ? '#fffcf5' : '#fff' }}>
                            <td style={{ padding: '10px', fontSize: 11, color: '#999', whiteSpace: 'nowrap' }}>{r.receipt_no}</td>
                            <td style={{ padding: '10px', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString('zh-HK')}</td>
                            <td style={{ padding: '10px', fontWeight: 600 }}>{r.customer_name}{r.customer_phone && <div style={{ fontSize: 11, color: '#888' }}>{r.customer_phone}</div>}</td>
                            <td style={{ padding: '10px', color: '#888' }}>{r.staff_name || '-'}</td>
                            <td style={{ padding: '10px', maxWidth: 180 }}>
                              {(r.items || []).map((item, i) => (
                                <span key={i} style={{ fontSize: 11, color: '#666' }}>{item.name}{i < r.items.length - 1 ? '、' : ''}</span>
                              ))}
                            </td>
                            <td style={{ padding: '10px', fontWeight: 700, fontSize: 15, color: '#5c4a3a' }}>${r.total}</td>
                            <td style={{ padding: '10px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: r.status === 'paid' ? '#E8F5E9' : r.status === 'cancelled' ? '#FFEBEE' : '#FFF3E0', color: r.status === 'paid' ? '#2e7d32' : r.status === 'cancelled' ? '#c62828' : '#E65100' }}>
                                {r.status === 'paid' ? '已付' : r.status === 'cancelled' ? '已取消' : '未付'}
                              </span>
                              {r.payment_method && <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>💳 {r.payment_method}</div>}
                              {r.sent_via && <div style={{ fontSize: 10, color: '#4CAF50', marginTop: 2 }}>📤 {r.sent_via}</div>}
                            </td>
                            <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {r.status === 'unpaid' && <button onClick={() => markReceiptPaid(r)} title="標記已付" style={{ padding: '5px 9px', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 6, cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>💰</button>}
                                <button onClick={() => sendReceiptWhatsApp(r)} disabled={receiptSending === r.id} title="WhatsApp 發送" style={{ padding: '5px 9px', background: '#e8f8e8', border: '1px solid #25D366', borderRadius: 6, cursor: 'pointer', fontSize: 13, lineHeight: 1, opacity: receiptSending === r.id ? 0.5 : 1 }}>📱</button>
                                <button onClick={() => printReceipt(r)} title="列印" style={{ padding: '5px 9px', background: '#f5f0eb', border: '1px solid #d0c8bc', borderRadius: 6, cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>🖨️</button>
                                <button onClick={() => deleteReceipt(r.id)} title="刪除" style={{ padding: '5px 9px', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: 6, cursor: 'pointer', fontSize: 13, lineHeight: 1 }}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </div>
        )}
        {tab === 'templates' && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, margin: '0 auto', maxWidth: 800, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#5c4a3a', fontSize: 18 }}>📝 WhatsApp 訊息模板</h3>
            <div style={{ background: '#fff8e1', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13 }}><strong>📌 可用變數：</strong><br/><code>{'{customer_name}'}</code> 客人名 &nbsp;<code>{'{booking_date}'}</code> 日期 &nbsp;<code>{'{booking_time}'}</code> 時間 &nbsp;<code>{'{service_name}'}</code> 服務 &nbsp;<code>{'{technician_label}'}</code> 技師 &nbsp;<code>{'{total_price}'}</code> 價錢 &nbsp;<code>{'{old_date}'}</code> 原日期 &nbsp;<code>{'{old_time}'}</code> 原時間</div>
            {msgTemplates.length === 0 ? <p style={{ textAlign: 'center', color: '#999', padding: 30 }}>載入中...</p> : msgTemplates.map(tpl => (
              <div key={tpl.id} style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 10, border: '1px solid #eee' }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#5c4a3a' }}>{tpl.label}</div>
                <textarea value={tpl.content} onChange={e => setMsgTemplates(prev => prev.map(t => t.id === tpl.id ? { ...t, content: e.target.value } : t))} style={{ width: '100%', minHeight: 120, padding: 10, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
           {/* WhatsApp 預覽 */}
<div style={{ marginTop: 12, padding: 14, background: '#DCF8C6', borderRadius: '0 12px 12px 12px', fontSize: 13, lineHeight: 1.8, color: '#333', fontFamily: 'system-ui', whiteSpace: 'pre-wrap', maxWidth: '85%', position: 'relative' }}>
  <div style={{ position: 'absolute', top: -6, left: 0, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid #DCF8C6' }} />
  {tpl.content
    .replace(/\{customer_name\}/g, '陳小姐')
    .replace(/\{booking_date\}/g, '2026-05-10')
    .replace(/\{booking_time\}/g, '14:00')
    .replace(/\{service_name\}/g, '自然美睫')
    .replace(/\{technician_label\}/g, '店主')
    .replace(/\{total_price\}/g, '580')
    .replace(/\{old_date\}/g, '2026-05-08')
    .replace(/\{old_time\}/g, '16:00')}
  <div style={{ fontSize: 10, color: '#999', textAlign: 'right', marginTop: 4 }}>14:30 ✓✓</div>
</div>
<div style={{ fontSize: 11, color: '#999', marginTop: 6, fontStyle: 'italic' }}>👆 預覽效果（使用示例數據）</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}><button onClick={() => saveTemplate(tpl.id, tpl.content)} style={{ padding: '6px 20px', borderRadius: 8, border: 'none', background: '#4CAF50', color: '#fff', cursor: 'pointer', fontWeight: 600, fontFamily: font }}>💾 儲存</button></div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
);
  }

