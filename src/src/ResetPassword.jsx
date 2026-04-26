import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase 會自動從 URL hash 讀取 token 並建立 session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
        }
      }
    );

    return () => subscription.unsubscribe();
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

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError('重設密碼失敗：' + error.message);
    } else {
      setMessage('密碼已成功重設！你可以用新密碼登入。');
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F0EB',
      fontFamily: "'Noto Serif TC', serif",
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: '24px',
          color: '#5C4033',
          marginBottom: '8px',
        }}>
          重設密碼
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#999',
          fontSize: '14px',
          marginBottom: '30px',
        }}>
          Reset Password
        </p>

        {message ? (
          <div style={{
            textAlign: 'center',
            padding: '20px',
          }}>
            <p style={{ color: '#4CAF50', fontSize: '16px', marginBottom: '20px' }}>
              ✅ {message}
            </p>
            <a
              href="/admin"
              style={{
                display: 'inline-block',
                padding: '12px 32px',
                backgroundColor: '#B8926A',
                color: 'white',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              前往登入
            </a>
          </div>
        ) : (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#5C4033', fontSize: '14px' }}>
                新密碼
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="輸入新密碼（最少 6 字元）"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#5C4033', fontSize: '14px' }}>
                確認新密碼
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次輸入新密碼"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {error && (
              <p style={{ color: '#e74c3c', fontSize: '14px', marginBottom: '16px' }}>
                ❌ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#B8926A',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
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
