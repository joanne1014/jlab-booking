import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // 你應該已經有呢個

const API_BASE = '/api'; // Vercel serverless

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  // 載入收據
  useEffect(() => {
    fetchReceipts();
  }, [filter, search]);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') query = query.eq('status', filter);
      if (search) {
        query = query.or(`receipt_no.ilike.%${search}%,customer_name.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setReceipts(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // 發送 PDF
  const handleSend = async (method, receipt) => {
    setSending(true);
    setSendResult(null);

    const phone = receipt.customer_phone ? '852' + receipt.customer_phone.replace(/[^0-9]/g, '') : '';
    const customer = await supabase.from('customers').select('email').eq('name', receipt.customer_name).single();
    const email = customer?.data?.email || '';

    try {
      const res = await fetch(`${API_BASE}/send-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_id: receipt.id,
          method: method,
          phone: phone,
          email: email,
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (method === 'whatsapp' && data.wa_link) {
          window.open(data.wa_link, '_blank');
        }
        setSendResult({ success: true, method });
        fetchReceipts(); // refresh
      } else {
        setSendResult({ success: false, error: data.error });
      }
    } catch (err) {
      setSendResult({ success: false, error: err.message });
    }
    setSending(false);
  };

  // 列印 PDF
  const handlePrint = async (receipt) => {
    try {
      const res = await fetch(`${API_BASE}/receipt-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receipt_id: receipt.id })
      });
      const data = await res.json();
      
      if (data.html) {
        const w = window.open('', '', 'width=400,height=700');
        w.document.write(data.html);
        w.document.close();
        setTimeout(() => w.print(), 500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>單據管理</h1>
      
      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="搜尋單號 / 客戶..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: 8 }}
        />
        {['all', 'paid', 'unpaid', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '8px 12px', borderRadius: 8, border: filter === f ? '2px solid #C4849A' : '1px solid #ddd', background: filter === f ? '#F5EEF0' : '#fff', cursor: 'pointer' }}>
            {f === 'all' ? '全部' : f === 'paid' ? '已付' : f === 'unpaid' ? '未付' : '取消'}
          </button>
        ))}
      </div>

      {/* Receipt List */}
      {loading ? <p>載入中...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>單號</th>
              <th>日期</th>
              <th>客戶</th>
              <th>金額</th>
              <th>狀態</th>
              <th>動作</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: 8, fontSize: 12 }}>{r.receipt_no}</td>
                <td style={{ fontSize: 11, color: '#888' }}>{new Date(r.created_at).toLocaleDateString('zh-HK')}</td>
                <td>{r.customer_name}</td>
                <td style={{ fontWeight: 700 }}>${r.total}</td>
                <td>
                  <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, background: r.status === 'paid' ? '#e8f5e8' : '#fff3e0', color: r.status === 'paid' ? '#2e7d32' : '#e65100' }}>
                    {r.status === 'paid' ? '已付' : '未付'}
                  </span>
                </td>
                <td>
                  <button onClick={() => handleSend('whatsapp', r)} style={{ marginRight: 4, padding: '4px 8px', border: 'none', background: '#25D366', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                    📱 WA
                  </button>
                  <button onClick={() => handleSend('email', r)} style={{ marginRight: 4, padding: '4px 8px', border: 'none', background: '#C4849A', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                    📧 Email
                  </button>
                  <button onClick={() => handlePrint(r)} style={{ padding: '4px 8px', border: '1px solid #ddd', background: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>
                    🖨️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
