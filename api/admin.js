// pages/api/admin.js

const SB_URL = 'https://vqyfbwnkdpncwvdonbcz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYwOTUxOSwiZXhwIjoyMDkyMTg1NTE5fQ.Hnjtc-LY653Ftpp9JvIaEJzFg7xwgoJLFIs5ezRwlN0';

// ═══ 輔助函數：驗證 Bearer token ═══
async function verifyToken(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  try {
    const r = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!r.ok) return null;
    const user = await r.json();
    return user;
  } catch (_) {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload } = req.body;

  try {

    // ══════════════════════════════════════
    // 1) login — 唔需要 token
    // ══════════════════════════════════════
    if (action === 'login') {
      const { email, password } = payload;
      const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        throw new Error(data.error_description || data.msg || '帳號或密碼錯誤');
      }
      // ═══ 改動：回傳 access_token 喺頂層，方便前端讀取 ═══
      return res.json({
        success: true,
        access_token: data.access_token,
        user: data.user,
        session: data,
      });
    }

    // ══════════════════════════════════════
    // 2) recover — 唔需要 token
    // ══════════════════════════════════════
    if (action === 'recover') {
      const { email, redirectUrl } = payload;
      if (!email) throw new Error('請輸入 Email');
      let url = `${SB_URL}/auth/v1/recover`;
      if (redirectUrl) {
        url += `?redirect_to=${encodeURIComponent(redirectUrl)}`;
      }
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error_description || data.msg || '發送失敗');
      }
      return res.json({ success: true });
    }

    // ══════════════════════════════════════
    // 3) reset-via-token — 用自己嘅 recovery token
    // ══════════════════════════════════════
    if (action === 'reset-via-token') {
      const { token, newPassword } = payload;
      if (!token) throw new Error('無效的重設連結');
      if (!newPassword || newPassword.length < 6) {
        throw new Error('密碼至少要 6 個字元');
      }
      const r = await fetch(`${SB_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error_description || data.msg || '重設密碼失敗，連結可能已過期');
      }
      return res.json({ success: true });
    }

    // ══════════════════════════════════════
    // 4) 以下所有操作都需要驗證 token
    // ══════════════════════════════════════
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Token 無效或已過期' });
    }

    // ═══ verify — 純粹確認 token 有效 ═══
    if (action === 'verify') {
      return res.json({ success: true, user: user.email });
    }

    // ═══ change-password ═══
    if (action === 'change-password') {
      const { email, oldPassword, newPassword } = payload;
      if (!email || !oldPassword || !newPassword) {
        throw new Error('請填寫所有欄位');
      }
      if (newPassword.length < 6) {
        throw new Error('新密碼至少要 6 個字元');
      }
      // 先用舊密碼驗證
      const loginR = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ email, password: oldPassword }),
      });
      const loginData = await loginR.json();
      if (!loginR.ok) {
        throw new Error('舊密碼錯誤');
      }
      // 用登入後嘅 token 更新密碼
      const updateR = await fetch(`${SB_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${loginData.access_token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!updateR.ok) {
        const data = await updateR.json();
        throw new Error(data.error_description || data.msg || '更新密碼失敗');
      }
      return res.json({ success: true });
    }

    // ═══ db — 所有資料庫操作 ═══
    if (action === 'db') {
      const { path, method = 'GET', body } = payload;

      const headers = {
        apikey: ANON_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      };

      if (method === 'POST') headers['Prefer'] = 'return=representation';
      if (method === 'PATCH') headers['Prefer'] = 'return=representation';

      const opts = { method, headers };
      if (body && (method === 'POST' || method === 'PATCH')) {
        opts.body = JSON.stringify(body);
      }

      const r = await fetch(`${SB_URL}/rest/v1/${path}`, opts);

      if (!r.ok) {
        const text = await r.text();
        throw new Error(`${r.status}: ${text}`);
      }

      if (method === 'DELETE') {
        return res.json({ success: true });
      }

      const data = await r.json();
      return res.json(data);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
