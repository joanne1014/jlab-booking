// src/components/ThemeEditor.jsx — 完整版（配合 themeConfig.js + API）
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PG, PS, FGRP, FS, RS, TX, texCss, buildTheme, R } from '../themeConfig';

const api = async (action, payload = {}) => {
  const r = await fetch('/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'API error');
  return d;
};

// ═══ 面板區段標題 ═══
const Sec = ({ title, icon, children, th }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: th.t2, letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
      <span>{icon}</span><span>{title}</span>
    </div>
    {children}
  </div>
);

// ═══ 滑桿 ═══
const Slider = ({ label, value, min, max, step, onChange, suffix, th }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: th.t3, marginBottom: 3 }}>
      <span>{label}</span><span>{value}{suffix || ''}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width: '100%', height: 4, appearance: 'none', background: th.brd, borderRadius: 2, outline: 'none', cursor: 'pointer' }} />
  </div>
);

// ═══ 選項按鈕組 ═══
const OptGroup = ({ options, value, onChange, th }) => (
  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
    {options.map(o => (
      <button key={o.id} onClick={() => onChange(o.id)}
        style={{
          padding: '4px 10px', fontSize: 9, borderRadius: 4, cursor: 'pointer',
          border: value === o.id ? `1.5px solid ${th.pri}` : `1px solid ${th.brd}`,
          background: value === o.id ? th.pri + '18' : 'transparent',
          color: value === o.id ? th.pri : th.t3, fontWeight: value === o.id ? 600 : 400,
        }}>
        {o.n || o.name}
      </button>
    ))}
  </div>
);

