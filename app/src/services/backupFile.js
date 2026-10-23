import { Capacitor, registerPlugin } from '@capacitor/core';

const BackupFile = registerPlugin('BackupFile');

/** 是否在原生 App 里运行 */
export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

/**
 * 调系统「保存到文件」选择器，把 JSON 存成真正的文件。
 * 返回 { cancelled: true } 表示用户取消。
 */
export async function saveBackupToDevice(fileName, data) {
  if (!isNativeApp()) return { web: true };
  return BackupFile.saveFile({ fileName, data, mimeType: 'application/json' });
}

/**
 * 调系统「打开文件」选择器，读取备份 JSON。
 * 返回 { cancelled: true } 表示用户取消。
 */
export async function pickBackupFile() {
  if (!isNativeApp()) return { web: true };
  return BackupFile.openFile();
}
