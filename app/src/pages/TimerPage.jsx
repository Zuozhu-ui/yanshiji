import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Save, Trash2, CheckCircle2, Edit3, Clock, Plus } from 'lucide-react';
import { timerService, TIMER_STATUS, TIMER_MODE } from '../services/timerService';
import { formatDate, saveAppConfig } from '../services/storage';

export default function TimerPage({ config, onSaveRecord }) {
  const [timerState, setTimerState] = useState(timerService.getState());
  const [pageMode, setPageMode] = useState('DIRECT_INPUT'); // 'DIRECT_INPUT' (直接手动录入) | 'LIVE_TIMER' (实时计时)

  // 1. 实时计时状态
  const [selectedSubject, setSelectedSubject] = useState(timerState.subjectName || config.subjects[0]?.name || '数学');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [pomoMode, setPomoMode] = useState(timerState.mode || TIMER_MODE.COUNT_UP);
  const [pomoTarget, setPomoTarget] = useState(timerState.targetMinutes || 25);

  // 实时计时结束弹窗状态
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [stopData, setStopData] = useState(null);
  const [editableDurationMin, setEditableDurationMin] = useState(1);
  const [editableSubject, setEditableSubject] = useState('');

  // 2. 直接手动打卡表格状态
  const [directDate, setDirectDate] = useState(formatDate(new Date()));
  const [directSubject, setDirectSubject] = useState(config.subjects[0]?.name || '数学');
  const [isDirectCustomSub, setIsDirectCustomSub] = useState(false);
  const [directCustomSubInput, setDirectCustomSubInput] = useState('');
  const [directDuration, setDirectDuration] = useState(60);
  const [directContent, setDirectContent] = useState('');

  const [studyContent, setStudyContent] = useState('');
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => {
    const unsubscribe = timerService.subscribe((state) => {
      setTimerState(state);
      if (state.status !== TIMER_STATUS.IDLE) {
        setPageMode('LIVE_TIMER'); // 如果正在计时，自动保持在实时计时标签
      }
    });
    return unsubscribe;
  }, []);

  const getActiveLiveSubject = () => {
    if (isCustomSubject) return customSubjectInput.trim() || '自定义科目';
    return selectedSubject;
  };

  const getActiveDirectSubject = () => {
    if (isDirectCustomSub) return directCustomSubInput.trim() || '自定义科目';
    return directSubject;
  };

  // 一键直接手动保存打卡
  const handleDirectSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(directDuration, 10);
    if (isNaN(mins) || mins < 1) {
      alert('专注时长至少为 1 分钟！');
      return;
    }

    const finalSub = getActiveDirectSubject();

    // 如果是新科目，记入全局
    if (!config.subjects.some(s => s.name === finalSub)) {
      const colors = ['#4A90D9', '#E0705A', '#7B6CCF', '#4CB8A4', '#D9A05B', '#6B9E7A'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      saveAppConfig({
        subjects: [...config.subjects, { name: finalSub, color: randomColor }]
      });
    }

    const now = Date.now();
    onSaveRecord({
      start_timestamp: now - (mins * 60000),
      end_timestamp: now,
      duration_min: mins,
      subject_name: finalSub,
      study_content: directContent,
      record_date: directDate
    });

    setAlertMsg(`成功记录！[${finalSub}] 本次专注 ${mins} 分钟。`);
    setDirectContent('');
    setTimeout(() => setAlertMsg(''), 3500);
  };

  // 实时计时相关控制
  const handleStartLive = () => {
    timerService.start(getActiveLiveSubject());
  };
  const handlePauseLive = () => timerService.pause();
  const handleResumeLive = () => timerService.resume();
  const handleStopLive = () => {
    const data = timerService.stop();
    setStopData(data);
    setEditableDurationMin(Math.max(1, data.duration_min));
    setEditableSubject(data.subject_name || getActiveLiveSubject());
    setStudyContent('');
    setShowSaveModal(true);
  };
  const handleResetLive = () => {
    if (window.confirm('确认放弃本次计时吗？')) timerService.reset();
  };

  const handleConfirmLiveSave = () => {
    if (!stopData) return;
    const mins = parseInt(editableDurationMin, 10);
    if (isNaN(mins) || mins < 1) return;

    const finalSub = editableSubject.trim() || '其他';
    if (!config.subjects.some(s => s.name === finalSub)) {
      const colors = ['#4A90D9', '#E0705A', '#7B6CCF', '#4CB8A4', '#D9A05B', '#6B9E7A'];
      saveAppConfig({
        subjects: [...config.subjects, { name: finalSub, color: colors[0] }]
      });
    }

    onSaveRecord({
      ...stopData,
      duration_min: mins,
      subject_name: finalSub,
      study_content: studyContent
    });

    setShowSaveModal(false);
    setStopData(null);
    setAlertMsg(`打卡成功！[${finalSub}] 专注 ${mins} 分钟已存入日志。`);
    setTimeout(() => setAlertMsg(''), 3500);
  };

  const formatClock = (sec) => {
    let displaySec = sec;
    if (pomoMode === TIMER_MODE.POMODORO) {
      displaySec = Math.max(0, (pomoTarget * 60) - sec);
    }
    const h = Math.floor(displaySec / 3600);
    const m = Math.floor((displaySec % 3600) / 60);
    const s = displaySec % 60;
    if (h > 0) return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
    return [m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  const isIdle = timerState.status === TIMER_STATUS.IDLE;
  const isRunning = timerState.status === TIMER_STATUS.RUNNING;
  const isPaused = timerState.status === TIMER_STATUS.PAUSED;

  return (
    <div className="animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', minHeight: '80vh' }}>
      
      {/* 提示消息 */}
      {alertMsg && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#ECFDF5',
          color: '#059669',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #A7F3D0'
        }}>
          <CheckCircle2 size={18} />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* 顶部主切换栏：直接录入时间 vs 秒表实时计时 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setPageMode('DIRECT_INPUT')}
          className={pageMode === 'DIRECT_INPUT' ? 'btn-primary' : 'btn-outline'}
          disabled={!isIdle}
          style={{ flex: 1, padding: '12px 8px', fontSize: '0.9rem' }}
        >
          ✍️ 直接录入学习时间
        </button>

        <button
          onClick={() => setPageMode('LIVE_TIMER')}
          className={pageMode === 'LIVE_TIMER' ? 'btn-primary' : 'btn-outline'}
          style={{ flex: 1, padding: '12px 8px', fontSize: '0.9rem', position: 'relative' }}
        >
          ⏱ 秒表/番茄钟计时
          {!isIdle && (
            <span style={{
              width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: '50%',
              position: 'absolute', top: 6, right: 6
            }} />
          )}
        </button>
      </div>

      {/* ===== 模式 A: 直接手动录入学习时间 (无需开启秒表计时) ===== */}
      {pageMode === 'DIRECT_INPUT' && (
        <form onSubmit={handleDirectSubmit} className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} color="var(--primary-blue)" />
            快捷录入学习时间
          </h3>

          {/* 1. 打卡日期 */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>
              学习日期
            </label>
            <input
              type="date"
              value={directDate}
              onChange={(e) => setDirectDate(e.target.value)}
              required
            />
          </div>

          {/* 2. 科目选择或自定义 */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)' }}>
                学习科目
              </label>
              <button
                type="button"
                onClick={() => setIsDirectCustomSub(!isDirectCustomSub)}
                style={{ background: 'none', color: 'var(--primary-blue)', fontSize: '0.78rem', fontWeight: 600 }}
              >
                {isDirectCustomSub ? '选择已有科目' : '＋ 自定义新科目'}
              </button>
            </div>

            {!isDirectCustomSub ? (
              <select value={directSubject} onChange={(e) => setDirectSubject(e.target.value)}>
                {(config.subjects || []).map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="请输入自定义科目名称..."
                value={directCustomSubInput}
                onChange={(e) => setDirectCustomSubInput(e.target.value)}
                required
              />
            )}
          </div>

          {/* 3. 手动录入时长 (分钟) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>
              学习专注时长 (分钟)
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max="1440"
                value={directDuration}
                onChange={(e) => setDirectDuration(e.target.value)}
                required
                style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', flexShrink: 0 }}>
                = {Math.floor(directDuration / 60)}h {directDuration % 60}m
              </span>
            </div>

            {/* 快速选择加号 */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              {[30, 45, 60, 90, 120, 180].map(m => (
                <button
                  key={m}
                  type="button"
                  className="btn-outline"
                  onClick={() => setDirectDuration(m)}
                  style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* 4. 具体学习内容 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)', display: 'block', marginBottom: '4px' }}>
              具体学习内容 (可选)
            </label>
            <textarea
              rows="3"
              placeholder="例如：完成线代前三章错题复盘、背完 100 个英语长难句..."
              value={directContent}
              onChange={(e) => setDirectContent(e.target.value)}
            />
          </div>

          {/* 提交按钮 */}
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}>
            <Save size={18} />
            保存学习记录
          </button>
        </form>
      )}

      {/* ===== 模式 B: 实时秒表 / 番茄钟 计时 ===== */}
      {pageMode === 'LIVE_TIMER' && (
        <>
          {/* 子模式 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button
              onClick={() => { setPomoMode(TIMER_MODE.COUNT_UP); timerService.setMode(TIMER_MODE.COUNT_UP); }}
              className={pomoMode === TIMER_MODE.COUNT_UP ? 'btn-primary' : 'btn-outline'}
              disabled={!isIdle}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
            >
              正计时
            </button>
            <button
              onClick={() => { setPomoMode(TIMER_MODE.POMODORO); setPomoTarget(25); timerService.setMode(TIMER_MODE.POMODORO, 25); }}
              className={pomoMode === TIMER_MODE.POMODORO && pomoTarget === 25 ? 'btn-primary' : 'btn-outline'}
              disabled={!isIdle}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
            >
              番茄 25m
            </button>
            <button
              onClick={() => { setPomoMode(TIMER_MODE.POMODORO); setPomoTarget(50); timerService.setMode(TIMER_MODE.POMODORO, 50); }}
              className={pomoMode === TIMER_MODE.POMODORO && pomoTarget === 50 ? 'btn-primary' : 'btn-outline'}
              disabled={!isIdle}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
            >
              番茄 50m
            </button>
          </div>

          {/* 科目 */}
          <div className="card" style={{ padding: '14px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                专注科目
              </label>
              {isIdle && (
                <button onClick={() => setIsCustomSubject(!isCustomSubject)} style={{ background: 'none', color: 'var(--primary-blue)', fontSize: '0.75rem', fontWeight: 600 }}>
                  {isCustomSubject ? '选择已有' : '＋ 新输入'}
                </button>
              )}
            </div>

            {!isCustomSubject ? (
              <select value={selectedSubject} onChange={(e) => { setSelectedSubject(e.target.value); timerService.setSubject(e.target.value); }} disabled={!isIdle}>
                {(config.subjects || []).map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            ) : (
              <input
                type="text"
                placeholder="科目名称..."
                value={customSubjectInput}
                onChange={(e) => setCustomSubjectInput(e.target.value)}
                onBlur={() => timerService.setSubject(getActiveLiveSubject())}
                disabled={!isIdle}
              />
            )}
          </div>

          {/* 数字计时盘 */}
          <div className="card" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justify: 'center',
            padding: '30px 20px',
            textAlign: 'center',
            background: isRunning ? 'linear-gradient(180deg, var(--bg-card), var(--primary-blue-light))' : 'var(--bg-card)'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 600, marginBottom: '8px' }}>
              {isIdle ? '准备开始专注' : isRunning ? `正在专注 · ${getActiveLiveSubject()}` : '计时已暂停'}
            </div>
            <div style={{ fontSize: '4.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '12px 0' }}>
              {formatClock(timerState.elapsedSeconds)}
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            {isIdle && (
              <button onClick={handleStartLive} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                <Play size={20} fill="white" /> 开启秒表计时
              </button>
            )}

            {isRunning && (
              <>
                <button onClick={handlePauseLive} className="btn-accent" style={{ flex: 1, padding: '12px' }}>
                  <Pause size={18} fill="white" /> 暂停
                </button>
                <button onClick={handleStopLive} className="btn-primary" style={{ flex: 1.5, padding: '12px' }}>
                  <Square size={18} fill="white" /> 结束保存
                </button>
              </>
            )}

            {isPaused && (
              <>
                <button onClick={handleResetLive} className="btn-outline" style={{ padding: '12px' }}>
                  <RotateCcw size={18} />
                </button>
                <button onClick={handleResumeLive} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                  <Play size={18} fill="white" /> 继续
                </button>
                <button onClick={handleStopLive} className="btn-accent" style={{ flex: 1, padding: '12px' }}>
                  <Square size={18} fill="white" /> 保存
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* 实时计时结束弹窗 */}
      {showSaveModal && stopData && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>
              确认打卡保存
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'block', marginBottom: '2px' }}>
                  科目
                </label>
                <input
                  type="text"
                  value={editableSubject}
                  onChange={(e) => setEditableSubject(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'block', marginBottom: '2px' }}>
                  时长 (分钟)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editableDurationMin}
                  onChange={(e) => setEditableDurationMin(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                具体学习内容 (可选)
              </label>
              <textarea
                rows="3"
                value={studyContent}
                onChange={(e) => setStudyContent(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowSaveModal(false); timerService.reset(); }} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>
                丢弃
              </button>
              <button onClick={handleConfirmLiveSave} className="btn-primary" style={{ flex: 1.5, padding: '10px' }}>
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
