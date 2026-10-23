/* 品牌与全局配置：改名 / 换文案只需要动这一个文件 */

export const BRAND = {
  // 当前工作名（待你最终确认，改这一处即可全站生效）
  name: '学时记',
  initial: '学',
  tagline: '把每一次专注，记成看得见的成长',

  // 备份文件里的应用标识；旧版本标识保留用于兼容导入
  backupId: '学时记',
  legacyBackupIds: ['研时记'],
  backupVersion: 2,
};

// 页面通用文案
export const COPY = {
  goalLabel: '距离目标日',
  goalPastLabel: '目标日已过',
  goalEmpty: '还没有设定目标日',
  goalEmptyHint: '设一个日期，让倒计时推着你走',
  quoteTitle: '今日一句',
  todayTitle: '今日专注',
  manualEntry: '手动补录',
};
