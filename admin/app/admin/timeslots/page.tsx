'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const DAYS = [1, 2, 3, 4, 5, 6, 0]
const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日']
const TIMES = [
  '10:00','10:30','11:00','11:30','12:00','12:30',
  '13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00',
]

export default function TimeSlotsPage() {
  const [slots, setSlots] = useState({})
  const [blockedDates, setBlockedDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data: slotData } = await supabase.from('time_slots').select('*').order('time')
    const map = {}
    slotData?.forEach(s => {
      if (!map[s.day_of_week]) map[s.day_of_week] = {}
      map[s.day_of_week][s.time] = { id: s.id, is_active: s.is_active }
    })
    setSlots(map)

    const { data: blocked } = await supabase.from('blocked_dates').select('*').order('date')
    if (blocked) setBlockedDates(blocked)
    setLoading(false)
  }

  async function toggleSlot(day, time) {
    const slot = slots[day]?.[time]
    if (!slot) return
    setSlots(prev => ({
      ...prev,
      [day]: { ...prev[day], [time]: { ...slot, is_active: !slot.is_active } }
    }))
    await supabase.from('time_slots').update({ is_active: !slot.is_active }).eq('id', slot.id)
  }

  async function setWholeDay(day, active) {
    const daySlots = slots[day]
    if (!daySlots) return
    const updated = { ...daySlots }
    Object.keys(updated).forEach(t => { updated[t] = { ...updated[t], is_active: active } })
    setSlots(prev => ({ ...prev, [day]: updated }))
    const ids = Object.values(daySlots).map(s => s.id)
    await supabase.from('time_slots').update({ is_active: active }).in('id', ids)
  }

  async function addBlockedDate() {
    if (!newDate) return
    const { error } = await supabase.from('blocked_dates').insert({ date: newDate, reason: newReason })
    if (error) { alert('此日期已存在'); return }
    setNewDate('')
    setNewReason('')
    fetchAll()
  }

  async function removeBlockedDate(id) {
    await supabase.from('blocked_dates').delete().eq('id', id)
    fetchAll()
  }

  function countActive(day) {
    const d = slots[day]
    if (!d) return 0
    return Object.values(d).filter(s => s.is_active).length
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f0eb',
      fontFamily: "'Noto Serif TC', serif",
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '20px 30px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: '20px', color: '#5c4a3a', margin: 0 }}>J.LAB 管理後台</h1>
          <p style={{ color: '#999', fontSize: '12px', margin: '4px 0 0', letterSpacing: '1px' }}>ADMIN DASHBOARD</p>
        </div>
        <Link href="/" style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #ccc', borderRadius: '6px', textDecoration: 'none', color: '#666', fontSize: '14px' }}>
          ← 返回前台
        </Link>
      </div>

      {/* Nav Tabs */}
      <div style={{
        background: '#fff',
        borderTop: '1px solid #f0ebe3',
        padding: '0 30px',
        display: 'flex',
        gap: 0,
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        {[
          { href: '/admin', label: '📋 預約管理', active: false },
          { href: '/admin/services', label: '🛍️ 服務管理', active: false },
          { href: '/admin/timeslots', label: '🕐 時段管理', active: true },
        ].map(tab => (
          <Link key={tab.href} href={tab.href} style={{
            padding: '14px 24px',
            textDecoration: 'none',
            fontSize: '14px',
            color: tab.active ? '#5c4a3a' : '#999',
            borderBottom: tab.active ? '2px solid #5c4a3a' : '2px solid transparent',
            fontWeight: tab.active ? 600 : 400,
          }}>{tab.label}</Link>
        ))}
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 20px' }}>
        <h2 style={{ fontSize: 20, marginBottom: 20, color: '#5c4a3a' }}>🕐 每週時段管理</h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>載入中...</p>
        ) : (
          <>
            {/* Weekly Grid */}
            <div style={{
              background: 'white', borderRadius: 12,
              padding: 20, marginBottom: 28, overflowX: 'auto',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#999', fontWeight: 400 }}>時間</th>
                    {DAYS.map((day, i) => (
                      <th key={day} style={{ padding: '8px 4px', textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontWeight: 600, color: '#5c4a3a', fontSize: 16 }}>週{DAY_NAMES[i]}</div>
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
                          {countActive(day)}/{TIMES.length} 開放
                        </div>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                          <button onClick={() => setWholeDay(day, true)} style={{
                            fontSize: 11, padding: '3px 8px', border: '1px solid #81c784',
                            background: '#e8f5e9', color: '#2e7d32', borderRadius: 4, cursor: 'pointer',
                          }}>全開</button>
                          <button onClick={() => setWholeDay(day, false)} style={{
                            fontSize: 11, padding: '3px 8px', border: '1px solid #ef9a9a',
                            background: '#ffebee', color: '#c62828', borderRadius: 4, cursor: 'pointer',
                          }}>全關</button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIMES.map(time => (
                    <tr key={time} style={{ borderTop: '1px solid #f0ebe3' }}>
                      <td style={{ padding: '6px 12px', fontWeight: 500, color: '#666', fontSize: 13 }}>
                        {time}
                      </td>
                      {DAYS.map(day => {
                        const slot = slots[day]?.[time]
                        const active = slot?.is_active ?? false
                        return (
                          <td key={day} style={{ padding: '4px', textAlign: 'center' }}>
                            <button onClick={() => toggleSlot(day, time)} style={{
                              width: 50, height: 34, border: 'none', borderRadius: 6,
                              cursor: 'pointer', fontSize: 16, transition: 'all 0.15s',
                              background: active ? '#4a7c59' : '#f0ebe3',
                              color: active ? 'white' : '#ccc',
                              fontWeight: 600,
                            }}>
                              {active ? '✓' : '✗'}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Blocked Dates */}
            <h2 style={{ fontSize: 20, marginBottom: 16, color: '#5c4a3a' }}>🚫 封鎖日期</h2>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              設定特定日期唔接受預約（例如：假期、私人事務）
            </p>

            <div style={{
              background: 'white', borderRadius: 12,
              padding: 20, marginBottom: 16,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', display: 'block', marginBottom: 4 }}>
                    日期
                  </label>
                  <input type="date" value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    style={{
                      padding: '10px 12px', border: '1px solid #ddd',
                      borderRadius: 8, fontSize: 14,
                    }} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#5c4a3a', display: 'block', marginBottom: 4 }}>
                    原因（選填）
                  </label>
                  <input value={newReason}
                    onChange={e => setNewReason(e.target.value)}
                    placeholder="例：公眾假期"
                    style={{
                      width: '100%', padding: '10px 12px', border: '1px solid #ddd',
                      borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
                    }} />
                </div>
                <button onClick={addBlockedDate} disabled={!newDate} style={{
                  padding: '10px 20px', background: '#c62828', color: 'white',
                  border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
                  fontWeight: 600, opacity: newDate ? 1 : 0.4, whiteSpace: 'nowrap',
                }}>🚫 封鎖此日</button>
              </div>
            </div>

            {blockedDates.length > 0 && (
              <div style={{
                background: 'white', borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              }}>
                {blockedDates.map((bd, i) => (
                  <div key={bd.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 20px',
                    borderTop: i > 0 ? '1px solid #f0ebe3' : 'none',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{bd.date}</span>
                      {bd.reason && (
                        <span style={{ color: '#888', marginLeft: 12, fontSize: 13 }}>
                          — {bd.reason}
                        </span>
                      )}
                    </div>
                    <button onClick={() => removeBlockedDate(bd.id)} style={{
                      padding: '4px 12px', fontSize: 13, borderRadius: 6, cursor: 'pointer',
                      background: '#ffebee', border: '1px solid #ef9a9a', color: '#c62828',
                    }}>移除</button>
                  </div>
                ))}
              </div>
            )}

            {blockedDates.length === 0 && (
              <p style={{ textAlign: 'center', color: '#ccc', padding: 20, fontSize: 14 }}>
                暫無封鎖日期
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
