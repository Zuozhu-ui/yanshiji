/* 学时记 · 学习金句（通用学习场景，不再限定考研） */

export const STUDY_QUOTES = [
  { text: '把时间花在哪里，人生的花就开在哪里。', author: '学习手记' },
  { text: '慢慢来，比较快。', author: '学习手记' },
  { text: '今天的专注，是明天的底气。', author: '学习手记' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子' },
  { text: '你只需要比昨天的自己，好一点点。', author: '学习手记' },
  { text: '学如逆水行舟，不进则退。', author: '古语' },
  { text: '把大目标，拆成今天的一小时。', author: '学习手记' },
  { text: '所有看似毫不费力的成绩，都来自日复一日的用力。', author: '学习手记' },
  { text: '种一棵树最好的时间是十年前，其次就是现在。', author: '谚语' },
  { text: '专注的每一分钟，都算数。', author: '学习手记' },
];

/** 每天固定一句：同一天多次渲染不会跳变 */
export function getDailyQuote(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return STUDY_QUOTES[dayOfYear % STUDY_QUOTES.length];
}

export function getRandomQuote() {
  return STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)];
}
