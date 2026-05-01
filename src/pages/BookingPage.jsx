import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const SUPABASE_URL = 'https://vqyfbwnkdpncwvdonbcz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTYyMDEsImV4cCI6MjA2MDY5MjIwMX0.jM21dYzEpHOtQMIRaOPe0fwdQMRz0vfMibgRB5BjLdE'

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [services, setServices] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [booking, setBooking] = useState({
    service: null,
    staffMember: null,
    date: '',
    time: '',
    name: '',
    phone: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

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

      // 確保一定係 array，唔會 crash
      setServices(Array.isArray(servData) ? servData : [])
      setStaff(Array.isArray(staffData) ? staffData : [])

      if (!servRes.ok || !staffRes.ok) {
        console.warn('Supabase response:', servData, staffData)
        setError('暫時未能載入服務資料，請稍後再試')
      }
    } catch (e) {
      console.error('Load error:', e)
      setError('網絡錯誤，請檢查連線')
    }
    setLoading(false)
  }

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  if (loading) {
    return <div style={styles.loadingScreen}><p style={{color:'#8B6F5C'}}>載入服務資料中...</p></div>
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>J.LAB</Link>
        <span style={styles.headerTitle}>預約服務</span>
        <Link to="/" style={styles.closeBtn}>✕</Link>
      </header>

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={{...styles.progressBar, width: `${progress}%`}}></div>
      </div>
      <p style={styles.stepLabel}>步驟 {step} / {totalSteps}</p>

      {/* Error Message */}
      {error && (
        <div style={styles.errorMsg}>
          ⚠️ {error}
        </div>
      )}

      {/* Step Content */}
      <main style={styles.main}>
        {step === 1 && (
          <div>
            <h2 style={styles.stepTitle}>選擇服務</h2>
            <div style={styles.serviceList}>
              {services.map(s => (
                <div
                  key={s.id}
                  style={{
                    ...styles.serviceCard,
                    ...(booking.service?.id === s.id ? styles.serviceCardActive : {}),
                  }}
                  onClick={() => setBooking({...booking, service: s})}
                >
                  <div style={styles.serviceName}>{s.name}</div>
                  <div style={styles.serviceInfo}>
                    <span>{s.duration || s.duration_minutes || 60} 分鐘</span>
                    <span style={styles.servicePrice}>${s.price || s.base_price || 0}</span>
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <p style={{color:'#999', textAlign:'center'}}>暫無可用服務，請稍後再試</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={styles.stepTitle}>選擇美療師</h2>
            <div style={styles.serviceList}>
              {staff.map(s => (
                <div
                  key={s.id}
                  style={{
                    ...styles.serviceCard,
                    ...(booking.staffMember?.id === s.id ? styles.serviceCardActive : {}),
                  }}
                  onClick={() => setBooking({...booking, staffMember: s})}
                >
                  <div style={styles.serviceName}>{s.name}</div>
                  <div style={{fontSize:'0.85rem', color:'#999'}}>{s.title || '美療師'}</div>
                </div>
              ))}
              <div
                style={{
                  ...styles.serviceCard,
                  ...(booking.staffMember === 'any' ? styles.serviceCardActive : {}),
                }}
                onClick={() => setBooking({...booking, staffMember: 'any'})}
              >
                <div style={styles.serviceName}>無所謂 / 任何美療師</div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={styles.stepTitle}>選擇日期同時間</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>日期</label>
              <input
                type="date"
                value={booking.date}
                onChange={e => setBooking({...booking, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>時間</label>
              <select
                value={booking.time}
                onChange={e => setBooking({...booking, time: e.target.value})}
                style={styles.input}
              >
                <option value="">請選擇時間</option>
                {['10:00','10:30','11:00','11:30','12:00','12:30',
                  '13:00','13:30','14:00','14:30','15:00','15:30',
                  '16:00','16:30','17:00','17:30','18:00','18:30'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={styles.stepTitle}>聯絡資料</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>姓名 *</label>
              <input
                type="text"
                placeholder="你嘅稱呼"
                value={booking.name}
                onChange={e => setBooking({...booking, name: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>WhatsApp 電話 *</label>
              <input
                type="tel"
                placeholder="例如：91234567"
                value={booking.phone}
                onChange={e => setBooking({...booking, phone: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>備註（可選）</label>
              <textarea
                placeholder="特殊需求、過敏資訊等..."
                value={booking.notes}
                onChange={e => setBooking({...booking, notes: e.target.value})}
                style={{...styles.input, minHeight: 80, resize: 'vertical'}}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 style={styles.stepTitle}>確認預約</h2>
            <div style={styles.summaryCard}>
              <div style={styles.summaryRow}>
                <span>服務</span>
                <strong>{booking.service?.name || '-'}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>美療師</span>
                <strong>{booking.staffMember === 'any' ? '任何' : (booking.staffMember?.name || '-')}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>日期</span>
                <strong>{booking.date || '-'}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>時間</span>
                <strong>{booking.time || '-'}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>姓名</span>
                <strong>{booking.name || '-'}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>電話</span>
                <strong>{booking.phone || '-'}</strong>
              </div>
              {booking.notes && (
                <div style={styles.summaryRow}>
                  <span>備註</span>
                  <strong>{booking.notes}</strong>
                </div>
              )}
              <div style={{...styles.summaryRow, borderTop:'2px solid #E8D5C4', paddingTop:12, marginTop:8}}>
                <span style={{fontWeight:600}}>總金額</span>
                <strong style={{fontSize:'1.2rem', color:'#8B6F5C'}}>
                  ${booking.service?.price || booking.service?.base_price || 0}
                </strong>
              </div>
            </div>
            <p style={{fontSize:'0.85rem', color:'#999', textAlign:'center', marginTop:'1rem'}}>
              確認預約後，我哋會喺 WhatsApp 聯絡你確認詳情
            </p>
          </div>
        )}
      </main>

      {/* Navigation Buttons */}
      <div style={styles.navButtons}>
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} style={styles.btnBack}>
            ← 上一步
          </button>
        )}
        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && !booking.service) ||
              (step === 2 && !booking.staffMember) ||
              (step === 3 && (!booking.date || !booking.time))
            }
            style={{
              ...styles.btnNext,
              opacity: (
                (step === 1 && !booking.service) ||
                (step === 2 && !booking.staffMember) ||
                (step === 3 && (!booking.date || !booking.time))
              ) ? 0.5 : 1
            }}
          >
            下一步 →
          </button>
        ) : (
          <button
            onClick={() => alert('預約功能即將啟用！')}
            disabled={!booking.name || !booking.phone}
            style={{
              ...styles.btnSubmit,
              opacity: (!booking.name || !booking.phone) ? 0.5 : 1
            }}
          >
            ✓ 確認預約
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#FDF6F0', display: 'flex', flexDirection: 'column' },
  loadingScreen: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 1.5rem', borderBottom: '1px solid #E8D5C4',
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.3rem', fontWeight: 600, color: '#5C3D2E', textDecoration: 'none',
  },
  headerTitle: { fontSize: '0.9rem', color: '#8B6F5C' },
  closeBtn: { color: '#8B6F5C', textDecoration: 'none', fontSize: '1.2rem' },
  progressContainer: { height: 4, background: '#E8D5C4', width: '100%' },
  progressBar: {
    height: '100%', background: 'linear-gradient(90deg, #8B6F5C, #C4956A)',
    transition: 'width 0.3s ease',
  },
  stepLabel: { textAlign: 'center', fontSize: '0.8rem', color: '#A08B7A', padding: '0.5rem' },
  errorMsg: {
    background: '#FFF3CD', color: '#856404', padding: '0.75rem 1.5rem',
    textAlign: 'center', fontSize: '0.85rem',
  },
  main: { flex: 1, padding: '1rem 1.5rem', maxWidth: 500, margin: '0 auto', width: '100%', boxSizing: 'border-box' },
  stepTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.5rem', color: '#5C3D2E', marginBottom: '1.5rem', textAlign: 'center',
  },
  serviceList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  serviceCard: {
    background: '#FFF', borderRadius: 12, padding: '1rem 1.2rem',
    border: '2px solid transparent',
    boxShadow: '0 2px 10px rgba(139,111,92,0.06)',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  serviceCardActive: { borderColor: '#8B6F5C', background: '#FAF5F0' },
  serviceName: { fontWeight: 600, color: '#5C3D2E', marginBottom: 4 },
  serviceInfo: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '0.85rem', color: '#A08B7A',
  },
  servicePrice: { fontWeight: 600, color: '#8B6F5C' },
  formGroup: { marginBottom: '1.2rem' },
  label: { display: 'block', fontSize: '0.9rem', color: '#5C3D2E', marginBottom: 6, fontWeight: 500 },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    border: '1.5px solid #E8D5C4', borderRadius: 8, fontSize: '1rem',
    background: '#FFF', color: '#4A3728', outline: 'none',
  },
  summaryCard: {
    background: '#FFF', borderRadius: 12, padding: '1.5rem',
    boxShadow: '0 2px 15px rgba(139,111,92,0.08)',
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid #F5EDE5',
    fontSize: '0.9rem', color: '#6B5344',
  },
  navButtons: {
    display: 'flex', justifyContent: 'space-between', gap: '1rem',
    padding: '1rem 1.5rem', borderTop: '1px solid #E8D5C4',
    maxWidth: 500, margin: '0 auto', width: '100%', boxSizing: 'border-box',
  },
  btnBack: {
    padding: '12px 24px', background: 'transparent', color: '#8B6F5C',
    border: '1.5px solid #D4C4B0', borderRadius: 8, cursor: 'pointer', fontSize: '0.95rem',
  },
  btnNext: {
    padding: '12px 24px', background: '#8B6F5C', color: '#FFF',
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontSize: '0.95rem', fontWeight: 600, marginLeft: 'auto',
  },
  btnSubmit: {
    padding: '12px 24px', background: 'linear-gradient(135deg, #8B6F5C, #A0845C)',
    color: '#FFF', border: 'none', borderRadius: 8, cursor: 'pointer',
    fontSize: '0.95rem', fontWeight: 600, marginLeft: 'auto',
  },
}
