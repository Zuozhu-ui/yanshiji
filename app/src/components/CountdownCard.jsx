import React from 'react';
import { Settings, Calendar, Trophy, Sparkles } from 'lucide-react';
import { calculateExamCountdown } from '../services/storage';

export default function CountdownCard({ examTargetDate, onOpenEditDate }) {
  const { days, isPast, expiredDays } = calculateExamCountdown(examTargetDate);

  // 计算星期几
  const getWeekdayName = (dateStr) => {
    if (!dateStr) return '';
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return weekdays[dt.getDay()];
  };

  return (
    <div 
      className={`card ${isPast ? 'card-wood' : ''}`} 
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: isPast 
          ? 'linear-gradient(135deg, var(--bg-wood), var(--accent-gold-light))' 
          : 'linear-gradient(135deg, var(--bg-card), var(--primary-blue-light))',
        borderColor: isPast ? 'var(--accent-gold)' : 'var(--primary-blue)',
        boxShadow: 'var(--shadow-md)',
        padding: '24px 20px'
      }}
    >
      {/* 顶部标题与设置按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={18} color="var(--primary-blue)" />
          <span style={{ fontWeight: 600, color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            {isPast ? '考研终章' : '考研还有'}
          </span>
        </div>

        <button 
          onClick={onOpenEditDate}
          style={{
            background: 'rgba(255,255,255,0.7)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Settings size={14} />
          <span>修改目标</span>
        </button>
      </div>

      {/* 倒计时主数字 */}
      {!isPast ? (
        <div style={{ textAlign: 'center', margin: '12px 0 16px 0' }}>
          <div style={{
            fontSize: '4.2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-main)',
            lineHeight: 1,
            letterSpacing: '-1px'
          }}>
            {days}
            <span style={{ fontSize: '1.4rem', fontWeight: 600, marginLeft: '6px', color: 'var(--primary-blue)' }}>天</span>
          </div>
          <p style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-sub)' }}>
            目标日期：{examTargetDate} {getWeekdayName(examTargetDate)}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', margin: '12px 0 16px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Trophy size={28} color="var(--accent-gold)" />
            <Sparkles size={24} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginBottom: '4px' }}>
            {expiredDays === 0 ? '今天正是考试日！' : '已到考试日期'}
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {expiredDays === 0 ? '放平心态，合上笔盖，拔剑出鞘！' : `已考完 · 考试已结束 ${expiredDays} 天`}
          </p>
        </div>
      )}

      {/* 底部进度感应条 */}
      <div style={{
        height: '4px',
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.06)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: isPast ? '100%' : `${Math.max(5, Math.min(100, 100 - (days / 365 * 100)))}%`,
          background: isPast 
            ? 'linear-gradient(90deg, #F59E0B, #10B981)' 
            : 'linear-gradient(90deg, var(--primary-blue), var(--accent-gold))',
          transition: 'width 0.6s ease'
        }} />
      </div>
    </div>
  );
}
