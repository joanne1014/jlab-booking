import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Upload, Trash2, Eye, EyeOff, RotateCcw, Save, Palette, Type, Image, Settings, Diamond, Monitor, Sun, Moon, ChevronDown, ChevronUp, X, ExternalLink, Smartphone } from 'lucide-react';

// ═══════════════════════════════════════════════════════
// themeConfig 內嵌版（正式項目用 import）
// ═══════════════════════════════════════════════════════

const PG = [
  { id: 'floral', n: '🌸 花語', items: [
    { id: 'rosemorn', n: '玫瑰晨曦', l: { pri: '#9e6b5a', sec: '#c4956a', ter: '#f5ede6', bg: '#faf7f5', t: '#3a2e2a', t2: '#6b5c55', t3: '#9e8e85' }, d: { pri: '#d4a090', sec: '#c4956a', ter: '#2a2220', bg: '#1a1614', t: '#ede5e0', t2: '#b8a8a0', t3: '#7a6a62' } },
    { id: 'lavdream', n: '薰衣草夢', l: { pri: '#7b6b8a', sec: '#a48bb5', ter: '#f0eaf5', bg: '#f9f7fc', t: '#2e2836', t2: '#5c5068', t3: '#8e8098' }, d: { pri: '#b8a0d0', sec: '#a48bb5', ter: '#24202a', bg: '#16141a', t: '#e8e0f0', t2: '#a898b8', t3: '#6e6080' } },
    { id: 'sakura', n: '櫻花雨', l: { pri: '#c47a8a', sec: '#d4a0aa', ter: '#fdf0f2', bg: '#fdf8f9', t: '#3a2028', t2: '#6b4a55', t3: '#9e7a85' }, d: { pri: '#e0a0b0', sec: '#d4a0aa', ter: '#2a1a1e', bg: '#1a1214', t: '#f0e0e5', t2: '#c0a0aa', t3: '#806068' } },
    { id: 'peony', n: '牡丹華', l: { pri: '#a85070', sec: '#c87090', ter: '#fceef3', bg: '#fef8fa', t: '#3a1828', t2: '#6b3850', t3: '#9e6880' }, d: { pri: '#d080a0', sec: '#c87090', ter: '#2a1520', bg: '#1a1015', t: '#f0dce5', t2: '#b890a5', t3: '#7a5068' } },
  ]},
  { id: 'nature', n: '🌿 自然', items: [
    { id: 'forest', n: '森林浴', l: { pri: '#5a7a5a', sec: '#8aaa6a', ter: '#eaf5ea', bg: '#f7faf7', t: '#1e2e1e', t2: '#4a6b4a', t3: '#7a9e7a' }, d: { pri: '#90c090', sec: '#8aaa6a', ter: '#1a2a1a', bg: '#121a12', t: '#e0f0e0', t2: '#a0c0a0', t3: '#607a60' } },
    { id: 'ocean', n: '海洋', l: { pri: '#4a7a9e', sec: '#6aaac4', ter: '#e6f2fa', bg: '#f5f9fc', t: '#1e2e3a', t2: '#4a6b7a', t3: '#7a9eaa' }, d: { pri: '#80b8d8', sec: '#6aaac4', ter: '#1a2228', bg: '#10181e', t: '#dceaf2', t2: '#90b0c0', t3: '#506a7a' } },
    { id: 'desert', n: '沙漠日落', l: { pri: '#b87040', sec: '#d4a060', ter: '#faf0e0', bg: '#fcf9f4', t: '#3a2810', t2: '#7a5830', t3: '#aa8860' }, d: { pri: '#d0a070', sec: '#d4a060', ter: '#2a2018', bg: '#1a1610', t: '#f0e8d8', t2: '#c0a080', t3: '#806040' } },
    { id: 'moss', n: '苔蘚', l: { pri: '#6a8a5a', sec: '#90aa70', ter: '#f0f5ea', bg: '#f8faf5', t: '#2a3a20', t2: '#5a7a4a', t3: '#8aaa7a' }, d: { pri: '#a0c890', sec: '#90aa70', ter: '#1e2a1a', bg: '#141a12', t: '#e5f0e0', t2: '#90b080', t3: '#608050' } },
  ]},
  { id: 'elegant', n: '✨ 典雅', items: [
    { id: 'champagne', n: '香檳金', l: { pri: '#a08850', sec: '#c4aa70', ter: '#f8f2e6', bg: '#fcfaf5', t: '#3a3020', t2: '#7a6840', t3: '#aa9a70' }, d: { pri: '#c8b080', sec: '#c4aa70', ter: '#28221a', bg: '#1a1610', t: '#f0e8d8', t2: '#b0a070', t3: '#7a6a40' } },
    { id: 'noir', n: '黑金', l: { pri: '#2a2a2a', sec: '#c8a050', ter: '#f0ece0', bg: '#faf8f5', t: '#1a1a1a', t2: '#5a5a5a', t3: '#9a9a9a' }, d: { pri: '#e0c070', sec: '#c8a050', ter: '#222018', bg: '#0e0e0c', t: '#f0ead8', t2: '#b0a880', t3: '#706838' } },
    { id: 'ivory', n: '象牙白', l: { pri: '#8a7a6a', sec: '#b0a090', ter: '#f5f0ea', bg: '#fdfcfa', t: '#2a2820', t2: '#6a6050', t3: '#9a9080' }, d: { pri: '#c0b0a0', sec: '#b0a090', ter: '#222018', bg: '#18160f', t: '#f0ebe0', t2: '#a09888', t3: '#686050' } },
    { id: 'royal', n: '皇家紫', l: { pri: '#5a3a8a', sec: '#8a60c0', ter: '#f0eaf8', bg: '#faf8fd', t: '#201830', t2: '#5a4870', t3: '#8a78a0' }, d: { pri: '#a080d0', sec: '#8a60c0', ter: '#201828', bg: '#140f1a', t: '#ede0f5', t2: '#9a88b8', t3: '#605070' } },
  ]},
  { id: 'modern', n: '🔲 現代', items: [
    { id: 'mono', n: '極簡灰', l: { pri: '#4a4a4a', sec: '#8a8a8a', ter: '#f0f0f0', bg: '#fafafa', t: '#1a1a1a', t2: '#5a5a5a', t3: '#9a9a9a' }, d: { pri: '#c0c0c0', sec: '#8a8a8a', ter: '#222222', bg: '#111111', t: '#eeeeee', t2: '#aaaaaa', t3: '#666666' } },
    { id: 'coral', n: '珊瑚粉', l: { pri: '#e07060', sec: '#f0a090', ter: '#fef0ee', bg: '#fefafa', t: '#3a2020', t2: '#7a4a4a', t3: '#aa7a7a' }, d: { pri: '#f0a090', sec: '#e07060', ter: '#2a1818', bg: '#1a1010', t: '#f5e8e5', t2: '#d0a0a0', t3: '#805050' } },
    { id: 'mint', n: '薄荷', l: { pri: '#40a0a0', sec: '#70c0c0', ter: '#e8f8f8', bg: '#f5fcfc', t: '#1a3030', t2: '#4a7070', t3: '#7aaa9a' }, d: { pri: '#80d0d0', sec: '#70c0c0', ter: '#182828', bg: '#101a1a', t: '#e0f5f0', t2: '#90c0b8', t3: '#507a70' } },
    { id: 'blush', n: '腮紅', l: { pri: '#d07080', sec: '#e0a0a8', ter: '#fdf0f2', bg: '#fef9fa', t: '#3a2028', t2: '#7a5058', t3: '#aa8088' }, d: { pri: '#e8a0b0', sec: '#d07080', ter: '#281a1e', bg: '#1a1014', t: '#f5e5ea', t2: '#c890a0', t3: '#805060' } },
  ]},
];

