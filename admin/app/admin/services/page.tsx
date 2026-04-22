'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const DAYS = [1, 2, 3, 4, 5, 6, 0]
const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日']
const DAY_FULL = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']
const TIMES = [
  '10:00','10:30','11:00','11:30','12:00','12:30',
  '13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00',
]

interface SlotInfo { id: string; is_active: boolean }
interface BlockedDate { id: string; date: string; reason: string }

export default function TimeSlotsPage() {
  const [slots, setSlots] = useState<Record<number, Record<string, SlotInfo>>>({})
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data: slotData } = await supabase.from('time_slots').select('*').order('time')
    const map: Record<number, Record<string, SlotInfo>> = {}
    slotData?.forEach(s => {
      if (!map[s.day_of_week]) map[s.day_of_week] = {}
      map[s.day_of_week][s.time] = { id: s.id, is_active: s.is_active }
    })
    setSlots(map)

    const { data: blocked } = await supabase.from('blocked_dates').select('*').order('date')
    if (blocked) setBlockedDates(blocked)
    setLoading(false)
  }

  async function toggleSlot(day: number, time: string) {
    const slot = slots[day]?.[time]
    if (!slot) return
    setSlots(prev => ({
      ...prev,
      [day]: { ...prev[day], [time]: { ...slot, is_active: !slot.is_active } }
    }))
    await supabase.from('time_slots').update({ is_active: !slot.is_active }).eq('id', slot.id)
  }

  async function setWholeDay(day: number, active: boolean) {
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

  async function removeBlockedDate(id: string) {
    await supabase.from('blocked_dates').delete().eq('id', id)
    fetchAll()
  }

  // Count active slots per day
  function countActive(day: number) {
    const d = slots[day]
    if (!d) return 0
    return Object.values(d).filter(s => s.is_active).length
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: "'Noto Sans TC', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h1 style={{ fontFamily: 'serif', fontSize: 28, fontStyle: 'italic', margin: 0 }}>J.LAB</h1>
          <span style={{ fontSize: 13, color: '#999', letterSpacing: 1 }}>ADMIN</span>
        </div>
        <Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>← 返回前台</Link>
      </div>

      {/* Nav Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e0d5c1', marginBottom: 28 }}>
        {[
          { href: '/admin', label: '📋 預約管理' },
          { href: '/admin/services', label: '🛍️ 服務管理' },
          { href: '/admin/timeslots', label: '🕐 時段管理' },
        ].map(tab => (
          <Link key={tab.href} href={tab.href} style={{
            padding: '12px 24px', textDecoration: 'none', fontSize: 15,
            color: tab.href === '/admin/timeslots' ? '#5a4a3a' : '#999',
            borderBottom: tab.href === '/admin/timeslots' ? '2px solid #5a4a3a' : '2px solid transparent',
            fontWeight: tab.href === '/admin/timeslots' ? 600 : 400,
            marginBottom: -2,
          }}>{tab.label}</Link>
        ))}
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 20 }}>🕐 每週時段管理</h2>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>載入中...</p>
      ) : (
        <>
          {/* Weekly Grid */}
          <div style={{
            background: 'white', border: '1px solid #e0d5c1', borderRadius: 12,
            padding: 20, marginBottom: 28, overflowX: 'auto',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#999', fontWeight: 400 }}>時間</th>
                  {DAYS.map((day, i) => (
                    <th key={day} style={{ padding: '8px 4px', textAlign: 'center', minWidth: 70 }}>
                      <div style={{ fontWeight: 600, color: '#5a4a3a' }}>{DAY_NAMES[i]}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                        {countActive(day)}/{TIMES.length}
                      </div>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                        <button onClick={() => setWholeDay(day, true)} style={{
                          fontSize: 10, padding: '2px 6px', border: '1px solid #81c784',
                          background: '#e8f5e9', color: '#2e7d32', borderRadius: 4, cursor: 'pointer',
                        }}>全開</button>
                        <button onClick={() => setWholeDay(day, false)} style={{
                          fontSize: 10, padding: '2px 6px', border: '1px solid #ef9a9a',
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
                            width: 44, height: 32, border: 'none', borderRadius: 6,
                            cursor: 'pointer', fontSize: 16, transition: 'all 0.15s',
                            background: active ? '#4a7c59' : '#f0ebe3',
                            color: active ? 'white' : '#ccc',
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
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>🚫 封鎖日期</h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
            設定特定日期唔接受預約（例如：假期、私人事務）
          </p>

          <div style={{
            background: 'white', border: '1px solid #e0d5c1', borderRadius: 12,
            padding: 20, marginBottom: 16,
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5a4a3a', display: 'block', marginBottom: 4 }}>
                  日期
                </label>
                <input type="date" value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  style={{
                    padding: '10px 12px', border: '1px solid #d5cec3',
                    borderRadius: 8, fontSize: 14, background: '#faf8f5',
                  }} />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5a4a3a', display: 'block', marginBottom: 4 }}>
                  原因（選填）
                </label>
                <input value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  placeholder="例：公眾假期"
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #d5cec3',
                    borderRadius: 8, fontSize: 14, background: '#faf8f5',
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
              background: 'white', border: '1px solid #e0d5c1', borderRadius: 12,
              overflow: 'hidden',
            }}>
              {blockedDates.map((bd, i) => (
                <div key={bd.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: i > 0 ? '1px solid #f0ebe3' : 'none',
                }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{bd.date}</span>
                    <span style={{ color: '#999', marginLeft: 12, fontSize: 13 }}>
                      {new Date(bd.date + 'T00:00:00').toLocaleDateString('zh-HK', { weekday: 'long' })}
                    </span>
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
  )
}
