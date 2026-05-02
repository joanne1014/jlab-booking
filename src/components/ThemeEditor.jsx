// src/components/ThemeEditor.jsx — 前台主題設定面板
import React, { useState, useEffect } from 'react';

const ADMIN_API = '/api/admin';
const token = () => localStorage.getItem('adminToken') || '';

async function apiCall(action, payload = {}) {
  const res = await fetch(ADMIN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ action, payload })
  });
  return res.json();
}

const COLOR_FIELDS = [
  { key: 'primary_color', label: '主色調', desc: '按鈕、標記、進度條' },
  { key: 'primary_dark', label: '主色（深）', desc: '選中狀態邊框' },
  { key: 'primary_light', label: '主色（淺）', desc: '選中背景邊框' },
  { key: 'primary_bg', label: '主色背景', desc: '選中卡片背景' },
  { key: 'button_color', label: '按鈕色', desc: '確認按鈕、操作按鈕' },
  { key: 'background_color', label: '頁面背景', desc: '整體背景色' },
  { key: 'card_bg', label: '卡片背景', desc: '白色卡片區域' },
  { key: 'text_color', label: '主文字色', desc: '標題、正文' },
];

const TEXT_FIELDS = [
  { key: 'brand_name', label: '品牌名稱', placeholder: 'J.LAB' },
  { key: 'brand_subtitle', label: '副標題', placeholder: 'LASH & BEAUTY STUDIO' },
  { key: 'booking_title', label: '預約頁標題', placeholder: '線上預約系統' },
  { key: 'success_message', label: '成功訊息', placeholder: '預約已送出！' },
  { key: 'footer_note', label: '底部提示文字', placeholder: '提交後我們將透過 WhatsApp 與您確認預約' },
];

const NOTIFY_FIELDS = [
  { key: 'shop_phone', label: '店舖電話', placeholder: '6000 0000' },
  { key: 'notification_email', label: '通知 Email', placeholder: 'you@example.com', desc: '新預約會發送通知到此 Email' },
  { key: 'whatsapp_number', label: 'WhatsApp 號碼（含區碼）', placeholder: '85260000000', desc: '用於自動通知，格式：85261234567' },
];

