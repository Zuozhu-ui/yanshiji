import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { exportBackupJSON, importBackupJSON, getAllRecords } from './storage.js';

const DIR = 'backups';
const KEEP = 5;

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

/** 自动备份列表（最新在前） */
export async function listSnapshots() {
  if (!isNativePlatform()) return [];
  try {
    const res = await Filesystem.readdir({ path: DIR, directory: Directory.Data });
    return (res.files || [])
      .filter((f) => f.name.endsWith('.json'))
      .map((f) => ({ name: f.name, size: f.size || 0 }))
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return [];
  }
}

/** 生成一份自动备份，保留最近 5 份 */
export async function saveSnapshot() {
  if (!isNativePlatform()) return null;
  if (getAllRecords().length === 0) return null;

  const name = `snap-${stamp()}.json`;
  await Filesystem.writeFile({
    path: `${DIR}/${name}`,
    data: exportBackupJSON(),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
    recursive: true,
  });

  const list = await listSnapshots();
  for (const old of list.slice(KEEP)) {
    try {
      await Filesystem.deleteFile({ path: `${DIR}/${old.name}`, directory: Directory.Data });
    } catch {
      /* 忽略清理失败 */
    }
  }
  return name;
}

export async function latestSnapshot() {
  const list = await listSnapshots();
  return list[0] || null;
}

/** 用某份自动备份覆盖恢复 */
export async function restoreSnapshot(name) {
  const res = await Filesystem.readFile({
    path: `${DIR}/${name}`,
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  });
  const text = typeof res.data === 'string' ? res.data : await res.data.text();
  return importBackupJSON(text, 'overwrite');
}
