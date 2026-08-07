import React from 'react';

export default function TrendChart({ dailyTrendData }) {
  if (!dailyTrendData || dailyTrendData.length === 0) return null;

  // 算出最大分钟数以放缩柱状图高度
  const maxMinutes = Math.max(...dailyTrendData.map(d => d.minutes), 60);

  return (
    <div style={{ marginTop: '16px' }}>
      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '12px', fontWeight: 600 }}>
        📊 每日学习时长趋势 (分钟)
      </h4>

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justify: 'space-between',
        height: '140px',
        padding: '12px 6px 0 6px',
        backgroundColor: 'var(--bg-main)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        {dailyTrendData.map((item, idx) => {
          const heightPercent = Math.max(4, Math.round((item.minutes / maxMinutes) * 100));
          const isToday = item.isToday;

          return (
            <div 
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                margin: '0 2px'
              }}
            >
              <div style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                color: item.minutes > 0 ? 'var(--text-main)' : 'transparent',
                fontWeight: 600,
                marginBottom: '4px'
              }}>
                {item.minutes}m
              </div>

              <div 
                title={`${item.date}: ${item.minutes} 分钟`}
                style={{
                  width: '70%',
                  maxWidth: '18px',
                  height: `${heightPercent}%`,
                  background: isToday 
                    ? 'linear-gradient(180deg, var(--accent-gold), #E5A952)' 
                    : item.minutes > 0 ? 'linear-gradient(180deg, var(--primary-blue), #3B82F6)' : 'var(--border-color)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.4s ease'
                }} 
              />

              <div style={{
                fontSize: '0.7rem',
                color: isToday ? 'var(--primary-blue)' : 'var(--text-sub)',
                fontWeight: isToday ? 700 : 500,
                marginTop: '6px'
              }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
