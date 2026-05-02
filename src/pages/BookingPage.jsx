import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronUp, MessageCircle, Clock, Loader2 } from 'lucide-react';

const P = '#b0a08a', PD = '#90806a', PL = '#c8b8a0', PBG = '#eae0d0';
const BTN = '#8a7c68', BTNL = '#a09484';
const BG = '#f4ede4', CD = '#faf6f0', CB = '#d8ccba', DV = '#dcd4c8';
const IB = '#f0e8dc';
const TX = '#3a3430', TM = '#6e6050', TL = '#a09484', TLL = '#c0b8aa';
const DV_BG = '#e6e2dc', DV_BD = '#c8c2b8', DV_TX = '#74706a';
const DA_BG = '#ece4d0', DA_BD = '#ccc0a4', DA_TX = '#7a7258';
const DR_TX = '#785a50';

const WDN = ['日','一','二','三','四','五','六'];
const ff = "'Noto Serif TC',serif";
const fp = "'Playfair Display',serif";
const fc = "'Cormorant Garamond',serif";

const api = async (action, payload = {}) => {
  const res = await fetch('/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
};

export default function BookingPage() {
  // ═══ Data from Supabase ═══
  const [services, setServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availDates, setAvailDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ═══ User selections ═══
  const [sid, setSid] = useState(null);
  const [vi, setVi] = useState({});
  const [ao, setAo] = useState([]);
  const [selDate, setSelDate] = useState(null);
  const [selTime, setSelTime] = useState(null);
  const [selStaffId, setSelStaffId] = useState(null);
  const [selStaffName, setSelStaffName] = useState(null);
  const [nm, setNm] = useState('');
  const [ph, setPh] = useState('');
  const [rk, setRk] = useState('');
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(1);

  const r2 = useRef(null), r3 = useRef(null), r4 = useRef(null), r5 = useRef(null), rS = useRef(null);
  const refs = { 2: r2, 3: r3, 4: r4, 5: r5, 6: rS };

  // ═══ Load fonts ═══
  useEffect(() => {
    if (!document.getElementById('p3f')) {
      const l = document.createElement('link'); l.id = 'p3f'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif+TC:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap';
      document.head.appendChild(l);
    }
  }, []);

  // ═══ Fetch initial data ═══
  useEffect(() => {
    const load = async () => {
      try {
        const [svcRes, addonRes, staffRes, dateRes] = await Promise.all([
          api('get-services'),
          api('get-addons'),
          api('get-staff'),
          api('get-available-dates'),
        ]);
        setServices(svcRes.services || []);
        setAddons(addonRes.addons || []);
        setStaffList(staffRes.staff || []);
        setAvailDates(dateRes.dates || []);
      } catch (e) {
        console.error('Failed to load booking data:', e);
      }
      setLoading(false);
    };
    load();
  }, []);

  // ═══ Fetch time slots when date changes ═══
  const fetchSlots = useCallback(async (date) => {
    if (!date) return;
    setSlotsLoading(true);
    setTimeSlots([]);
    setSelTime(null);
    setSelStaffId(null);
    setSelStaffName(null);
    try {
      const res = await api('get-timeslots', { date });
      if (res.blocked) {
        setTimeSlots([]);
      } else {
        setTimeSlots(res.slots || []);
      }
    } catch (e) {
      console.error('Failed to load slots:', e);
    }
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    if (selDate) fetchSlots(selDate);
  }, [selDate, fetchSlots]);

  // ═══ Computed values ═══
  const sv = services.find(s => s.id === sid);
  const sp = useMemo(() => {
    if (!sv) return 0;
    if (sv.variants && sv.variants.length > 0) {
      const idx = vi[sid] || 0;
      return sv.variants[idx]?.price || sv.base_price || 0;
    }
    return sv.base_price || 0;
  }, [sv, vi, sid]);

  const selAddons = addons.filter(a => ao.includes(a.id));
  const ap = selAddons.reduce((s, a) => s + (a.price || 0), 0);
  const total = sp + ap;
  const canGo = sid !== null && selDate && selTime && nm.trim() && ph.trim();

  const scrollTo = (n) => {
    setTimeout(() => refs[n]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 280);
  };

  const tao = id => setAo(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const pick = id => {
    setSid(id); setSelDate(null); setSelTime(null);
    if (step < 2) setStep(2);
    scrollTo(2);
  };

  const pickDate = date => {
    setSelDate(date);
    if (step < 3) setStep(3);
    scrollTo(3);
  };

  const pickTime = (time, staffId, staffName) => {
    setSelTime(time);
    setSelStaffId(staffId);
    setSelStaffName(staffName);
    if (step < 4) setStep(4);
    scrollTo(4);
  };

  // ═══ Submit booking ═══
  const handleSubmit = async () => {
    if (!canGo || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError('');

    try {
      const variantLabel = sv?.variants?.length > 0 ? sv.variants[vi[sid] || 0]?.label : null;
      const addonNames = selAddons.map(a => a.name);

      await api('submit-booking', {
        serviceName: sv.name,
        variantLabel,
        addonNames,
        bookingDate: selDate,
        bookingTime: selTime,
        technicianLabel: selStaffName || null,
        staffId: selStaffId || null,
        customerName: nm.trim(),
        customerPhone: ph.trim(),
        notes: rk.trim() || null,
        totalPrice: total,
        durationMinutes: sv.duration_minutes || 60,
      });

      setDone(true);
    } catch (e) {
      setSubmitError(e.message || '提交失敗，請稍後再試');
    }
    setSubmitLoading(false);
  };

  // ═══ Helpers ═══
  const getDC = s => {
    if (s === 'few') return { bg: DA_BG, bd: DA_BD, tx: DA_TX };
    if (s === 'full') return { bg: '#e8e4dc', bd: CB, tx: TLL };
    return { bg: DV_BG, bd: DV_BD, tx: DV_TX };
  };

  const dateObj = selDate ? new Date(selDate + 'T00:00:00') : null;
  const dateWd = dateObj ? dateObj.getDay() : 0;

  const crd = (vis = true) => ({
    background: CD, borderRadius: 3, padding: '28px 22px', marginBottom: 18,
    border: `1px solid ${CB}`, boxShadow: '0 2px 16px rgba(0,0,0,0.03)',
    opacity: vis ? 1 : 0.4, pointerEvents: vis ? 'auto' : 'none',
    transition: 'opacity 0.3s'
  });

  // ═══ Loading state ═══
  if (loading) {
    return (
      <div style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: fp, fontSize: '1.3rem', color: TM, marginBottom: 16, fontStyle: 'italic' }}>J.LAB</div>
          <div style={{ color: TL, fontSize: '0.8rem' }}>載入中...</div>
        </div>
      </div>
    );
  }

  // ═══ Render ═══
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: ff, color: TX, maxWidth: 480, margin: '0 auto', position: 'relative', fontWeight: 300 }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', position: 'sticky', top: 0, background: BG, zIndex: 10, borderBottom: `1px solid ${DV}` }}>
        <div style={{ fontFamily: fp, fontSize: '1.1rem', fontWeight: 500, color: TM, letterSpacing: '0.04em', fontStyle: 'italic' }}>J.LAB</div>
      </header>

      <div style={{ padding: '0 16px 60px' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', padding: '36px 0 28px' }}>
          <div style={{ fontFamily: fc, fontSize: '0.58rem', letterSpacing: '0.3em', color: P, fontWeight: 400 }}>BOOKING</div>
          <div style={{ fontSize: '1.3rem', fontWeight: 500, margin: '10px 0 6px', letterSpacing: '0.08em' }}>線上預約系統</div>
          <div style={{ fontFamily: fc, fontSize: '0.56rem', letterSpacing: '0.22em', color: TL, fontStyle: 'italic' }}>ONLINE BOOKING SYSTEM</div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 28, padding: '0 10px' }}>
          {[1, 2, 3, 4, 5].map((n, i) => {
            const active = step >= n;
            return (
              <React.Fragment key={n}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: active ? P : 'transparent', border: `1.5px solid ${active ? P : CB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.48rem', fontFamily: fp, fontWeight: 500, color: active ? '#fff' : TLL, transition: 'all 0.3s' }}>
                  {active && step > n ? <Check size={10} strokeWidth={3} /> : n}
                </div>
                {i < 4 && <div style={{ flex: 1, height: 1, background: step > n ? PL : DV, transition: 'all 0.3s' }} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* ═══ Step 1: Service ═══ */}
        <div style={crd()}>
          <SH n="1" z="選擇預約項目" e="SELECT SERVICE" />
          {services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: TL, fontSize: '0.76rem' }}>暫無可預約服務</div>
          ) : services.map(s => {
            const sel = sid === s.id;
            return (
              <div key={s.id} onClick={() => pick(s.id)}
                style={{ border: `1px solid ${sel ? P : CB}`, borderRadius: 3, padding: '18px 16px', marginBottom: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden', background: sel ? PBG : '#fff', transition: 'all 0.25s' }}>
                {s.category && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: P, color: '#fff', fontSize: '0.42rem', padding: '3px 10px', letterSpacing: '0.08em', fontWeight: 400, borderRadius: '0 2px 0 3px' }}>{s.category}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, paddingRight: s.category ? 50 : 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.5, flex: 1 }}>{s.name}</div>
                  <div style={{ fontFamily: fp, fontWeight: 500, color: TM, fontSize: '0.88rem', flexShrink: 0 }}>
                    {s.variants && s.variants.length > 0 ? `$${s.variants[0].price}起` : `$${s.base_price}`}
                  </div>
                </div>
                {s.description && <div style={{ fontSize: '0.66rem', color: TM, margin: '8px 0 4px', lineHeight: 1.7, fontWeight: 300 }}>{s.description}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
                  <Clock size={11} color={TL} strokeWidth={1.5} />
                  <span style={{ fontSize: '0.56rem', color: TL, fontWeight: 300 }}>約 {s.duration_minutes || 60} 分鐘</span>
                </div>
                {/* Variants */}
                {s.variants && s.variants.length > 0 && sel && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {s.variants.map((v, idx) => {
                      const vs = (vi[s.id] || 0) === idx;
                      return (
                        <button key={v.id || idx} onClick={e => { e.stopPropagation(); setVi(p => ({ ...p, [s.id]: idx })); }}
                          style={{ padding: '8px 18px', borderRadius: 2, fontSize: '0.62rem', fontFamily: ff, fontWeight: vs ? 500 : 300, letterSpacing: '0.04em', border: `1px solid ${vs ? PD : CB}`, background: vs ? P : '#fff', color: vs ? '#fff' : TX, cursor: 'pointer', transition: 'all 0.2s' }}>
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
          <SH n="2" z="可選加購項目" e="OPTIONAL ADD-ONS" />
          <div style={{ fontSize: '0.6rem', color: TL, marginBottom: 16, fontWeight: 300, lineHeight: 1.7 }}>
            可根據需要加選以下附加服務，非必選項目。</div>
          {addons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '10px 0', color: TL, fontSize: '0.68rem' }}>暫無附加項目</div>
          ) : addons.map(a => {
            const on = ao.includes(a.id);
            return (
              <div key={a.id} onClick={() => tao(a.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', border: `1px solid ${on ? PL : CB}`, borderRadius: 3, marginBottom: 10, cursor: 'pointer', background: on ? PBG : '#fff', transition: 'all 0.2s' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `1.5px solid ${on ? P : CB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: on ? P : 'transparent', transition: 'all 0.2s' }}>
                  {on && <Check size={11} color="#fff" strokeWidth={2.5} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: on ? 500 : 300 }}>{a.name}</div>
                  {a.description && <div style={{ fontSize: '0.58rem', color: TL, marginTop: 2 }}>{a.description}</div>}
                </div>
                <div style={{ fontFamily: fp, fontWeight: 500, color: TM, fontSize: '0.72rem' }}>+${a.price}</div>
              </div>
            );
          })}
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <span style={{ fontSize: '0.56rem', color: TL, fontWeight: 300 }}>
              已選 {ao.length} 項 {ao.length > 0 && <span style={{ fontFamily: fp }}>+${ap}</span>}
            </span>
          </div>
        </div>

        {/* ═══ Step 3: Date ═══ */}
        <div ref={r3} style={crd(step >= 2)}>
          <SH n="3" z="選擇日期" e="SELECT DATE" />
          {sid !== null && <div style={{ fontSize: '0.58rem', color: P, marginBottom: 16, fontWeight: 400, background: PBG, padding: '10px 14px', borderRadius: 3, border: `1px solid ${PL}` }}>
            已選服務：{sv?.name} {sv?.variants?.length > 0 && <span style={{ fontFamily: fp }}>({sv.variants[vi[sid] || 0]?.label})</span>}
          </div>}
          {availDates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: TL, fontSize: '0.72rem' }}>暫無可預約日期，請稍後再試</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
              {availDates.map(d => {
                const sel = selDate === d.date;
                const dateObj2 = new Date(d.date + 'T00:00:00');
                const day = dateObj2.getDate();
                const month = dateObj2.getMonth() + 1;
                const wd = dateObj2.getDay();
                const c = getDC(d.status);
                return (
                  <motion.div key={d.date} whileTap={{ scale: 0.94 }}
                    onClick={() => pickDate(d.date)}
                    style={{ textAlign: 'center', padding: '9px 4px', borderRadius: 3, cursor: 'pointer', background: sel ? P : c.bg, border: `1px solid ${sel ? PD : c.bd}`, transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '0.42rem', color: sel ? 'rgba(255,255,255,0.65)' : c.tx, letterSpacing: '0.03em' }}>{month}月</div>
                    <div style={{ fontFamily: fp, fontSize: '1.05rem', fontWeight: 500, color: sel ? '#fff' : TX, lineHeight: 1.4 }}>{day}</div>
                    <div style={{ fontSize: '0.38rem', color: sel ? 'rgba(255,255,255,0.65)' : c.tx }}>週{WDN[wd]}</div>
                    {d.status === 'few' && !sel && <div style={{ fontSize: '0.36rem', color: DA_TX, marginTop: 2 }}>僅剩</div>}
                  </motion.div>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 14, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['充裕', DV_BG, DV_BD], ['僅剩少量', DA_BG, DA_BD]].map(([l, bg, bd]) => (
              <span key={l} style={{ fontSize: '0.42rem', color: TL, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1px solid ${bd}`, display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* ═══ Step 4: Time + Staff ═══ */}
        <div ref={r4} style={crd(step >= 3)}>
          <SH n="4" z="選擇時段及技師" e="SELECT TIME & STAFF" />
          {selDate && (
            <div style={{ fontSize: '0.58rem', color: P, marginBottom: 16, fontWeight: 400, background: PBG, padding: '10px 14px', borderRadius: 3, border: `1px solid ${PL}` }}>
              已選日期：<span style={{ fontFamily: fp }}>{selDate}</span>（週{WDN[dateWd]}）
            </div>
          )}
          {slotsLoading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: TL }}>
              <div style={{ fontSize: '0.76rem' }}>載入可用時段...</div>
            </div>
          ) : timeSlots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: TL, fontSize: '0.72rem' }}>
              {selDate ? '此日期暫無可用時段' : '請先選擇日期'}
            </div>
          ) : (
            timeSlots.map(staffSlot => (
              <div key={staffSlot.staffId} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.62rem', color: TM, fontWeight: 500, marginBottom: 10, padding: '6px 10px', background: '#f5ede4', borderRadius: 3, border: `1px solid ${DV}` }}>
                  👤 {staffSlot.staffName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                  {staffSlot.slots.map(t => {
                    const sel = selTime === t && selStaffId === staffSlot.staffId;
                    return (
                      <motion.div key={`${staffSlot.staffId}-${t}`} whileTap={{ scale: 0.96 }}
                        onClick={() => pickTime(t, staffSlot.staffId, staffSlot.staffName)}
                        style={{ textAlign: 'center', padding: '13px 6px', borderRadius: 3, fontFamily: fc, fontSize: '0.88rem', letterSpacing: '0.06em', fontWeight: sel ? 500 : 400, border: `1px solid ${sel ? PD : CB}`, cursor: 'pointer', background: sel ? P : '#fff', color: sel ? '#fff' : TX, transition: 'all 0.2s' }}>
                        {t}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ═══ Step 5: Contact ═══ */}
        <div ref={r5} style={crd(step >= 4)}>
          <SH n="5" z="聯絡資料" e="CONTACT INFORMATION" />
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.6rem', color: TL, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>
              您的姓名 <span style={{ color: DR_TX }}>*</span>
            </div>
            <input value={nm} onChange={e => setNm(e.target.value)} placeholder="e.g. Miss Chan"
              style={{ width: '100%', padding: '13px 16px', borderRadius: 3, border: `1px solid ${CB}`, background: IB, fontSize: '0.76rem', fontFamily: ff, fontWeight: 300, outline: 'none', boxSizing: 'border-box', color: TX }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: '0.6rem', color: TL, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>
              WhatsApp 電話 <span style={{ color: DR_TX }}>*</span>
            </div>
            <input value={ph} onChange={e => setPh(e.target.value)} placeholder="e.g. 6000 0000" type="tel"
              style={{ width: '100%', padding: '13px 16px', borderRadius: 3, border: `1px solid ${CB}`, background: IB, fontSize: '0.76rem', fontFamily: ff, fontWeight: 300, outline: 'none', boxSizing: 'border-box', color: TX }} />
          </div>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: '0.6rem', color: TL, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 300 }}>
              備註（選填）
            </div>
            <textarea value={rk} onChange={e => setRk(e.target.value)}
              placeholder="如有特別需要，請在此處註明..."
              rows={3}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 3, border: `1px solid ${CB}`, background: IB, fontSize: '0.72rem', fontFamily: ff, fontWeight: 300, outline: 'none', boxSizing: 'border-box', color: TX, resize: 'vertical', lineHeight: 1.6 }} />
          </div>
          {nm.trim() && ph.trim() && step < 5 && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (step < 5) setStep(5); scrollTo(6); }}
              style={{ width: '100%', padding: '14px', marginTop: 14, borderRadius: 3, border: 'none', background: BTN, color: '#fff', fontFamily: ff, fontSize: '0.72rem', cursor: 'pointer', fontWeight: 400, letterSpacing: '0.08em' }}>
              查看摘要 →
            </motion.button>
          )}
        </div>

        {/* ═══ Summary ═══ */}
        <div ref={rS} style={crd(step >= 5)}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontFamily: fc, fontSize: '0.54rem', letterSpacing: '0.24em', color: P, fontWeight: 400 }}>ORDER SUMMARY</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 500, marginTop: 6, letterSpacing: '0.06em' }}>預約摘要</div>
          </div>

          <div style={{ background: IB, borderRadius: 3, padding: '18px 16px', border: `1px solid ${DV}`, marginBottom: 18 }}>
            {/* Service */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.56rem', color: TL, fontWeight: 300, marginBottom: 4 }}>服務項目</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.5 }}>{sv ? sv.name : '尚未選擇'}</div>
                {sv?.variants?.length > 0 && <div style={{ fontSize: '0.58rem', color: TM, marginTop: 2 }}>{sv.variants[vi[sid] || 0]?.label}</div>}
              </div>
              <div style={{ fontFamily: fp, fontWeight: 500, fontSize: '0.82rem', flexShrink: 0, marginLeft: 10 }}>{sv ? `$${sp}` : '—'}</div>
            </div>

            {/* Add-ons */}
            {selAddons.length > 0 && (
              <div style={{ borderTop: `1px solid ${DV}`, paddingTop: 12, marginBottom: 12 }}>
                <div style={{ fontSize: '0.56rem', color: TL, fontWeight: 300, marginBottom: 8 }}>加購項目</div>
                {selAddons.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6, fontWeight: 300 }}>
                    <span>{a.name}</span>
                    <span style={{ fontFamily: fp, fontWeight: 500 }}>+${a.price}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Date & Time */}
            <div style={{ borderTop: `1px solid ${DV}`, paddingTop: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 8 }}>
                <span style={{ color: TL, fontWeight: 300 }}>日期</span>
                <span style={{ fontFamily: fp, fontWeight: 500, color: selDate ? TX : P }}>
                  {selDate ? `${selDate}（週${WDN[dateWd]}）` : '尚未選擇'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 8 }}>
                <span style={{ color: TL, fontWeight: 300 }}>時段</span>
                <span style={{ fontFamily: fp, fontWeight: 500, color: selTime ? TX : P }}>{selTime || '尚未選擇'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                <span style={{ color: TL, fontWeight: 300 }}>技師</span>
                <span style={{ fontSize: '0.66rem' }}>{selStaffName || '待分配'}</span>
              </div>
            </div>

            {/* Contact */}
            <div style={{ borderTop: `1px solid ${DV}`, paddingTop: 12 }}>
              <div style={{ fontSize: '0.56rem', color: TL, fontWeight: 300, marginBottom: 8 }}>聯絡資料</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6 }}>
                <span style={{ color: TL, fontWeight: 300 }}>姓名</span>
                <span style={{ fontWeight: 400 }}>{nm || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: 6 }}>
                <span style={{ color: TL, fontWeight: 300 }}>電話</span>
                <span style={{ fontWeight: 400 }}>{ph || '—'}</span>
              </div>
              {rk && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem' }}>
                <span style={{ color: TL, fontWeight: 300 }}>備註</span>
                <span style={{ fontWeight: 300, maxWidth: '60%', textAlign: 'right', fontSize: '0.64rem' }}>{rk}</span>
              </div>}
            </div>
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '16px 0 6px', borderTop: `1.5px solid ${P}` }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 500, letterSpacing: '0.06em' }}>預計總額</div>
              <div style={{ fontFamily: fc, fontSize: '0.52rem', letterSpacing: '0.16em', color: TL, marginTop: 3, fontStyle: 'italic' }}>ESTIMATED TOTAL</div>
            </div>
            <div style={{ fontFamily: fp, fontSize: '1.7rem', fontWeight: 500, color: TX }}>${total}</div>
          </div>
        </div>

        {/* Error */}
        {submitError && (
          <div style={{ padding: '12px 16px', background: '#fde8e8', border: '1px solid #e8b4b4', borderRadius: 3, marginBottom: 14, fontSize: '0.72rem', color: '#8a3030', textAlign: 'center' }}>
            ❌ {submitError}
          </div>
        )}

        {/* Missing fields hint */}
        {!canGo && step >= 5 && (
          <div style={{ textAlign: 'center', fontSize: '0.58rem', color: DA_TX, marginBottom: 14, fontWeight: 300 }}>
            請確保已填寫所有必填項目（*）
          </div>
        )}

        {/* Submit Button */}
        <motion.button whileTap={canGo && !submitLoading ? { scale: 0.97 } : {}}
          onClick={handleSubmit}
          disabled={!canGo || submitLoading}
          style={{ width: '100%', padding: '20px', borderRadius: 3, border: 'none', background: canGo ? (submitLoading ? BTNL : BTN) : DV, fontSize: '0.82rem', fontWeight: 400, fontFamily: ff, cursor: canGo && !submitLoading ? 'pointer' : 'not-allowed', color: canGo ? '#fff' : TLL, letterSpacing: '0.14em', marginBottom: 10, lineHeight: 2 }}>
          {submitLoading ? '提交中...' : '確認並發送預約'}
          <br />
          <span style={{ fontFamily: fc, fontSize: '0.54rem', fontWeight: 300, letterSpacing: '0.2em', fontStyle: 'italic', color: canGo ? 'rgba(255,255,255,0.7)' : TLL }}>
            CONFIRM & SEND BOOKING REQUEST</span>
        </motion.button>

        <div style={{ textAlign: 'center', fontSize: '0.48rem', color: TLL, lineHeight: 1.8, marginTop: 8, fontWeight: 300 }}>
          提交後我們將透過 WhatsApp 與您確認預約
        </div>
      </div>

      {/* Footer — 隱藏管理入口 */}
      <div style={{ background: '#1a1814', padding: '28px 22px', textAlign: 'center' }}>
        <div onClick={() => window.location.href = '/admin'}
          style={{ fontFamily: fp, fontSize: '0.9rem', fontWeight: 500, color: P, letterSpacing: '0.06em', fontStyle: 'italic', cursor: 'default' }}>J.LAB</div>
        <div style={{ fontFamily: fc, fontSize: '0.5rem', letterSpacing: '0.2em', color: '#665e52', marginTop: 8, fontStyle: 'italic' }}>LASH & BEAUTY STUDIO</div>
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
              style={{ background: CD, borderRadius: 4, padding: '32px 24px', maxWidth: 360, width: '100%', textAlign: 'center', border: `1px solid ${CB}`, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: P, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <Check size={22} color="#fff" strokeWidth={2} />
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 500, marginBottom: 5, letterSpacing: '0.06em' }}>預約已送出！</div>
              <div style={{ fontFamily: fc, fontSize: '0.66rem', color: TL, marginBottom: 22, fontStyle: 'italic' }}>Booking request submitted successfully</div>

              <div style={{ background: IB, borderRadius: 3, padding: '16px', textAlign: 'left', fontSize: '0.66rem', color: TM, lineHeight: 2.2, marginBottom: 22, fontWeight: 300, border: `1px solid ${DV}` }}>
                <div><span style={{ fontWeight: 500 }}>服務：</span>{sv?.name}</div>
                {sv?.variants?.length > 0 && <div><span style={{ fontWeight: 500 }}>類型：</span>{sv.variants[vi[sid] || 0]?.label}</div>}
                {selAddons.length > 0 && <div><span style={{ fontWeight: 500 }}>加購：</span>{selAddons.map(a => a.name).join('、')}</div>}
                <div><span style={{ fontWeight: 500 }}>日期：</span>{selDate}（週{WDN[dateWd]}）</div>
                <div><span style={{ fontWeight: 500 }}>時段：</span>{selTime}</div>
                <div><span style={{ fontWeight: 500 }}>技師：</span>{selStaffName || '待分配'}</div>
                <div style={{ borderTop: `1px solid ${DV}`, marginTop: 6, paddingTop: 6 }} />
                <div><span style={{ fontWeight: 500 }}>姓名：</span>{nm}</div>
                <div><span style={{ fontWeight: 500 }}>電話：</span>{ph}</div>
                {rk && <div><span style={{ fontWeight: 500 }}>備註：</span>{rk}</div>}
                <div style={{ borderTop: `1px solid ${DV}`, marginTop: 6, paddingTop: 6 }}>
                  <span style={{ fontWeight: 500 }}>總額：</span>
                  <span style={{ fontFamily: fp, fontSize: '1rem', fontWeight: 500 }}>${total}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.56rem', color: TL, marginBottom: 20, lineHeight: 1.7, fontWeight: 300 }}>
                我們將透過 WhatsApp 確認您的預約
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setDone(false); setSid(null); setAo([]); setSelDate(null); setSelTime(null); setNm(''); setPh(''); setRk(''); setStep(1); setSubmitError(''); window.scrollTo({ top: 0 }); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 3, border: `1px solid ${CB}`, background: '#fff', fontSize: '0.68rem', fontFamily: ff, cursor: 'pointer', color: TM, fontWeight: 300 }}>
                  再預約一次</button>
                <button onClick={() => {
                  let msg = `Hi J.Lab 🌙\n\n我想確認預約：\n服務：${sv?.name}`;
                  if (sv?.variants?.length > 0) msg += `\n類型：${sv.variants[vi[sid] || 0]?.label}`;
                  if (selAddons.length) msg += `\n加購：${selAddons.map(a => a.name).join('、')}`;
                  msg += `\n日期：${selDate}（週${WDN[dateWd]}）\n時段：${selTime}\n技師：${selStaffName || '待分配'}`;
                  msg += `\n姓名：${nm}\n電話：${ph}`;
                  if (rk) msg += `\n備註：${rk}`;
                  msg += `\n\n總額：$${total}\n\n請確認，謝謝！`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                  style={{ flex: 1, padding: '12px', borderRadius: 3, border: 'none', background: BTN, fontSize: '0.68rem', fontFamily: ff, cursor: 'pointer', color: '#fff', fontWeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, letterSpacing: '0.04em' }}>
                  <MessageCircle size={13} strokeWidth={1.5} />WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top */}
      <motion.div whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ position: 'fixed', bottom: 24, right: 20, width: 38, height: 38, borderRadius: '50%', background: CD, border: `1px solid ${CB}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', zIndex: 20 }}>
        <ChevronUp size={16} color={TM} strokeWidth={1.5} />
      </motion.div>
    </div>
  );
}

function SH({ n, z, e }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{ width: 3, height: 20, background: P, borderRadius: 1 }} />
      <span style={{ fontWeight: 500, fontSize: '0.92rem' }}>
        <span style={{ fontFamily: fp }}>{n}.</span> {z}</span>
      <span style={{ fontFamily: fc, fontSize: '0.58rem', letterSpacing: '0.12em', color: TL, fontStyle: 'italic' }}>{e}</span>
    </div>
  );
}
