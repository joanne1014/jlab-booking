// src/pages/CustomerManagement.jsx
import React, { useState, useMemo } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import {
  Search, Plus, Star, Phone, Mail, Calendar,
  DollarSign, X, Edit2, Trash2, ChevronRight,
  Users, Crown, TrendingUp,
} from 'lucide-react';

const AVAILABLE_TAGS = [
  'Gel Nail', 'Nail Art', 'Eyelash',
  'Hand Care', 'Regular', 'New Client', 'VIP Treatment',
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerManagement() {
  const {
    customers, loading, error,
    addCustomer, updateCustomer, deleteCustomer,
  } = useCustomers();

  const [search,            setSearch]            = useState('');
  const [activeTab,         setActiveTab]          = useState('all');
  const [selectedId,        setSelectedId]         = useState(null);
  const [showAddModal,      setShowAddModal]        = useState(false);
  const [showEditModal,     setShowEditModal]       = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm]   = useState(false);
  const [saving,            setSaving]             = useState(false);
  const [form, setForm] = useState({
    name: '', phone: '', email: '', notes: '', tags: [], vip: false,
  });

  // 目前選中嘅客戶（跟住 customers 更新）
  const selectedCustomer = useMemo(
    () => customers.find(c => c.id === selectedId) ?? null,
    [customers, selectedId],
  );

  // 篩選
  const filtered = useMemo(() => {
    let list = customers;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
      );
    }
    if (activeTab === 'vip')     list = list.filter(c => c.vip);
    if (activeTab === 'regular') list = list.filter(c => !c.vip);
    return list;
  }, [customers, search, activeTab]);

  // 統計
  const stats = useMemo(() => ({
    total:      customers.length,
    vip:        customers.filter(c => c.vip).length,
    revenue:    customers.reduce((s, c) => s + (c.total_spent ?? 0), 0),
    avgVisits:  customers.length
      ? (customers.reduce((s, c) => s + (c.visits ?? 0), 0) / customers.length).toFixed(1)
      : '0',
  }), [customers]);

  // ── 開啟 Modal ──
  function openAdd() {
    setForm({ name: '', phone: '', email: '', notes: '', tags: [], vip: false });
    setShowAddModal(true);
  }
  function openEdit() {
    if (!selectedCustomer) return;
    setForm({
      name:  selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email  ?? '',
      notes: selectedCustomer.notes  ?? '',
      tags:  selectedCustomer.tags   ?? [],
      vip:   selectedCustomer.vip    ?? false,
    });
    setShowEditModal(true);
  }

  // ── CRUD ──
  async function handleAdd() {
    if (!form.name.trim() || !form.phone.trim()) return;
    try {
      setSaving(true);
      const newCustomer = await addCustomer(form);
      setSelectedId(newCustomer?.id ?? null);
      setShowAddModal(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!form.name.trim() || !form.phone.trim() || !selectedCustomer) return;
    try {
      setSaving(true);
      await updateCustomer(selectedCustomer.id, {
        name:  form.name,
        phone: form.phone,
        email: form.email  || null,
        notes: form.notes,
        tags:  form.tags,
        vip:   form.vip,
      });
      setShowEditModal(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selectedCustomer) return;
    try {
      setSaving(true);
      await deleteCustomer(selectedCustomer.id);
      setSelectedId(null);
      setShowDeleteConfirm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function toggleVIP(customer) {
    await updateCustomer(customer.id, { vip: !customer.vip });
  }

  function toggleTag(tag) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter(t => t !== tag)
        : [...f.tags, tag],
    }));
  }

  // ── Loading / Error ──
  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-stone-400 text-sm">載入客戶資料中…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center text-red-400">
        <p className="text-lg mb-2">載入失敗</p>
        <p className="text-sm opacity-70">{error}</p>
      </div>
    </div>
  );

  // ── Render ──
  return (
    <div className="min-h-screen bg-stone-50">

      {/* ─── Header ─── */}
      <div className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-800">客戶管理</h1>
            <p className="text-xs text-stone-400 mt-0.5">管理所有客戶資料及消費記錄</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 transition-colors"
          >
            <Plus size={16} />
            新增客戶
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<Users    size={18} />} label="總客戶數"    value={stats.total}                              color="stone"   />
          <StatCard icon={<Crown    size={18} />} label="VIP 客戶"    value={stats.vip}                                color="amber"   />
          <StatCard icon={<DollarSign size={18} />} label="總消費"    value={`HK$ ${stats.revenue.toLocaleString()}`} color="emerald" />
          <StatCard icon={<TrendingUp size={18} />} label="平均到訪" value={`${stats.avgVisits} 次`}                  color="sky"     />
        </div>

        {/* ─── Search + Tabs ─── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="搜尋姓名、電話或 Email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            />
          </div>
          <div className="flex bg-white border border-stone-200 rounded-lg p-1 gap-1 self-start">
            {[['all','全部'], ['vip','VIP'], ['regular','一般']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
                  activeTab === key
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── List + Detail ─── */}
        <div className="flex gap-4 items-start">

          {/* 客戶列表 */}
          <div className={`space-y-2 ${selectedCustomer ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <div className="text-4xl mb-3 text-stone-200">👤</div>
                <p className="text-stone-400 text-sm">
                  {search ? '找不到符合的客戶' : '未有客戶資料，按右上角新增'}
                </p>
              </div>
            ) : filtered.map(c => (
              <CustomerCard
                key={c.id}
                customer={c}
                isSelected={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
                onToggleVIP={() => toggleVIP(c)}
              />
            ))}
          </div>

          {/* 客戶詳情 */}
          {selectedCustomer && (
            <div className="w-full lg:w-1/2">
              <CustomerDetail
                customer={selectedCustomer}
                onClose={() => setSelectedId(null)}
                onEdit={openEdit}
                onDelete={() => setShowDeleteConfirm(true)}
                onToggleVIP={() => toggleVIP(selectedCustomer)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Modal ─── */}
      {showAddModal && (
        <Modal title="新增客戶" onClose={() => setShowAddModal(false)}>
          <CustomerForm
            form={form} setForm={setForm}
            onToggleTag={toggleTag}
            onSave={handleAdd} onCancel={() => setShowAddModal(false)}
            saving={saving} saveLabel="新增客戶"
          />
        </Modal>
      )}

      {/* ─── Edit Modal ─── */}
      {showEditModal && (
        <Modal title="編輯客戶資料" onClose={() => setShowEditModal(false)}>
          <CustomerForm
            form={form} setForm={setForm}
            onToggleTag={toggleTag}
            onSave={handleEdit} onCancel={() => setShowEditModal(false)}
            saving={saving} saveLabel="儲存更改" showVIP
          />
        </Modal>
      )}

      {/* ─── Delete Confirm ─── */}
      {showDeleteConfirm && (
        <Modal title="確認刪除" onClose={() => setShowDeleteConfirm(false)}>
          <div className="p-6">
            <p className="text-stone-500 mb-1 text-sm">確定要刪除客戶</p>
            <p className="text-stone-800 font-semibold text-lg mb-2">{selectedCustomer?.name}？</p>
            <p className="text-stone-400 text-xs mb-6">此操作不可撤銷，客戶資料將被永久刪除。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {saving ? '刪除中…' : '確認刪除'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  const cls = {
    stone:   'bg-stone-100   text-stone-600',
    amber:   'bg-amber-100   text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    sky:     'bg-sky-100     text-sky-600',
  }[color];
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${cls}`}>{icon}</div>
      <div className="text-xl font-semibold text-stone-800">{value}</div>
      <div className="text-xs text-stone-400 mt-0.5">{label}</div>
    </div>
  );
}