export default function ThemeEditor() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('colors');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await apiCall('get-frontend-settings');
      if (res.settings) setSettings(res.settings);
      else setSettings({});
    } catch (e) {
      setError('載入失敗');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const res = await apiCall('save-frontend-settings', { settings });
      if (res.error) throw new Error(res.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message || '儲存失敗');
    }
    setSaving(false);
  };

  const update = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>載入設定中...</div>;

  const s = settings || {};

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #e5e0d8' }}>
        {[
          { id: 'colors', label: '🎨 配色' },
          { id: 'text', label: '✍️ 文字' },
          { id: 'notify', label: '🔔 通知' },
          { id: 'preview', label: '👁️ 預覽' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #8a7c68' : '2px solid transparent',
              background: 'none', fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? '#3a3430' : '#999', cursor: 'pointer', marginBottom: -2
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div>
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 20 }}>
            修改配色後，客人嘅預約頁面會即時套用新配色。
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {COLOR_FIELDS.map(f => (
              <div key={f.key} style={{ padding: 14, background: '#faf6f0', borderRadius: 6, border: '1px solid #e5e0d8' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: '0.6rem', color: '#999', marginBottom: 10 }}>{f.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={s[f.key] || '#000000'}
                    onChange={e => update(f.key, e.target.value)}
                    style={{ width: 40, height: 32, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', padding: 0 }} />
                  <input type="text" value={s[f.key] || ''}
                    onChange={e => update(f.key, e.target.value)}
                    style={{ flex: 1, padding: '6px 10px', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.72rem', fontFamily: 'monospace' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Preset themes */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 600, marginBottom: 12 }}>快速套用預設主題</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { name: '奶茶金（預設）', colors: { primary_color: '#b0a08a', primary_dark: '#90806a', primary_light: '#c8b8a0', primary_bg: '#eae0d0', button_color: '#8a7c68', background_color: '#f4ede4', card_bg: '#faf6f0', text_color: '#3a3430' } },
                { name: '玫瑰粉', colors: { primary_color: '#c4919b', primary_dark: '#a06e78', primary_light: '#dbb4bc', primary_bg: '#f5e5e8', button_color: '#96676f', background_color: '#faf0f2', card_bg: '#fff8f9', text_color: '#3a2e30' } },
                { name: '薄荷綠', colors: { primary_color: '#8aab9e', primary_dark: '#6a8b7e', primary_light: '#a8c8ba', primary_bg: '#e0f0e8', button_color: '#607a6e', background_color: '#f0f8f4', card_bg: '#f8fdfb', text_color: '#2e3a34' } },
                { name: '暮光紫', colors: { primary_color: '#9e90b0', primary_dark: '#7e7090', primary_light: '#b8a8c8', primary_bg: '#e8e0f0', button_color: '#6e6080', background_color: '#f4f0f8', card_bg: '#faf8fd', text_color: '#34303a' } },
                { name: '經典黑金', colors: { primary_color: '#c8a870', primary_dark: '#a88850', primary_light: '#dcc090', primary_bg: '#f0e8d4', button_color: '#2a2420', background_color: '#f8f4ee', card_bg: '#fffcf8', text_color: '#1a1814' } },
              ].map(theme => (
                <button key={theme.name} onClick={() => setSettings(prev => ({ ...prev, ...theme.colors }))}
                  style={{
                    padding: '8px 16px', borderRadius: 20, border: '1px solid #ddd', fontSize: '0.68rem',
                    cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: 6
                  }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: theme.colors.primary_color, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }} />
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Text Tab */}
      {activeTab === 'text' && (
        <div>
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 20 }}>
            自訂預約頁面上顯示嘅文字內容。
          </p>
          {TEXT_FIELDS.map(f => (
            <div key={f.key} style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type="text" value={s[f.key] || ''} placeholder={f.placeholder}
                onChange={e => update(f.key, e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>
          ))}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>最大可預約天數</label>
            <input type="number" value={s.max_booking_days || 60}
              onChange={e => update('max_booking_days', parseInt(e.target.value) || 60)}
              style={{ width: 120, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.8rem' }} />
            <span style={{ fontSize: '0.68rem', color: '#999', marginLeft: 10 }}>日</span>
          </div>
        </div>
      )}

      {/* Notify Tab */}
      {activeTab === 'notify' && (
        <div>
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 20 }}>
            設定新預約通知方式。每次有客人預約，系統會自動通知你。
          </p>
          {NOTIFY_FIELDS.map(f => (
            <div key={f.key} style={{ marginBottom: 18 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>{f.label}</label>
              {f.desc && <div style={{ fontSize: '0.62rem', color: '#999', marginBottom: 6 }}>{f.desc}</div>}
              <input type="text" value={s[f.key] || ''} placeholder={f.placeholder}
                onChange={e => update(f.key, e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.8rem', boxSizing: 'border-box' }} />
            </div>
          ))}

          <div style={{ marginTop: 24, padding: 16, background: '#f0f8f4', border: '1px solid #c8e0d4', borderRadius: 8 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 600, marginBottom: 8 }}>📬 通知方式說明</div>
            <div style={{ fontSize: '0.68rem', color: '#555', lineHeight: 1.8 }}>
              <div>✅ <b>Email 通知</b>：填寫 notification_email，新預約會自動發送 Email 到你信箱</div>
              <div>✅ <b>WhatsApp 通知</b>：填寫 whatsapp_number，系統會生成通知連結</div>
              <div style={{ marginTop: 8, color: '#888' }}>
                💡 提示：如需自動 WhatsApp 訊息（唔使手動點），需要設定 WhatsApp Business API（進階功能）
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div>
          <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: 20 }}>
            預覽客人預約頁面嘅外觀效果。
          </p>
          <div style={{
            background: s.background_color || '#f4ede4',
            borderRadius: 12, padding: 24, border: '1px solid #ddd',
            maxWidth: 360, margin: '0 auto'
          }}>
            {/* Mini preview */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontStyle: 'italic', color: s.text_color || '#3a3430' }}>
                {s.brand_name || 'J.LAB'}
              </div>
              <div style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: s.primary_color || '#b0a08a', marginTop: 4 }}>
                {s.brand_subtitle || 'LASH & BEAUTY STUDIO'}
              </div>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 500, textAlign: 'center', color: s.text_color || '#3a3430', marginBottom: 16 }}>
              {s.booking_title || '線上預約系統'}
            </div>
            {/* Fake card */}
            <div style={{ background: s.card_bg || '#faf6f0', borderRadius: 6, padding: 16, marginBottom: 12, border: `1px solid ${s.primary_light || '#c8b8a0'}30` }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 500, color: s.text_color || '#3a3430', marginBottom: 8 }}>經典單根睫毛嫁接</div>
              <div style={{ fontSize: '0.6rem', color: '#999' }}>約 90 分鐘</div>
            </div>
            {/* Fake selected card */}
            <div style={{ background: s.primary_bg || '#eae0d0', borderRadius: 6, padding: 16, marginBottom: 12, border: `1px solid ${s.primary_color || '#b0a08a'}` }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 500, color: s.text_color || '#3a3430', marginBottom: 8 }}>日式輕盈束感</div>
              <div style={{ fontSize: '0.6rem', color: '#999' }}>已選擇 ✓</div>
            </div>
            {/* Fake button */}
            <div style={{ background: s.button_color || '#8a7c68', color: '#fff', padding: '12px 0', borderRadius: 4, textAlign: 'center', fontSize: '0.76rem', letterSpacing: '0.1em' }}>
              確認並發送預約
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <div style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={handleSave} disabled={saving}
          style={{
            padding: '12px 32px', borderRadius: 6, border: 'none',
            background: saving ? '#ccc' : '#8a7c68', color: '#fff',
            fontSize: '0.82rem', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer'
          }}>
          {saving ? '儲存中...' : '💾 儲存設定'}
        </button>
        {saved && <span style={{ fontSize: '0.76rem', color: '#4a9' }}>✅ 已儲存！</span>}
        {error && <span style={{ fontSize: '0.76rem', color: '#c44' }}>❌ {error}</span>}
      </div>

      <div style={{ marginTop: 16, fontSize: '0.66rem', color: '#aaa' }}>
        儲存後，客人嘅預約頁面會自動套用新設定（毋需重新部署）。
      </div>
    </div>
  );
}
