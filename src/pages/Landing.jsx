import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const SUPABASE_URL = 'https://vqyfbwnkdpncwvdonbcz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeWZid25rZHBuY3d2ZG9uYmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxMTYyMDEsImV4cCI6MjA2MDY5MjIwMX0.jM21dYzEpHOtQMIRaOPe0fwdQMRz0vfMibgRB5BjLdE'

export default function Landing() {
  const [sections, setSections] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPageData()
  }, [])

  async function loadPageData() {
    try {
      // 載入網站設定
      const settingsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/site_settings?limit=1`,
        { headers: { apikey: SUPABASE_ANON_KEY } }
      )
      const settingsData = await settingsRes.json()
      if (settingsData && settingsData[0]) setSettings(settingsData[0])

      // 載入頁面區塊
      const pagesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/pages?slug=eq.landing&select=id`,
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
      console.error('Load error:', e)
    }
    setLoading(false)
  }

  if (loading) {
    return <div style={styles.loadingScreen}><div style={styles.spinner}></div></div>
  }

  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            {settings.site_name || 'J.LAB'}
          </h1>
          <p style={styles.heroSubtitle}>
            {settings.site_subtitle || 'LASH & BEAUTY STUDIO'}
          </p>
          <p style={styles.heroDesc}>專業美睫 · 用心呈現每一根</p>
          
          <div style={styles.heroBtns}>
            <Link to="/booking" style={styles.btnPrimary}>
              ✨ 立即預約
            </Link>
            <Link to="/about" style={styles.btnOutline}>
              了解我哋
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <h2 style={styles.sectionTitle}>我哋嘅特色</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>✨</div>
            <h3 style={styles.featureTitle}>專業技術</h3>
            <p style={styles.featureDesc}>持續進修最新美睫技術，為你帶來最新最靚嘅款式</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🌿</div>
            <h3 style={styles.featureTitle}>安全衛生</h3>
            <p style={styles.featureDesc}>一人一套工具，全程嚴格消毒，令你安心享受</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💝</div>
            <h3 style={styles.featureTitle}>貼心服務</h3>
            <p style={styles.featureDesc}>根據面型眼型度身設計，打造最自然嘅效果</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>準備好變靚啦？</h2>
        <p style={styles.ctaDesc}>選擇你鍾意嘅服務，即刻預約</p>
        <Link to="/booking" style={styles.btnPrimary}>
          立即預約 →
        </Link>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>© 2026 J.LAB Lash & Beauty Studio</p>
        {settings.whatsapp_number && (
          <a 
            href={`https://wa.me/${settings.whatsapp_number}`} 
            style={styles.footerLink}
            target="_blank"
            rel="noreferrer"
          >
            📱 WhatsApp 聯絡我哋
          </a>
        )}
        <div style={styles.footerLinks}>
          <Link to="/admin" style={styles.footerLink}>管理後台</Link>
        </div>
      </footer>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#FDF6F0',
  },
  loadingScreen: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh',
  },
  spinner: {
    width: 40, height: 40,
    border: '3px solid #E8D5C4',
    borderTopColor: '#8B6F5C',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // Hero
  hero: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #8B6F5C 0%, #A0845C 50%, #C4956A 100%)',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
  },
  heroContent: {
    position: 'relative',
    textAlign: 'center',
    padding: '2rem',
    maxWidth: 600,
  },
  heroTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(3rem, 8vw, 5rem)',
    fontWeight: 300,
    color: '#FFFFFF',
    letterSpacing: '0.3em',
    marginBottom: '0.5rem',
  },
  heroSubtitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: '0.4em',
    marginBottom: '1.5rem',
  },
  heroDesc: {
    fontSize: '1.1rem',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: '2.5rem',
  },
  heroBtns: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    display: 'inline-block',
    padding: '14px 32px',
    background: '#FFFFFF',
    color: '#8B6F5C',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'transform 0.2s',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  btnOutline: {
    display: 'inline-block',
    padding: '14px 32px',
    background: 'transparent',
    color: '#FFFFFF',
    border: '2px solid rgba(255,255,255,0.8)',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: '1rem',
  },

  // Features
  features: {
    padding: '5rem 1.5rem',
    maxWidth: 900,
    margin: '0 auto',
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '2rem',
    color: '#5C3D2E',
    marginBottom: '3rem',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '2rem',
  },
  featureCard: {
    background: '#FFFFFF',
    borderRadius: 16,
    padding: '2rem 1.5rem',
    boxShadow: '0 2px 20px rgba(139,111,92,0.08)',
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#5C3D2E',
    marginBottom: '0.5rem',
  },
  featureDesc: {
    fontSize: '0.9rem',
    color: '#8B7355',
    lineHeight: 1.6,
  },

  // CTA
  cta: {
    textAlign: 'center',
    padding: '4rem 1.5rem',
    background: 'linear-gradient(135deg, #F5E6D3 0%, #FDF6F0 100%)',
  },
  ctaTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '1.8rem',
    color: '#5C3D2E',
    marginBottom: '0.5rem',
  },
  ctaDesc: {
    color: '#8B7355',
    marginBottom: '1.5rem',
  },

  // Footer
  footer: {
    textAlign: 'center',
    padding: '2rem 1.5rem',
    borderTop: '1px solid #E8D5C4',
  },
  footerText: {
    fontSize: '0.85rem',
    color: '#A08B7A',
    marginBottom: '0.5rem',
  },
  footerLink: {
    fontSize: '0.85rem',
    color: '#8B6F5C',
    textDecoration: 'none',
    marginTop: '0.5rem',
    display: 'inline-block',
  },
  footerLinks: {
    marginTop: '0.5rem',
  },
}
