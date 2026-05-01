import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const SUPABASE_URL = 'https://vqyfbwnkdpncwvdonbcz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTYyMDEsImV4cCI6MjA2MDY5MjIwMX0.jM21dYzEpHOtQMIRaOPe0fwdQMRz0vfMibgRB5BjLdE'

export default function AboutPage() {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAboutData()
  }, [])

  async function loadAboutData() {
    try {
      const pagesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/pages?slug=eq.about&select=id`,
        { headers: { apikey: SUPABASE_ANON_KEY } }
      )
      const pagesData = await pagesRes.json()
      
      if (pagesData && pagesData[0]) {
        const sectionsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/page_sections?page_id=eq.${pagesData[0].id}&is_visible=eq.true&order=sort_order`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        )
        const sectionsData = await sectionsRes.json()
        setSections(sectionsData || [])
      }
    } catch (e) {
      console.error('Load about error:', e)
    }
    setLoading(false)
  }

  if (loading) {
    return <div style={styles.loadingScreen}><p>載入中...</p></div>
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>J.LAB</Link>
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>首頁</Link>
          <Link to="/booking" style={styles.navBtn}>立即預約</Link>
        </nav>
      </header>

      {/* Content */}
      <main style={styles.main}>
        <h1 style={styles.pageTitle}>了解我哋</h1>

        {sections.length > 0 ? (
          sections.map(section => (
            <div key={section.id} style={styles.section}>
              {section.image_url && (
                <img src={section.image_url} alt={section.image_alt || ''} style={styles.sectionImage} />
              )}
              {section.title && <h2 style={styles.sectionTitle}>{section.title}</h2>}
              {section.body && <p style={styles.sectionBody}>{section.body}</p>}
            </div>
          ))
        ) : (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>關於 J.LAB</h2>
            <p style={styles.sectionBody}>
              我哋係一間位於香港嘅專業美睫工作室，致力為每位客人打造最自然、最適合嘅睫毛造型。
              每一次服務都係一次專屬體驗，我哋會根據你嘅眼型、面型同生活習慣，設計出最適合你嘅睫毛款式。
            </p>
            <p style={styles.sectionBody}>
              我哋使用頂級材料，確保每位客人都能享受到安全、舒適嘅服務體驗。
            </p>
          </div>
        )}

        <div style={styles.ctaBox}>
          <Link to="/booking" style={styles.btnPrimary}>✨ 立即預約</Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 J.LAB Lash & Beauty Studio</p>
      </footer>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#FDF6F0' },
  loadingScreen: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', color: '#8B6F5C',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid #E8D5C4',
    background: 'rgba(253,246,240,0.95)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.5rem', fontWeight: 600,
    color: '#5C3D2E', textDecoration: 'none',
  },
  nav: { display: 'flex', gap: '1rem', alignItems: 'center' },
  navLink: { color: '#8B6F5C', textDecoration: 'none', fontSize: '0.9rem' },
  navBtn: {
    padding: '8px 20px', background: '#8B6F5C', color: '#FFF',
    borderRadius: 6, textDecoration: 'none', fontSize: '0.9rem',
  },
  main: { maxWidth: 700, margin: '0 auto', padding: '3rem 1.5rem' },
  pageTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2.5rem', color: '#5C3D2E',
    textAlign: 'center', marginBottom: '2rem',
  },
  section: {
    background: '#FFFFFF', borderRadius: 16,
    padding: '2rem', marginBottom: '1.5rem',
    boxShadow: '0 2px 20px rgba(139,111,92,0.06)',
  },
  sectionImage: {
    width: '100%', borderRadius: 12, marginBottom: '1.5rem',
    objectFit: 'cover', maxHeight: 300,
  },
  sectionTitle: {
    fontSize: '1.3rem', fontWeight: 600, color: '#5C3D2E', marginBottom: '1rem',
  },
  sectionBody: {
    fontSize: '1rem', color: '#6B5344', lineHeight: 1.8, marginBottom: '1rem',
  },
  ctaBox: { textAlign: 'center', marginTop: '2rem' },
  btnPrimary: {
    display: 'inline-block', padding: '14px 32px',
    background: '#8B6F5C', color: '#FFF', borderRadius: 8,
    textDecoration: 'none', fontWeight: 600,
  },
  footer: {
    textAlign: 'center', padding: '2rem', color: '#A08B7A', fontSize: '0.85rem',
    borderTop: '1px solid #E8D5C4',
  },
}
