/* 学时记 · 数据存储与核心服务（Storage Service）
 *
 * 兼容性约定（重要）：
 * 1. localStorage 的 key 继续沿用 yanshiji_*，保证覆盖安装后旧数据原样可用；
 * 2. 备份文件的应用标识从「研时记」改为「学时记」，但导入同时接受旧标识；
 * 3. 字段名（exam_target_date 等）保持不变，避免迁移风险。
 */
import { BRAND } from '../brand.js';

export const STORAGE_KEYS = {
  RECORDS: 'yanshiji_study_records_v1',
  CONFIG: 'yanshiji_app_config_v1',
  REFLECTIONS: 'yanshiji_daily_reflections_v1',
  TIMER_HEARTBEAT: 'yanshiji_timer_heartbeat_v1',
};

// 通用学习科目预设（不再限定考研学科）
export const DEFAULT_SUBJECTS = [
  { name: '阅读', color: '#4A90D9' },
  { name: '写作', color: '#E0705A' },
  { name: '练习', color: '#7B6CCF' },
  { name: '复习', color: '#4CB8A4' },
  { name: '其他', color: '#9AA5B1' },
];

export function getDefaultConfig() {
  return {
    // 目标日改为可选：空字符串表示未设置
    exam_target_date: '',
    daily_target_min: 300,
    theme_mode: 'light',
    subjects: DEFAULT_SUBJECTS,
    schema_version: 2,
  };
}

export function getAppConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return getDefaultConfig();
    return { ...getDefaultConfig(), ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to get app config:', e);
    return getDefaultConfig();
  }
}

export function saveAppConfig(config) {
  try {
    const updated = { ...getAppConfig(), ...config };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save app config:', e);
    return null;
  }
}

export function getAllRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Failed to get study records:', e);
    return [];
  }
}

function saveAllRecords(records) {
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
}

export function addRecord({ start_timestamp, end_timestamp, duration_min, subject_name, study_content, record_date }) {
  const records = getAllRecords();
  const now = Date.now();
  const maxId = records.reduce((max, r) => Math.max(max, r.record_id || 0), 0);

  const newRecord = {
    record_id: maxId + 1,
    start_timestamp: start_timestamp || now - duration_min * 60000,
    end_timestamp: end_timestamp || now,
    duration_min: Math.max(1, Number(duration_min) || 1),
    subject_name: subject_name || '其他',
    study_content: study_content || '',
    record_date: record_date || formatDate(new Date()),
    created_at: now,
    updated_at: now,
  };

  records.unshift(newRecord);
  saveAllRecords(records);
  return newRecord;
}

export function updateRecord(record_id, fields) {
  const records = getAllRecords();
  const index = records.findIndex((r) => r.record_id === record_id);
  if (index === -1) return null;

  records[index] = { ...records[index], ...fields, updated_at: Date.now() };
  saveAllRecords(records);
  return records[index];
}

export function deleteRecord(record_id) {
  saveAllRecords(getAllRecords().filter((r) => r.record_id !== record_id));
  return true;
}

/** 清空学习记录（保留目标日与设置） */
export function wipeAllRecords() {
  localStorage.removeItem(STORAGE_KEYS.RECORDS);
  localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
  localStorage.removeItem(STORAGE_KEYS.TIMER_HEARTBEAT);
}

/* ---------------- 每日复盘 ---------------- */

export function getReflections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveReflection(date, content) {
  const reflections = getReflections();
  if (!content || !content.trim()) {
    delete reflections[date];
  } else {
    reflections[date] = { content: content.trim(), updated_at: Date.now() };
  }
  localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflections));
  return reflections;
}

/* ---------------- 工具方法 ---------------- */

export function formatDate(dateObj) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 目标日倒计时（按 0 点取整）。
 * 返回 days=0 且 isPast=false 表示就是今天。
 */
export function calculateExamCountdown(targetDateStr) {
  if (!targetDateStr) return { days: 0, isPast: false, expiredDays: 0, hasTarget: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = targetDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d, 0, 0, 0, 0);

  const diffDays = Math.floor((target.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) {
    return { days: 0, isPast: true, expiredDays: Math.abs(diffDays), hasTarget: true };
  }
  return { days: diffDays, isPast: false, expiredDays: 0, hasTarget: true };
}

/* ---------------- 计时心跳 ---------------- */

export function saveTimerHeartbeat(heartbeatData) {
  if (!heartbeatData) {
    localStorage.removeItem(STORAGE_KEYS.TIMER_HEARTBEAT);
  } else {
    localStorage.setItem(STORAGE_KEYS.TIMER_HEARTBEAT, JSON.stringify(heartbeatData));
  }
}

export function getTimerHeartbeat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER_HEARTBEAT);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ---------------- 备份导出 / 导入 ---------------- */

