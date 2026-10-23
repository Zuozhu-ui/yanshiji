import React from 'react';
import { Settings } from 'lucide-react';
import CountdownCard from '../components/CountdownCard';
import TimerWidget from '../components/TimerWidget';
import Ring from '../components/Ring';
import { getDailyQuote } from '../services/quotes';
import { formatDate } from '../services/storage';
import { BRAND } from '../brand';

const WEEK_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

function greetingOf(hour) {
  if (hour < 5) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function humanMinutes(min) {
  if (!min) return '0 分钟';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} 小时${m ? ` ${m} 分` : ''}` : `${m} 分钟`;
}

export default function HomePage({
  config,
  records,
  timerState,
  onJumpToTimer,
  onOpenEditDate,
  onOpenSettings,
}) {
  const now = new Date();
  const todayStr = formatDate(now);
  const quote = getDailyQuote(now);

  const todayRecords = records.filter((r) => r.record_date === todayStr);
  const totalMin = todayRecords.reduce((sum, r) => sum + (r.duration_min || 0), 0);
  const targetMin = config.daily_target_min || 0;
  const percent = targetMin > 0 ? Math.min(1, totalMin / targetMin) : 0;

  const subjectMap = {};
  todayRecords.forEach((r) => {
    subjectMap[r.subject_name] = (subjectMap[r.subject_name] || 0) + (r.duration_min || 0);
  });
  const topSubjects = Object.entries(subjectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const maxMin = topSubjects.length ? topSubjects[0][1] : 1;

  const colorOf = (name) => {
    const found = (config.subjects || []).find((s) => s.name === name);
    return found ? found.color : '#9AA5B1';
  };

  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  const recent = [...records]
    .sort(
      (a, b) =>
        (b.record_date || '').localeCompare(a.record_date || '') ||
        (b.start_timestamp || 0) - (a.start_timestamp || 0)
    )
    .slice(0, 3);

  return (
    <div className="page home">
      <div className="home-top">
        <div className="home-date">
          {now.getMonth() + 1} 月 {now.getDate()} 日 · 周{WEEK_SHORT[now.getDay()]}
        </div>
        <button className="avatar" onClick={onOpenSettings} aria-label="设置">
          <Settings size={17} strokeWidth={1.8} />
        </button>
      </div>

      <h1 className="home-greet">
        {greetingOf(now.getHours())}
        <em>今天也为自己积累一点</em>
      </h1>

      <TimerWidget timerState={timerState} onClick={onJumpToTimer} />

      <CountdownCard examTargetDate={config.exam_target_date} onOpenEditDate={onOpenEditDate} />

      <section className="card" style={{ marginTop: 26 }}>
        <div className="card-head">
          <h3>今日专注</h3>
          <span>{todayStr}</span>
        </div>

        <div className="today-main">
          <Ring size={88} stroke={7} value={percent} color="var(--accent)">
            <b>{Math.round(percent * 100)}%</b>
            <span>目标</span>
          </Ring>

          <div>
            <div className="today-num">
              {h}
              <small>h</small> {m}
              <small>m</small>
            </div>
            <div className="today-sub">
              {targetMin > 0
                ? percent >= 1
                  ? '今日目标已达成，很稳'
                  : `还差 ${humanMinutes(targetMin - totalMin)} 达到今日目标`
                : '还没有设置每日目标'}
            </div>
          </div>
        </div>

        {topSubjects.length > 0 ? (
          <div style={{ marginTop: 6 }}>
            {topSubjects.map(([name, mins]) => (
              <div className="subj" key={name}>
                <span className="dot" style={{ background: colorOf(name) }} />
                <span className="name">{name}</span>
                <span className="track">
                  <span
                    className="fill"
                    style={{ width: `${Math.round((mins / maxMin) * 100)}%`, background: colorOf(name) }}
                  />
                </span>
                <span className="time">{mins} 分</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-hint">
            今天还没有记录
            <br />
            点下方中间的按钮，开始第一段专注
          </div>
        )}
      </section>

      <div className="quote">
        <p>“{quote.text}”</p>
        <div className="from">—— {quote.author}</div>
      </div>

      {recent.length > 0 && (
        <section className="recent">
          <div className="recent-head">
            <h3>最近记录</h3>
            <span>共 {records.length} 条</span>
          </div>
          {recent.map((r) => (
            <div className="recent-item" key={r.record_id}>
              <span className="recent-dot" style={{ background: colorOf(r.subject_name) }} />
              <span className="recent-subject">{r.subject_name}</span>
              <span className="recent-content">{r.study_content || '没有填写内容'}</span>
              <span className="recent-min">{r.duration_min}m</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
