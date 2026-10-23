import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  ShieldCheck,
  AlertCircle,
  Send,
  Copy,
  RotateCcw,
  Clock,
  Info,
} from 'lucide-react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { exportBackupJSON, importBackupJSON } from '../services/storage';
import { saveBackupToDevice, pickBackupFile, isNativeApp } from '../services/backupFile';
import { listSnapshots, restoreSnapshot } from '../services/autoBackup';
import { BRAND } from '../brand';

const native = isNativeApp();

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function snapTime(name) {
  const m = /^snap-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.json$/.exec(name);
  if (!m) return name;
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
}

function backupFileName() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${BRAND.name}_备份_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.json`;
}

export default function BackupModal({ onRefreshData, onClose }) {
  const [mode, setMode] = useState('merge');
  const [status, setStatus] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    refreshSnapshots();
  }, []);

  async function refreshSnapshots() {
    try {
      setSnapshots(await listSnapshots());
    } catch {
      setSnapshots([]);
    }
  }

  /* ---------- 导出 ---------- */

  async function handleSaveFile() {
    setBusy(true);
    setStatus(null);
    try {
      const json = exportBackupJSON();
      const name = backupFileName();

      if (native) {
        const res = await saveBackupToDevice(name, json);
        if (res && res.cancelled) {
          setStatus({ type: 'info', text: '已取消保存。' });
        } else {
          setStatus({
            type: 'success',
            text: `已保存：${name}。之后可以在微信聊天里点「＋ → 文件」把它发出去。`,
          });
        }
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatus({ type: 'success', text: '已开始下载备份文件。' });
      }
    } catch (e) {
      setStatus({ type: 'error', text: '保存失败：' + (e.message || e) });
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    if (!native) {
      setStatus({ type: 'info', text: '网页版不支持直接分享，请用「保存备份文件」。' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const name = backupFileName();
      const written = await Filesystem.writeFile({
        path: name,
        data: exportBackupJSON(),
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: BRAND.name + '备份',
        files: [written.uri],
        dialogTitle: '发送备份文件',
      });
      setStatus({
        type: 'success',
        text: '已打开系统分享。如果微信只收到文字，请改用「保存备份文件」再从微信的文件入口发送。',
      });
    } catch (e) {
      setStatus({ type: 'info', text: '已取消分享。' });
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    const json = exportBackupJSON();
    try {
      await navigator.clipboard.writeText(json);
      setStatus({ type: 'success', text: '备份内容已复制到剪贴板，可粘贴到备忘录里保存。' });
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = json;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setStatus({ type: 'success', text: '备份内容已复制到剪贴板。' });
      } catch {
        setStatus({ type: 'error', text: '复制失败，请改用「保存备份文件」。' });
      }
    }
  }

  /* ---------- 导入 ---------- */

  function doImport(text) {
    const res = importBackupJSON(text, mode);
    if (res.success) {
      setStatus({ type: 'success', text: `导入成功（${res.mode}），共 ${res.count} 条记录。` });
      onRefreshData();
      refreshSnapshots();
    } else {
      setStatus({ type: 'error', text: res.message || '导入失败，文件格式不正确。' });
    }
  }

  async function handlePickFile() {
    setStatus(null);
    if (native) {
      try {
        const res = await pickBackupFile();
        if (res && res.cancelled) return;
        if (!res || !res.data) {
          setStatus({ type: 'error', text: '没有读到文件内容。' });
          return;
        }
        doImport(res.data);
      } catch (e) {
        setStatus({ type: 'error', text: '读取失败：' + (e.message || e) });
      }
      return;
    }
    fileRef.current?.click();
  }

  function handleWebFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => doImport(String(evt.target.result || ''));
    reader.onerror = () => setStatus({ type: 'error', text: '无法读取所选文件。' });
    reader.readAsText(file);
    e.target.value = '';
  }

  /* ---------- 自动备份 ---------- */

  async function handleRestore(snap) {
    if (!window.confirm(`用 ${snapTime(snap.name)} 的自动备份恢复？当前的记录会被覆盖。`)) return;
    setBusy(true);
    try {
      const res = await restoreSnapshot(snap.name);
      if (res.success) {
        setStatus({ type: 'success', text: `已恢复到 ${snapTime(snap.name)}，共 ${res.count} 条记录。` });
        onRefreshData();
      } else {
        setStatus({ type: 'error', text: res.message || '恢复失败。' });
      }
    } catch (e) {
      setStatus({ type: 'error', text: '恢复失败：' + (e.message || e) });
    } finally {
      setBusy(false);
    }
  }

  /* ---------- UI ---------- */

  const banner = status && (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-sm)',
        marginBottom: '14px',
        fontSize: '12px',
        lineHeight: 1.6,
        background:
          status.type === 'success' ? 'var(--accent-soft)' : status.type === 'error' ? '#FBE9E5' : 'var(--paper-2)',
        color: status.type === 'error' ? 'var(--danger)' : 'var(--ink-1)',
        border: `1px solid ${status.type === 'error' ? '#EFC3BA' : 'var(--accent-line)'}`,
      }}
    >
      {status.type === 'success' ? (
        <ShieldCheck size={15} style={{ flex: 'none', marginTop: 2 }} />
      ) : status.type === 'error' ? (
        <AlertCircle size={15} style={{ flex: 'none', marginTop: 2 }} />
      ) : (
        <Info size={15} style={{ flex: 'none', marginTop: 2 }} />
      )}
      <span>{status.text}</span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>备份与恢复</h3>
          <button onClick={onClose} style={{ background: 'transparent', padding: '4px', color: 'var(--ink-3)' }}>
            <X size={19} />
          </button>
        </div>

        {banner}

        {/* 导出 */}
        <section className="card" style={{ padding: '15px', marginBottom: '12px', background: 'var(--bg-main)' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px' }}>导出到手机</h4>
          <p style={{ fontSize: '12px', color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: '12px' }}>
            生成一个 JSON 文件，自己选保存位置（下载目录、网盘都行）。
          </p>

          <button
            onClick={handleSaveFile}
            disabled={busy}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '13.5px' }}
          >
            <Download size={17} />
            保存备份文件
          </button>

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleShare}
              disabled={busy}
              className="btn-secondary"
              style={{ flex: 1, padding: '10px', fontSize: '12px' }}
            >
              <Send size={15} />
              发送给微信/QQ
            </button>
            <button onClick={handleCopy} className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '12px' }}>
              <Copy size={15} />
              复制备份内容
            </button>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--ink-3)', lineHeight: 1.7, marginTop: '10px' }}>
            建议在微信里用「＋ → 文件」发送保存好的备份文件；直接分享时，微信可能只收取文字。
          </p>
        </section>

        {/* 导入 */}
        <section className="card" style={{ padding: '15px', marginBottom: '12px', background: 'var(--bg-main)' }}>
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>从备份恢复</h4>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="radio" name="importMode" checked={mode === 'merge'} onChange={() => setMode('merge')} />
              合并（保留现有）
            </label>
            <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
              <input type="radio" name="importMode" checked={mode === 'overwrite'} onChange={() => setMode('overwrite')} />
              覆盖（清空再导入）
            </label>
          </div>

          <button onClick={handlePickFile} className="btn-secondary" style={{ width: '100%', padding: '12px', fontSize: '13px' }}>
            <Upload size={16} />
            选择备份文件
          </button>

          <input ref={fileRef} type="file" accept=".json,application/json" onChange={handleWebFile} style={{ display: 'none' }} />

          <p style={{ fontSize: '11px', color: 'var(--ink-3)', lineHeight: 1.7, marginTop: '10px' }}>
            覆盖模式会先清空当前记录再导入；合并模式会按内容去重，不会把同一份备份导入两遍。
          </p>
        </section>

        {/* 自动备份 */}
        <section className="card" style={{ padding: '15px', marginBottom: '12px', background: 'var(--bg-main)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>自动备份</h4>
            <span style={{ fontSize: '10.5px', color: 'var(--ink-3)' }}>保留最近 5 份</span>
          </div>

          {!native ? (
            <p style={{ fontSize: '11.5px', color: 'var(--ink-3)', lineHeight: 1.7 }}>
              自动备份只在手机 App 里生效。
            </p>
          ) : snapshots.length === 0 ? (
            <p style={{ fontSize: '11.5px', color: 'var(--ink-3)', lineHeight: 1.7 }}>
              还没有自动备份。有学习记录后，修改数据时会自动生成。
            </p>
          ) : (
            <div>
              {snapshots.map((s) => (
                <div
                  key={s.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--line-soft)',
                  }}
                >
                  <Clock size={14} color="var(--ink-3)" style={{ flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: 'var(--ink-1)' }}>{snapTime(s.name)}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--ink-3)' }}>{fmtSize(s.size)}</div>
                  </div>
                  <button
                    onClick={() => handleRestore(s)}
                    disabled={busy}
                    className="btn-outline"
                    style={{ padding: '6px 10px', fontSize: '11px', flex: 'none' }}
                  >
                    <RotateCcw size={13} />
                    恢复
                  </button>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontSize: '11px', color: 'var(--ink-3)', lineHeight: 1.7, marginTop: '10px' }}>
            自动备份只存在本机应用目录里，卸载 App 会一起删除。重要数据请定期「保存备份文件」到手机。
          </p>
        </section>

        <button onClick={onClose} className="btn-outline" style={{ width: '100%', padding: '12px' }}>
          关闭
        </button>
      </div>
    </div>
  );
}