export function exportBackupJSON() {
  const config = getAppConfig();
  const records = getAllRecords();
  const reflections = getReflections();

  const backupData = {
    app: BRAND.backupId,
    formatVersion: BRAND.backupVersion,
    exportedAt: new Date().toISOString(),
    config: {
      examTargetDate: config.exam_target_date,
      dailyTargetMin: config.daily_target_min,
      subjects: config.subjects,
    },
    records: records.map((r) => ({
      recordId: r.record_id,
      startTimestamp: r.start_timestamp,
      endTimestamp: r.end_timestamp,
      durationMin: r.duration_min,
      subjectName: r.subject_name,
      studyContent: r.study_content,
      recordDate: r.record_date,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
    reflections,
  };

  return JSON.stringify(backupData, null, 2);
}

export function isBackupOfThisApp(data) {
  if (!data || typeof data !== 'object') return false;
  const ids = [BRAND.backupId, ...BRAND.legacyBackupIds];
  return ids.includes(data.app);
}

export function importBackupJSON(jsonString, mode = 'merge') {
  try {
    const data = JSON.parse(jsonString);
    if (!isBackupOfThisApp(data) || !Array.isArray(data.records)) {
      return { success: false, message: '这不是本软件的备份文件，或文件内容不完整。' };
    }

    const validRecords = [];
    for (const item of data.records) {
      if (!item.recordDate || !item.durationMin || item.durationMin <= 0) continue;
      // 旧备份可能没有时间戳：用日期推导一个稳定占位值，保证重复导入可去重
      const fallbackStart = new Date(`${item.recordDate}T00:00:00`).getTime() || Date.now();
      const startTs = item.startTimestamp || fallbackStart;
      validRecords.push({
        record_id: item.recordId || Date.now() + Math.floor(Math.random() * 1000),
        start_timestamp: startTs,
        end_timestamp: item.endTimestamp || startTs + item.durationMin * 60000,
        duration_min: item.durationMin,
        subject_name: item.subjectName || '其他',
        study_content: item.studyContent || '',
        record_date: item.recordDate,
        created_at: item.createdAt || startTs,
        updated_at: item.updatedAt || startTs,
      });
    }

    if (mode === 'overwrite') {
      saveAllRecords(validRecords);
      if (data.config && data.config.examTargetDate) {
        saveAppConfig({
          exam_target_date: data.config.examTargetDate,
          daily_target_min: data.config.dailyTargetMin || 300,
          subjects: data.config.subjects || DEFAULT_SUBJECTS,
        });
      }
      if (data.reflections) {
        localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(data.reflections));
      }
      return { success: true, count: validRecords.length, mode: '覆盖导入' };
    }

    // 合并：按内容指纹去重（同一份备份重复导入不会翻倍）；
    // id 冲突但内容不同的记录会重新分配 id，避免跨设备导入时静默丢数据。
    const existing = getAllRecords();
    const existingIds = new Set(existing.map((r) => r.record_id));
    let maxId = existing.reduce((m, r) => Math.max(m, r.record_id || 0), 0);
    const fingerprint = (r) =>
      `${r.record_date}|${r.subject_name}|${r.duration_min}|${r.start_timestamp}|${r.study_content}`;
    const seen = new Set(existing.map(fingerprint));
    let addedCount = 0;

    for (const rec of validRecords) {
      const fp = fingerprint(rec);
      if (seen.has(fp)) continue;

      let id = rec.record_id;
      if (existingIds.has(id)) id = ++maxId;
      rec.record_id = id;

      existingIds.add(id);
      seen.add(fp);
      existing.push(rec);
      addedCount++;
    }

    existing.sort((a, b) => b.record_id - a.record_id);
    saveAllRecords(existing);

    if (data.reflections) {
      localStorage.setItem(
        STORAGE_KEYS.REFLECTIONS,
        JSON.stringify({ ...getReflections(), ...data.reflections })
      );
    }

    return { success: true, count: addedCount, mode: '合并增量导入' };
  } catch (e) {
    return { success: false, message: '解析备份文件失败：' + e.message };
  }
}
