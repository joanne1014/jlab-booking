// src/pages/BookingPage.jsx — 完整版（使用 buildTheme 動態主題系統）
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronUp, MessageCircle, Clock, User } from 'lucide-react';
import { buildTheme, texCss, R, FS, FGRP } from '../themeConfig';

const WDN = ['日','一','二','三','四','五','六'];

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

// ═══ 動態載入 Google Font ═══
function loadFont(fontObj) {
  if (!fontObj || fontObj.id === 'sys') return;
  const id = `gf-${fontObj.id}`;
  if (document.getElementById(id)) return;
  // 建構 Google Fonts URL
  const familyMap = {
    'notosan': 'Noto+Sans+TC:wght@300;400;500;600',
    'notoser': 'Noto+Serif+TC:wght@300;400;500;600',
    'shippori': 'Shippori+Mincho:wght@400;500;600',
    'hina': 'Hina+Mincho',
    'kaisei': 'Kaisei+Decol:wght@400;700',
    'biz': 'BIZ+UDPMincho',
    'lxgw': 'LXGW+WenKai+TC:wght@300;400;700',
    'zcoolkl': 'ZCOOL+KuaiLe',
    'nunito': 'Nunito:wght@300;400;500;600',
    'mashan': 'Ma+Shan+Zheng',
    'zhimang': 'Zhi+Mang+Xing',
    'corm': 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400',
    'play': 'Playfair+Display:ital,wght@0,400;0,500;0,600;1,400',
    'lora': 'Lora:ital,wght@0,400;0,500;1,400',
    'cinzel': 'Cinzel:wght@400;500;600',
    'raleway': 'Raleway:wght@300;400;500;600',
    'jose': 'Josefin+Sans:wght@300;400;500',
    'mont': 'Montserrat:wght@300;400;500;600',
    'dm': 'DM+Sans:wght@300;400;500',
  };
  const family = familyMap[fontObj.id];
  if (!family) return;
  const l = document.createElement('link');
  l.id = id;
  l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(l);
}

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availDates, setAvailDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datesLoading, setDatesLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [sid, setSid] = useState(null);
  const [vi, setVi] = useState({});
  const [ao, setAo] = useState([]);
  const [selStaff, setSelStaff] = useState(null);
  const [selStaffLabel, setSelStaffLabel] = useState('');
  const [selDate, setSelDate] = useState(null);
  const [selTime, setSelTime] = useState(null);
  const [bookStaffId, setBookStaffId] = useState(null);
  const [bookStaffName, setBookStaffName] = useState('');
  const [nm, setNm] = useState('');
  const [ph, setPh] = useState('');
  const [rk, setRk] = useState('');
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(1);

  // ★ 主題設定
  const [themeSettings, setThemeSettings] = useState(null);

  const r2 = useRef(null), r3 = useRef(null), r4 = useRef(null), r5 = useRef(null), r6 = useRef(null), rS = useRef(null);
  const refs = { 2: r2, 3: r3, 4: r4, 5: r5, 6: r6, 7: rS };

  // ★ 用 buildTheme 建立完整主題
  const th = useMemo(() => buildTheme(themeSettings), [themeSettings]);

  // ★ 載入字體
  useEffect(() => {
    if (th.fnt) loadFont(th.fnt);
    // 額外載入 display font（如果主字體唔係 serif 類）
    const corm = FS.find(f => f.id === 'corm');
    const play = FS.find(f => f.id === 'play');
    if (corm) loadFont(corm);
    if (play) loadFont(play);
    // 中文 fallback
    const notoSer = FS.find(f => f.id === 'notoser');
    if (notoSer) loadFont(notoSer);
  }, [th.fnt]);

  // ★ 載入資料 + 主題設定
  useEffect(() => {
    (async () => {
      try {
        const [sR, aR, stR, thR] = await Promise.all([
          api('get-services'),
          api('get-addons'),
          api('get-staff'),
          api('get-frontend-settings').catch(() => ({ settings: null })),
        ]);
        setServices(sR.services || []);
        setAddons(aR.addons || []);
        setStaffList(stR.staff || []);
        if (thR.settings) setThemeSettings(thR.settings);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // ═══ Helper functions ═══
  const fetchDates = useCallback(async (staffId) => {
    setDatesLoading(true);
    setAvailDates([]);
    setSelDate(null);
    setSelTime(null);
    setTimeSlots([]);
    try {
      const r = await api('get-available-dates', { staffId: staffId === 'any' ? undefined : staffId });
      setAvailDates(r.dates || []);
    } catch (e) { console.error(e); }
    setDatesLoading(false);
  }, []);

  const fetchSlots = useCallback(async (date, staffId) => {
    setSlotsLoading(true);
    setTimeSlots([]);
    setSelTime(null);
    try {
      const r = await api('get-timeslots', { date, staffId: staffId === 'any' ? undefined : staffId });
      if (!r.blocked) setTimeSlots(r.slots || []);
    } catch (e) { console.error(e); }
    setSlotsLoading(false);
  }, []);

  const sv = services.find(s => s.id === sid);
  const sp = useMemo(() => {
    if (!sv) return 0;
    if (sv.variants && sv.variants.length > 0) return sv.variants[vi[sid] || 0]?.price || sv.base_price || 0;
    return sv.base_price || 0;
  }, [sv, vi, sid]);
  const selAddons = addons.filter(a => ao.includes(a.id));
  const ap = selAddons.reduce((s, a) => s + (a.price || 0), 0);
  const total = sp + ap;
  const canGo = sid !== null && selStaff && selDate && selTime && nm.trim() && ph.trim();
  const dateObj = selDate ? new Date(selDate + 'T00:00:00') : null;
  const dateWd = dateObj ? dateObj.getDay() : 0;

  const scrollTo = n => setTimeout(() => refs[n]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 280);
  const tao = id => setAo(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const pick = id => {
    setSid(id);
    setSelStaff(null); setSelStaffLabel(''); setSelDate(null); setSelTime(null);
    setAvailDates([]); setTimeSlots([]); setBookStaffId(null); setBookStaffName('');
    if (step < 2) setStep(2);
    scrollTo(2);
  };
  const goStep3 = () => { setStep(3); scrollTo(3); };
  const pickStaff = (id, name) => {
    setSelStaff(id); setSelStaffLabel(name);
    setSelDate(null); setSelTime(null); setTimeSlots([]);
    setBookStaffId(id === 'any' ? null : id); setBookStaffName(id === 'any' ? '' : name);
    fetchDates(id);
    if (step < 4) setStep(4);
    scrollTo(4);
  };
  const pickDate = date => {
    setSelDate(date); setSelTime(null);
    fetchSlots(date, selStaff);
    if (step < 5) setStep(5);
    scrollTo(5);
  };
  const pickTime = (time, staffId, staffName) => {
    setSelTime(time); setBookStaffId(staffId); setBookStaffName(staffName);
    if (step < 6) setStep(6);
    scrollTo(6);
  };

  const handleSubmit = async () => {
    if (!canGo || submitLoading) return;
    setSubmitLoading(true); setSubmitError('');
    try {
      await api('submit-booking', {
        serviceName: sv.name,
        variantLabel: sv?.variants?.length > 0 ? sv.variants[vi[sid] || 0]?.label : null,
        addonNames: selAddons.map(a => a.name),
        bookingDate: selDate, bookingTime: selTime,
        technicianLabel: bookStaffName || null, staffId: bookStaffId || null,
        customerName: nm.trim(), customerPhone: ph.trim(), notes: rk.trim() || null,
        totalPrice: total, durationMinutes: sv.duration_minutes || 60,
      });
      setDone(true);
    } catch (e) { setSubmitError(e.message || '提交失敗'); }
    setSubmitLoading(false);
  };

  // ═══ 主題衍生值 ═══
  const ff = th.f;                           // 主字體
  const fp = '"Playfair Display",serif';     // Display font
  const fc = '"Cormorant Garamond",serif';   // Accent font
  const radius = th.r;                       // 圓角值
  const pad = th.padScale;                   // 密度倍率
  const ls = th.lsMap;                       // 字距

  // 按鈕樣式
  const btnPrimary = (enabled = true) => {
    const base = { fontFamily: ff, fontSize: '0.82rem', fontWeight: 400, letterSpacing: ls, cursor: enabled ? 'pointer' : 'not-allowed', borderRadius: radius, transition: 'all 0.2s' };
    if (!enabled) return { ...base, background: th.ter, border: `1px solid ${th.brd}`, color: th.t3 };
    switch (th.btnStyle) {
      case 'outline': return { ...base, background: 'transparent', border: `2px solid ${th.pri}`, color: th.pri };
      case 'ghost': return { ...base, background: 'transparent', border: 'none', color: th.pri, textDecoration: 'underline' };
      default: return { ...base, background: th.pri, border: 'none', color: '#fff' };
    }
  };

  const btnSecondary = () => {
    switch (th.btnStyle) {
      case 'outline': return { background: 'transparent', border: `1.5px solid ${th.brd}`, color: th.t2 };
      case 'ghost': return { background: 'transparent', border: 'none', color: th.t2 };
      default: return { background: th.ter, border: `1px solid ${th.brd}`, color: th.t };
    }
  };

  // Divider
  const divider = () => {
    switch (th.dividerStyle) {
      case 'dots': return { borderTop: `2px dotted ${th.brd}` };
      case 'fade': return { height: 1, background: `linear-gradient(90deg, transparent, ${th.brd}, transparent)` };
      case 'none': return { border: 'none', height: 0 };
      default: return { borderTop: `1px solid ${th.brd2}` };
    }
  };

  // Card style
  const crd = (vis = true) => ({
    background: th.card,
    borderRadius: radius,
    padding: `${28 * pad}px ${22 * pad}px`,
    marginBottom: 18,
    border: `1px solid ${th.brd}`,
    boxShadow: th.sh,
    backdropFilter: th.blur || undefined,
    WebkitBackdropFilter: th.blur || undefined,
    opacity: vis ? 1 : 0.4,
    pointerEvents: vis ? 'auto' : 'none',
    transition: 'opacity 0.3s',
  });

  // Input style
  const inputStyle = {
    width: '100%', padding: `${13 * pad}px ${16 * pad}px`, borderRadius: radius,
    border: `1px solid ${th.brd}`, background: th.cardInner, fontSize: '0.76rem',
    fontFamily: ff, fontWeight: 300, outline: 'none', boxSizing: 'border-box',
    color: th.t, letterSpacing: ls,
  };

  // Date item colors
  const getDC = s => {
    if (s === 'few') return { bg: th.sec + '20', bd: th.sec + '60', tx: th.t2 };
    if (s === 'full') return { bg: th.ter + '30', bd: th.brd, tx: th.t3 };
    return { bg: th.ter + '15', bd: th.brd, tx: th.t2 };
  };

  // ═══ Background texture + image ═══
  const bgTexStyle = th.bgTex !== 'none' ? texCss(th.bgTex, th.bgTexOp) : {};

  // ═══ Loading ═══
  if (loading) return (
    <div style={{ background: th.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff, filter: th.colorFilter }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: fp, fontSize: '1.3rem', color: th.t2, marginBottom: 16, fontStyle: 'italic' }}>{th.brandName}</div>
        <div style={{ color: th.t3, fontSize: '0.8rem' }}>載入中...</div>
      </div>
    </div>
  );

  return (
    <div style={{ background: th.bg, minHeight: '100vh', fontFamily: ff, color: th.t, maxWidth: 480, margin: '0 auto', position: 'relative', fontWeight: 300, letterSpacing: ls, filter: th.colorFilter, ...bgTexStyle }}>

      {/* ═══ Background Image Layer ═══ */}
      {th.bgImg && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          <img src={th.bgImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: th.bgImgOp, filter: th.bgImgBlur ? `blur(${th.bgImgBlur}px)` : undefined }} />
        </div>
      )}

      {/* ═══ Content wrapper ═══ */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ═══ Header ═══ */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${14 * pad}px ${22 * pad}px`, position: 'sticky', top: 0, background: th.bg, zIndex: 10, borderBottom: `1px solid ${th.brd2}`, backdropFilter: th.bgImg ? 'blur(12px)' : undefined }}>
          <div style={{ fontFamily: fp, fontSize: '1.1rem', fontWeight: 500, color: th.t2, letterSpacing: '0.04em', fontStyle: 'italic' }}>{th.brandName}</div>
        </header>

        <div style={{ padding: `0 16px ${60 * pad}px` }}>

          {/* ═══ Title ═══ */}
          <div style={{ textAlign: 'center', padding: `${36 * pad}px 0 ${28 * pad}px` }}>
            <div style={{ fontFamily: fc, fontSize: '0.58rem', letterSpacing: '0.3em', color: th.pri, fontWeight: 400 }}>BOOKING</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 500, margin: '10px 0 6px', letterSpacing: '0.08em' }}>線上預約系統</div>
            <div style={{ fontFamily: fc, fontSize: '0.56rem', letterSpacing: '0.22em', color: th.t3, fontStyle: 'italic' }}>ONLINE BOOKING SYSTEM</div>
          </div>

          {/* ═══ Progress ═══ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28 * pad, padding: '0 6px' }}>
            {[1, 2, 3, 4, 5, 6].map((n, i) => {
              const active = step >= n;
              return (
                <React.Fragment key={n}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: active ? th.pri : 'transparent', border: `1.5px solid ${active ? th.pri : th.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.44rem', fontFamily: fp, fontWeight: 500, color: active ? '#fff' : th.t3, transition: 'all 0.3s' }}>
                    {active && step > n ? <Check size={9} strokeWidth={3} /> : n}
                  </div>
                  {i < 5 && <div style={{ flex: 1, height: 1, background: step > n ? th.sec : th.brd2, transition: 'all 0.3s' }} />}
                </React.Fragment>
              );
            })}
          </div>

          {/* ═══ Step 1: Service ═══ */}
          <div style={crd()}>
            <SH n="1" z="選擇預約項目" e="SELECT SERVICE" th={th} fp={fp} fc={fc} />
            {services.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: th.t3, fontSize: '0.76rem' }}>暫無可預約服務</div>
            ) : services.map(s => {
              const sel = sid === s.id;
              return (
                <div key={s.id} onClick={() => pick(s.id)}
                  style={{ border: `1px solid ${sel ? th.pri : th.brd}`, borderRadius: radius, padding: `${18 * pad}px ${16 * pad}px`, marginBottom: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden', background: sel ? (th.dk ? 'rgba(255,255,255,0.04)' : th.ter + '30') : (th.dk ? 'rgba(255,255,255,0.02)' : '#fff'), transition: 'all 0.25s' }}>
                  {s.category && <div style={{ position: 'absolute', top: 0, right: 0, background: th.pri, color: '#fff', fontSize: '0.42rem', padding: '3px 10px', letterSpacing: '0.08em', fontWeight: 400, borderRadius: `0 ${radius}px 0 ${radius}px` }}>{s.category}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, paddingRight: s.category ? 50 : 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.5, flex: 1 }}>{s.name}</div>
                    <div style={{ fontFamily: fp, fontWeight: 500, color: th.t2, fontSize: '0.88rem', flexShrink: 0 }}>
                      {s.variants && s.variants.length > 0 ? `$${s.variants[0].price}起` : `$${s.base_price}`}
                    </div>
                  </div>
                  {s.description && <div style={{ fontSize: '0.66rem', color: th.t2, margin: '8px 0 4px', lineHeight: 1.7, fontWeight: 300 }}>{s.description}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
                    <Clock size={11} color={th.t3} strokeWidth={1.5} />
                    <span style={{ fontSize: '0.56rem', color: th.t3, fontWeight: 300 }}>約 {s.duration_minutes || 60} 分鐘</span>
                  </div>
                  {s.variants && s.variants.length > 0 && sel && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      {s.variants.map((v, idx) => {
                        const vs = (vi[s.id] || 0) === idx;
                        return (
                          <button key={v.id || idx} onClick={e => { e.stopPropagation(); setVi(p => ({ ...p, [s.id]: idx })); }}
                            style={{ padding: '8px 18px', borderRadius: radius, fontSize: '0.62rem', fontFamily: ff, fontWeight: vs ? 500 : 300, letterSpacing: '0.04em', border: `1px solid ${vs ? th.pri : th.brd}`, background: vs ? th.pri : (th.dk ? 'rgba(255,255,255,0.03)' : '#fff'), color: vs ? '#fff' : th.t, cursor: 'pointer', transition: 'all 0.2s' }}>
                            {v.label} ${v.price}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══ Step 2: Add-ons ═══ */}
          <div ref={r2} style={crd(step >= 2)}>
            <SH n="2" z="可選加購項目" e="OPTIONAL ADD-ONS" th={th} fp={fp} fc={fc} />
            <div style={{ fontSize: '0.6rem', color: th.t3, marginBottom: 16, fontWeight: 300, lineHeight: 1.7 }}>可根據需要加選以下附加服務，非必選項目。</div>
            {addons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '10px 0', color: th.t3, fontSize: '0.68rem' }}>暫無附加項目</div>
            ) : addons.map(a => {
              const on = ao.includes(a.id);
              return (
                <div key={a.id} onClick={() => tao(a.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `${14 * pad}px ${14 * pad}px`, border: `1px solid ${on ? th.sec : th.brd}`, borderRadius: radius, marginBottom: 10, cursor: 'pointer', background: on ? (th.dk ? 'rgba(255,255,255,0.04)' : th.ter + '30') : (th.dk ? 'rgba(255,255,255,0.02)' : '#fff'), transition: 'all 0.2s' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${on ? th.pri : th.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: on ? th.pri : 'transparent', transition: 'all 0.2s' }}>
                    {on && <Check size={11} color="#fff" strokeWidth={2.5} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: on ? 500 : 300 }}>{a.name}</div>
                    {a.description && <div style={{ fontSize: '0.58rem', color: th.t3, marginTop: 2 }}>{a.description}</div>}
                  </div>
                  <div style={{ fontFamily: fp, fontWeight: 500, color: th.t2, fontSize: '0.72rem' }}>+${a.price}</div>
                </div>
              );
            })}
            <div style={{ textAlign: 'right', marginTop: 8 }}>
              <span style={{ fontSize: '0.56rem', color: th.t3, fontWeight: 300 }}>已選 {ao.length} 項 {ao.length > 0 && <span style={{ fontFamily: fp }}>+${ap}</span>}</span>
            </div>
            {step === 2 && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={goStep3}
                style={{ width: '100%', padding: `${14 * pad}px`, marginTop: 14, borderRadius: radius, ...btnPrimary(), fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                下一步：選擇技師 →
              </motion.button>
            )}
          </div>

          {/* ═══ Step 3: Technician ═══ */}
          <div ref={r3} style={crd(step >= 3)}>
            <SH n="3" z="選擇技師" e="SELECT TECHNICIAN" th={th} fp={fp} fc={fc} />
            {/* 不指定 */}
            <div onClick={() => pickStaff('any', '不指定技師')}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `${16 * pad}px ${14 * pad}px`, border: `1px solid ${selStaff === 'any' ? th.pri : th.brd}`, borderRadius: radius, marginBottom: 10, cursor: 'pointer', background: selStaff === 'any' ? (th.dk ? 'rgba(255,255,255,0.04)' : th.ter + '30') : (th.dk ? 'rgba(255,255,255,0.02)' : '#fff'), transition: 'all 0.2s' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: selStaff === 'any' ? th.pri : th.ter, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${selStaff === 'any' ? th.pri : th.brd}` }}>
                <User size={16} color={selStaff === 'any' ? '#fff' : th.t3} strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.76rem', fontWeight: selStaff === 'any' ? 500 : 300 }}>不指定技師</div>
                <div style={{ fontSize: '0.54rem', color: th.t3, marginTop: 2 }}>系統自動安排可用技師</div>
              </div>
              {selStaff === 'any' && <Check size={16} color={th.pri} strokeWidth={2} />}
            </div>
            {staffList.map(s => {
              const sel = selStaff === s.id;
              return (
                <div key={s.id} onClick={() => pickStaff(s.id, s.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `${16 * pad}px ${14 * pad}px`, border: `1px solid ${sel ? th.pri : th.brd}`, borderRadius: radius, marginBottom: 10, cursor: 'pointer', background: sel ? (th.dk ? 'rgba(255,255,255,0.04)' : th.ter + '30') : (th.dk ? 'rgba(255,255,255,0.02)' : '#fff'), transition: 'all 0.2s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: sel ? th.pri : th.ter, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${sel ? th.pri : th.brd}`, fontFamily: fp, fontSize: '0.72rem', fontWeight: 500, color: sel ? '#fff' : th.t2 }}>
                    {s.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: sel ? 500 : 300 }}>{s.name}</div>
                  </div>
                  {sel && <Check size={16} color={th.pri} strokeWidth={2} />}
                </div>
              );
            })}
            {staffList.length === 0 && <div style={{ textAlign: 'center', padding: '10px 0', color: th.t3, fontSize: '0.68rem' }}>暫無可選技師</div>}
          </div>

          {/* ═══ Step 4: Date ═══ */}
          <div ref={r4} style={crd(step >= 4)}>
            <SH n="4" z="選擇日期" e="SELECT DATE" th={th} fp={fp} fc={fc} />
            {selStaff && (
              <div style={{ fontSize: '0.58rem', color: th.pri, marginBottom: 16, fontWeight: 400, background: th.dk ? 'rgba(255,255,255,0.04)' : th.ter + '30', padding: `${10 * pad}px ${14 * pad}px`, borderRadius: radius, border: `1px solid ${th.sec}` }}>
                已選技師：{selStaffLabel}
              </div>
            )}
            {datesLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: th.t3, fontSize: '0.76rem' }}>載入可預約日期...</div>
            ) : availDates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: th.t3, fontSize: '0.72rem' }}>
                {selStaff ? '此技師暫無可預約日期' : '請先選擇技師'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
                {availDates.map(d => {
                  const sel = selDate === d.date;
                  const dO = new Date(d.date + 'T00:00:00');
                  const day = dO.getDate(), month = dO.getMonth() + 1, wd = dO.getDay();
                  const c = getDC(d.status);
                  return (
                    <motion.div key={d.date} whileTap={{ scale: 0.94 }} onClick={() => pickDate(d.date)}
                      style={{ textAlign: 'center', padding: `${9 * pad}px 4px`, borderRadius: radius, cursor: 'pointer', background: sel ? th.pri : c.bg, border: `1px solid ${sel ? th.pri : c.bd}`, transition: 'all 0.2s' }}>
                      <div style={{ fontSize: '0.42rem', color: sel ? 'rgba(255,255,255,0.65)' : c.tx, letterSpacing: '0.03em' }}>{month}月</div>
                      <div style={{ fontFamily: fp, fontSize: '1.05rem', fontWeight: 500, color: sel ? '#fff' : th.t, lineHeight: 1.4 }}>{day}</div>
                      <div style={{ fontSize: '0.38rem', color: sel ? 'rgba(255,255,255,0.65)' : c.tx }}>週{WDN[wd]}</div>
                      {d.status === 'few' && !sel && <div style={{ fontSize: '0.36rem', color: th.sec, marginTop: 2 }}>僅剩</div>}
                    </motion.div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: 14, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[['充裕', th.ter + '15', th.brd], ['僅剩少量', th.sec + '20', th.sec + '60']].map(([l, bg, bd]) => (
                <span key={l} style={{ fontSize: '0.42rem', color: th.t3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: radius > 6 ? 4 : 2, background: bg, border: `1px solid ${bd}`, display: 'inline-block' }} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* ═══ Step 5: Time ═══ */}
          <div ref={r5} style={crd(step >= 5)}>
            <SH n="5" z="選擇時段" e="SELECT TIME" th={th} fp={fp} fc={fc} />
            {selDate && (
              <div style={{ fontSize: '0.58rem', color: th.pri, marginBottom: 16, fontWeight: 400, background: th.dk ? 'rgba(255,255,255,0.04)' : th.ter + '30', padding: `${10 * pad}px ${14 * pad}px`, borderRadius: radius, border: `1px solid ${th.sec}` }}>
                已選日期：<span style={{ fontFamily: fp }}>{selDate}</span>（週{WDN[dateWd]}）
              </div>
            )}
            {slotsLoading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: th.t3, fontSize: '0.76rem' }}>載入可用時段...</div>
            ) : timeSlots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: th.t3, fontSize: '0.72rem' }}>
                {selDate ? '此日期暫無可用時段' : '請先選擇日期'}
              </div>
            ) : (
              timeSlots.map(ss => (
                <div key={ss.staffId} style={{ marginBottom: 20 }}>
                  {(selStaff === 'any' || timeSlots.length > 1) && (
                    <div style={{ fontSize: '0.62rem', color: th.t2, fontWeight: 500, marginBottom: 10, padding: `${6 * pad}px ${10 * pad}px`, background: th.cardInner, borderRadius: radius, border: `1px solid ${th.brd2}` }}>
                      👤 {ss.staffName}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                    {ss.slots.map(t => {
                      const selected = selTime === t && bookStaffId === ss.staffId;
                      return (
                        <motion.div key={`${ss.staffId}-${t}`} whileTap={{ scale: 0.96 }}
                          onClick={() => pickTime(t, ss.staffId, ss.staffName)}
                          style={{ textAlign: 'center', padding: `${13 * pad}px 6px`, borderRadius: radius, fontFamily: fc, fontSize: '0.88rem', letterSpacing: '0.06em', fontWeight: selected ? 500 : 400, border: `1px solid ${selected ? th.pri : th.brd}`, cursor: 'pointer', background: selected ? th.pri : (th.dk ? 'rgba(255,255,255,0.02)' : '#fff'), color: selected ? '#fff' : th.t, transition: 'all 0.2s' }}>
                          {t}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ═══ Step 6: Contact ═══ */}
          <div ref={r6} style={crd(step >= 6)}>
            <SH n="6" z="聯絡資料" e="CONTACT INFORMATION" th={th} fp={fp} fc={fc} />
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.6rem', color: th.t3, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>您的姓名 <span style={{ color: th.pri }}>*</span></div>
              <input value={nm} onChange={e => setNm(e.target.value)} placeholder="e.g. Miss Chan" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.6rem', color: th.t3, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>WhatsApp 電話 <span style={{ color: th.pri }}>*</span></div>
              <input value={ph} onChange={e => setPh(e.target.value)} placeholder="e.g. 6000 0000" type="tel" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: '0.6rem', color: th.t3, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>備註（選填）</div>
              <textarea value={rk} onChange={e => setRk(e.target.value)} placeholder="如有特別需要，請在此處註明..." rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          </div>

          {/* ═══ Summary ═══ */}
          <div ref={rS} style={crd(step >= 6)}>
            <div style={{ textAlign: 'center', marginBottom: 22 * pad }}>
              <div style={{ fontFamily: fc, fontSize: '0.54rem', letterSpacing: '0.24em', color: th.pri, fontWeight: 400 }}>ORDER SUMMARY</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 500, marginTop: 6, letterSpacing: '0.06em' }}>預約摘要</div>
            </div>
            <div style={{ background: th.cardInner, borderRadius: radius, padding: `${18 * pad}px ${16 * pad}px`, border: `1px solid ${th.brd2}`, marginBottom: 18 }}>
              {/* Service */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.56rem', color: th.t3, fontWeight: 300, marginBottom: 4 }}>服務項目</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.5 }}>{sv ? sv.name : '尚未選擇'}</div>
                  {sv?.variants?.length > 0 && <div style={{ fontSize: '0.58rem', color: th.t2, marginTop: 2 }}>{sv.variants[vi[sid] || 0]?.label}</div>}
                </div>
                <div style={{ fontFamily: fp, fontWeight: 500, fontSize: '0.82rem', flexShrink: 0, marginLeft: 10 }}>{sv ? `$${sp}` : '—'}</div>
              </div>
              {/* Addons */}
              {selAddons.length > 0 && (
                <div style={{ ...divider(), paddingTop: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: '0.56rem', color: th.t3, fontWeight: 300, marginBottom: 8, paddingTop: 12 }}>加購項目</div>
                  {selAddons.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6, fontWeight: 300 }}>
                      <span>{a.name}</span><span style={{ fontFamily: fp, fontWeight: 500 }}>+${a.price}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Technician + Date + Time */}
              <div style={{ ...divider(), paddingTop: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 8, paddingTop: 12 }}>
                  <span style={{ color: th.t3, fontWeight: 300 }}>技師</span>
                  <span style={{ fontSize: '0.66rem' }}>{bookStaffName || selStaffLabel || '待分配'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 8 }}>
                  <span style={{ color: th.t3, fontWeight: 300 }}>日期</span>
                  <span style={{ fontFamily: fp, fontWeight: 500, color: selDate ? th.t : th.pri }}>
                    {selDate ? `${selDate}（週${WDN[dateWd]}）` : '尚未選擇'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                  <span style={{ color: th.t3, fontWeight: 300 }}>時段</span>
                  <span style={{ fontFamily: fp, fontWeight: 500, color: selTime ? th.t : th.pri }}>{selTime || '尚未選擇'}</span>
                </div>
              </div>
              {/* Contact */}
              <div style={{ ...divider(), paddingTop: 12 }}>
                <div style={{ fontSize: '0.56rem', color: th.t3, fontWeight: 300, marginBottom: 8, paddingTop: 12 }}>聯絡資料</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6 }}>
                  <span style={{ color: th.t3, fontWeight: 300 }}>姓名</span><span style={{ fontWeight: 400 }}>{nm || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6 }}>
                  <span style={{ color: th.t3, fontWeight: 300 }}>電話</span><span style={{ fontWeight: 400 }}>{ph || '—'}</span>
                </div>
                {rk && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                  <span style={{ color: th.t3, fontWeight: 300 }}>備註</span>
                  <span style={{ fontWeight: 300, maxWidth: '60%', textAlign: 'right', fontSize: '0.64rem' }}>{rk}</span>
                </div>}
              </div>
            </div>
            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '16px 0 6px', borderTop: `1.5px solid ${th.pri}` }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 500, letterSpacing: '0.06em' }}>預計總額</div>
                <div style={{ fontFamily: fc, fontSize: '0.52rem', letterSpacing: '0.16em', color: th.t3, marginTop: 3, fontStyle: 'italic' }}>ESTIMATED TOTAL</div>
              </div>
              <div style={{ fontFamily: fp, fontSize: '1.7rem', fontWeight: 500, color: th.t }}>${total}</div>
            </div>
          </div>

          {/* Error */}
          {submitError && <div style={{ padding: '12px 16px', background: th.dk ? 'rgba(200,60,60,0.15)' : '#fde8e8', border: `1px solid ${th.dk ? 'rgba(200,60,60,0.4)' : '#e8b4b4'}`, borderRadius: radius, marginBottom: 14, fontSize: '0.72rem', color: th.dk ? '#ff9090' : '#8a3030', textAlign: 'center' }}>❌ {submitError}</div>}

          {!canGo && step >= 6 && <div style={{ textAlign: 'center', fontSize: '0.58rem', color: th.sec, marginBottom: 14, fontWeight: 300 }}>請確保已填寫所有必填項目（*）</div>}

          {/* Submit */}
          <motion.button whileTap={canGo && !submitLoading ? { scale: 0.97 } : {}} onClick={handleSubmit} disabled={!canGo || submitLoading}
            style={{ width: '100%', padding: `${20 * pad}px`, ...btnPrimary(canGo && !submitLoading), marginBottom: 10, lineHeight: 2 }}>
            {submitLoading ? '提交中...' : '確認並發送預約'}<br />
            <span style={{ fontFamily: fc, fontSize: '0.54rem', fontWeight: 300, letterSpacing: '0.2em', fontStyle: 'italic', opacity: 0.7 }}>CONFIRM & SEND BOOKING REQUEST</span>
          </motion.button>

          <div style={{ textAlign: 'center', fontSize: '0.48rem', color: th.t3, lineHeight: 1.8, marginTop: 8, fontWeight: 300 }}>提交後我們將透過 WhatsApp 與您確認預約</div>
        </div>

        {/* ═══ Footer ═══ */}
        <div style={{ background: th.dk ? 'rgba(0,0,0,0.3)' : '#1a1814', padding: '28px 22px', textAlign: 'center' }}>
          <div onClick={() => window.location.href = '/admin'}
            style={{ fontFamily: fp, fontSize: '0.9rem', fontWeight: 500, color: th.pri, letterSpacing: '0.06em', fontStyle: 'italic', cursor: 'default' }}>{th.brandName}</div>
          <div style={{ fontFamily: fc, fontSize: '0.5rem', letterSpacing: '0.2em', color: th.dk ? 'rgba(255,255,255,0.25)' : '#665e52', marginTop: 8, fontStyle: 'italic' }}>{th.brandSubtitle}</div>
        </div>

        {/* ═══ Success Modal ═══ */}
        <AnimatePresence>
          {done && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
              onClick={() => setDone(false)}>
              <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 240 }}
                onClick={e => e.stopPropagation()}
                style={{ background: th.dk ? th.bg : th.card, borderRadius: radius, padding: `${32 * pad}px ${24 * pad}px`, maxWidth: 360, width: '100%', textAlign: 'center', border: `1px solid ${th.brd}`, maxHeight: '90vh', overflowY: 'auto', boxShadow: th.sh2 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: th.pri, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                  <Check size={22} color="#fff" strokeWidth={2} />
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 500, marginBottom: 5, letterSpacing: '0.06em', color: th.t }}>預約已送出！</div>
                <div style={{ fontFamily: fc, fontSize: '0.66rem', color: th.t3, marginBottom: 22, fontStyle: 'italic' }}>Booking request submitted successfully</div>
                <div style={{ background: th.cardInner, borderRadius: radius, padding: '16px', textAlign: 'left', fontSize: '0.66rem', color: th.t2, lineHeight: 2.2, marginBottom: 22, fontWeight: 300, border: `1px solid ${th.brd2}` }}>
                  <div><span style={{ fontWeight: 500 }}>服務：</span>{sv?.name}</div>
                  {sv?.variants?.length > 0 && <div><span style={{ fontWeight: 500 }}>類型：</span>{sv.variants[vi[sid] || 0]?.label}</div>}
                  {selAddons.length > 0 && <div><span style={{ fontWeight: 500 }}>加購：</span>{selAddons.map(a => a.name).join('、')}</div>}
                  <div><span style={{ fontWeight: 500 }}>技師：</span>{bookStaffName || '待分配'}</div>
                  <div><span style={{ fontWeight: 500 }}>日期：</span>{selDate}（週{WDN[dateWd]}）</div>
                  <div><span style={{ fontWeight: 500 }}>時段：</span>{selTime}</div>
                  <div style={{ ...divider(), marginTop: 6, paddingTop: 6 }} />
                  <div style={{ paddingTop: 6 }}><span style={{ fontWeight: 500 }}>姓名：</span>{nm}</div>
                  <div><span style={{ fontWeight: 500 }}>電話：</span>{ph}</div>
                  {rk && <div><span style={{ fontWeight: 500 }}>備註：</span>{rk}</div>}
                  <div style={{ ...divider(), marginTop: 6, paddingTop: 6 }}>
                    <span style={{ fontWeight: 500, paddingTop: 6 }}>總額：</span><span style={{ fontFamily: fp, fontSize: '1rem', fontWeight: 500 }}>${total}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.56rem', color: th.t3, marginBottom: 20, lineHeight: 1.7, fontWeight: 300 }}>我們將透過 WhatsApp 確認您的預約</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => { setDone(false); setSid(null); setAo([]); setSelStaff(null); setSelStaffLabel(''); setSelDate(null); setSelTime(null); setBookStaffId(null); setBookStaffName(''); setNm(''); setPh(''); setRk(''); setStep(1); setSubmitError(''); window.scrollTo({ top: 0 }); }}
                    style={{ flex: 1, padding: '12px', borderRadius: radius, ...btnSecondary(), fontSize: '0.68rem', fontFamily: ff, cursor: 'pointer' }}>再預約一次</button>
                  <button onClick={() => {
                    let msg = `Hi ${th.brandName} 🌙\n\n我想確認預約：\n服務：${sv?.name}`;
                    if (sv?.variants?.length > 0) msg += `\n類型：${sv.variants[vi[sid] || 0]?.label}`;
                    if (selAddons.length) msg += `\n加購：${selAddons.map(a => a.name).join('、')}`;
                    msg += `\n技師：${bookStaffName || '待分配'}\n日期：${selDate}（週${WDN[dateWd]}）\n時段：${selTime}`;
                    msg += `\n姓名：${nm}\n電話：${ph}`;
                    if (rk) msg += `\n備註：${rk}`;
                    msg += `\n\n總額：$${total}\n\n請確認，謝謝！`;
                    const waNumber = themeSettings?.whatsapp_number || '';
                    const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                    window.open(waUrl, '_blank');
                  }}
                    style={{ flex: 1, padding: '12px', borderRadius: radius, ...btnPrimary(), fontSize: '0.68rem', fontFamily: ff, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, letterSpacing: '0.04em' }}>
                    <MessageCircle size={13} strokeWidth={1.5} />WhatsApp
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ Scroll to top ═══ */}
        <motion.div whileTap={{ scale: 0.9 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ position: 'fixed', bottom: 24, right: 20, width: 38, height: 38, borderRadius: '50%', background: th.card, border: `1px solid ${th.brd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: th.sh, zIndex: 20 }}>
          <ChevronUp size={16} color={th.t2} strokeWidth={1.5} />
        </motion.div>

      </div>
    </div>
  );
}

/* ═══ Section Header Component ═══ */
function SH({ n, z, e, th, fp, fc }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 3, height: 20, background: th.pri, borderRadius: 1 }} />
      <span style={{ fontWeight: 500, fontSize: '0.92rem', color: th.t }}><span style={{ fontFamily: fp }}>{n}.</span> {z}</span>
      <span style={{ fontFamily: fc, fontSize: '0.58rem', letterSpacing: '0.12em', color: th.t3, fontStyle: 'italic' }}>{e}</span>
    </div>
  );
}
