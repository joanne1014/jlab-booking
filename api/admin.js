const SB = process.env.SUPABASE_URL;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, payload } = req.body;

  // 呢幾個 action 唔需要驗證 admin secret（未登入時使用）
  const publicActions = ['login', 'recover', 'reset-via-token'];

  if (!publicActions.includes(action)) {
    const authHeader = req.headers['x-admin-secret'];
    if (authHeader !== ADMIN_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (action === 'login') {
      const r = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: SK, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, password: payload.password })
      });
      if (!r.ok) return res.status(401).json({ error: '帳號或密碼錯誤' });
      const data = await r.json();
      return res.status(200).json({ ok: true, user: data.user?.email });
    }
    // 發送重設密碼郵件
if (action === 'recover') {
  const r = await fetch(`${SB}/auth/v1/recover`, {
    method: 'POST',
    headers: { apikey: SK, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: payload.email })
  });
  if (!r.ok) return res.status(400).json({ error: '發送失敗' });
  return res.status(200).json({ ok: true });
}

// 用 recovery token 更新密碼
if (action === 'update-password') {
  const r = await fetch(`${SB}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: SK,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.access_token}`
    },
    body: JSON.stringify({ password: payload.new_password })
  });
  if (!r.ok) return res.status(400).json({ error: '更新密碼失敗' });
  return res.status(200).json({ ok: true });
}

    if (action === 'reset-password') {
      const listRes = await fetch(`${SB}/auth/v1/admin/users`, {
        headers: { apikey: SK, Authorization: `Bearer ${SK}` }
      });
      const listData = await listRes.json();
      const user = listData.users?.find(u => u.email?.toLowerCase() === payload.email?.toLowerCase());
      if (!user) return res.status(404).json({ error: '搵唔到此 Email' });
      const updateRes = await fetch(`${SB}/auth/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: payload.newPassword })
      });
      if (!updateRes.ok) return res.status(500).json({ error: '更新失敗' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'change-password') {
      const verifyRes = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: SK, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: payload.email, password: payload.oldPassword })
      });
      if (!verifyRes.ok) return res.status(401).json({ error: '舊密碼不正確' });
      const listRes = await fetch(`${SB}/auth/v1/admin/users`, {
        headers: { apikey: SK, Authorization: `Bearer ${SK}` }
      });
      const listData = await listRes.json();
      const user = listData.users?.find(u => u.email?.toLowerCase() === payload.email?.toLowerCase());
      if (!user) return res.status(404).json({ error: '搵唔到用戶' });
      const updateRes = await fetch(`${SB}/auth/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: payload.newPassword })
      });
      if (!updateRes.ok) return res.status(500).json({ error: '更新失敗' });
      return res.status(200).json({ ok: true });
    }

    if (action === 'db') {
      const { method, path, body } = payload;
      const headers = { apikey: SK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };
      if (method === 'POST') headers['Prefer'] = 'return=representation';
      const r = await fetch(`${SB}/rest/v1/${path}`, {
        method: method || 'GET',
        headers,
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      if (!r.ok) {
        const errText = await r.text();
        return res.status(r.status).json({ error: errText });
      }
      if (method === 'DELETE') return res.status(200).json({ ok: true });
      const data = await r.json();
      return res.status(200).json(data);
    }

    if (action === 'recover') {
      const r = await fetch(`${SB}/auth/v1/recover`, {
        method: 'POST',
        headers: { apikey: SK, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: payload.email,
          redirect_to: 'https://jlab-booking.vercel.app/admin'
        })
      });
      if (!r.ok) {
        const errText = await r.text().catch(() => '');
        return res.status(500).json({ error: errText || '發送失敗' });
      }
      return res.status(200).json({ ok: true });
    }

    if (action === 'reset-via-token') {
      const r = await fetch(`${SB}/auth/v1/user`, {
        method: 'PUT',
        headers: { apikey: SK, Authorization: `Bearer ${payload.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: payload.newPassword })
      });
      if (!r.ok) return res.status(500).json({ error: '重設失敗' });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
