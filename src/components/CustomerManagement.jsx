// 喺 component 最頂加入
import { useState, useEffect } from 'react';

// 喺 App component 入面，替換 const customers = [...] 改成：
export default function App() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // API helper function
  const apiCall = async (action, body = {}) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    return res.json();
  };

  // 載入客戶資料
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    const result = await apiCall('getCustomers');
    if (result.data) {
      // 將 Supabase 數據轉成 component 需要嘅格式
      const formatted = result.data.map(c => ({
        ...c,
        initials: getInitials(c.name),
        color: getRandomColor(c.id),
      }));
      setCustomers(formatted);
    }
    setLoading(false);
  };

  // ... 其餘 JSX 保持唔變
}
