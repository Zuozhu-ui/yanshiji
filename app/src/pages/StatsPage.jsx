import React, { useState } from 'react';
import PieChart from '../components/PieChart';
import TrendChart from '../components/TrendChart';
import CalendarHeatmap from '../components/CalendarHeatmap';
import { formatDate } from '../services/storage';

function hm(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function StatsPage({ config, records }) {
  const [rangeType, setRangeType] = useState('week');
  const [selectedDayStr, setSelectedDayStr] = useState(formatDate(new Date()));
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => formatDate(new Date()).slice(0, 7));

  const totalCount = records.length;
  const totalMinutesAll = records.reduce((s, r) => s + (r.duration_min || 0), 0);

  const getRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (rangeType === 'day') {
      return { startStr: selectedDayStr, endStr: selectedDayStr, elapsedDays: 1 };
    }

    if (rangeType === 'week') {
      const dayOfWeek = today.getDay();
      const distToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - distToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        startStr: formatDate(monday),
        endStr: formatDate(sunday),
        elapsedDays: Math.min(7, distToMonday + 1),
      };
    }

    if (rangeType === 'month') {
      const [y, m] = selectedMonthStr.split('-').map(Number);
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      const isCurrentMonth = today.getFullYear() === y && today.getMonth() === m - 1;
      return {
        startStr: formatDate(firstDay),
        endStr: formatDate(lastDay),
        elapsedDays: isCurrentMonth ? today.getDate() : lastDay.getDate(),
      };
    }

    const dates = records.map((r) => r.record_date).filter(Boolean);
    const distinctDays = new Set(dates).size;
    return {
      startStr: dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : formatDate(today),
      endStr: formatDate(today),
      elapsedDays: Math.max(1, distinctDays),
    };
  };

  const { startStr, endStr, elapsedDays } = getRange();

  const periodRecords = records.filter(
    (r) => r.record_date && r.record_date >= startStr && r.record_date <= endStr
  );
  const periodMinutes = periodRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
  const avgDaily = elapsedDays > 0 ? Math.round(periodMinutes / elapsedDays) : 0;

  const subjectMap = {};
  periodRecords.forEach((r) => {
    subjectMap[r.subject_name] = (subjectMap[r.subject_name] || 0) + (r.duration_min || 0);
  });
  const subjectStats = Object.entries(subjectMap)
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  const subjectColors = {};
  (config.subjects || []).forEach((s) => {
    subjectColors[s.name] = s.color;
  });

  const trendData = (() => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      const minutes = records
        .filter((r) => r.record_date === dateStr)
        .reduce((s, r) => s + (r.duration_min || 0), 0);
      list.push({
        date: dateStr,
        label: i === 0 ? '今天' : `周${weekdays[d.getDay()]}`,
        minutes,
        isToday: i === 0,
      });
    }
    return list;
  })();

  return (
    <div className="page">
      <div className="page-title-row">
        <h1 className="log-title">统计</h1>
        <span className="page-sub">{startStr} ~ {endStr}</span>
      </div>

      <div className="stats-range">
        {[
          ['day', '日'],
          ['week', '周'],
          ['month', '月'],
          ['all', '全部'],
        ].map(([key, label]) => (
          <button
            key={key}
            className={rangeType === key ? 'on' : ''}
            onClick={() => setRangeType(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {rangeType === 'day' && (
        <div className="range-picker">
          <span>查看日期</span>
          <input type="date" value={selectedDayStr} onChange={(e) => setSelectedDayStr(e.target.value)} />
        </div>
      )}

      {rangeType === 'month' && (
        <div className="range-picker">
          <span>查看月份</span>
          <input
            type="month"
            value={selectedMonthStr}
            onChange={(e) => setSelectedMonthStr(e.target.value || formatDate(new Date()).slice(0, 7))}
          />
        </div>
      )}

      <div className="metric-grid">
        <div className="metric">
          <span className="metric-label">累计次数</span>
          <b className="metric-value">
            {totalCount}
            <span className="metric-unit">次</span>
          </b>
        </div>
        <div className="metric">
          <span className="metric-label">累计时长</span>
          <b className="metric-value">
            {hm(totalMinutesAll)}
          </b>
        </div>
        <div className="metric">
          <span className="metric-label">日均专注</span>
          <b className="metric-value accent">
            {avgDaily}
            <span className="metric-unit">m</span>
          </b>
        </div>
        <div className="metric">
          <span className="metric-label">本周期</span>
          <b className="metric-value">{hm(periodMinutes)}</b>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <h3>科目分布</h3>
          <span>{hm(periodMinutes)}</span>
        </div>
        <PieChart
          subjectStats={subjectStats}
          totalMinutes={periodMinutes}
          subjectColors={subjectColors}
        />
      </section>

      <section className="card">
        <TrendChart dailyTrendData={trendData} />
      </section>

      <CalendarHeatmap records={records} />
    </div>
  );
}
