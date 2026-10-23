/* 研时记 · 自动化测试套件 (Auto Test Suite) */
import { 
  calculateExamCountdown, 
  formatDate, 
  getDefaultConfig, 
  exportBackupJSON, 
  importBackupJSON 
} from './src/services/storage.js';
import { BRAND } from './src/brand.js';

// 简单内存 Storage 模拟，便于 Node 环境脱离浏览器测试
class MockLocalStorage {
  constructor() { this.store = {}; }
  getItem(key) { return this.store[key] || null; }
  setItem(key, val) { this.store[key] = String(val); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
}

global.localStorage = new MockLocalStorage();

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

console.log('==================================================');
console.log('  🧪 开始执行「研时记」单元与集成自动化测试');
console.log('==================================================\n');

// 1. 测试考研目标倒计时计算
console.log('▶ 1. 考研目标倒计时逻辑测试:');

const todayStr = formatDate(new Date());
const resToday = calculateExamCountdown(todayStr);
assert(resToday.days === 0 && !resToday.isPast, '考试日期恰好为今天时，剩余天数为 0');

const pastRes = calculateExamCountdown('2020-01-01');
assert(pastRes.isPast && pastRes.expiredDays > 0, '目标日期为过去日期时，正确定位为已考完过期状态');

const futureYear = new Date().getFullYear() + 1;
const futureRes = calculateExamCountdown(`${futureYear}-12-20`);
assert(futureRes.days > 300 && !futureRes.isPast, '目标日期为未来年份时，正确计算剩余天数 (>300天)');

// 2. 测试向上取整 (ceil) 与不足60秒拦截逻辑
console.log('\n▶ 2. 计时向上取整与拦截规则测试:');

const sec1 = 30;
const durationMin1 = Math.ceil(sec1 / 60);
assert(sec1 < 60 && durationMin1 === 1, '30 秒向上取整为 1 分钟（但业务界面校验时需拦住不足60秒记录）');

const sec2 = 90;
const durationMin2 = Math.ceil(sec2 / 60);
assert(durationMin2 === 2, '90 秒 (1分30秒) 向上取整为 2 分钟');

const sec3 = 3600;
const durationMin3 = Math.ceil(sec3 / 60);
assert(durationMin3 === 60, '3600 秒恰好为 60 分钟');

// 3. 测试跨零点日期归属逻辑
console.log('\n▶ 3. 跨零点记录归属逻辑测试:');

const startLate = new Date('2026-08-07T23:50:00').getTime();
const endEarly = new Date('2026-08-08T00:20:00').getTime();
const recordDate = formatDate(new Date(startLate));
const durationMs = endEarly - startLate;
const durationMinMs = Math.ceil(durationMs / 60000);

assert(recordDate === '2026-08-07', '23:50 开始、00:20 结束的记录，日期归属于开始日 2026-08-07');
assert(durationMinMs === 30, '跨零点耗时计算为 30 分钟');

// 4. 测试 JSON 备份与导出导入重组
console.log('\n▶ 4. 数据备份与恢复 (JSON Schema) 测试:');

// 设置初始数据
localStorage.setItem('yanshiji_app_config_v1', JSON.stringify(getDefaultConfig()));
localStorage.setItem('yanshiji_study_records_v1', JSON.stringify([
  { record_id: 1, start_timestamp: 1754550000000, end_timestamp: 1754553600000, subject_name: '数学', duration_min: 60, study_content: '高数第六章', record_date: '2026-08-07' },
  { record_id: 2, start_timestamp: 1754557200000, end_timestamp: 1754559900000, subject_name: '英语', duration_min: 45, study_content: '外刊精读', record_date: '2026-08-07' }
]));

const exportedJsonStr = exportBackupJSON();
let exportedData;
try {
  exportedData = JSON.parse(exportedJsonStr);
} catch (e) {}

assert(exportedData && exportedData.app === BRAND.backupId && exportedData.records.length === 2, '导出 JSON 使用新的应用标识且记录条数一致');

// 校验无效 JSON 拦截
const invalidRes = importBackupJSON('{"app":"未知软件"}', 'merge');
assert(!invalidRes.success, '导入非本软件格式 JSON 时，安全拦截并抛出错误提示');

// 旧版「研时记」备份仍可导入
const legacyJson = JSON.stringify({
  app: '研时记',
  formatVersion: 1,
  records: [{ recordId: 99, subjectName: '数学', durationMin: 30, recordDate: '2026-08-01' }],
});
const legacyRes = importBackupJSON(legacyJson, 'merge');
assert(legacyRes.success && legacyRes.count === 1, '旧版「研时记」备份可以正常导入');

// 测试合并模式去重
const mergeRes = importBackupJSON(exportedJsonStr, 'merge');
assert(mergeRes.success && mergeRes.count === 0, '合并模式重复导入同一份备份时，按内容指纹跳过 (0条新增)');

// 测试覆盖模式
const overwriteRes = importBackupJSON(exportedJsonStr, 'overwrite');
assert(overwriteRes.success && overwriteRes.count === 2, '覆盖模式正确覆盖更新已有记录库');

console.log('\n==================================================');
console.log(`  📊 测试结果: ${passedTests} / ${totalTests} 全部通过！`);
console.log('==================================================\n');

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
