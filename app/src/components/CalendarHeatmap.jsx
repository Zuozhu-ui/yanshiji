import React, { useState } from 'react';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../services/storage';

export default function CalendarHeatmap({ records }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0 - 11

  // 计算打卡强度与天数字典
  const dateMinutesMap = {};
  records.forEach(r => {
    if (!r.record_date) return;
    dateMinutesMap[r.record_date] = (dateMinutesMap[r.record_date] || 0) + (r.duration_min || 0);
  });

  // 计算连续打卡天数 (Streak)
  const calculateStreak = () => {
    let streak = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    let checkDate = new Date(today);
    
    // 如果今天没打卡，先查昨天
    const todayStr = formatDate(today);
    if (!dateMinutesMap[todayStr]) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = formatDate(checkDate);
      if (dateMinutesMap[dateStr] && dateMinutesMap[dateStr] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  // 当月天数与首日星期几
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0(日)-6(六)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  // 填充空白
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    daysArray.push(`${year}-${monthStr}-${dayStr}`);
  }

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const getHeatColor = (mins) => {
    if (!mins || mins === 0) return 'var(--bg-main)';
    if (mins < 60) return '#C6E2FF';
    if (mins < 180) return '#79BBFF';
    if (mins < 360) return '#409EFF';
    return '#1A73E8'; // 高强度深蓝
  };

  return (
    <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
      {/* 连续打卡 Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        marginBottom: '14px',
        paddingBottom: '10px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={20} color="#F59E0B" fill="#F59E0B" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>学习打卡历</span>
        </div>

        <div style={{
          backgroundColor: 'var(--accent-gold-light)',
          color: 'var(--accent-gold)',
          fontWeight: 700,
          fontSize: '0.8rem',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--accent-gold)'
        }}>
          连续打卡 {currentStreak} 天 🔥
        </div>
      </div>

      {/* 月份切换头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={prevMonth} className="btn-outline" style={{ padding: '4px 8px' }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
          {year}年 {month + 1}月
        </span>
        <button onClick={nextMonth} className="btn-outline" style={{ padding: '4px 8px' }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 星期表头 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-sub)', marginBottom: '6px' }}>
        <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
      </div>

      {/* 日历网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {daysArray.map((dateStr, index) => {
          if (!dateStr) {
            return <div key={`empty-${index}`} style={{ height: '32px' }} />;
          }

          const mins = dateMinutesMap[dateStr] || 0;
          const dayNum = parseInt(dateStr.split('-')[2], 10);
          const isToday = dateStr === formatDate(new Date());

          return (
            <div
              key={dateStr}
              title={`${dateStr}: ${mins} 分钟`}
              style={{
                height: '32px',
                borderRadius: '6px',
                backgroundColor: getHeatColor(mins),
                color: mins >= 180 ? '#FFFFFF' : 'var(--text-main)',
                border: isToday ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: isToday ? 700 : 500
              }}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}
