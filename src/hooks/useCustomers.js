import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // 改成你嘅路徑

export function useCustomers() {
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);

      // 如果你建咗 View 就用 customers_with_stats
      // 如果未有 appointments 表就用 customers
      const { data, error } = await supabase
        .from('customers_with_stats')   // 或者 'customers'
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 補上 initials（從 name 自動生成）
      const enriched = (data || []).map(c => ({
        ...c,
        initials: c.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        visits:      c.visits      ?? 0,
        total_spent: c.total_spent ?? 0,
        last_visit:  c.last_visit  ?? '未有記錄',
      }));

      setCustomers(enriched);
    } catch (err) {
      console.error('fetchCustomers error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // 新增客戶
  async function addCustomer(form) {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name:         form.name,
        phone:        form.phone,
        email:        form.email  || null,
        notes:        form.notes  || '',
        vip:          false,
        tags:         [],
        avatar_color: pickColor(form.name),
      })
      .select()
      .single();

    if (error) throw error;
    await fetchCustomers(); // 重新整
    return data;
  }

  // 更新客戶
  async function updateCustomer(id, updates) {
    const { error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    await fetchCustomers();
  }

  // 刪除客戶
  async function deleteCustomer(id) {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchCustomers();
  }

  return { customers, loading, error, refetch: fetchCustomers, addCustomer, updateCustomer, deleteCustomer };
}

// 根據名字自動選顏色（唔會每次都一樣）
const COLORS = [
  'from-slate-300 to-slate-600',
  'from-rose-200 to-rose-500',
  'from-sky-200 to-sky-500',
  'from-amber-200 to-amber-500',
  'from-teal-200 to-teal-500',
  'from-violet-200 to-violet-500',
  'from-stone-300 to-stone-600',
];
function pickColor(name) {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}
