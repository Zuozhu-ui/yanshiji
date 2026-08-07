import React from 'react';
import { Timer as TimerIcon, Play, Pause } from 'lucide-react';

export default function TimerWidget({ timerState, onClick }) {
  if (!timerState || timerState.status === 'IDLE') return null;

  const formatSeconds = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  const isPaused = timerState.status === 'PAUSED';

  return (
    <div 
      onClick={onClick}
      className="animate-pulse"
      style={{
        background: isPaused ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, var(--primary-blue), #2563EB)',
        color: '#FFFFFF',
        padding: '10px 16px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        boxShadow: 'var(--shadow-md)',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <TimerIcon size={20} />
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.9 }}>
            {isPaused ? '⏸ 计时暂停中' : '⏱ 正在学习'} · {timerState.subjectName}
          </span>
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontSize: '1.1rem',
        letterSpacing: '1px'
      }}>
        {formatSeconds(timerState.elapsedSeconds)}
      </div>
    </div>
  );
}
