import React from 'react';
import { Timer as TimerIcon } from 'lucide-react';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function TimerWidget({ timerState, onClick }) {
  if (!timerState || timerState.status === 'IDLE') return null;

  const paused = timerState.status === 'PAUSED';
  const s = timerState.elapsedSeconds || 0;
  const clock = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;

  return (
    <button className={`mini-timer ${paused ? 'paused' : ''}`} onClick={onClick}>
      <span className="mini-timer-dot" />
      <TimerIcon size={15} strokeWidth={2} />
      <span className="mini-timer-label">
        {paused ? '已暂停' : '正在专注'} · {timerState.subjectName}
      </span>
      <b>{clock}</b>
    </button>
  );
}
