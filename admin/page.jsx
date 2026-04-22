'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ADMIN_PASSWORD = 'jlab2024';

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      fetchBookings();
    } else {
      alert('密碼錯誤！');
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: false });

    if (filterDate) {
      query = query.eq('date', filterDate);
    }
    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data, error } = await query;
    if (!error) {
      setBookings(data || []);
      calculateStats(data || []);
    }
    setLoading(false);
  };

  const calculateStats = (data) => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthStart = new Date().toISOString().slice(0, 7);

    setStats({
      today: data.filter(b => b.date === today).length,
      week: data.filter(b => b.date >= weekAgo).length,
      month: data.filter(b => b.date?.startsWith(monthStart)).length,
      total: data.length,
    });
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      fetchBookings();
    }
  };

  const deleteBooking = async (id) => {
    if (!confirm('確定要刪除呢筆預約？')) return;
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchBookings();
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchBookings();
  }, [filterDate, filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'cancelled': return '#f44336';
      case 'completed': return '#2196F3';
      default: return '#FF9800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return '已確認';
      case 'cancelled': return '已取消';
      case 'completed': return '已完成';
      default: return '待確認';
    }
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f0eb 0%, #e8e0d8 100%)',
        fontFamily: "'Noto Serif TC', serif",
      }}>
        <form onSubmit={handleLogin} style={{
          background: '#fff',
          padding: '60px 40px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px',
          width: '90%',
        }}>
          <h1 style={{ fontSize: '24px', color: '#5c4a3a', marginBottom: '8px' }}>J.LAB</h1>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '40px', letterSpacing: '2px' }}>管理後台 ADMIN</p>
          <input
            type="password"
            placeholder="請輸入管理密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '20px',
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          />
          <button type="submit" style={{
            width: '100%',
            padding: '14px',
            background: '#5c4a3a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}>
            登入
          </button>
        </form>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f0eb',
      fontFamily: "'Noto Serif TC', serif",
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '20px 30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '20px', color: '#5c4a3a', margin: 0 }}>J.LAB 管理後台</h1>
          <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0', letterSpacing: '1px' }}>ADMIN DASHBOARD</p>
        </div>
        <button onClick={() => setIsLoggedIn(false)} style={{
          padding: '8px 20px',
          background: 'transparent',
          border: '1px solid #ccc',
          borderRadius: '6px',
          cursor: 'pointer',
          color: '#666',
        }}>
          登出
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '30px',
        }}>
          {[
            { label: '今日預約', value: stats.today, color: '#FF9800' },
            { label: '本週預約', value: stats.week, color: '#4CAF50' },
            { label: '本月預約', value: stats.month, color: '#2196F3' },
            { label: '總預約數', value: stats.total, color: '#5c4a3a' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <p style={{ color: '#999', fontSize: '13px', margin: '0 0 8px' }}>{s.label}</p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <span style={{ color: '#5c4a3a', fontWeight: 'bold' }}>篩選：</span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="all">全部狀態</option>
            <option value="pending">待確認</option>
            <option value="confirmed">已確認</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <button onClick={() => { setFilterDate(''); setFilterStatus('all'); }} style={{
            padding: '8px 16px',
            background: '#f5f0eb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#5c4a3a',
          }}>
            清除篩選
          </button>
          <button onClick={fetchBookings} style={{
            padding: '8px 16px',
            background: '#5c4a3a',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}>
            🔄 重新整理
          </button>
        </div>

        {/* Bookings Table */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <h2 style={{ margin: 0, color: '#5c4a3a', fontSize: '18px' }}>
              預約列表 ({bookings.length} 筆)
            </h2>
          </div>

          {loading ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>載入中...</p>
          ) : bookings.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#999' }}>暫無預約紀錄</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#f9f6f3' }}>
                    {['日期', '時間', '服務', '客人', '電話', '技師', '金額', '狀態', '操作'].map((h) => (
                      <th key={h} style={{
                        padding: '14px 12px',
                        textAlign: 'left',
                        color: '#5c4a3a',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>{b.date}</td>
                      <td style={{ padding: '14px 12px' }}>{b.time}</td>
                      <td style={{ padding: '14px 12px' }}>
                        {b.service}
                        {b.addon && <div style={{ fontSize: '12px', color: '#999' }}>+ {b.addon}</div>}
                      </td>
                      <td style={{ padding: '14px 12px' }}>{b.name}</td>
                      <td style={{ padding: '14px 12px' }}>{b.phone}</td>
                      <td style={{ padding: '14px 12px' }}>{b.therapist || '-'}</td>
                      <td style={{ padding: '14px 12px', fontWeight: 'bold' }}>${b.total_price || b.price}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          color: '#fff',
                          background: getStatusColor(b.status),
                        }}>
                          {getStatusText(b.status)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
                        <select
                          value={b.status || 'pending'}
                          onChange={(e) => updateStatus(b.id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px',
                            marginRight: '6px',
                          }}
                        >
                          <option value="pending">待確認</option>
                          <option value="confirmed">已確認</option>
                          <option value="completed">已完成</option>
                          <option value="cancelled">已取消</option>
                        </select>
                        <button
                          onClick={() => deleteBooking(b.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#fee',
                            border: '1px solid #fcc',
                            borderRadius: '4px',
                            color: '#c00',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
