import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TimerPage from './pages/TimerPage';
import StatsPage from './pages/StatsPage';
import LogPage from './pages/LogPage';
import EditExamDateModal from './components/EditExamDateModal';
import SettingsModal from './components/SettingsModal';
import BackupModal from './components/BackupModal';
import ManualLogModal from './components/ManualLogModal';
import { Clock, Check, ShieldCheck, RotateCcw } from 'lucide-react';

import {
  getAppConfig,
  saveAppConfig,
  getAllRecords,
  addRecord,
  updateRecord,
  deleteRecord,
} from './services/storage';
import { timerService } from './services/timerService';
import { saveSnapshot, latestSnapshot, restoreSnapshot } from './services/autoBackup';

const RESTORE_FLAG = 'yanshiji_restore_prompted';

function snapLabel(name) {
  const m = /^snap-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.json$/.exec(name || '');
  if (!m) return name || '';
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return ['home', 'timer', 'stats', 'log'].includes(tab) ? tab : 'home';
  });
  const [config, setConfig] = useState(getAppConfig());
  const [records, setRecords] = useState(getAllRecords());
  const [timerState, setTimerState] = useState(timerService.getState());

  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [lastAddedId, setLastAddedId] = useState(null);

  const [recoveryData, setRecoveryData] = useState(null);
  const [restoreCandidate, setRestoreCandidate] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme_mode || 'light');

    const unsubscribe = timerService.subscribe((state) => setTimerState(state));

    const hb = timerService.checkHeartbeatRecovery();
    if (hb) setRecoveryData(hb);

    return unsubscribe;
  }, []);

  // 启动自愈：本地没有记录、但存在自动备份时，提示恢复
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (getAllRecords().length > 0) return;
        if (localStorage.getItem(RESTORE_FLAG) === '1') return;
        const latest = await latestSnapshot();
        if (alive && latest) setRestoreCandidate(latest);
      } catch {
        /* 自动备份不可用时忽略 */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 数据变更 6 秒后生成一份自动备份（保留最近 5 份）
  useEffect(() => {
    const t = setTimeout(() => {
      saveSnapshot().catch(() => {});
    }, 6000);
    return () => clearTimeout(t);
  }, [records]);

  const refreshRecords = () => setRecords(getAllRecords());
  const refreshAll = () => {
    setRecords(getAllRecords());
    setConfig(getAppConfig());
  };

  const handleRestoreSnapshot = async () => {
    if (!restoreCandidate) return;
    try {
      await restoreSnapshot(restoreCandidate.name);
      localStorage.removeItem(RESTORE_FLAG);
      refreshAll();
    } catch {
      /* 失败则保持原样 */
    }
    setRestoreCandidate(null);
  };

  const handleDismissRestore = () => {
    localStorage.setItem(RESTORE_FLAG, '1');
    setRestoreCandidate(null);
  };

  const handleSaveRecord = (recordData) => {
    const rec = addRecord(recordData);
    refreshRecords();
    if (rec) setLastAddedId(rec.record_id);
  };

  const handleUpdateRecord = (id, fields) => {
    updateRecord(id, fields);
    refreshRecords();
  };

  const handleDeleteRecord = (id) => {
    deleteRecord(id);
    refreshRecords();
  };

  const handleSaveExamDate = (newDate) => {
    const updated = saveAppConfig({ exam_target_date: newDate });
    setConfig(updated);
  };

  const handleConfirmRecovery = () => {
    if (recoveryData) {
      timerService.recoverFromHeartbeat(recoveryData);
      setRecoveryData(null);
      setActiveTab('timer');
    }
  };

  const handleDiscardRecovery = () => {
    timerService.reset();
    setRecoveryData(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main className="app-main">
        {activeTab === 'home' && (
          <HomePage
            config={config}
            records={records}
            timerState={timerState}
            onJumpToTimer={() => setActiveTab('timer')}
            onOpenEditDate={() => setShowEditDateModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {activeTab === 'timer' && (
          <TimerPage
            config={config}
            records={records}
            onSaveRecord={handleSaveRecord}
            onExit={() => setActiveTab('home')}
            onOpenManual={() => setShowManualModal(true)}
          />
        )}

        {activeTab === 'stats' && <StatsPage config={config} records={records} />}

        {activeTab === 'log' && (
          <LogPage
            config={config}
            records={records}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
            onOpenManual={() => setShowManualModal(true)}
            lastAddedId={lastAddedId}
          />
        )}
      </main>

      {activeTab !== 'timer' && (
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setShowSettingsModal(true)}
        />
      )}

      {showEditDateModal && (
        <EditExamDateModal
          currentDate={config.exam_target_date}
          onSave={handleSaveExamDate}
          onClose={() => setShowEditDateModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          config={config}
          onUpdateConfig={setConfig}
          onOpenBackup={() => {
            setShowSettingsModal(false);
            setShowBackupModal(true);
          }}
          onRefreshData={refreshRecords}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {showBackupModal && (
        <BackupModal
          onRefreshData={refreshAll}
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {showManualModal && (
        <ManualLogModal
          subjects={config.subjects || []}
          onSave={handleSaveRecord}
          onClose={() => setShowManualModal(false)}
        />
      )}

      {/* 自动备份自愈提示 */}
      {restoreCandidate && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-container" style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent)' }}>
              <ShieldCheck size={22} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>发现本机自动备份</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: '16px' }}>
              当前没有学习记录，但本机保存着一份 <strong>{snapLabel(restoreCandidate.name)}</strong> 的自动备份。
              要恢复回来吗？
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDismissRestore} className="btn-secondary" style={{ flex: 1, padding: '11px' }}>
                暂不
              </button>
              <button onClick={handleRestoreSnapshot} className="btn-primary" style={{ flex: 1, padding: '11px' }}>
                <RotateCcw size={15} />
                恢复
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 计时遗留心跳恢复 */}
      {recoveryData && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-container" style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--accent)' }}>
              <Clock size={22} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>检测到未结束的计时</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: '16px' }}>
              上次关闭前，你在专注 <strong>{recoveryData.subjectName || '学习'}</strong>（开始于{' '}
              {new Date(recoveryData.startTimestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
              ）。要继续吗？
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleDiscardRecovery} className="btn-secondary" style={{ flex: 1, padding: '11px' }}>
                丢弃
              </button>
              <button onClick={handleConfirmRecovery} className="btn-primary" style={{ flex: 1, padding: '11px' }}>
                <Check size={16} />
                继续
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
