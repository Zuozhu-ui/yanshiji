import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../services/storage';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function heatLevel(min) {
  if (!min) return 0;
  if (min < 60) return 1;
  if (min < 180) return 2;
  if (min < 360) return 3;
  return 4;
}

export default function CalendarHeatmap({ records }) {
  const [cursor, setCursor] = useState(new Date());

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const minutesMap = {};
  records.forEach((r) => {
    if (!r.record_date) return;
    minutesMap[r.record_date] = (minutesMap[r.record_date] || 0) + (r.duration_min || 0);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  let streak = 0;
  const walk = new Date(today);
  if (!minutesMap[todayStr]) walk.setDate(walk.getDate() - 1);
  while (minutesMap[formatDate(walk)]) {
    streak += 1;
    walk.setDate(walk.getDate() - 1);
  }

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ d, dateStr, min: minutesMap[dateStr] || 0 });
  }

  return (
    <section className="card">
      <div className="heat-head">
        <h3>打卡历</h3>
        <span className="streak">连续 {streak} 天</span>
      </div>

      <div className="heat-nav">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="上个月">
          <ChevronLeft size={16} />
        </button>
        <span>
          {year} 年 {month + 1} 月
        </span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="下个月">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="heat-week">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="heat-grid">
        {cells.map((c, i) =>
          c ? (
            <span
              key={c.dateStr}
              className={`heat-cell lv${heatLevel(c.min)} ${c.dateStr === todayStr ? 'today' : ''}`}
              title={`${c.dateStr} · ${c.min} 分钟`}
            >
              {c.d}
            </span>
          ) : (
            <span key={`e${i}`} className="heat-cell empty" />
          )
        )}
      </div>
    </section>
  );
}
