import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, ChevronLeft, PenLine, Check } from 'lucide-react';
import Ring from '../components/Ring';
import { timerService, TIMER_STATUS, TIMER_MODE } from '../services/timerService';
import { formatDate } from '../services/storage';

function pad(n) {
  return String(n).padStart(2, '0');
}

function clockText(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function fmtHM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function TimerPage({ config, records, onSaveRecord, onExit, onOpenManual }) {
  const [timerState, setTimerState] = useState(timerService.getState());
  const [selectedSubject, setSelectedSubject] = useState(() => {
    const st = timerService.getState();
    if (st.status !== TIMER_STATUS.IDLE && st.subjectName) return st.subjectName;
    return config.subjects?.[0]?.name || '其他';
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [stopData, setStopData] = useState(null);
  const [editableDurationMin, setEditableDurationMin] = useState(1);
  const [editableSubject, setEditableSubject] = useState('');
  const [studyContent, setStudyContent] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const unsubscribe = timerService.subscribe(setTimerState);
    return unsubscribe;
  }, []);

  const isIdle = timerState.status === TIMER_STATUS.IDLE;
  const isRunning = timerState.status === TIMER_STATUS.RUNNING;
  const isPaused = timerState.status === TIMER_STATUS.PAUSED;

  const mode = timerState.mode || TIMER_MODE.COUNT_UP;
  const target = timerState.targetMinutes || 25;
  const elapsed = timerState.elapsedSeconds || 0;
  const isPomodoro = mode === TIMER_MODE.POMODORO;

  const displaySeconds = isPomodoro ? Math.max(0, target * 60 - elapsed) : elapsed;
  const progress = isPomodoro
    ? Math.min(1, elapsed / (target * 60))
    : Math.min(1, elapsed / 3600);

  const activeName = isIdle ? selectedSubject : timerState.subjectName;
  let subjects = config.subjects || [];
  if (activeName && !subjects.some((s) => s.name === activeName)) {
    subjects = [{ name: activeName, color: '#9AA5B1' }, ...subjects];
  }

  /* —— 今日 / 本周 / 连续 —— */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  const todayMin = records
    .filter((r) => r.record_date === todayStr)
    .reduce((s, r) => s + (r.duration_min || 0), 0);

  const dayOfWeek = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek - 1));
  const mondayStr = formatDate(monday);

  const weekMin = records
    .filter((r) => r.record_date >= mondayStr && r.record_date <= todayStr)
    .reduce((s, r) => s + (r.duration_min || 0), 0);

  const daySet = new Set(records.map((r) => r.record_date).filter(Boolean));
  let streak = 0;
  const cursor = new Date(today);
  if (!daySet.has(formatDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (daySet.has(formatDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  /* —— 操作 —— */
  const pickSubject = (name) => {
    if (!isIdle) return;
    setSelectedSubject(name);
    timerService.setSubject(name);
  };

  const handleStart = () => timerService.start(selectedSubject);
  const handlePause = () => timerService.pause();
  const handleResume = () => timerService.resume();

  const handleStop = () => {
    const data = timerService.stop();
    setStopData(data);
    setEditableDurationMin(Math.max(1, data.duration_min));
    setEditableSubject(data.subject_name || selectedSubject);
    setStudyContent('');
    setShowSaveModal(true);
  };

  const handleReset = () => {
    if (window.confirm('放弃这次计时？已经计的时间不会保存。')) timerService.reset();
  };

  const handleConfirmSave = () => {
    if (!stopData) return;
    const mins = parseInt(editableDurationMin, 10);
    if (Number.isNaN(mins) || mins < 1) {
      setToast('时长至少 1 分钟');
      return;
    }

    const finalSubject = editableSubject.trim() || '其他';
    onSaveRecord({
      ...stopData,
      duration_min: mins,
      subject_name: finalSubject,
      study_content: studyContent,
    });

    setShowSaveModal(false);
    setStopData(null);
    setToast(`已记录 · ${finalSubject} ${mins} 分钟`);
    setTimeout(() => setToast(''), 2600);
  };

  return (
    <div className="focus-page">
      <div className="focus-top">
        <button className="focus-icon-btn" onClick={onExit} aria-label="返回">
          <ChevronLeft size={20} />
        </button>
        <div className="focus-title">
          {isIdle ? '准备专注' : isPaused ? '已暂停' : `专注中 · ${timerState.subjectName}`}
        </div>
        <button className="focus-icon-btn" onClick={onOpenManual} aria-label="手动补录">
          <PenLine size={17} />
        </button>
      </div>

      <div className="focus-chips">
        {subjects.map((s) => (
          <button
            key={s.name}
            className={`chip ${activeName === s.name ? 'on' : ''}`}
            onClick={() => pickSubject(s.name)}
            disabled={!isIdle}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="focus-modes">
        <button
          className={mode === TIMER_MODE.COUNT_UP ? 'on' : ''}
          onClick={() => timerService.setMode(TIMER_MODE.COUNT_UP)}
          disabled={!isIdle}
        >
          正计时
        </button>
        <button
          className={isPomodoro && target === 25 ? 'on' : ''}
          onClick={() => timerService.setMode(TIMER_MODE.POMODORO, 25)}
          disabled={!isIdle}
        >
          番茄 25
        </button>
        <button
          className={isPomodoro && target === 50 ? 'on' : ''}
          onClick={() => timerService.setMode(TIMER_MODE.POMODORO, 50)}
          disabled={!isIdle}
        >
          番茄 50
        </button>
      </div>

      <div className="dial">
        <Ring
          size={280}
          stroke={6}
          value={isIdle ? 0 : progress}
          track="rgba(255,255,255,.07)"
          gradient={['#8FE0BC', '#E3B471']}
        />
        <div className="dial-inner">
          <div className="dial-time">{clockText(displaySeconds)}</div>
          <div className="dial-label">{isPomodoro ? 'REMAINING' : 'ELAPSED'}</div>
          <div className="dial-sub">
            {isPomodoro
              ? `目标 ${target} 分钟 · 已专注 ${Math.floor(elapsed / 60)} 分钟`
              : isIdle
                ? '选好科目，按下开始'
                : '保持节奏，别急着看表'}
          </div>
        </div>
      </div>

      <div className="focus-stats">
        <div className="focus-stat">
          <b>{fmtHM(todayMin)}</b>
          <span>今日</span>
        </div>
        <div className="focus-stat">
          <b>{streak}</b>
          <span>连续天数</span>
        </div>
        <div className="focus-stat">
          <b>{fmtHM(weekMin)}</b>
          <span>本周</span>
        </div>
      </div>

      <button className="focus-link" onClick={onOpenManual}>
        <PenLine size={13} />
        直接录入学习时长
      </button>

      <div className="focus-controls">
        <button className="ctrl-ghost" onClick={handleReset} disabled={isIdle} aria-label="放弃">
          <RotateCcw size={19} />
        </button>

        {isIdle && (
          <button className="ctrl-main" onClick={handleStart} aria-label="开始">
            <Play size={28} fill="currentColor" />
          </button>
        )}
        {isRunning && (
          <button className="ctrl-main paused" onClick={handlePause} aria-label="暂停">
            <Pause size={28} fill="currentColor" />
          </button>
        )}
        {isPaused && (
          <button className="ctrl-main" onClick={handleResume} aria-label="继续">
            <Play size={28} fill="currentColor" />
          </button>
        )}

        <button className="ctrl-ghost" onClick={handleStop} disabled={isIdle} aria-label="结束并保存">
          <Square size={17} fill="currentColor" />
        </button>
      </div>

      <div className="focus-hint">
        {isIdle ? '屏幕会保持常亮 · 计时不会因为切页中断' : '结束会生成一条学习记录'}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 120,
            transform: 'translateX(-50%)',
            background: 'rgba(20,32,28,.92)',
            border: '1px solid rgba(255,255,255,.12)',
            color: '#cfe8da',
            fontSize: 12,
            padding: '9px 16px',
            borderRadius: 999,
            zIndex: 120,
          }}
        >
          {toast}
        </div>
      )}

      {showSaveModal && stopData && (
        <div className="modal-overlay">
          <div className="modal-container sheet-dark">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '4px' }}>保存这次专注</h3>
            <p style={{ fontSize: '12px', color: '#8fa79b', marginBottom: '16px' }}>
              {stopData.subject_name} · 开始于{' '}
              {new Date(stopData.start_timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>科目</label>
                <input value={editableSubject} onChange={(e) => setEditableSubject(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>时长（分钟）</label>
                <input
                  type="number"
                  min="1"
                  value={editableDurationMin}
                  onChange={(e) => setEditableDurationMin(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>学了什么</label>
                <textarea
                  rows="3"
                  placeholder="例如：第三章习题、背 80 个单词…"
                  value={studyContent}
                  onChange={(e) => setStudyContent(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setStopData(null);
                }}
                className="btn-secondary"
                style={{ flex: 1, padding: '12px' }}
              >
                丢弃
              </button>
              <button onClick={handleConfirmSave} className="btn-primary" style={{ flex: 1.4, padding: '12px' }}>
                <Check size={16} />
                保存记录
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
