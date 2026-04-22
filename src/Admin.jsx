{batchSummary.length > 0 && (
  <div style={card}>
    <div style={sectionTitle}>📊 已選日期時段概覽</div>
    <div style={sectionDesc}>顯示每個已選星期嘅時段狀態同涉及日期</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
      {batchSummary.map(s => {
        {/* ✅ 新增：計算該星期對應嘅實際日期 */}
        const datesForDay = [...selDates]
          .filter(d => new Date(d + 'T00:00:00').getDay() === s.day)
          .sort();
        return (
          <div key={s.day} style={{ padding: 14, borderRadius: 8, background: '#faf6f0', textAlign: 'center', border: '1px solid #e0d8cc' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#5c4a3a' }}>週{DAYS[s.day]}</div>
            <div style={{ fontSize: 22, fontWeight: 'bold', color: s.active === 0 ? '#f44336' : '#4CAF50', margin: '6px 0' }}>{s.active}</div>
            <div style={{ fontSize: 11, color: '#999' }}>/ {s.total} 個時段</div>
            {/* ✅ 新增：顯示實際日期 */}
            <div style={{ fontSize: 11, color: '#888', marginTop: 8, lineHeight: 1.6 }}>
              {datesForDay.map(d => (
                <div key={d} style={{
                  display: 'inline-block', padding: '2px 6px', margin: 2,
                  background: '#e8e0d8', borderRadius: 4, fontSize: 10
                }}>
                  {d.slice(5)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
