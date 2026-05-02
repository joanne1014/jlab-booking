import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const contentRef = useRef(null)

  const [booking, setBooking] = useState({
    service: null,
    staffMember: null,
    date: '',
    time: '',
    name: '',
    phone: '',
    notes: '',
  })

  const totalSteps = 6

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [step])

  async function loadData() {
    try {
      const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }

      const [servRes, staffRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/services?is_active=eq.true&order=sort_order`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/staff?is_active=eq.true&order=sort_order`, { headers }),
      ])

      const servData = await servRes.json()
      const staffData = await staffRes.json()

      setServices(Array.isArray(servData) ? servData : [])
      setStaff(Array.isArray(staffData) ? staffData : [])

      if (!servRes.ok || !staffRes.ok) {
        setError('暫時未能載入服務資料，請稍後再試')
      }
    } catch (e) {
      console.error('Load error:', e)
      setError('網絡錯誤，請檢查連線')
    }
    setLoading(false)
  }

  function selectService(s) {
    setBooking({ ...booking, service: s })
    setTimeout(() => setStep(2), 300)
  }

  function selectStaff(s) {
    setBooking({ ...booking, staffMember: s })
    setTimeout(() => setStep(3), 300)
  }

  function selectDate(date) {
    setBooking({ ...booking, date })
    setTimeout(() => setStep(4), 300)
  }

  function selectTime(t) {
    setBooking({ ...booking, time: t })
    setTimeout(() => setStep(5), 300)
  }

  async function handleSubmit() {
    if (!booking.name || !booking.phone) return
    setSubmitting(true)

    try {
      const headers = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      }

      const body = {
        service_id: booking.service?.id,
        service_name: booking.service?.name,
        staff_id: booking.staffMember === 'any' ? null : booking.staffMember?.id,
        staff_name: booking.staffMember === 'any' ? '任何美療師' : booking.staffMember?.name,
        date: booking.date,
        time: booking.time,
        customer_name: booking.name,
        customer_phone: booking.phone,
        notes: booking.notes,
        status: 'pending',
        total_price: booking.service?.price || booking.service?.base_price || 0,
      }

      const res = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (res.ok || res.status === 201) {
        setSubmitted(true)
        setStep(6)
      } else {
        alert('預約提交失敗，請稍後再試')
      }
    } catch (e) {
      alert('網絡錯誤，請稍後再試')
    }
    setSubmitting(false)
  }

  function getServiceTag(s) {
    if (s.tag) return s.tag
    if (s.name?.includes('首次') || s.name?.includes('試做')) return '新客限定'
    if (s.is_featured || s.featured) return '店主推薦'
    return null
  }

  function getTagColor(tag) {
    if (tag === '新客限定') return { bg: '#C4956A', text: '#FFF' }
    if (tag === '店主推薦') return { bg: '#8B6F5C', text: '#FFF' }
    if (tag === '人氣之選') return { bg: '#B8860B', text: '#FFF' }
    return { bg: '#A08B7A', text: '#FFF' }
  }

  // Generate available dates (next 14 days, skip Sundays)
  function getAvailableDates() {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 21 && dates.length < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      if (d.getDay() !== 0) { // Skip Sunday
        dates.push(d)
      }
    }
    return dates
  }

  function formatDate(d) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const month = d.getMonth() + 1
    const date = d.getDate()
    const day = weekdays[d.getDay()]
    return { full: `${month}月${date}日 (${day})`, value: d.toISOString().split('T')[0] }
  }

  // Generate time slots
  function getTimeSlots() {
    return ['10:00','10:30','11:00','11:30','12:00','12:30',
      '13:00','13:30','14:00','14:30','15:00','15:30',
      '16:00','16:30','17:00','17:30','18:00','18:30','19:00']
  }

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <div style={styles.loadingSpinner}></div>
          <p style={{ color: '#8B6F5C', marginTop: '1rem', fontSize: '0.9rem' }}>載入服務資料中...</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <Link to="/" style={styles.logo}>𝒥.𝐿𝒜𝐵</Link>
          <span style={styles.headerRight}>LASH & BEAUTY</span>
        </header>
        <div style={styles.successPage}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>預約成功！</h2>
          <p style={styles.successText}>感謝您的預約，我哋會盡快透過 WhatsApp 聯絡您確認詳情。</p>
          <div style={styles.successCard}>
            <div style={styles.successRow}><span>服務</span><strong>{booking.service?.name}</strong></div>
            <div style={styles.successRow}><span>日期</span><strong>{booking.date}</strong></div>
            <div style={styles.successRow}><span>時間</span><strong>{booking.time}</strong></div>
            <div style={styles.successRow}><span>美療師</span><strong>{booking.staffMember === 'any' ? '任何美療師' : booking.staffMember?.name}</strong></div>
          </div>
          <Link to="/" style={styles.backHomeBtn}>返回主頁</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>𝒥.𝐿𝒜𝐵</Link>
        <span style={styles.headerRight}>LASH & BEAUTY</span>
      </header>

      {/* Title Section */}
      <div style={styles.titleSection}>
        <p style={styles.titleLabel}>BOOKING</p>
        <h1 style={styles.titleMain}>線上預約系統</h1>
        <p style={styles.titleSub}>ONLINE BOOKING SYSTEM</p>
      </div>

      {/* Step Indicators */}
      <div style={styles.stepIndicators}>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div
            key={n}
            style={{
              ...styles.stepDot,
              ...(n === step ? styles.stepDotActive : {}),
              ...(n < step ? styles.stepDotDone : {}),
            }}
            onClick={() => n < step && setStep(n)}
          >
            {n}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && <div style={styles.errorMsg}>⚠️ {error}</div>}

      {/* Main Content */}
      <main style={styles.main} ref={contentRef}>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionBorder}></div>
              <div>
                <span style={styles.sectionNumber}>1. 選擇預約項目</span>
                <span style={styles.sectionEn}> SELECT SERVICE</span>
              </div>
            </div>

            <div style={styles.cardList}>
              {services.map(s => {
                const tag = getServiceTag(s)
                const tagColor = tag ? getTagColor(tag) : null
                return (
                  <div
                    key={s.id}
                    style={{
                      ...styles.card,
                      ...(booking.service?.id === s.id ? styles.cardActive : {}),
                    }}
                    onClick={() => selectService(s)}
                  >
                    {tag && (
                      <div style={{ ...styles.cardTag, background: tagColor.bg, color: tagColor.text }}>
                        {tag}
                      </div>
                    )}
                    <div style={styles.cardTopRow}>
                      <h3 style={styles.cardName}>{s.name}</h3>
                      <span style={styles.cardPrice}>${s.price || s.base_price || 0}</span>
                    </div>
                    {s.description && (
                      <p style={styles.cardDesc}>{s.description}</p>
                    )}
                    {s.description_en && (
                      <p style={styles.cardDescEn}>{s.description_en}</p>
                    )}
                    <div style={styles.cardDuration}>
                      <span style={styles.clockIcon}>⏱</span>
                      <span>約 {s.duration || s.duration_minutes || 60} 分鐘</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Select Staff */}
        {step === 2 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionBorder}></div>
              <div>
                <span style={styles.sectionNumber}>2. 選擇美療師</span>
                <span style={styles.sectionEn}> SELECT THERAPIST</span>
              </div>
            </div>

            <div style={styles.cardList}>
              {staff.map(s => (
                <div
                  key={s.id}
                  style={{
                    ...styles.card,
                    ...(booking.staffMember?.id === s.id ? styles.cardActive : {}),
                  }}
                  onClick={() => selectStaff(s)}
                >
                  <div style={styles.cardTopRow}>
                    <h3 style={styles.cardName}>{s.name}</h3>
                  </div>
                  {s.title && <p style={styles.cardDesc}>{s.title}</p>}
                  {s.description && <p style={styles.cardDescEn}>{s.description}</p>}
                </div>
              ))}
              <div
                style={{
                  ...styles.card,
                  ...(booking.staffMember === 'any' ? styles.cardActive : {}),
                }}
                onClick={() => selectStaff('any')}
              >
                <div style={styles.cardTopRow}>
                  <h3 style={styles.cardName}>無所謂 / 任何美療師</h3>
                </div>
                <p style={styles.cardDesc}>由系統自動安排合適嘅美療師</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Date */}
        {step === 3 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionBorder}></div>
              <div>
                <span style={styles.sectionNumber}>3. 選擇日期</span>
                <span style={styles.sectionEn}> SELECT DATE</span>
              </div>
            </div>

            <div style={styles.dateGrid}>
              {getAvailableDates().map(d => {
                const { full, value } = formatDate(d)
                return (
                  <div
                    key={value}
                    style={{
                      ...styles.dateCard,
                      ...(booking.date === value ? styles.dateCardActive : {}),
                    }}
                    onClick={() => selectDate(value)}
                  >
                    {full}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 4: Select Time */}
        {step === 4 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionBorder}></div>
              <div>
                <span style={styles.sectionNumber}>4. 選擇時間</span>
                <span style={styles.sectionEn}> SELECT TIME</span>
              </div>
            </div>

            <p style={styles.selectedInfo}>
              📅 已選日期：<strong>{booking.date}</strong>
            </p>

            <div style={styles.timeGrid}>
              {getTimeSlots().map(t => (
                <div
                  key={t}
                  style={{
                    ...styles.timeCard,
                    ...(booking.time === t ? styles.timeCardActive : {}),
                  }}
                  onClick={() => selectTime(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Contact Info */}
        {step === 5 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionBorder}></div>
              <div>
                <span style={styles.sectionNumber}>5. 聯絡資料</span>
                <span style={styles.sectionEn}> YOUR DETAILS</span>
              </div>
            </div>

            <div style={styles.formCard}>
              <div style={styles.formGroup}>
                <label style={styles.label}>姓名 *</label>
                <input
                  type="text"
                  placeholder="你嘅稱呼"
                  value={booking.name}
                  onChange={e => setBooking({ ...booking, name: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>WhatsApp 電話 *</label>
                <input
                  type="tel"
                  placeholder="例如：91234567"
                  value={booking.phone}
                  onChange={e => setBooking({ ...booking, phone: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>備註（可選）</label>
                <textarea
                  placeholder="特殊需求、過敏資訊等..."
                  value={booking.notes}
                  onChange={e => setBooking({ ...booking, notes: e.target.value })}
                  style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                />
              </div>

              <button
                onClick={() => setStep(6)}
                disabled={!booking.name || !booking.phone}
                style={{
                  ...styles.nextBtn,
                  opacity: (!booking.name || !booking.phone) ? 0.5 : 1,
                }}
              >
                下一步：確認預約 →
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Confirm */}
        {step === 6 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionBorder}></div>
              <div>
                <span style={styles.sectionNumber}>6. 確認預約</span>
                <span style={styles.sectionEn}> CONFIRM BOOKING</span>
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>服務</span>
                <strong style={styles.summaryValue}>{booking.service?.name}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>美療師</span>
                <strong style={styles.summaryValue}>
                  {booking.staffMember === 'any' ? '任何美療師' : booking.staffMember?.name}
                </strong>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>日期</span>
                <strong style={styles.summaryValue}>{booking.date}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>時間</span>
                <strong style={styles.summaryValue}>{booking.time}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>姓名</span>
                <strong style={styles.summaryValue}>{booking.name}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span style={styles.summaryLabel}>電話</span>
                <strong style={styles.summaryValue}>{booking.phone}</strong>
              </div>
              {booking.notes && (
                <div style={styles.summaryRow}>
                  <span style={styles.summaryLabel}>備註</span>
                  <strong style={styles.summaryValue}>{booking.notes}</strong>
                </div>
              )}
              <div style={styles.summaryTotal}>
                <span>總金額</span>
                <strong>${booking.service?.price || booking.service?.base_price || 0}</strong>
              </div>
            </div>

            <p style={styles.confirmNote}>
              確認預約後，我哋會透過 WhatsApp 聯絡您確認詳情
            </p>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={styles.submitBtn}
            >
              {submitting ? '提交中...' : '✓ 確認預約'}
            </button>
          </div>
        )}
      </main>

      {/* Back Button (floating) */}
      {step > 1 && (
        <button
          onClick={() => setStep(step - 1)}
          style={styles.backBtn}
        >
          ← 返回上一步
        </button>
      )}

      {/* Scroll to top button */}
      <div style={styles.scrollTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        ↑
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#FAF6F1',
    fontFamily: "'Noto Sans TC', -apple-system, sans-serif",
  },
  loadingScreen: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#FAF6F1',
  },
  loadingContent: { textAlign: 'center' },
  loadingSpinner: {
    width: 40, height: 40, border: '3px solid #E8D5C4',
    borderTopColor: '#8B6F5C', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', margin: '0 auto',
  },

  // Header
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.2rem 2rem',
    borderBottom: '1px solid #E8D5C4',
    background: '#FAF6F1',
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.4rem', fontWeight: 600, color: '#5C3D2E',
    textDecoration: 'none', fontStyle: 'italic',
  },
  headerRight: {
    fontSize: '0.75rem', color: '#A08B7A', letterSpacing: '2px',
  },

  // Title Section
  titleSection: {
    textAlign: 'center', padding: '2.5rem 1.5rem 1.5rem',
  },
  titleLabel: {
    fontSize: '0.75rem', letterSpacing: '4px', color: '#A08B7A', marginBottom: '0.5rem',
  },
  titleMain: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif TC', serif",
    fontSize: '1.8rem', color: '#4A3728', margin: '0.3rem 0',
    fontWeight: 600,
  },
  titleSub: {
    fontSize: '0.7rem', letterSpacing: '3px', color: '#B8A89A', marginTop: '0.3rem',
  },

  // Step Indicators
  stepIndicators: {
    display: 'flex', justifyContent: 'center', gap: '1.2rem',
    padding: '1rem 1.5rem 2rem',
  },
  stepDot: {
    width: 36, height: 36, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.8rem', color: '#B8A89A',
    border: '1.5px solid #D4C4B0', background: 'transparent',
    cursor: 'default', transition: 'all 0.3s',
  },
  stepDotActive: {
    background: '#5C3D2E', color: '#FFF', border: '1.5px solid #5C3D2E',
  },
  stepDotDone: {
    background: '#E8D5C4', color: '#5C3D2E', border: '1.5px solid #C4A882',
    cursor: 'pointer',
  },

  // Error
  errorMsg: {
    background: '#FFF3CD', color: '#856404', padding: '0.75rem 1.5rem',
    textAlign: 'center', fontSize: '0.85rem', margin: '0 1.5rem', borderRadius: 8,
  },

  // Main
  main: {
    maxWidth: 680, margin: '0 auto', padding: '0 1.5rem 6rem',
  },

  // Section
  section: { },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: '0.8rem',
    marginBottom: '1.5rem',
  },
  sectionBorder: {
    width: 4, height: 28, background: '#C4956A', borderRadius: 2,
  },
  sectionNumber: {
    fontSize: '1.1rem', fontWeight: 700, color: '#4A3728',
  },
  sectionEn: {
    fontSize: '0.75rem', letterSpacing: '2px', color: '#B8A89A', marginLeft: '0.5rem',
  },

  // Service Cards
  cardList: {
    display: 'flex', flexDirection: 'column', gap: '1rem',
  },
  card: {
    background: '#FFF', borderRadius: 12, padding: '1.5rem',
    border: '1.5px solid #E8D5C4',
    cursor: 'pointer', transition: 'all 0.2s',
    position: 'relative', overflow: 'hidden',
  },
  cardActive: {
    borderColor: '#8B6F5C', background: '#FDF9F5',
    boxShadow: '0 4px 20px rgba(139,111,92,0.12)',
  },
  cardTag: {
    position: 'absolute', top: 12, right: 12,
    padding: '3px 10px', borderRadius: 4,
    fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.5px',
  },
  cardTopRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '0.5rem', paddingRight: '4rem',
  },
  cardName: {
    fontSize: '1.05rem', fontWeight: 700, color: '#4A3728', margin: 0,
  },
  cardPrice: {
    fontSize: '1.1rem', fontWeight: 700, color: '#5C3D2E',
    position: 'absolute', top: '1.5rem', right: '1.5rem',
  },
  cardDesc: {
    fontSize: '0.85rem', color: '#6B5344', lineHeight: 1.6,
    margin: '0.3rem 0',
  },
  cardDescEn: {
    fontSize: '0.8rem', color: '#A08B7A', fontStyle: 'italic',
    lineHeight: 1.5, margin: '0.3rem 0',
  },
  cardDuration: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    marginTop: '0.8rem', fontSize: '0.8rem', color: '#A08B7A',
  },
  clockIcon: { fontSize: '0.85rem' },

  // Date Grid
  dateGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem',
  },
  dateCard: {
    background: '#FFF', borderRadius: 10, padding: '1rem',
    border: '1.5px solid #E8D5C4', textAlign: 'center',
    cursor: 'pointer', fontSize: '0.9rem', color: '#4A3728',
    fontWeight: 500, transition: 'all 0.2s',
  },
  dateCardActive: {
    borderColor: '#8B6F5C', background: '#FDF9F5',
    boxShadow: '0 4px 15px rgba(139,111,92,0.1)',
  },

  // Time Grid
  timeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem',
  },
  timeCard: {
    background: '#FFF', borderRadius: 10, padding: '0.9rem 0.5rem',
    border: '1.5px solid #E8D5C4', textAlign: 'center',
    cursor: 'pointer', fontSize: '0.95rem', color: '#4A3728',
    fontWeight: 500, transition: 'all 0.2s',
  },
  timeCardActive: {
    borderColor: '#8B6F5C', background: '#FDF9F5',
    boxShadow: '0 4px 15px rgba(139,111,92,0.1)',
  },
  selectedInfo: {
    fontSize: '0.85rem', color: '#6B5344', marginBottom: '1.2rem',
    padding: '0.7rem 1rem', background: '#FFF', borderRadius: 8,
    border: '1px solid #E8D5C4',
  },

  // Form
  formCard: {
    background: '#FFF', borderRadius: 12, padding: '1.5rem',
    border: '1.5px solid #E8D5C4',
  },
  formGroup: { marginBottom: '1.2rem' },
  label: {
    display: 'block', fontSize: '0.85rem', color: '#5C3D2E',
    marginBottom: 6, fontWeight: 600,
  },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    border: '1.5px solid #E8D5C4', borderRadius: 8, fontSize: '0.95rem',
    background: '#FDFBF9', color: '#4A3728', outline: 'none',
    transition: 'border-color 0.2s',
  },
  nextBtn: {
    width: '100%', padding: '14px', background: '#5C3D2E', color: '#FFF',
    border: 'none', borderRadius: 10, cursor: 'pointer',
    fontSize: '0.95rem', fontWeight: 600, marginTop: '0.5rem',
  },

  // Summary
  summaryCard: {
    background: '#FFF', borderRadius: 12, padding: '1.5rem',
    border: '1.5px solid #E8D5C4',
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid #F5EDE5',
  },
  summaryLabel: { fontSize: '0.85rem', color: '#A08B7A' },
  summaryValue: { fontSize: '0.9rem', color: '#4A3728', textAlign: 'right' },
  summaryTotal: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0 0', marginTop: '8px',
    borderTop: '2px solid #E8D5C4',
    fontSize: '1.1rem', color: '#5C3D2E', fontWeight: 700,
  },
  confirmNote: {
    fontSize: '0.8rem', color: '#A08B7A', textAlign: 'center',
    marginTop: '1.2rem', lineHeight: 1.6,
  },
  submitBtn: {
    width: '100%', padding: '16px', marginTop: '1.5rem',
    background: 'linear-gradient(135deg, #5C3D2E, #8B6F5C)',
    color: '#FFF', border: 'none', borderRadius: 10,
    cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
    letterSpacing: '1px',
  },

  // Back Button
  backBtn: {
    position: 'fixed', bottom: '1.5rem', left: '1.5rem',
    padding: '10px 18px', background: '#FFF', color: '#8B6F5C',
    border: '1.5px solid #D4C4B0', borderRadius: 25,
    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    zIndex: 50,
  },

  // Scroll to top
  scrollTop: {
    position: 'fixed', bottom: '1.5rem', right: '1.5rem',
    width: 44, height: 44, borderRadius: '50%',
    background: '#FFF', border: '1.5px solid #D4C4B0',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '1.1rem', color: '#8B6F5C',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    zIndex: 50,
  },

  // Success Page
  successPage: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '3rem 1.5rem', maxWidth: 500, margin: '0 auto',
  },
  successIcon: {
    width: 60, height: 60, borderRadius: '50%',
    background: 'linear-gradient(135deg, #5C3D2E, #8B6F5C)',
    color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.5rem', fontWeight: 700,
  },
  successTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.6rem', color: '#4A3728', marginTop: '1rem',
  },
  successText: {
    fontSize: '0.9rem', color: '#6B5344', textAlign: 'center', lineHeight: 1.6,
  },
  successCard: {
    width: '100%', background: '#FFF', borderRadius: 12, padding: '1.5rem',
    border: '1.5px solid #E8D5C4', marginTop: '1.5rem',
  },
  successRow: {
    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
    borderBottom: '1px solid #F5EDE5', fontSize: '0.9rem', color: '#6B5344',
  },
  backHomeBtn: {
    marginTop: '2rem', padding: '14px 32px', background: '#5C3D2E',
    color: '#FFF', borderRadius: 10, textDecoration: 'none',
    fontSize: '0.9rem', fontWeight: 600,
  },
}