// ─── CustomerCard ─────────────────────────────────────────────────────────────
function CustomerCard({ customer, isSelected, onClick, onToggleVIP }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
        isSelected ? 'border-stone-500 shadow-sm' : 'border-stone-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${customer.avatar_color ?? 'from-slate-300 to-slate-600'} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
          {customer.initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-stone-800 text-sm truncate">{customer.name}</span>
            {customer.vip && (
              <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full flex-shrink-0">VIP</span>
            )}
          </div>
          <div className="text-xs text-stone-400 mt-0.5">{customer.phone}</div>
          {customer.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {customer.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
              {customer.tags.length > 3 && (
                <span className="text-xs text-stone-400">+{customer.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="text-right flex-shrink-0 mr-1">
          <div className="text-xs text-stone-400">{customer.visits ?? 0} 次到訪</div>
          <div className="text-sm font-medium text-stone-700 mt-0.5">
            HK$ {(customer.total_spent ?? 0).toLocaleString()}
          </div>
        </div>

        <ChevronRight size={15} className="text-stone-300 flex-shrink-0" />
      </div>
    </div>
  );
}

// ─── CustomerDetail ───────────────────────────────────────────────────────────
function CustomerDetail({ customer, onClose, onEdit, onDelete, onToggleVIP }) {
  const lastVisitText = customer.last_visit && customer.last_visit !== '未有記錄'
    ? new Date(customer.last_visit).toLocaleDateString('zh-HK', { year: 'numeric', month: 'short', day: 'numeric' })
    : '未有記錄';

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden sticky top-4">

      {/* Top actions */}
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-stone-100 rounded-lg">
          <X size={18} className="text-stone-500" />
        </button>
        <div className="hidden lg:block" />
        <div className="flex gap-1">
          <button onClick={onEdit}   className="p-2 hover:bg-stone-100 rounded-lg transition-colors" title="編輯">
            <Edit2  size={16} className="text-stone-500" />
          </button>
          <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="刪除">
            <Trash2 size={16} className="text-red-400" />
          </button>
          <button onClick={onClose}  className="hidden lg:block p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <X      size={16} className="text-stone-500" />
          </button>
        </div>
      </div>

      {/* Avatar + Name */}
      <div className="px-5 pb-5 pt-3 border-b border-stone-100">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${customer.avatar_color ?? 'from-slate-300 to-slate-600'} flex items-center justify-center text-white text-xl font-medium flex-shrink-0`}>
            {customer.initials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-stone-800">{customer.name}</h2>
              <button
                onClick={onToggleVIP}
                className={`transition-colors ${customer.vip ? 'text-amber-400 hover:text-amber-300' : 'text-stone-300 hover:text-amber-400'}`}
                title={customer.vip ? '取消 VIP' : '設為 VIP'}
              >
                <Star size={18} fill={customer.vip ? 'currentColor' : 'none'} />
              </button>
            </div>
            {customer.vip
              ? <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">⭐ VIP 客戶</span>
              : <span className="text-xs text-stone-400">一般客戶</span>
            }
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-stone-100 border-b border-stone-100">
        {[
          { val: customer.visits ?? 0,                                                label: '到訪次數' },
          { val: `HK$ ${(customer.total_spent ?? 0).toLocaleString()}`,               label: '總消費'   },
          { val: lastVisitText,                                                         label: '上次到訪' },
        ].map(({ val, label }) => (
          <div key={label} className="p-4 text-center">
            <div className="text-sm font-semibold text-stone-800 leading-tight">{val}</div>
            <div className="text-xs text-stone-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="p-5 space-y-2.5 border-b border-stone-100">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">聯絡資料</p>
        <Row icon={<Phone size={14} />}    text={customer.phone} />
        {customer.email   && <Row icon={<Mail size={14} />}     text={customer.email} />}
        <Row
          icon={<Calendar size={14} />}
          text={`加入於 ${new Date(customer.created_at).toLocaleDateString('zh-HK')}`}
          muted
        />
      </div>

      {/* Tags */}
      {customer.tags?.length > 0 && (
        <div className="p-5 border-b border-stone-100">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">服務標籤</p>
          <div className="flex flex-wrap gap-2">
            {customer.tags.map(tag => (
              <span key={tag} className="text-sm bg-stone-100 text-stone-600 px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {customer.notes && (
        <div className="p-5">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">備註</p>
          <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 rounded-lg p-3 whitespace-pre-wrap">
            {customer.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ icon, text, muted }) {
  return (
    <div className={`flex items-center gap-3 text-sm ${muted ? 'text-stone-400' : 'text-stone-600'}`}>
      <span className="text-stone-400">{icon}</span>
      {text}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-xl max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-stone-100 rounded-lg">
            <X size={18} className="text-stone-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── CustomerForm ─────────────────────────────────────────────────────────────
function CustomerForm({ form, setForm, onToggleTag, onSave, onCancel, saving, saveLabel, showVIP }) {
  const isValid = form.name.trim() && form.phone.trim();
  return (
    <div className="p-6 space-y-4">
      <div>
        <label className="text-xs text-stone-500 mb-1 block">姓名 *</label>
        <input
          placeholder="客戶姓名"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 mb-1 block">電話 *</label>
          <input
            placeholder="9XXXXXXX"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 mb-1 block">Email（可選）</label>
          <input
            placeholder="email@example.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-stone-500 mb-2 block">服務標籤</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                form.tags?.includes(tag)
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {showVIP && (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setForm(f => ({ ...f, vip: !f.vip }))}
            className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.vip ? 'bg-amber-400' : 'bg-stone-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.vip ? 'translate-x-5' : 'translate-x-1'}`} />
          </div>
          <span className="text-sm text-stone-600">設為 VIP 客戶</span>
        </label>
      )}

      <div>
        <label className="text-xs text-stone-500 mb-1 block">備註</label>
        <textarea
          placeholder="過敏資訊、喜好、特別注意事項…"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors"
        >
          取消
        </button>
        <button
          onClick={onSave}
          disabled={saving || !isValid}
          className="flex-1 py-2.5 bg-stone-800 text-white rounded-lg text-sm hover:bg-stone-700 disabled:opacity-40 transition-colors"
        >
          {saving ? '儲存中…' : saveLabel}
        </button>
      </div>
    </div>
  );
}
