import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      padding: '3rem 1.5rem',
      background: '#f4ede4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: '600px', width: '100%' }}
      >
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2.5rem',
          color: '#3a3430',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          About J.LAB
        </h1>

        <div style={{
          fontFamily: "'Noto Serif TC', serif",
          color: '#5a4a40',
          lineHeight: 2,
          fontSize: '1rem'
        }}>
          <p style={{ marginBottom: '1.5rem' }}>
            J.LAB 係一間位於香港嘅專業美睫工作室，主打自然輕盈嘅日式美睫技術。
          </p>
          <p style={{ marginBottom: '1.5rem' }}>
            我哋相信，每一位客人都值得擁有量身訂造嘅睫毛設計。從諮詢、設計到施作，每一步都用心對待。
          </p>
          <p style={{ marginBottom: '2rem' }}>
            歡迎預約體驗，感受唔一樣嘅精緻美睫服務 ✨
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            onClick={() => navigate('/booking')}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1rem',
              fontFamily: "'Noto Serif TC', serif",
              background: '#8B6F5C',
              color: '#fff',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            立即預約
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '1rem 2rem',
              fontSize: '0.9rem',
              fontFamily: "'Noto Serif TC', serif",
              background: 'transparent',
              color: '#8B6F5C',
              border: '1px solid #8B6F5C',
              borderRadius: '50px',
              cursor: 'pointer'
            }}
          >
            返回首頁
          </button>
        </div>
      </motion.div>
    </div>
  )
}