const FS = [
  { id: 'sys', n: '系統預設', v: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', cat: '系統', e: 'System', demo: '預約' },
  { id: 'notosan', n: 'Noto Sans TC', v: '"Noto Sans TC", sans-serif', cat: '現代', e: 'Modern', demo: '預約' },
  { id: 'notoser', n: 'Noto Serif TC', v: '"Noto Serif TC", serif', cat: '傳統', e: 'Classic', demo: '預約' },
  { id: 'corm', n: 'Cormorant Garamond', v: '"Cormorant Garamond", serif', cat: '優雅', e: 'Elegant', demo: 'Booking' },
  { id: 'play', n: 'Playfair Display', v: '"Playfair Display", serif', cat: '時尚', e: 'Fashion', demo: 'Booking' },
  { id: 'lora', n: 'Lora', v: '"Lora", serif', cat: '書卷', e: 'Literary', demo: 'Booking' },
  { id: 'raleway', n: 'Raleway', v: '"Raleway", sans-serif', cat: '纖細', e: 'Thin', demo: 'Booking' },
  { id: 'mont', n: 'Montserrat', v: '"Montserrat", sans-serif', cat: '幾何', e: 'Geometric', demo: 'Booking' },
  { id: 'lxgw', n: 'LXGW WenKai', v: '"LXGW WenKai TC", cursive', cat: '手寫', e: 'Handwritten', demo: '預約' },
  { id: 'jose', n: 'Josefin Sans', v: '"Josefin Sans", sans-serif', cat: '簡約', e: 'Minimal', demo: 'Booking' },
  { id: 'cinzel', n: 'Cinzel', v: '"Cinzel", serif', cat: '古典', e: 'Classical', demo: 'BOOKING' },
  { id: 'dm', n: 'DM Sans', v: '"DM Sans", sans-serif', cat: '中性', e: 'Neutral', demo: 'Booking' },
];

const FGRP = [
  { id: 'serif', n: '襯線', items: FS.filter(f => ['corm','play','lora','notoser','cinzel'].includes(f.id)) },
  { id: 'sans', n: '無襯線', items: FS.filter(f => ['sys','notosan','raleway','mont','jose','dm'].includes(f.id)) },
  { id: 'special', n: '特殊', items: FS.filter(f => ['lxgw'].includes(f.id)) },
];

const RS = [
  { id: 'none', n: '直角', v: 0 },
  { id: 'xs', n: '微圓', v: 4 },
  { id: 'sm', n: '小圓', v: 8 },
  { id: 'md', n: '中圓', v: 12 },
  { id: 'lg', n: '大圓', v: 18 },
  { id: 'full', n: '膠囊', v: 50 },
];

const TX = [
  { id: 'none', n: '無' },
  { id: 'linen', n: '亞麻' },
  { id: 'paper', n: '紙質' },
  { id: 'noise', n: '噪點' },
  { id: 'silk', n: '絲綢' },
  { id: 'canvas', n: '帆布' },
];

function texCss(id, opacity = 0.7) {
  const o = opacity;
  switch (id) {
    case 'linen': return { backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23000' fill-opacity='${o * 0.03}'/%3E%3C/svg%3E")` };
    case 'paper': return { backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='${o * 0.04}'/%3E%3C/svg%3E")` };
    case 'noise': return { backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${o * 0.05}'/%3E%3C/svg%3E")` };
    case 'silk': return { backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30 Q15 25 30 30 T60 30' fill='none' stroke='%23000' stroke-opacity='${o * 0.02}' stroke-width='0.5'/%3E%3C/svg%3E")` };
    case 'canvas': return { backgroundImage: `url("data:image/svg+xml,%3Csvg width='6' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='3' height='3' fill='%23000' fill-opacity='${o * 0.015}'/%3E%3C/svg%3E")` };
    default: return {};
  }
}

function buildTheme(s) {
  if (!s) s = {};
  const palId = s.palette_id || 'rosemorn';
  const fontId = s.font_id || 'corm';
  const radId = s.radius_id || 'sm';
  const dark = s.dark_mode || false;

  let pal = null;
  for (const g of PG) { const found = g.items.find(p => p.id === palId); if (found) { pal = found; break; } }
  if (!pal) pal = PG[0].items[0];
  const c = dark ? pal.d : pal.l;

  const pri = s.custom_primary || c.pri;
  const sec = s.custom_secondary || c.sec;
  const ter = s.custom_tertiary || c.ter;
  const font = FS.find(f => f.id === fontId) || FS[0];
  const rad = RS.find(r => r.id === radId) || RS[2];

  const op = s.card_opacity !== undefined ? Number(s.card_opacity) : 0.9;
  const cardBg = dark ? `rgba(30,28,26,${op})` : `rgba(255,255,255,${op})`;
  const cardInner = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)';

  const shadow = s.shadow_depth || 'normal';
  const sh = shadow === 'none' ? 'none' : shadow === 'soft' ? '0 1px 4px rgba(0,0,0,0.04)' : shadow === 'deep' ? '0 4px 20px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)';
  const sh2 = shadow === 'none' ? 'none' : shadow === 'soft' ? '0 2px 8px rgba(0,0,0,0.06)' : shadow === 'deep' ? '0 8px 32px rgba(0,0,0,0.18)' : '0 4px 16px rgba(0,0,0,0.1)';

  const dens = s.density || 'normal';
  const padScale = dens === 'compact' ? 0.8 : dens === 'airy' ? 1.2 : 1;

  const ls = s.letter_spacing || 'normal';
  const lsMap = ls === 'tight' ? '-0.01em' : ls === 'wide' ? '0.06em' : '0.02em';

  const hue = s.hue_shift || 0;
  const sat = s.saturation_adj || 100;
  const brt = s.brightness_adj || 0;
  let colorFilter = '';
  if (hue !== 0) colorFilter += `hue-rotate(${hue}deg) `;
  if (sat !== 100) colorFilter += `saturate(${sat}%) `;
  if (brt !== 0) colorFilter += brt > 0 ? `brightness(${100 + brt}%) ` : `brightness(${100 + brt}%) `;
  colorFilter = colorFilter.trim() || 'none';

  const glass = s.glass_card || false;
  const blur = glass ? 'blur(12px)' : '';

  return {
    pri, sec, ter, bg: c.bg, t: c.t, t2: c.t2, t3: c.t3,
    card: cardBg, cardInner,
    brd: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    brd2: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    sh, sh2, r: rad.v, f: font.v, fnt: font,
    dk: dark, padScale, lsMap, colorFilter,
    bgTex: s.bg_texture || 'none', bgTexOp: s.bg_texture_opacity || 0.7,
    bgImg: s.bg_image_url || '', bgImgOp: s.bg_image_opacity || 0.12, bgImgBlur: s.bg_image_blur || 0,
    glassCard: glass, blur,
    btnStyle: s.btn_style || 'solid', dividerStyle: s.divider_style || 'line',
    brandName: s.brand_name || 'J.LAB', brandSubtitle: s.brand_subtitle || 'LASH & BEAUTY STUDIO',
    logoUrl: s.logo_url || '', logoShape: s.logo_shape || 'circle', logoSize: s.logo_size || 'md',
  };
}

// ═══════════════════════════════════════════════════════
// 子組件
// ═══════════════════════════════════════════════════════

const Sec = ({ title, icon, children, th, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 18, border: `1px solid ${th.brd}`, borderRadius: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(!open)}
        style={{ padding: '10px 14px', background: th.cardInner, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: th.t2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{icon}</span>{title}
        </span>
        {open ? <ChevronUp size={14} color={th.t3} /> : <ChevronDown size={14} color={th.t3} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: '12px 14px', overflow: 'hidden' }}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Slider = ({ label, value, min, max, step, onChange, suffix = '', th }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: th.t3, marginBottom: 4 }}>
      <span>{label}</span><span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width: '100%', height: 5, appearance: 'none', background: `linear-gradient(90deg, ${th.pri} ${((value - min) / (max - min)) * 100}%, ${th.brd} ${((value - min) / (max - min)) * 100}%)`, borderRadius: 3, outline: 'none', cursor: 'pointer' }} />
  </div>
);

const OptGroup = ({ options, value, onChange, th }) => (
  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
    {options.map(o => (
      <motion.button key={o.id} whileTap={{ scale: 0.95 }} onClick={() => onChange(o.id)}
        style={{
          padding: '6px 14px', fontSize: 10, borderRadius: 6, cursor: 'pointer', border: 'none',
          background: value === o.id ? th.pri : th.cardInner,
          color: value === o.id ? '#fff' : th.t3, fontWeight: value === o.id ? 600 : 400,
          boxShadow: value === o.id ? `0 2px 8px ${th.pri}40` : 'none',
          transition: 'all 0.2s',
        }}>
        {o.n || o.name}
      </motion.button>
    ))}
  </div>
);

const Toggle = ({ value, onChange, th, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span style={{ fontSize: 11, color: th.t2, flex: 1 }}>{label}</span>
    <motion.div onClick={() => onChange(!value)} whileTap={{ scale: 0.9 }}
      style={{ width: 40, height: 22, borderRadius: 11, background: value ? th.pri : th.brd, cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
      <motion.div animate={{ x: value ? 19 : 1 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </motion.div>
  </div>
);

const ColorInput = ({ label, value, onChange, placeholder, th }) => (
  <div>
    <div style={{ fontSize: 9, color: th.t3, marginBottom: 4 }}>{label}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <input type="color" value={value || th.pri} onChange={e => onChange(e.target.value)}
        style={{ width: 28, height: 28, border: `1.5px solid ${th.brd}`, borderRadius: 6, cursor: 'pointer', padding: 0 }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || '留空用預設'}
        style={{ flex: 1, padding: '5px 8px', fontSize: 10, border: `1px solid ${th.brd}`, borderRadius: 5, fontFamily: 'monospace', background: 'transparent', color: th.t2, outline: 'none' }} />
      {value && <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.t3, fontSize: 10 }}>✕</button>}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
// 主組件
// ═══════════════════════════════════════════════════════

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

  // Logo
  const [logoUrl, setLogoUrl] = useState('');
  const [logoShape, setLogoShape] = useState('circle');
  const [logoSize, setLogoSize] = useState('md');

  // 自訂字體
  const [customFontUrl, setCustomFontUrl] = useState('');
  const [customFontFamily, setCustomFontFamily] = useState('');

  // 品牌
  const [brandName, setBrandName] = useState('J.LAB');
  const [brandSub, setBrandSub] = useState('LASH & BEAUTY STUDIO');
  const [whatsapp, setWhatsapp] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');

  // UI
  const [tab, setTab] = useState('palette');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [palGroup, setPalGroup] = useState('floral');
  const [fontGroup, setFontGroup] = useState('serif');
  const [showPreview, setShowPreview] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState('');

  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);

  // ═══ Build theme ═══
  const currentSettings = useMemo(() => ({
    palette_id: pid, font_id: fid, radius_id: rid, dark_mode: dk, card_opacity: op,
    custom_primary: customPri, custom_secondary: customSec, custom_tertiary: customTer,
    hue_shift: hueShift, saturation_adj: satAdj, brightness_adj: brightAdj,
    bg_texture: bgTex, bg_texture_opacity: bgTexOp,
    bg_image_url: bgImg, bg_image_opacity: bgImgOp, bg_image_blur: bgImgBlur,
    glass_card: glassCard, btn_style: btnStyle, shadow_depth: shadowDepth,
    density, letter_spacing: letterSpc, divider_style: dividerStyle,
    brand_name: brandName, brand_subtitle: brandSub,
    logo_url: logoUrl, logo_shape: logoShape, logo_size: logoSize,
    custom_font_url: customFontUrl, custom_font_family: customFontFamily,
  }), [pid, fid, rid, dk, op, customPri, customSec, customTer, hueShift, satAdj, brightAdj, bgTex, bgTexOp, bgImg, bgImgOp, bgImgBlur, glassCard, btnStyle, shadowDepth, density, letterSpc, dividerStyle, brandName, brandSub, logoUrl, logoShape, logoSize, customFontUrl, customFontFamily]);

  const th = useMemo(() => buildTheme(currentSettings), [currentSettings]);

  // ═══ 發送 preview 訊息到 iframe ═══
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'theme-preview', settings: currentSettings }, '*');
    }
  }, [currentSettings]);

  // ═══ Mock Save ═══
  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    await new Promise(r => setTimeout(r, 800));
    setSaveMsg('✅ 主題已儲存');
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 3000);
  };

  // ═══ Reset ═══
  const handleReset = () => {
    sPid('rosemorn'); sFid('corm'); sRid('sm'); sDk(false); sOp(0.9);
    sCustomPri(''); sCustomSec(''); sCustomTer('');
    setHueShift(0); setSatAdj(100); setBrightAdj(0);
    sBgTex('none'); sBgTexOp(0.7); sBgImg(''); sBgImgOp(0.12); sBgImgBlur(0);
    sGlassCard(false); setBtnStyle('solid'); setShadowDepth('normal');
    setDensity('normal'); setLetterSpc('normal'); setDividerStyle('line');
    setLogoUrl(''); setLogoShape('circle'); setLogoSize('md');
    setCustomFontUrl(''); setCustomFontFamily('');
  };

  // ═══ Upload handler (mock) ═══
  const handleUpload = (target) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };
  const onFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // Mock upload - 喺正式版用 Supabase Storage
    const reader = new FileReader();
    reader.onload = () => {
      setTimeout(() => {
        if (uploadTarget === 'bgImg') sBgImg(reader.result);
        if (uploadTarget === 'logo') setLogoUrl(reader.result);
        setUploading(false);
      }, 500);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ═══ Tabs ═══
  const TABS = [
    { id: 'palette', icon: <Palette size={14} />, label: '配色' },
    { id: 'font', icon: <Type size={14} />, label: '字體' },
    { id: 'bg', icon: <Image size={14} />, label: '背景' },
    { id: 'detail', icon: <Settings size={14} />, label: '細節' },
    { id: 'brand', icon: <Diamond size={14} />, label: '品牌' },
  ];

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  return (
    <div style={{ display: 'flex', gap: 0, height: '100vh', fontFamily: '-apple-system, sans-serif', background: '#f8f7f6', overflow: 'hidden' }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileSelect} />

      {/* ═══ LEFT: Editor Panel ═══ */}
      <div style={{ width: showPreview ? '55%' : '100%', minWidth: 380, display: 'flex', flexDirection: 'column', transition: 'width 0.3s', borderRight: `1px solid #e8e4e0` }}>

        {/* Top bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e8e4e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: th.pri }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>🖌️ 主題編輯器</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowPreview(!showPreview)}
              style={{ padding: '6px 12px', fontSize: 10, borderRadius: 6, border: '1px solid #e0dcd8', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#666' }}>
              {showPreview ? <EyeOff size={12} /> : <Eye size={12} />}
              {showPreview ? '隱藏預覽' : '顯示預覽'}
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #e8e4e0', background: '#fff', overflowX: 'auto', padding: '0 12px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: tab === t.id ? `2.5px solid ${th.pri}` : '2.5px solid transparent',
                color: tab === t.id ? th.pri : '#888', fontSize: 11, fontWeight: tab === t.id ? 600 : 400,
                marginBottom: -1, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#fcfbfa' }}>

          {/* ═══ 配色 Tab ═══ */}
          {tab === 'palette' && (
            <div>
              {/* Dark mode */}
              <div style={{ marginBottom: 18, padding: '12px 14px', background: '#fff', borderRadius: 10, border: '1px solid #e8e4e0' }}>
                <Toggle value={dk} onChange={sDk} th={th} label={dk ? '🌙 深色模式' : '☀️ 淺色模式'} />
              </div>

              {/* 色盤群組 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {PG.map(g => (
                  <button key={g.id} onClick={() => setPalGroup(g.id)}
                    style={{
                      padding: '5px 14px', fontSize: 11, borderRadius: 20, cursor: 'pointer',
                      border: palGroup === g.id ? `2px solid ${th.pri}` : '1px solid #e0dcd8',
                      background: palGroup === g.id ? th.pri + '12' : '#fff',
                      color: palGroup === g.id ? th.pri : '#666', fontWeight: palGroup === g.id ? 600 : 400,
                    }}>
                    {g.n}
                  </button>
                ))}
              </div>

              {/* 色盤選項 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
                {(PG.find(g => g.id === palGroup)?.items || []).map(p => {
                  const c = dk ? p.d : p.l;
                  const sel = pid === p.id;
                  return (
                    <motion.div key={p.id} whileTap={{ scale: 0.97 }} onClick={() => sPid(p.id)}
                      style={{
                        padding: '14px', borderRadius: 10, cursor: 'pointer',
                        border: sel ? `2.5px solid ${c.pri}` : '1.5px solid #e8e4e0',
                        background: sel ? (dk ? '#1a1816' : '#fff') : '#fff',
                        boxShadow: sel ? `0 4px 16px ${c.pri}25` : 'none',
                      }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                        {[c.pri, c.sec, c.ter, c.bg].map((clr, i) => (
                          <div key={i} style={{ width: 20, height: 20, borderRadius: 5, background: clr, border: '1px solid rgba(0,0,0,0.05)' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: sel ? 600 : 400, color: sel ? c.pri : '#666' }}>{p.n}</div>
                      {sel && <div style={{ fontSize: 9, color: c.sec, marginTop: 2 }}>✓ 已選</div>}
                    </motion.div>
                  );
                })}
              </div>

              {/* 透明度 */}
              <Sec title="卡片透明度" icon="◻️" th={th}>
                <Slider label="不透明度" value={op} min={0.5} max={1} step={0.05} onChange={sOp} th={th} />
              </Sec>

              {/* 色調微調 */}
              <Sec title="色彩氛圍微調" icon="🎛️" th={th} defaultOpen={false}>
                <Slider label="色相偏移" value={hueShift} min={-180} max={180} step={5} onChange={setHueShift} suffix="°" th={th} />
                <Slider label="飽和度" value={satAdj} min={50} max={150} step={5} onChange={setSatAdj} suffix="%" th={th} />
                <Slider label="明度" value={brightAdj} min={-30} max={30} step={5} onChange={setBrightAdj} suffix="" th={th} />
                {(hueShift !== 0 || satAdj !== 100 || brightAdj !== 0) && (
                  <button onClick={() => { setHueShift(0); setSatAdj(100); setBrightAdj(0); }}
                    style={{ fontSize: 10, color: th.pri, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                    ↩ 重設氛圍
                  </button>
                )}
              </Sec>

              {/* 自訂顏色覆蓋 */}
              <Sec title="自訂顏色覆蓋" icon="🎯" th={th} defaultOpen={false}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <ColorInput label="主色 Primary" value={customPri} onChange={sCustomPri} placeholder={th.pri} th={th} />
                  <ColorInput label="副色 Secondary" value={customSec} onChange={sCustomSec} placeholder={th.sec} th={th} />
                  <ColorInput label="第三色 Tertiary" value={customTer} onChange={sCustomTer} placeholder={th.ter} th={th} />
                </div>
              </Sec>
            </div>
          )}

          {/* ═══ 字體 Tab ═══ */}
          {tab === 'font' && (
            <div>
              {/* 字體群組 */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {FGRP.map(g => (
                  <button key={g.id} onClick={() => setFontGroup(g.id)}
                    style={{
                      padding: '5px 14px', fontSize: 11, borderRadius: 20, cursor: 'pointer',
                      border: fontGroup === g.id ? `2px solid ${th.pri}` : '1px solid #e0dcd8',
                      background: fontGroup === g.id ? th.pri + '12' : '#fff',
                      color: fontGroup === g.id ? th.pri : '#666',
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
                        padding: '14px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: sel ? `2.5px solid ${th.pri}` : '1.5px solid #e8e4e0',
                        background: sel ? th.pri + '08' : '#fff',
                        boxShadow: sel ? `0 2px 12px ${th.pri}15` : 'none',
                      }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? th.pri : '#333', marginBottom: 3 }}>{f.n}</div>
                        <div style={{ fontSize: 9, color: '#999' }}>{f.cat} · {f.e}</div>
                      </div>
                      <div style={{ fontFamily: f.v, fontSize: 22, color: sel ? th.pri : '#aaa', fontWeight: 400 }}>{f.demo}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 自訂字體 URL */}
              <Sec title="自訂字體 URL" icon="🔗" th={th} defaultOpen={false}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Google Fonts CSS URL</div>
                  <input type="text" value={customFontUrl} onChange={e => setCustomFontUrl(e.target.value)}
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    style={{ width: '100%', padding: '8px 12px', fontSize: 11, border: '1px solid #e0dcd8', borderRadius: 6, background: '#fff', color: '#333', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>字體名稱（CSS font-family）</div>
                  <input type="text" value={customFontFamily} onChange={e => setCustomFontFamily(e.target.value)}
                    placeholder='e.g. "Noto Sans TC"'
                    style={{ width: '100%', padding: '8px 12px', fontSize: 11, border: '1px solid #e0dcd8', borderRadius: 6, background: '#fff', color: '#333', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div style={{ fontSize: 9, color: '#aaa', marginTop: 8, lineHeight: 1.6 }}>
                  💡 貼入 Google Fonts 嘅 CSS URL，並填寫字體名稱。儲存後前台會自動載入。
                </div>
              </Sec>

              {/* 圓角 */}
              <Sec title="圓角" icon="⬜" th={th}>
                <OptGroup options={RS} value={rid} onChange={sRid} th={th} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                  {RS.map(r => (
                    <div key={r.id} style={{ width: 32, height: 32, borderRadius: r.v, border: `2px solid ${rid === r.id ? th.pri : '#ddd'}`, background: rid === r.id ? th.pri + '15' : '#f5f5f5' }} />
                  ))}
                </div>
              </Sec>

              {/* 字距 */}
              <Sec title="字距" icon="↔️" th={th}>
                <OptGroup options={[
                  { id: 'tight', n: '緊湊 -0.01em' }, { id: 'normal', n: '正常 0.02em' }, { id: 'wide', n: '寬鬆 0.06em' }
                ]} value={letterSpc} onChange={setLetterSpc} th={th} />
              </Sec>
            </div>
          )}

          {/* ═══ 背景 Tab ═══ */}
          {tab === 'bg' && (
            <div>
              {/* 材質 */}
              <Sec title="背景材質紋理" icon="🧶" th={th}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {TX.map(t => {
                    const sel = bgTex === t.id;
                    const texStyle = t.id !== 'none' ? texCss(t.id, 0.8) : {};
                    return (
                      <motion.div key={t.id} whileTap={{ scale: 0.93 }} onClick={() => sBgTex(t.id)}
                        style={{
                          padding: '16px 8px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                          border: sel ? `2.5px solid ${th.pri}` : '1.5px solid #e8e4e0',
                          background: sel ? '#fff' : '#faf9f8', ...texStyle,
                        }}>
                        <div style={{ fontSize: 10, color: sel ? th.pri : '#888', fontWeight: sel ? 600 : 400, marginTop: 4 }}>{t.n}</div>
                      </motion.div>
                    );
                  })}
                </div>
                {bgTex !== 'none' && (
                  <Slider label="材質深度" value={bgTexOp} min={0.2} max={1} step={0.05} onChange={sBgTexOp} th={th} />
                )}
              </Sec>

              {/* 背景圖片 */}
              <Sec title="背景圖片" icon="🖼️" th={th}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpload('bgImg')}
                      style={{ flex: 1, padding: '12px', borderRadius: 8, border: `1.5px dashed ${th.brd}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#666' }}>
                      <Upload size={14} /> {uploading && uploadTarget === 'bgImg' ? '上傳中...' : '上傳圖片'}
                    </motion.button>
                  </div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>或貼入網址：</div>
                  <input type="text" value={bgImg} onChange={e => sBgImg(e.target.value)} placeholder="https://example.com/bg.jpg"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 11, border: '1px solid #e0dcd8', borderRadius: 6, background: '#fff', color: '#333', boxSizing: 'border-box', outline: 'none' }} />
                </div>

                {bgImg && (
                  <div>
                    <div style={{ width: '100%', height: 80, borderRadius: 8, overflow: 'hidden', marginBottom: 12, border: '1px solid #e8e4e0' }}>
                      <img src={bgImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bgImgOp, filter: bgImgBlur ? `blur(${bgImgBlur}px)` : undefined }} />
                    </div>
                    <Slider label="圖片透明度" value={bgImgOp} min={0.03} max={0.5} step={0.01} onChange={sBgImgOp} th={th} />
                    <Slider label="模糊程度" value={bgImgBlur} min={0} max={20} step={1} onChange={sBgImgBlur} suffix="px" th={th} />
                    <div style={{ marginTop: 10, marginBottom: 10 }}>
                      <Toggle value={glassCard} onChange={sGlassCard} th={th} label="🫧 毛玻璃卡片效果" />
                    </div>
                    <button onClick={() => { sBgImg(''); sBgImgOp(0.12); sBgImgBlur(0); sGlassCard(false); }}
                      style={{ fontSize: 10, color: '#c44', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={11} /> 移除背景圖片
                    </button>
                  </div>
                )}
              </Sec>
            </div>
          )}

          {/* ═══ 細節 Tab ═══ */}
          {tab === 'detail' && (
            <div>
              <Sec title="按鈕樣式" icon="🔘" th={th}>
                <OptGroup options={[
                  { id: 'solid', n: '實心填色' }, { id: 'outline', n: '描邊' }, { id: 'soft', n: '柔色底' }, { id: 'ghost', n: '無框文字' }
                ]} value={btnStyle} onChange={setBtnStyle} th={th} />
                {/* 預覽 */}
                <div style={{ display: 'flex', gap: 12, marginTop: 14, padding: '16px', background: th.bg, borderRadius: 8, justifyContent: 'center', border: '1px solid #e8e4e0' }}>
                  {[
                    { style: btnStyle === 'solid' ? { background: th.pri, color: '#fff' } : btnStyle === 'outline' ? { border: `2px solid ${th.pri}`, color: th.pri, background: 'transparent' } : btnStyle === 'soft' ? { background: th.pri + '20', color: th.pri } : { color: th.pri, background: 'transparent' }, label: '主按鈕' },
                  ].map((b, i) => (
                    <div key={i} style={{ padding: '10px 24px', borderRadius: th.r, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', ...b.style }}>
                      {b.label}
                    </div>
                  ))}
                </div>
              </Sec>

              <Sec title="陰影深度" icon="🌓" th={th}>
                <OptGroup options={[
                  { id: 'none', n: '無陰影' }, { id: 'soft', n: '柔和' }, { id: 'normal', n: '正常' }, { id: 'deep', n: '深沉' }
                ]} value={shadowDepth} onChange={setShadowDepth} th={th} />
              </Sec>

              <Sec title="內容密度" icon="📐" th={th}>
                <OptGroup options={[
                  { id: 'compact', n: '緊湊' }, { id: 'normal', n: '正常' }, { id: 'airy', n: '寬鬆' }
                ]} value={density} onChange={setDensity} th={th} />
              </Sec>

              <Sec title="分隔線樣式" icon="➖" th={th}>
                <OptGroup options={[
                  { id: 'none', n: '無' }, { id: 'line', n: '實線' }, { id: 'dots', n: '點線' }, { id: 'fade', n: '漸淡' }
                ]} value={dividerStyle} onChange={setDividerStyle} th={th} />
                {/* 預覽 */}
                <div style={{ marginTop: 12, padding: '8px 0' }}>
                  {dividerStyle === 'line' && <div style={{ height: 1, background: th.brd }} />}
                  {dividerStyle === 'dots' && <div style={{ borderBottom: `2px dotted ${th.brd}` }} />}
                  {dividerStyle === 'fade' && <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${th.brd}, transparent)` }} />}
                  {dividerStyle === 'none' && <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center' }}>（無分隔線）</div>}
                </div>
              </Sec>
            </div>
          )}

          {/* ═══ 品牌 Tab ═══ */}
          {tab === 'brand' && (
            <div>
              {/* Logo */}
              <Sec title="店舖 Logo" icon="🏪" th={th}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: logoShape === 'circle' ? '50%' : logoShape === 'rounded' ? 12 : 0,
                    background: logoUrl ? 'transparent' : '#f0ede8', border: `2px dashed ${logoUrl ? 'transparent' : '#ccc'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Upload size={18} color="#aaa" />
                    )}
                  </div>
                  <div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUpload('logo')}
                      style={{ padding: '8px 16px', fontSize: 10, borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', marginBottom: 6, display: 'block' }}>
                      {uploading && uploadTarget === 'logo' ? '上傳中...' : '📤 上傳 Logo'}
                    </motion.button>
                    {logoUrl && (
                      <button onClick={() => setLogoUrl('')} style={{ fontSize: 9, color: '#c44', background: 'none', border: 'none', cursor: 'pointer' }}>✕ 移除</button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>形狀</div>
                    <OptGroup options={[
                      { id: 'circle', n: '圓形' }, { id: 'rounded', n: '圓角' }, { id: 'square', n: '方形' }
                    ]} value={logoShape} onChange={setLogoShape} th={th} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: '#888', marginBottom: 4 }}>大小</div>
                    <OptGroup options={[
                      { id: 'sm', n: '小' }, { id: 'md', n: '中' }, { id: 'lg', n: '大' }
                    ]} value={logoSize} onChange={setLogoSize} th={th} />
                  </div>
                </div>
              </Sec>

              {/* 品牌資訊 */}
              <Sec title="品牌名稱" icon="💎" th={th}>
                {[
                  { label: '品牌名稱', val: brandName, set: setBrandName, ph: 'J.LAB' },
                  { label: '副標題 / Slogan', val: brandSub, set: setBrandSub, ph: 'LASH & BEAUTY STUDIO' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{f.label}</div>
                    <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      style={{ width: '100%', padding: '10px 14px', fontSize: 13, border: '1px solid #e0dcd8', borderRadius: 8, background: '#fff', color: '#333', boxSizing: 'border-box', outline: 'none', fontWeight: 500 }} />
                  </div>
                ))}
              </Sec>

              {/* 通知設定 */}
              <Sec title="通知設定" icon="🔔" th={th}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>WhatsApp 號碼（含區碼）</div>
                  <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="85261234567"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: '1px solid #e0dcd8', borderRadius: 6, background: '#fff', color: '#333', boxSizing: 'border-box', outline: 'none' }} />
                  <div style={{ fontSize: 9, color: '#aaa', marginTop: 3 }}>客人提交預約後可一鍵發送 WhatsApp</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>通知 Email</div>
                  <input type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="you@example.com"
                    style={{ width: '100%', padding: '8px 12px', fontSize: 12, border: '1px solid #e0dcd8', borderRadius: 6, background: '#fff', color: '#333', boxSizing: 'border-box', outline: 'none' }} />
                  <div style={{ fontSize: 9, color: '#aaa', marginTop: 3 }}>新預約會自動發送通知到此信箱</div>
                </div>
              </Sec>
            </div>
          )}
        </div>

        {/* ═══ Bottom action bar ═══ */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e8e4e0', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving}
            style={{
              padding: '10px 28px', borderRadius: 8, border: 'none',
              background: saving ? '#ccc' : th.pri, color: '#fff',
              fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 2px 12px ${th.pri}30`,
            }}>
            <Save size={14} /> {saving ? '儲存中...' : '儲存主題'}
          </motion.button>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleReset}
            style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid #e0dcd8', background: '#fff', color: '#888', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RotateCcw size={12} /> 重設
          </motion.button>

          <AnimatePresence>
            {saveMsg && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 12, color: saveMsg.includes('✅') ? '#2a8' : '#c44', fontWeight: 500 }}>
                {saveMsg}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ RIGHT: Live Preview ═══ */}
      {showPreview && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#e8e4e0', alignItems: 'center', justifyContent: 'center', padding: 20, minWidth: 320 }}>
          {/* Phone mockup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Smartphone size={14} color="#888" />
            <span style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>客戶端即時預覽</span>
          </div>
          <div style={{
            width: 320, height: 580, borderRadius: 32, background: '#111',
            padding: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative',
          }}>
            {/* Notch */}
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 20, background: '#111', borderRadius: '0 0 12px 12px', zIndex: 2 }} />
            {/* Screen */}
            <div style={{ width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', background: th.bg, position: 'relative' }}>
              {/* Mini preview content */}
              <div style={{
                width: '100%', height: '100%', overflowY: 'auto', padding: 0,
                fontFamily: th.f, color: th.t, filter: th.colorFilter !== 'none' ? th.colorFilter : undefined,
                ...(bgTex !== 'none' ? texCss(bgTex, bgTexOp) : {}),
                position: 'relative',
              }}>
                {/* BG Image */}
                {bgImg && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                    <img src={bgImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: bgImgOp, filter: bgImgBlur ? `blur(${bgImgBlur}px)` : undefined }} />
                  </div>
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Header */}
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${th.brd}`, backdropFilter: bgImg ? 'blur(10px)' : undefined, background: bgImg ? th.card : th.bg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {logoUrl && (
                        <img src={logoUrl} alt="" style={{
                          width: logoSize === 'sm' ? 22 : logoSize === 'lg' ? 34 : 28,
                          height: logoSize === 'sm' ? 22 : logoSize === 'lg' ? 34 : 28,
                          borderRadius: logoShape === 'circle' ? '50%' : logoShape === 'rounded' ? 6 : 0,
                          objectFit: 'cover',
                        }} />
                      )}
                      <span style={{ fontSize: 14, fontWeight: 500, color: th.t2, fontStyle: 'italic' }}>{brandName}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ textAlign: 'center', padding: '24px 16px 18px' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.25em', color: th.pri, fontWeight: 400 }}>BOOKING</div>
                    <div style={{ fontSize: 16, fontWeight: 500, margin: '6px 0 4px', letterSpacing: th.lsMap }}>線上預約系統</div>
                    <div style={{ fontSize: 8, letterSpacing: '0.18em', color: th.t3, fontStyle: 'italic' }}>ONLINE BOOKING SYSTEM</div>
                  </div>

                  {/* Cards */}
                  <div style={{ padding: '0 14px' }}>
                    {/* Card 1 - Normal */}
                    <div style={{
                      background: th.card, borderRadius: th.r, padding: `${12 * th.padScale}px ${14 * th.padScale}px`,
                      marginBottom: 10, border: `1px solid ${th.brd}`, boxShadow: th.sh,
                      backdropFilter: th.blur || undefined,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 500, color: th.t, letterSpacing: th.lsMap }}>經典單根嫁接</div>
                          <div style={{ fontSize: 8, color: th.t3, marginTop: 3 }}>自然款 · 約 90 分鐘</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: th.t2 }}>$680</div>
                      </div>
                    </div>

                    {/* Card 2 - Selected */}
                    <div style={{
                      background: th.card, borderRadius: th.r, padding: `${12 * th.padScale}px ${14 * th.padScale}px`,
                      marginBottom: 10, border: `2px solid ${th.pri}`, boxShadow: th.sh2,
                      backdropFilter: th.blur || undefined,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: th.pri, letterSpacing: th.lsMap }}>日式輕盈束感</div>
                          <div style={{ fontSize: 8, color: th.t3, marginTop: 3 }}>人氣款 · 約 120 分鐘</div>
                        </div>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: th.pri, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={10} color="#fff" strokeWidth={3} />
                        </div>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div style={{
                      background: th.card, borderRadius: th.r, padding: `${12 * th.padScale}px ${14 * th.padScale}px`,
                      marginBottom: 14, border: `1px solid ${th.brd}`, boxShadow: th.sh,
                      backdropFilter: th.blur || undefined,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 500, color: th.t, letterSpacing: th.lsMap }}>濃密貴婦款</div>
                          <div style={{ fontSize: 8, color: th.t3, marginTop: 3 }}>豪華款 · 約 150 分鐘</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: th.t2 }}>$1280</div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ margin: '12px 0' }}>
                      {dividerStyle === 'line' && <div style={{ height: 1, background: th.brd }} />}
                      {dividerStyle === 'dots' && <div style={{ borderBottom: `2px dotted ${th.brd}` }} />}
                      {dividerStyle === 'fade' && <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${th.brd}, transparent)` }} />}
                    </div>

                    {/* Date grid mini */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5, marginBottom: 14 }}>
                      {[12, 13, 14, 15].map((d, i) => (
                        <div key={d} style={{
                          textAlign: 'center', padding: '8px 4px', borderRadius: th.r,
                          background: i === 1 ? th.pri : th.ter + '30',
                          border: `1px solid ${i === 1 ? th.pri : th.brd}`,
                        }}>
                          <div style={{ fontSize: 6, color: i === 1 ? 'rgba(255,255,255,0.7)' : th.t3 }}>5月</div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: i === 1 ? '#fff' : th.t }}>{d}</div>
                          <div style={{ fontSize: 6, color: i === 1 ? 'rgba(255,255,255,0.7)' : th.t3 }}>週{['一', '二', '三', '四'][i]}</div>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <div style={{
                      padding: '14px', borderRadius: th.r, textAlign: 'center', fontSize: 11,
                      fontWeight: 500, letterSpacing: '0.08em', marginBottom: 20,
                      ...(btnStyle === 'solid' ? { background: th.pri, color: '#fff' } :
                        btnStyle === 'outline' ? { border: `2px solid ${th.pri}`, color: th.pri, background: 'transparent' } :
                        btnStyle === 'soft' ? { background: th.pri + '20', color: th.pri } :
                        { color: th.pri, background: 'transparent', textDecoration: 'underline' }),
                    }}>
                      確認並發送預約
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ background: dk ? 'rgba(0,0,0,0.4)' : '#1a1814', padding: '18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: th.pri, fontStyle: 'italic' }}>{brandName}</div>
                    <div style={{ fontSize: 7, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{brandSub}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Color swatches */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {[
              { label: 'Primary', color: th.pri },
              { label: 'Secondary', color: th.sec },
              { label: 'Tertiary', color: th.ter },
              { label: 'BG', color: th.bg },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: s.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                <div style={{ fontSize: 7, color: '#888', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
