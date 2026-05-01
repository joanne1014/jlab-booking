import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(160deg, #f4ede4 0%, #e8ddd3 100%)',
      textAlign: 'center'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
          color: '#3a3430',
          marginBottom: '0.5rem',
          letterSpacing: '0.05em'
        }}>
          J.LAB
        </h1>
        <p style={{
          fontFamily: "'Noto Serif TC', serif",
          fontSize: 'clamp(0.9rem, 3vw, 1.1rem)',
          color: '#8B6F5C',
          marginBottom: '3rem',
          fontWeight: 300
        }}>
          專業美睫工作室 ・ 用心呈現每一根
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/booking')}
            style={{
              padding: '1rem 3rem',
              fontSize: '1rem',
              fontFamily: "'Noto Serif TC', serif",
              background: '#8B6F5C',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 15px rgba(139,111,92,0.3)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            立即預約
          </button>

          <button
            onClick={() => navigate('/about')}
            style={{
              padding: '0.8rem 2rem',
              fontSize: '0.9rem',
              fontFamily: "'Noto Serif TC', serif",
              background: 'transparent',
              color: '#8B6F5C',
              border: '1px solid #8B6F5C',
              borderRadius: '50px',
              cursor: 'pointer',
              letterSpacing: '0.05em'
            }}
          >
            關於我們
          </button>
        </div>
      </motion.div>
    </div>
  )
}
