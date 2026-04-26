import { useState, useEffect } from 'react';

const SB = 'https://vqyfbwnkdpncwvdonbcz.supabase.co';
const SK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDk1MTksImV4cCI6MjA5MjE4NTUxOX0.hMHq_HcpnjiF-4zwSznyMpMx5Ooao5hDhaMi4aXME3M';

const ff = "'Noto Serif TC',serif";
const fp = "'Playfair Display',serif";
const fc = "'Cormorant Garamond',serif";

export default function ResetPassword() {
  const [accessToken, setAccessToken] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 從 URL hash 讀取 access_token 同 type
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const type = params.get('type');

    if (token && type === 'recovery') {
      setAccessToken(token);
    } else {
      setError('無效的重設密碼連結，請重新申請。');
    }
    setChecking(false);
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 6) {
      setError('密碼最少需要 6 個字元');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('兩次輸入嘅密碼不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SB}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          apikey: SK,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error_description || data.msg || '重設失敗');
      }

      setMessage('密碼已成功重設！你可以用新密碼登入。');
    } catch (err) {
      setError('重設密碼失敗：' + err.message);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4ede4', fontFamily: ff }}>
        <div style={{ color: '#a09484', fontSize: '0.8rem' }}>載入中...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4ede4',
      fontFamily: ff,
      padding: '20px',
    }}>
      <div style={{
        background: '#faf6f0',
        borderRadius: 3,
        padding: '40px 28px',
        maxWidth: 400,
        width: '100%',
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
        border: '1px solid #d8ccba',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontFamily: fp, fontSize: '1.1rem', fontWeight: 500, color: '#6e6050', fontStyle: 'italic', marginBottom: 16 }}>
            J.LAB
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#3a3430', marginBottom: 6 }}>
            重設密碼
          </div>
          <div style={{ fontFamily: fc, fontSize: '0.6rem', color: '#a09484', fontStyle: 'italic', letterSpacing: '0.2em' }}>
            RESET PASSWORD
          </div>
        </div>

        {/* ✅ 成功 */}
        {message ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%', background: '#b0a08a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', fontSize: '1.2rem', color: '#fff',
            }}>✓</div>
            <p style={{ color: '#5C8A5C', fontSize: '0.82rem', marginBottom: 24, lineHeight: 1.8 }}>
              {message}
            </p>
            <a href="/admin" style={{
              display: 'inline-block', padding: '14px 36px', backgroundColor: '#8a7c68',
              color: 'white', borderRadius: 3, textDecoration: 'none',
              fontFamily: ff, fontSize: '0.76rem', fontWeight: 400, letterSpacing: '0.1em',
            }}>
              前往登入
            </a>
          </div>
        ) : error && !accessToken ? (
          /* ❌ 無效連結 */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              fontSize: '0.78rem', color: '#785a50', background: '#e6d4cc',
              padding: '16px', borderRadius: 3, border: '1px solid #c4aea4',
              marginBottom: 24, lineHeight: 1.8,
            }}>
              {error}
            </div>
            <a href="/admin" style={{
              display: 'inline-block', padding: '14px 36px', backgroundColor: '#8a7c68',
              color: 'white', borderRadius: 3, textDecoration: 'none',
              fontFamily: ff, fontSize: '0.76rem', fontWeight: 400,
            }}>
              返回登入頁面
            </a>
          </div>
        ) : (
          /* 📝 輸入新密碼表單 */
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.62rem', color: '#a09484', marginBottom: 8, fontWeight: 300 }}>
                新密碼 <span style={{ color: '#785a50' }}>*</span>
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="輸入新密碼（最少 6 字元）"
                required
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 3,
                  border: '1px solid #d8ccba', background: '#f0e8dc',
                  fontSize: '0.76rem', fontFamily: ff, fontWeight: 300,
                  outline: 'none', boxSizing: 'border-box', color: '#3a3430',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: '0.62rem', color: '#a09484', marginBottom: 8, fontWeight: 300 }}>
                確認新密碼 <span style={{ color: '#785a50' }}>*</span>
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入新密碼"
                required
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 3,
                  border: '1px solid #d8ccba', background: '#f0e8dc',
                  fontSize: '0.76rem', fontFamily: ff, fontWeight: 300,
                  outline: 'none', boxSizing: 'border-box', color: '#3a3430',
                }}
              />
            </div>

            {error && (
              <div style={{
                color: '#785a50', fontSize: '0.64rem', marginBottom: 16,
                background: '#e6d4cc', padding: '10px 14px', borderRadius: 3,
                border: '1px solid #c4aea4', lineHeight: 1.6,
              }}>
                ❌ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px', borderRadius: 3, border: 'none',
                backgroundColor: '#8a7c68', color: 'white', fontFamily: ff,
                fontSize: '0.78rem', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1, fontWeight: 400, letterSpacing: '0.1em',
              }}
            >
              {loading ? '處理中...' : '確認重設密碼'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