export default function ThemeEditor() {
  // ═══ State ═══
  const [pid, sPid] = useState('rosemorn');
  const [fid, sFid] = useState('corm');
  const [rid, sRid] = useState('sm');
  const [dk, sDk] = useState(false);
  const [op, sOp] = useState(0.9);
  const [customPri, sCustomPri] = useState('');
  const [customSec, sCustomSec] = useState('');
  const [customTer, sCustomTer] = useState('');
  const [hueShift, setHueShift] = useState(0);
  const [satAdj, setSatAdj] = useState(100);
  const [brightAdj, setBrightAdj] = useState(0);
  const [bgTex, sBgTex] = useState('none');
  const [bgTexOp, sBgTexOp] = useState(0.7);
  const [bgImg, sBgImg] = useState('');
  const [bgImgOp, sBgImgOp] = useState(0.12);
  const [bgImgBlur, sBgImgBlur] = useState(0);
  const [glassCard, sGlassCard] = useState(false);
  const [btnStyle, setBtnStyle] = useState('solid');
  const [shadowDepth, setShadowDepth] = useState('normal');
  const [density, setDensity] = useState('normal');
  const [letterSpc, setLetterSpc] = useState('normal');
  const [dividerStyle, setDividerStyle] = useState('line');

  // 品牌
  const [brandName, setBrandName] = useState('J.LAB');
  const [brandSub, setBrandSub] = useState('LASH & BEAUTY STUDIO');
  const [whatsapp, setWhatsapp] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');

  // UI State
  const [tab, setTab] = useState('palette');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [palGroup, setPalGroup] = useState('floral');
  const [fontGroup, setFontGroup] = useState('serif');

  // ═══ 載入設定 ═══
  useEffect(() => {
    (async () => {
      try {
        const { settings } = await api('get-frontend-settings');
        if (settings) {
          if (settings.palette_id) sPid(settings.palette_id);
          if (settings.font_id) sFid(settings.font_id);
          if (settings.radius_id) sRid(settings.radius_id);
          if (settings.dark_mode !== undefined) sDk(settings.dark_mode);
          if (settings.card_opacity !== undefined) sOp(Number(settings.card_opacity));
          if (settings.custom_primary) sCustomPri(settings.custom_primary);
          if (settings.custom_secondary) sCustomSec(settings.custom_secondary);
          if (settings.custom_tertiary) sCustomTer(settings.custom_tertiary);
          if (settings.hue_shift !== undefined) setHueShift(Number(settings.hue_shift));
          if (settings.saturation_adj !== undefined) setSatAdj(Number(settings.saturation_adj));
          if (settings.brightness_adj !== undefined) setBrightAdj(Number(settings.brightness_adj));
          if (settings.bg_texture) sBgTex(settings.bg_texture);
          if (settings.bg_texture_opacity !== undefined) sBgTexOp(Number(settings.bg_texture_opacity));
          if (settings.bg_image_url) sBgImg(settings.bg_image_url);
          if (settings.bg_image_opacity !== undefined) sBgImgOp(Number(settings.bg_image_opacity));
          if (settings.bg_image_blur !== undefined) sBgImgBlur(Number(settings.bg_image_blur));
          if (settings.glass_card !== undefined) sGlassCard(settings.glass_card);
          if (settings.btn_style) setBtnStyle(settings.btn_style);
          if (settings.shadow_depth) setShadowDepth(settings.shadow_depth);
          if (settings.density) setDensity(settings.density);
          if (settings.letter_spacing) setLetterSpc(settings.letter_spacing);
          if (settings.divider_style) setDividerStyle(settings.divider_style);
          if (settings.brand_name) setBrandName(settings.brand_name);
          if (settings.brand_subtitle) setBrandSub(settings.brand_subtitle);
          if (settings.whatsapp_number) setWhatsapp(settings.whatsapp_number);
          if (settings.notification_email) setNotifyEmail(settings.notification_email);
        }
      } catch (e) {
        console.error('Failed to load theme settings:', e);
      }
      setLoading(false);
    })();
  }, []);

  // ═══ 建立 theme ═══
  const currentSettings = useMemo(() => ({
    palette_id: pid, font_id: fid, radius_id: rid, dark_mode: dk, card_opacity: op,
    custom_primary: customPri, custom_secondary: customSec, custom_tertiary: customTer,
    hue_shift: hueShift, saturation_adj: satAdj, brightness_adj: brightAdj,
    bg_texture: bgTex, bg_texture_opacity: bgTexOp,
    bg_image_url: bgImg, bg_image_opacity: bgImgOp, bg_image_blur: bgImgBlur,
    glass_card: glassCard, btn_style: btnStyle, shadow_depth: shadowDepth,
    density, letter_spacing: letterSpc, divider_style: dividerStyle,
    brand_name: brandName, brand_subtitle: brandSub,
  }), [pid, fid, rid, dk, op, customPri, customSec, customTer, hueShift, satAdj, brightAdj, bgTex, bgTexOp, bgImg, bgImgOp, bgImgBlur, glassCard, btnStyle, shadowDepth, density, letterSpc, dividerStyle, brandName, brandSub]);

  const th = useMemo(() => buildTheme(currentSettings), [currentSettings]);

  // ═══ 儲存 ═══
  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      await api('save-frontend-settings', {
        settings: {
          ...currentSettings,
          whatsapp_number: whatsapp,
          notification_email: notifyEmail,
        }
      });
      setSaveMsg('✅ 已儲存');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e) {
      setSaveMsg('❌ ' + e.message);
    }
    setSaving(false);
  };

  // ═══ 重設 ═══
  const handleReset = () => {
    sPid('rosemorn'); sFid('corm'); sRid('sm'); sDk(false); sOp(0.9);
    sCustomPri(''); sCustomSec(''); sCustomTer('');
    setHueShift(0); setSatAdj(100); setBrightAdj(0);
    sBgTex('none'); sBgTexOp(0.7); sBgImg(''); sBgImgOp(0.12); sBgImgBlur(0);
    sGlassCard(false); setBtnStyle('solid'); setShadowDepth('normal');
    setDensity('normal'); setLetterSpc('normal'); setDividerStyle('line');
  };

  // ═══ Tab List ═══
  const TABS = [
    { id: 'palette', icon: '🎨', label: '配色' },
    { id: 'font', icon: '✍️', label: '字體' },
    { id: 'bg', icon: '🖼️', label: '背景' },
    { id: 'detail', icon: '⚙️', label: '細節' },
    { id: 'brand', icon: '💎', label: '品牌' },
    { id: 'preview', icon: '👁️', label: '預覽' },
  ];

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#888', fontSize: 13 }}>載入主題設定中...</div>
  );

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: '"Noto Sans TC", sans-serif' }}>
      {/* ═══ Tab 導航 ═══ */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `2px solid ${th.brd}`, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t.id ? `2px solid ${th.pri}` : '2px solid transparent',
              color: tab === t.id ? th.t : th.t3, fontSize: 12, fontWeight: tab === t.id ? 600 : 400,
              marginBottom: -2, whiteSpace: 'nowrap',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════ 配色 TAB ═══════════════════ */}
      {tab === 'palette' && (
        <div>
          {/* 色盤群組選擇 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {PG.map(g => (
              <button key={g.id} onClick={() => setPalGroup(g.id)}
                style={{
                  padding: '5px 12px', fontSize: 11, borderRadius: 14, cursor: 'pointer',
                  border: palGroup === g.id ? `1.5px solid ${th.pri}` : `1px solid ${th.brd}`,
                  background: palGroup === g.id ? th.pri + '15' : 'transparent',
                  color: palGroup === g.id ? th.pri : th.t3,
                }}>
                {g.n}
              </button>
            ))}
          </div>

          {/* 色盤選項 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
            {(PG.find(g => g.id === palGroup)?.items || []).map(p => {
              const c = dk ? p.d : p.l;
              const sel = pid === p.id;
              return (
                <motion.div key={p.id} whileTap={{ scale: 0.96 }} onClick={() => sPid(p.id)}
                  style={{
                    padding: 10, borderRadius: 8, cursor: 'pointer',
                    border: sel ? `2px solid ${c.pri}` : `1px solid ${th.brd}`,
                    background: sel ? c.bg : 'transparent',
                  }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                    {[c.pri, c.sec, c.ter].map((clr, i) => (
                      <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: clr }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: sel ? 600 : 400, color: sel ? c.pri : th.t2 }}>{p.n}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Dark Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: 12, background: th.card, borderRadius: 8, border: `1px solid ${th.brd}` }}>
            <span style={{ fontSize: 11, color: th.t2, flex: 1 }}>🌙 深色模式</span>
            <motion.div onClick={() => sDk(!dk)} whileTap={{ scale: 0.9 }}
              style={{ width: 40, height: 22, borderRadius: 11, background: dk ? th.pri : th.brd, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <motion.div animate={{ x: dk ? 19 : 1 }}
                style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </motion.div>
          </div>

          {/* Card Opacity */}
          <Slider label="卡片透明度" value={op} min={0.5} max={1} step={0.05} onChange={sOp} suffix="" th={th} />

          {/* 色調微調 */}
          <Sec title="色彩氛圍微調" icon="🎛️" th={th}>
            <Slider label="色相偏移" value={hueShift} min={-180} max={180} step={5} onChange={setHueShift} suffix="°" th={th} />
            <Slider label="飽和度" value={satAdj} min={50} max={150} step={5} onChange={setSatAdj} suffix="%" th={th} />
            <Slider label="明度" value={brightAdj} min={-30} max={30} step={5} onChange={setBrightAdj} suffix="" th={th} />
            {(hueShift !== 0 || satAdj !== 100 || brightAdj !== 0) && (
              <button onClick={() => { setHueShift(0); setSatAdj(100); setBrightAdj(0); }}
                style={{ fontSize: 9, color: th.pri, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                ↩ 重設氛圍
              </button>
            )}
          </Sec>

          {/* 自訂顏色覆蓋 */}
          <Sec title="自訂顏色覆蓋（選填）" icon="🎯" th={th}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: '主色', val: customPri, set: sCustomPri },
                { label: '副色', val: customSec, set: sCustomSec },
                { label: '第三色', val: customTer, set: sCustomTer },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: th.t3, marginBottom: 4 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="color" value={val || th.pri} onChange={e => set(e.target.value)}
                      style={{ width: 24, height: 24, border: `1px solid ${th.brd}`, borderRadius: 4, cursor: 'pointer', padding: 0 }} />
                    <input type="text" value={val} onChange={e => set(e.target.value)} placeholder="留空用預設"
                      style={{ flex: 1, padding: '4px 6px', fontSize: 9, border: `1px solid ${th.brd}`, borderRadius: 4, fontFamily: 'monospace', background: 'transparent', color: th.t2 }} />
                  </div>
                </div>
              ))}
            </div>
            {(customPri || customSec || customTer) && (
              <button onClick={() => { sCustomPri(''); sCustomSec(''); sCustomTer(''); }}
                style={{ fontSize: 9, color: th.pri, background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}>
                ↩ 清除自訂顏色
              </button>
            )}
          </Sec>
        </div>
      )}

      {/* ═══════════════════ 字體 TAB ═══════════════════ */}
      {tab === 'font' && (
        <div>
          {/* 字體群組 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {FGRP.map(g => (
              <button key={g.id} onClick={() => setFontGroup(g.id)}
                style={{
                  padding: '5px 12px', fontSize: 11, borderRadius: 14, cursor: 'pointer',
                  border: fontGroup === g.id ? `1.5px solid ${th.pri}` : `1px solid ${th.brd}`,
                  background: fontGroup === g.id ? th.pri + '15' : 'transparent',
                  color: fontGroup === g.id ? th.pri : th.t3,
                }}>
                {g.n}
              </button>
            ))}
          </div>

          {/* 字體選項 */}
          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            {(FGRP.find(g => g.id === fontGroup)?.items || []).map(f => {
              const sel = fid === f.id;
              return (
                <motion.div key={f.id} whileTap={{ scale: 0.98 }} onClick={() => sFid(f.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: sel ? `2px solid ${th.pri}` : `1px solid ${th.brd}`,
                    background: sel ? th.pri + '10' : 'transparent',
                  }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: sel ? 600 : 400, color: sel ? th.pri : th.t2, marginBottom: 2 }}>{f.n}</div>
                    <div style={{ fontSize: 9, color: th.t3 }}>{f.cat} · {f.e}</div>
                  </div>
                  <div style={{ fontFamily: f.v, fontSize: 18, color: sel ? th.pri : th.t3 }}>{f.demo}</div>
                </motion.div>
              );
            })}
          </div>

          {/* 圓角 */}
          <Sec title="圓角" icon="⬜" th={th}>
            <OptGroup options={RS} value={rid} onChange={sRid} th={th} />
          </Sec>

          {/* 字距 */}
          <Sec title="字距" icon="↔️" th={th}>
            <OptGroup options={[
              { id: 'tight', n: '緊湊' }, { id: 'normal', n: '正常' }, { id: 'wide', n: '寬鬆' }
            ]} value={letterSpc} onChange={setLetterSpc} th={th} />
          </Sec>
        </div>
      )}

      {/* ═══════════════════ 背景 TAB ═══════════════════ */}
      {tab === 'bg' && (
        <div>
          {/* 材質 */}
          <Sec title="背景材質" icon="🧶" th={th}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6, marginBottom: 10 }}>
              {TX.map(t => {
                const sel = bgTex === t.id;
                const texStyle = t.id !== 'none' ? texCss(t.id, 0.8) : {};
                return (
                  <motion.div key={t.id} whileTap={{ scale: 0.93 }} onClick={() => sBgTex(t.id)}
                    style={{
                      padding: '10px 6px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                      border: sel ? `2px solid ${th.pri}` : `1px solid ${th.brd}`,
                      background: sel ? th.pri + '12' : th.bg,
                      ...texStyle,
                    }}>
                    <div style={{ fontSize: 9, color: sel ? th.pri : th.t3, fontWeight: sel ? 600 : 400 }}>{t.n}</div>
                  </motion.div>
                );
              })}
            </div>
            {bgTex !== 'none' && (
              <Slider label="材質深度" value={bgTexOp} min={0.2} max={1} step={0.05} onChange={sBgTexOp} suffix="" th={th} />
            )}
          </Sec>

          {/* 背景圖片 */}
          <Sec title="背景圖片" icon="🖼️" th={th}>
            <input type="text" value={bgImg} onChange={e => sBgImg(e.target.value)} placeholder="貼入圖片網址..."
              style={{ width: '100%', padding: '8px 12px', fontSize: 11, border: `1px solid ${th.brd}`, borderRadius: 6, background: 'transparent', color: th.t2, boxSizing: 'border-box', marginBottom: 8 }} />
            {bgImg && (
              <>
                <Slider label="圖片透明度" value={bgImgOp} min={0.05} max={0.5} step={0.01} onChange={sBgImgOp} suffix="" th={th} />
                <Slider label="模糊程度" value={bgImgBlur} min={0} max={20} step={1} onChange={sBgImgBlur} suffix="px" th={th} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 10, color: th.t3 }}>毛玻璃卡片</span>
                  <motion.div onClick={() => sGlassCard(!glassCard)} whileTap={{ scale: 0.9 }}
                    style={{ width: 32, height: 18, borderRadius: 9, background: glassCard ? th.pri : th.brd, cursor: 'pointer', position: 'relative' }}>
                    <motion.div animate={{ x: glassCard ? 15 : 1 }}
                      style={{ width: 14, height: 14, borderRadius: 7, background: '#fff', position: 'absolute', top: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                  </motion.div>
                </div>
                <button onClick={() => { sBgImg(''); sBgImgOp(0.12); sBgImgBlur(0); sGlassCard(false); }}
                  style={{ fontSize: 9, color: '#c44', background: 'none', border: 'none', cursor: 'pointer', marginTop: 8 }}>
                  ✕ 移除背景圖片
                </button>
              </>
            )}
          </Sec>
        </div>
      )}

      {/* ═══════════════════ 細節 TAB ═══════════════════ */}
      {tab === 'detail' && (
        <div>
          <Sec title="按鈕樣式" icon="🔘" th={th}>
            <OptGroup options={[
              { id: 'solid', n: '實心' }, { id: 'outline', n: '描邊' }, { id: 'soft', n: '柔色' }, { id: 'ghost', n: '無框' }
            ]} value={btnStyle} onChange={setBtnStyle} th={th} />
            {/* 按鈕預覽 */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {btnStyle === 'solid' && <div style={{ padding: '6px 18px', borderRadius: th.r, background: th.pri, color: '#fff', fontSize: 10 }}>預覽按鈕</div>}
              {btnStyle === 'outline' && <div style={{ padding: '6px 18px', borderRadius: th.r, border: `1.5px solid ${th.pri}`, color: th.pri, fontSize: 10 }}>預覽按鈕</div>}
              {btnStyle === 'soft' && <div style={{ padding: '6px 18px', borderRadius: th.r, background: th.pri + '20', color: th.pri, fontSize: 10 }}>預覽按鈕</div>}
              {btnStyle === 'ghost' && <div style={{ padding: '6px 18px', borderRadius: th.r, color: th.pri, fontSize: 10 }}>預覽按鈕</div>}
            </div>
          </Sec>

          <Sec title="陰影深度" icon="🌓" th={th}>
            <OptGroup options={[
              { id: 'none', n: '無' }, { id: 'soft', n: '柔和' }, { id: 'normal', n: '正常' }, { id: 'deep', n: '深沉' }
            ]} value={shadowDepth} onChange={setShadowDepth} th={th} />
          </Sec>

          <Sec title="密度" icon="📐" th={th}>
            <OptGroup options={[
              { id: 'compact', n: '緊湊' }, { id: 'normal', n: '正常' }, { id: 'airy', n: '寬鬆' }
            ]} value={density} onChange={setDensity} th={th} />
          </Sec>

          <Sec title="分隔線" icon="➖" th={th}>
            <OptGroup options={[
              { id: 'none', n: '無' }, { id: 'line', n: '線條' }, { id: 'dot', n: '點線' }, { id: 'fade', n: '漸淡' }
            ]} value={dividerStyle} onChange={setDividerStyle} th={th} />
          </Sec>
        </div>
      )}

      {/* ═══════════════════ 品牌 TAB ═══════════════════ */}
      {tab === 'brand' && (
        <div>
          <Sec title="品牌資訊" icon="💎" th={th}>
            {[
              { label: '品牌名稱', val: brandName, set: setBrandName, ph: 'J.LAB' },
              { label: '副標題', val: brandSub, set: setBrandSub, ph: 'LASH & BEAUTY STUDIO' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: th.t3, marginBottom: 4 }}>{f.label}</div>
                <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                  style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: `1px solid ${th.brd}`, borderRadius: 6, background: 'transparent', color: th.t, boxSizing: 'border-box' }} />
              </div>
            ))}
          </Sec>

          <Sec title="通知設定" icon="🔔" th={th}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: th.t3, marginBottom: 4 }}>通知 Email</div>
              <input type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="you@example.com"
                style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: `1px solid ${th.brd}`, borderRadius: 6, background: 'transparent', color: th.t, boxSizing: 'border-box' }} />
              <div style={{ fontSize: 9, color: th.t3, marginTop: 3 }}>新預約會自動發送通知到此信箱</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: th.t3, marginBottom: 4 }}>WhatsApp 號碼（含區碼）</div>
              <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="85261234567"
                style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: `1px solid ${th.brd}`, borderRadius: 6, background: 'transparent', color: th.t, boxSizing: 'border-box' }} />
            </div>
          </Sec>
        </div>
      )}

      {/* ═══════════════════ 預覽 TAB ═══════════════════ */}
      {tab === 'preview' && (
        <div>
          <div style={{ fontSize: 11, color: th.t3, marginBottom: 14 }}>以下係客人預約頁面嘅外觀預覽：</div>
          <div style={{
            background: th.bg, borderRadius: 12, padding: 24, border: `1px solid ${th.brd}`,
            maxWidth: 380, margin: '0 auto', position: 'relative', overflow: 'hidden',
            filter: th.colorFilter, fontFamily: th.f, letterSpacing: th.lsMap,
            ...(bgTex !== 'none' ? texCss(bgTex, bgTexOp) : {}),
          }}>
            {/* BG Image */}
            {bgImg && (
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: bgImgOp, filter: bgImgBlur ? `blur(${bgImgBlur}px)` : undefined }} />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 20, fontWeight: 300, fontStyle: 'italic', color: th.t }}>{brandName}</div>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', color: th.pri, marginTop: 4 }}>{brandSub}</div>
              </div>

              {/* Card - normal */}
              <div style={{
                background: th.card, borderRadius: th.r, padding: 14 * th.padScale, marginBottom: 10,
                border: `1px solid ${th.brd}`, boxShadow: th.sh,
                backdropFilter: th.blur,
              }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: th.t, marginBottom: 4 }}>經典單根嫁接</div>
                <div style={{ fontSize: 9, color: th.t3 }}>自然款 · 約 90 分鐘</div>
              </div>

              {/* Card - selected */}
              <div style={{
                background: th.card, borderRadius: th.r, padding: 14 * th.padScale, marginBottom: 10,
                border: `2px solid ${th.pri}`, boxShadow: th.sh2,
                backdropFilter: th.blur,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: th.pri, marginBottom: 4 }}>日式輕盈束感</div>
                    <div style={{ fontSize: 9, color: th.t3 }}>已選擇</div>
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: th.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontSize: 10 }}>✓</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              {dividerStyle === 'line' && <div style={{ height: 1, background: th.brd, margin: '14px 0' }} />}
              {dividerStyle === 'dot' && <div style={{ borderBottom: `1px dashed ${th.brd}`, margin: '14px 0' }} />}
              {dividerStyle === 'fade' && <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${th.brd}, transparent)`, margin: '14px 0' }} />}
              {dividerStyle === 'none' && <div style={{ margin: '8px 0' }} />}

              {/* Button */}
              <div style={{
                padding: '12px 0', borderRadius: th.r, textAlign: 'center', fontSize: 12,
                fontWeight: 500, letterSpacing: '0.1em', cursor: 'pointer',
                ...(btnStyle === 'solid' ? { background: th.pri, color: '#fff' } :
                  btnStyle === 'outline' ? { border: `1.5px solid ${th.pri}`, color: th.pri, background: 'transparent' } :
                  btnStyle === 'soft' ? { background: th.pri + '20', color: th.pri } :
                  { color: th.pri, background: 'transparent' }),
              }}>
                確認並發送預約
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ 底部操作列 ═══ */}
      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: `1px solid ${th.brd}` }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
          style={{
            padding: '12px 32px', borderRadius: 6, border: 'none',
            background: saving ? '#ccc' : th.pri, color: '#fff',
            fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: 0.5,
          }}>
          {saving ? '儲存中...' : '💾 儲存主題'}
        </motion.button>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleReset}
          style={{
            padding: '12px 20px', borderRadius: 6, border: `1px solid ${th.brd}`,
            background: 'transparent', color: th.t3, fontSize: 12, cursor: 'pointer',
          }}>
          ↩ 重設
        </motion.button>

        {saveMsg && (
          <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
            style={{ fontSize: 12, color: saveMsg.includes('✅') ? '#4a9' : '#c44' }}>
            {saveMsg}
          </motion.span>
        )}
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: th.t3 }}>
        儲存後，客人嘅預約頁面會自動套用新主題（毋需重新部署）。
      </div>
    </div>
  );
}
