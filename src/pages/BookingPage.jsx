// src/pages/BookingPage.jsx — 完整版（含動態主題設定）
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronUp, MessageCircle, Clock, User } from 'lucide-react';

/* ═══ 預設顏色（作為 fallback） ═══ */
const DEFAULTS = {
  primary_color: '#b0a08a',
  primary_dark: '#90806a',
  primary_light: '#c8b8a0',
  primary_bg: '#eae0d0',
  button_color: '#8a7c68',
  background_color: '#f4ede4',
  card_bg: '#faf6f0',
  text_color: '#3a3430',
};

const IB = '#f0e8dc';
const WDN = ['日','一','二','三','四','五','六'];
const ff = "'Noto Serif TC',serif";
const fp = "'Playfair Display',serif";
const fc = "'Cormorant Garamond',serif";

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

  // ★ 主題設定 state
  const [theme, setTheme] = useState(null);

  const r2 = useRef(null), r3 = useRef(null), r4 = useRef(null), r5 = useRef(null), r6 = useRef(null), rS = useRef(null);
  const refs = { 2: r2, 3: r3, 4: r4, 5: r5, 6: r6, 7: rS };

  // ★ 根據 theme 計算實際使用嘅顏色
  const C = useMemo(() => {
    const t = theme || {};
    const P = t.primary_color || DEFAULTS.primary_color;
    const PD = t.primary_dark || DEFAULTS.primary_dark;
    const PL = t.primary_light || DEFAULTS.primary_light;
    const PBG = t.primary_bg || DEFAULTS.primary_bg;
    const BTN = t.button_color || DEFAULTS.button_color;
    const BTNL = (t.button_color || DEFAULTS.button_color) + '99';
    const BG = t.background_color || DEFAULTS.background_color;
    const CD = t.card_bg || DEFAULTS.card_bg;
    const TX = t.text_color || DEFAULTS.text_color;
    // 衍生色（從主色計算）
    const CB = '#d8ccba';
    const DV = '#dcd4c8';
    const TM = '#6e6050';
    const TL = '#a09484';
    const TLL = '#c0b8aa';
    const DV_BG = '#e6e2dc';
    const DV_BD = '#c8c2b8';
    const DV_TX = '#74706a';
    const DA_BG = '#ece4d0';
    const DA_BD = '#ccc0a4';
    const DA_TX = '#7a7258';
    const DR_TX = '#785a50';
    return { P, PD, PL, PBG, BTN, BTNL, BG, CD, TX, CB, DV, TM, TL, TLL, DV_BG, DV_BD, DV_TX, DA_BG, DA_BD, DA_TX, DR_TX };
  }, [theme]);

  // ★ 品牌名稱等動態文字
  const brandName = theme?.brand_name || 'J.LAB';
  const brandSubtitle = theme?.brand_subtitle || 'LASH & BEAUTY STUDIO';
  const bookingTitle = theme?.booking_title || '線上預約系統';
  const successMessage = theme?.success_message || '預約已送出！';
  const footerNote = theme?.footer_note || '提交後我們將透過 WhatsApp 與您確認預約';

  // Load fonts
  useEffect(() => {
    if (!document.getElementById('p3f')) {
      const l = document.createElement('link');
      l.id = 'p3f';
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+TC:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap';
      document.head.appendChild(l);
    }
  }, []);

  // ★ Load initial data + theme settings
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
        if (thR.settings) setTheme(thR.settings);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

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

  const getDC = s => {
    if (s === 'few') return { bg: C.DA_BG, bd: C.DA_BD, tx: C.DA_TX };
    if (s === 'full') return { bg: '#e8e4dc', bd: C.CB, tx: C.TLL };
    return { bg: C.DV_BG, bd: C.DV_BD, tx: C.DV_TX };
  };
  const crd = (vis = true) => ({
    background: C.CD, borderRadius: 3, padding: '28px 22px', marginBottom: 18,
    border: `1px solid ${C.CB}`, boxShadow: '0 2px 16px rgba(0,0,0,0.03)',
    opacity: vis ? 1 : 0.4, pointerEvents: vis ? 'auto' : 'none', transition: 'opacity 0.3s'
  });

  if (loading) return (
    <div style={{ background: C.BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: fp, fontSize: '1.3rem', color: C.TM, marginBottom: 16, fontStyle: 'italic' }}>{brandName}</div>
        <div style={{ color: C.TL, fontSize: '0.8rem' }}>載入中...</div>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.BG, minHeight: '100vh', fontFamily: ff, color: C.TX, maxWidth: 480, margin: '0 auto', position: 'relative', fontWeight: 300 }}>

      {/* ═══ Header ═══ */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', position: 'sticky', top: 0, background: C.BG, zIndex: 10, borderBottom: `1px solid ${C.DV}` }}>
        <div style={{ fontFamily: fp, fontSize: '1.1rem', fontWeight: 500, color: C.TM, letterSpacing: '0.04em', fontStyle: 'italic' }}>{brandName}</div>
      </header>

      <div style={{ padding: '0 16px 60px' }}>

        {/* ═══ Title ═══ */}
        <div style={{ textAlign: 'center', padding: '36px 0 28px' }}>
          <div style={{ fontFamily: fc, fontSize: '0.58rem', letterSpacing: '0.3em', color: C.P, fontWeight: 400 }}>BOOKING</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 500, margin: '10px 0 6px', letterSpacing: '0.08em' }}>{bookingTitle}</div>
          <div style={{ fontFamily: fc, fontSize: '0.56rem', letterSpacing: '0.22em', color: C.TL, fontStyle: 'italic' }}>ONLINE BOOKING SYSTEM</div>
        </div>

        {/* ═══ Progress — 6 steps ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28, padding: '0 6px' }}>
          {[1, 2, 3, 4, 5, 6].map((n, i) => {
            const active = step >= n;
            return (
              <React.Fragment key={n}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: active ? C.P : 'transparent', border: `1.5px solid ${active ? C.P : C.CB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.44rem', fontFamily: fp, fontWeight: 500, color: active ? '#fff' : C.TLL, transition: 'all 0.3s' }}>
                  {active && step > n ? <Check size={9} strokeWidth={3} /> : n}
                </div>
                {i < 5 && <div style={{ flex: 1, height: 1, background: step > n ? C.PL : C.DV, transition: 'all 0.3s' }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ═══ Step 1: Service ═══ */}
        <div style={crd()}>
          <SH n="1" z="選擇預約項目" e="SELECT SERVICE" color={C.P} textLight={C.TL} />
          {services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.TL, fontSize: '0.76rem' }}>暫無可預約服務</div>
          ) : services.map(s => {
            const sel = sid === s.id;
            return (
              <div key={s.id} onClick={() => pick(s.id)}
                style={{ border: `1px solid ${sel ? C.P : C.CB}`, borderRadius: 3, padding: '18px 16px', marginBottom: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden', background: sel ? C.PBG : '#fff', transition: 'all 0.25s' }}>
                {s.category && <div style={{ position: 'absolute', top: 0, right: 0, background: C.P, color: '#fff', fontSize: '0.42rem', padding: '3px 10px', letterSpacing: '0.08em', fontWeight: 400, borderRadius: '0 2px 0 3px' }}>{s.category}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, paddingRight: s.category ? 50 : 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.5, flex: 1 }}>{s.name}</div>
                  <div style={{ fontFamily: fp, fontWeight: 500, color: C.TM, fontSize: '0.88rem', flexShrink: 0 }}>
                    {s.variants && s.variants.length > 0 ? `$${s.variants[0].price}起` : `$${s.base_price}`}
                  </div>
                </div>
                {s.description && <div style={{ fontSize: '0.66rem', color: C.TM, margin: '8px 0 4px', lineHeight: 1.7, fontWeight: 300 }}>{s.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
                  <Clock size={11} color={C.TL} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.56rem', color: C.TL, fontWeight: 300 }}>約 {s.duration_minutes || 60} 分鐘</span>
                </div>
                {s.variants && s.variants.length > 0 && sel && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {s.variants.map((v, idx) => {
                      const vs = (vi[s.id] || 0) === idx;
                      return (
                        <button key={v.id || idx} onClick={e => { e.stopPropagation(); setVi(p => ({ ...p, [s.id]: idx })); }}
                          style={{ padding: '8px 18px', borderRadius: 2, fontSize: '0.62rem', fontFamily: ff, fontWeight: vs ? 500 : 300, letterSpacing: '0.04em', border: `1px solid ${vs ? C.PD : C.CB}`, background: vs ? C.P : '#fff', color: vs ? '#fff' : C.TX, cursor: 'pointer', transition: 'all 0.2s' }}>
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
          <SH n="2" z="可選加購項目" e="OPTIONAL ADD-ONS" color={C.P} textLight={C.TL} />
          <div style={{ fontSize: '0.6rem', color: C.TL, marginBottom: 16, fontWeight: 300, lineHeight: 1.7 }}>可根據需要加選以下附加服務，非必選項目。</div>
          {addons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '10px 0', color: C.TL, fontSize: '0.68rem' }}>暫無附加項目</div>
          ) : addons.map(a => {
            const on = ao.includes(a.id);
            return (
              <div key={a.id} onClick={() => tao(a.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', border: `1px solid ${on ? C.PL : C.CB}`, borderRadius: 3, marginBottom: 10, cursor: 'pointer', background: on ? C.PBG : '#fff', transition: 'all 0.2s' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${on ? C.P : C.CB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: on ? C.P : 'transparent', transition: 'all 0.2s' }}>
                  {on && <Check size={11} color="#fff" strokeWidth={2.5} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: on ? 500 : 300 }}>{a.name}</div>
                  {a.description && <div style={{ fontSize: '0.58rem', color: C.TL, marginTop: 2 }}>{a.description}</div>}
                </div>
                <div style={{ fontFamily: fp, fontWeight: 500, color: C.TM, fontSize: '0.72rem' }}>+${a.price}</div>
              </div>
            );
          })}
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <span style={{ fontSize: '0.56rem', color: C.TL, fontWeight: 300 }}>已選 {ao.length} 項 {ao.length > 0 && <span style={{ fontFamily: fp }}>+${ap}</span>}</span>
          </div>
          {step === 2 && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={goStep3}
              style={{ width: '100%', padding: '14px', marginTop: 14, borderRadius: 3, border: 'none', background: C.BTN, color: '#fff', fontFamily: ff, fontSize: '0.72rem', cursor: 'pointer', fontWeight: 400, letterSpacing: '0.08em' }}>
              下一步：選擇技師 →
            </motion.button>
          )}
        </div>

        {/* ═══ Step 3: Technician ═══ */}
        <div ref={r3} style={crd(step >= 3)}>
          <SH n="3" z="選擇技師" e="SELECT TECHNICIAN" color={C.P} textLight={C.TL} />
          {/* 不指定 */}
          <div onClick={() => pickStaff('any', '不指定技師')}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 14px', border: `1px solid ${selStaff === 'any' ? C.P : C.CB}`, borderRadius: 3, marginBottom: 10, cursor: 'pointer', background: selStaff === 'any' ? C.PBG : '#fff', transition: 'all 0.2s' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: selStaff === 'any' ? C.P : C.DV_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${selStaff === 'any' ? C.PD : C.CB}` }}>
              <User size={16} color={selStaff === 'any' ? '#fff' : C.TL} strokeWidth={1.5} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: selStaff === 'any' ? 500 : 300 }}>不指定技師</div>
              <div style={{ fontSize: '0.54rem', color: C.TL, marginTop: 2 }}>系統自動安排可用技師</div>
            </div>
            {selStaff === 'any' && <Check size={16} color={C.P} strokeWidth={2} />}
          </div>
          {staffList.map(s => {
            const sel = selStaff === s.id;
            return (
              <div key={s.id} onClick={() => pickStaff(s.id, s.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 14px', border: `1px solid ${sel ? C.P : C.CB}`, borderRadius: 3, marginBottom: 10, cursor: 'pointer', background: sel ? C.PBG : '#fff', transition: 'all 0.2s' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: sel ? C.P : C.DV_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${sel ? C.PD : C.CB}`, fontFamily: fp, fontSize: '0.72rem', fontWeight: 500, color: sel ? '#fff' : C.TM }}>
                  {s.name?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: sel ? 500 : 300 }}>{s.name}</div>
                </div>
                {sel && <Check size={16} color={C.P} strokeWidth={2} />}
              </div>
            );
          })}
          {staffList.length === 0 && <div style={{ textAlign: 'center', padding: '10px 0', color: C.TL, fontSize: '0.68rem' }}>暫無可選技師</div>}
        </div>

        {/* ═══ Step 4: Date ═══ */}
        <div ref={r4} style={crd(step >= 4)}>
          <SH n="4" z="選擇日期" e="SELECT DATE" color={C.P} textLight={C.TL} />
          {selStaff && (
            <div style={{ fontSize: '0.58rem', color: C.P, marginBottom: 16, fontWeight: 400, background: C.PBG, padding: '10px 14px', borderRadius: 3, border: `1px solid ${C.PL}` }}>
              已選技師：{selStaffLabel}
            </div>
          )}
          {datesLoading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: C.TL, fontSize: '0.76rem' }}>載入可預約日期...</div>
          ) : availDates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.TL, fontSize: '0.72rem' }}>
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
                    style={{ textAlign: 'center', padding: '9px 4px', borderRadius: 3, cursor: 'pointer', background: sel ? C.P : c.bg, border: `1px solid ${sel ? C.PD : c.bd}`, transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '0.42rem', color: sel ? 'rgba(255,255,255,0.65)' : c.tx, letterSpacing: '0.03em' }}>{month}月</div>
                    <div style={{ fontFamily: fp, fontSize: '1.05rem', fontWeight: 500, color: sel ? '#fff' : C.TX, lineHeight: 1.4 }}>{day}</div>
                    <div style={{ fontSize: '0.38rem', color: sel ? 'rgba(255,255,255,0.65)' : c.tx }}>週{WDN[wd]}</div>
                    {d.status === 'few' && !sel && <div style={{ fontSize: '0.36rem', color: C.DA_TX, marginTop: 2 }}>僅剩</div>}
                  </motion.div>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['充裕', C.DV_BG, C.DV_BD], ['僅剩少量', C.DA_BG, C.DA_BD]].map(([l, bg, bd]) => (
              <span key={l} style={{ fontSize: '0.42rem', color: C.TL, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1px solid ${bd}`, display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* ═══ Step 5: Time ═══ */}
        <div ref={r5} style={crd(step >= 5)}>
          <SH n="5" z="選擇時段" e="SELECT TIME" color={C.P} textLight={C.TL} />
          {selDate && (
            <div style={{ fontSize: '0.58rem', color: C.P, marginBottom: 16, fontWeight: 400, background: C.PBG, padding: '10px 14px', borderRadius: 3, border: `1px solid ${C.PL}` }}>
              已選日期：<span style={{ fontFamily: fp }}>{selDate}</span>（週{WDN[dateWd]}）
            </div>
          )}
          {slotsLoading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: C.TL, fontSize: '0.76rem' }}>載入可用時段...</div>
          ) : timeSlots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: C.TL, fontSize: '0.72rem' }}>
              {selDate ? '此日期暫無可用時段' : '請先選擇日期'}
            </div>
          ) : (
            timeSlots.map(ss => (
              <div key={ss.staffId} style={{ marginBottom: 20 }}>
                {(selStaff === 'any' || timeSlots.length > 1) && (
                  <div style={{ fontSize: '0.62rem', color: C.TM, fontWeight: 500, marginBottom: 10, padding: '6px 10px', background: '#f5ede4', borderRadius: 3, border: `1px solid ${C.DV}` }}>
                    👤 {ss.staffName}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                  {ss.slots.map(t => {
                    const selected = selTime === t && bookStaffId === ss.staffId;
                    return (
                      <motion.div key={`${ss.staffId}-${t}`} whileTap={{ scale: 0.96 }}
                        onClick={() => pickTime(t, ss.staffId, ss.staffName)}
                        style={{ textAlign: 'center', padding: '13px 6px', borderRadius: 3, fontFamily: fc, fontSize: '0.88rem', letterSpacing: '0.06em', fontWeight: selected ? 500 : 400, border: `1px solid ${selected ? C.PD : C.CB}`, cursor: 'pointer', background: selected ? C.P : '#fff', color: selected ? '#fff' : C.TX, transition: 'all 0.2s' }}>
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
          <SH n="6" z="聯絡資料" e="CONTACT INFORMATION" color={C.P} textLight={C.TL} />
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.6rem', color: C.TL, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>您的姓名 <span style={{ color: C.DR_TX }}>*</span></div>
            <input value={nm} onChange={e => setNm(e.target.value)} placeholder="e.g. Miss Chan"
              style={{ width: '100%', padding: '13px 16px', borderRadius: 3, border: `1px solid ${C.CB}`, background: IB, fontSize: '0.76rem', fontFamily: ff, fontWeight: 300, outline: 'none', boxSizing: 'border-box', color: C.TX }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.6rem', color: C.TL, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>WhatsApp 電話 <span style={{ color: C.DR_TX }}>*</span></div>
            <input value={ph} onChange={e => setPh(e.target.value)} placeholder="e.g. 6000 0000" type="tel"
              style={{ width: '100%', padding: '13px 16px', borderRadius: 3, border: `1px solid ${C.CB}`, background: IB, fontSize: '0.76rem', fontFamily: ff, fontWeight: 300, outline: 'none', boxSizing: 'border-box', color: C.TX }} />
          </div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: '0.6rem', color: C.TL, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>備註（選填）</div>
            <textarea value={rk} onChange={e => setRk(e.target.value)} placeholder="如有特別需要，請在此處註明..." rows={3}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 3, border: `1px solid ${C.CB}`, background: IB, fontSize: '0.72rem', fontFamily: ff, fontWeight: 300, outline: 'none', boxSizing: 'border-box', color: C.TX, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
        </div>

        {/* ═══ Summary ═══ */}
        <div ref={rS} style={crd(step >= 6)}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontFamily: fc, fontSize: '0.54rem', letterSpacing: '0.24em', color: C.P, fontWeight: 400 }}>ORDER SUMMARY</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 500, marginTop: 6, letterSpacing: '0.06em' }}>預約摘要</div>
          </div>
          <div style={{ background: IB, borderRadius: 3, padding: '18px 16px', border: `1px solid ${C.DV}`, marginBottom: 18 }}>
            {/* Service */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.56rem', color: C.TL, fontWeight: 300, marginBottom: 4 }}>服務項目</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.5 }}>{sv ? sv.name : '尚未選擇'}</div>
                {sv?.variants?.length > 0 && <div style={{ fontSize: '0.58rem', color: C.TM, marginTop: 2 }}>{sv.variants[vi[sid] || 0]?.label}</div>}
              </div>
              <div style={{ fontFamily: fp, fontWeight: 500, fontSize: '0.82rem', flexShrink: 0, marginLeft: 10 }}>{sv ? `$${sp}` : '—'}</div>
            </div>
            {/* Addons */}
            {selAddons.length > 0 && (
              <div style={{ borderTop: `1px solid ${C.DV}`, paddingTop: 12, marginBottom: 12 }}>
                <div style={{ fontSize: '0.56rem', color: C.TL, fontWeight: 300, marginBottom: 8 }}>加購項目</div>
                {selAddons.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6, fontWeight: 300 }}>
                    <span>{a.name}</span><span style={{ fontFamily: fp, fontWeight: 500 }}>+${a.price}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Technician + Date + Time */}
            <div style={{ borderTop: `1px solid ${C.DV}`, paddingTop: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 8 }}>
                <span style={{ color: C.TL, fontWeight: 300 }}>技師</span>
                <span style={{ fontSize: '0.66rem' }}>{bookStaffName || selStaffLabel || '待分配'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 8 }}>
                <span style={{ color: C.TL, fontWeight: 300 }}>日期</span>
                <span style={{ fontFamily: fp, fontWeight: 500, color: selDate ? C.TX : C.P }}>
                  {selDate ? `${selDate}（週${WDN[dateWd]}）` : '尚未選擇'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                <span style={{ color: C.TL, fontWeight: 300 }}>時段</span>
                <span style={{ fontFamily: fp, fontWeight: 500, color: selTime ? C.TX : C.P }}>{selTime || '尚未選擇'}</span>
              </div>
            </div>
            {/* Contact */}
            <div style={{ borderTop: `1px solid ${C.DV}`, paddingTop: 12 }}>
              <div style={{ fontSize: '0.56rem', color: C.TL, fontWeight: 300, marginBottom: 8 }}>聯絡資料</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6 }}>
                <span style={{ color: C.TL, fontWeight: 300 }}>姓名</span><span style={{ fontWeight: 400 }}>{nm || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6 }}>
                <span style={{ color: C.TL, fontWeight: 300 }}>電話</span><span style={{ fontWeight: 400 }}>{ph || '—'}</span>
              </div>
              {rk && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                <span style={{ color: C.TL, fontWeight: 300 }}>備註</span>
                <span style={{ fontWeight: 300, maxWidth: '60%', textAlign: 'right', fontSize: '0.64rem' }}>{rk}</span>
              </div>}
            </div>
          </div>
          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '16px 0 6px', borderTop: `1.5px solid ${C.P}` }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 500, letterSpacing: '0.06em' }}>預計總額</div>
              <div style={{ fontFamily: fc, fontSize: '0.52rem', letterSpacing: '0.16em', color: C.TL, marginTop: 3, fontStyle: 'italic' }}>ESTIMATED TOTAL</div>
            </div>
            <div style={{ fontFamily: fp, fontSize: '1.7rem', fontWeight: 500, color: C.TX }}>${total}</div>
          </div>
        </div>

        {/* Error */}
        {submitError && <div style={{ padding: '12px 16px', background: '#fde8e8', border: '1px solid #e8b4b4', borderRadius: 3, marginBottom: 14, fontSize: '0.72rem', color: '#8a3030', textAlign: 'center' }}>❌ {submitError}</div>}

        {!canGo && step >= 6 && <div style={{ textAlign: 'center', fontSize: '0.58rem', color: C.DA_TX, marginBottom: 14, fontWeight: 300 }}>請確保已填寫所有必填項目（*）</div>}

        {/* Submit */}
        <motion.button whileTap={canGo && !submitLoading ? { scale: 0.97 } : {}} onClick={handleSubmit} disabled={!canGo || submitLoading}
          style={{ width: '100%', padding: '20px', borderRadius: 3, border: 'none', background: canGo ? (submitLoading ? C.BTNL : C.BTN) : C.DV, fontSize: '0.82rem', fontWeight: 400, fontFamily: ff, cursor: canGo && !submitLoading ? 'pointer' : 'not-allowed', color: canGo ? '#fff' : C.TLL, letterSpacing: '0.14em', marginBottom: 10, lineHeight: 2 }}>
          {submitLoading ? '提交中...' : '確認並發送預約'}<br />
          <span style={{ fontFamily: fc, fontSize: '0.54rem', fontWeight: 300, letterSpacing: '0.2em', fontStyle: 'italic', color: canGo ? 'rgba(255,255,255,0.7)' : C.TLL }}>CONFIRM & SEND BOOKING REQUEST</span>
        </motion.button>

        <div style={{ textAlign: 'center', fontSize: '0.48rem', color: C.TLL, lineHeight: 1.8, marginTop: 8, fontWeight: 300 }}>{footerNote}</div>
      </div>

      {/* ═══ Footer — 隱藏管理入口 ═══ */}
      <div style={{ background: '#1a1814', padding: '28px 22px', textAlign: 'center' }}>
        <div onClick={() => window.location.href = '/admin'}
          style={{ fontFamily: fp, fontSize: '0.9rem', fontWeight: 500, color: C.P, letterSpacing: '0.06em', fontStyle: 'italic', cursor: 'default' }}>{brandName}</div>
        <div style={{ fontFamily: fc, fontSize: '0.5rem', letterSpacing: '0.2em', color: '#665e52', marginTop: 8, fontStyle: 'italic' }}>{brandSubtitle}</div>
      </div>

      {/* ═══ Success Modal ═══ */}
      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(26,24,20,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setDone(false)}>
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 240 }}
              onClick={e => e.stopPropagation()}
              style={{ background: C.CD, borderRadius: 4, padding: '32px 24px', maxWidth: 360, width: '100%', textAlign: 'center', border: `1px solid ${C.CB}`, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: C.P, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Check size={22} color="#fff" strokeWidth={2} />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 500, marginBottom: 5, letterSpacing: '0.06em' }}>{successMessage}</div>
              <div style={{ fontFamily: fc, fontSize: '0.66rem', color: C.TL, marginBottom: 22, fontStyle: 'italic' }}>Booking request submitted successfully</div>
              <div style={{ background: IB, borderRadius: 3, padding: '16px', textAlign: 'left', fontSize: '0.66rem', color: C.TM, lineHeight: 2.2, marginBottom: 22, fontWeight: 300, border: `1px solid ${C.DV}` }}>
                <div><span style={{ fontWeight: 500 }}>服務：</span>{sv?.name}</div>
                {sv?.variants?.length > 0 && <div><span style={{ fontWeight: 500 }}>類型：</span>{sv.variants[vi[sid] || 0]?.label}</div>}
                {selAddons.length > 0 && <div><span style={{ fontWeight: 500 }}>加購：</span>{selAddons.map(a => a.name).join('、')}</div>}
                <div><span style={{ fontWeight: 500 }}>技師：</span>{bookStaffName || '待分配'}</div>
                <div><span style={{ fontWeight: 500 }}>日期：</span>{selDate}（週{WDN[dateWd]}）</div>
                <div><span style={{ fontWeight: 500 }}>時段：</span>{selTime}</div>
                <div style={{ borderTop: `1px solid ${C.DV}`, marginTop: 6, paddingTop: 6 }} />
                <div><span style={{ fontWeight: 500 }}>姓名：</span>{nm}</div>
                <div><span style={{ fontWeight: 500 }}>電話：</span>{ph}</div>
                {rk && <div><span style={{ fontWeight: 500 }}>備註：</span>{rk}</div>}
                <div style={{ borderTop: `1px solid ${C.DV}`, marginTop: 6, paddingTop: 6 }}>
                  <span style={{ fontWeight: 500 }}>總額：</span><span style={{ fontFamily: fp, fontSize: '1rem', fontWeight: 500 }}>${total}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.56rem', color: C.TL, marginBottom: 20, lineHeight: 1.7, fontWeight: 300 }}>我們將透過 WhatsApp 確認您的預約</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setDone(false); setSid(null); setAo([]); setSelStaff(null); setSelStaffLabel(''); setSelDate(null); setSelTime(null); setBookStaffId(null); setBookStaffName(''); setNm(''); setPh(''); setRk(''); setStep(1); setSubmitError(''); window.scrollTo({ top: 0 }); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 3, border: `1px solid ${C.CB}`, background: '#fff', fontSize: '0.68rem', fontFamily: ff, cursor: 'pointer', color: C.TM, fontWeight: 300 }}>再預約一次</button>
                <button onClick={() => {
                  let msg = `Hi ${brandName} 🌙\n\n我想確認預約：\n服務：${sv?.name}`;
                  if (sv?.variants?.length > 0) msg += `\n類型：${sv.variants[vi[sid] || 0]?.label}`;
                  if (selAddons.length) msg += `\n加購：${selAddons.map(a => a.name).join('、')}`;
                  msg += `\n技師：${bookStaffName || '待分配'}\n日期：${selDate}（週${WDN[dateWd]}）\n時段：${selTime}`;
                  msg += `\n姓名：${nm}\n電話：${ph}`;
                  if (rk) msg += `\n備註：${rk}`;
                  msg += `\n\n總額：$${total}\n\n請確認，謝謝！`;
                  // 如果有設定 WhatsApp 號碼，直接發送到店家
                  const waNumber = theme?.whatsapp_number || '';
                  const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                  window.open(waUrl, '_blank');
                }}
                  style={{ flex: 1, padding: '12px', borderRadius: 3, border: 'none', background: C.BTN, fontSize: '0.68rem', fontFamily: ff, cursor: 'pointer', color: '#fff', fontWeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, letterSpacing: '0.04em' }}>
                  <MessageCircle size={13} strokeWidth={1.5} />WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Scroll to top ═══ */}
      <motion.div whileTap={{ scale: 0.9 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ position: 'fixed', bottom: 24, right: 20, width: 38, height: 38, borderRadius: '50%', background: C.CD, border: `1px solid ${C.CB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 20 }}>
        <ChevronUp size={16} color={C.TM} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

/* ═══ Section Header Component ═══ */
function SH({ n, z, e, color, textLight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 3, height: 20, background: color || '#b0a08a', borderRadius: 1 }} />
      <span style={{ fontWeight: 500, fontSize: '0.92rem' }}><span style={{ fontFamily: "'Playfair Display',serif" }}>{n}.</span> {z}</span>
      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '0.58rem', letterSpacing: '0.12em', color: textLight || '#a09484', fontStyle: 'italic' }}>{e}</span>
    </div>
  );
}
