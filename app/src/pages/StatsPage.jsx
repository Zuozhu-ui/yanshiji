import React, { useState } from 'react';
import PieChart from '../components/PieChart';
import TrendChart from '../components/TrendChart';
import CalendarHeatmap from '../components/CalendarHeatmap';
import { formatDate } from '../services/storage';

export default function StatsPage({ config, records }) {
  const [rangeType, setRangeType] = useState('week'); // 'day' | 'week' | 'month' | 'all'
  const [selectedDayStr, setSelectedDayStr] = useState(formatDate(new Date()));
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => formatDate(new Date()).slice(0, 7)); // 'YYYY-MM'

  // 1. 全量指标 (不受时间筛选影响)
  const totalCount = records.length;
  const totalMinutesAll = records.reduce((sum, r) => sum + (r.duration_min || 0), 0);

  // 2. 周期区间判定 (自然周/自然月/按日)
  const getPeriodDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (rangeType === 'day') {
      return { startStr: selectedDayStr, endStr: selectedDayStr, elapsedDays: 1 };
    }

    if (rangeType === 'week') {
      // 自然周 (周一 00:00 ~ 周日 23:59)
      const dayOfWeek = today.getDay(); // 0(日)-6(六)
      const distToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

      const monday = new Date(today);
      monday.setDate(today.getDate() - distToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startStr = formatDate(monday);
      const endStr = formatDate(sunday);

      // 计算本周已过天数 (1 ~ 7)
      const elapsedDays = Math.min(7, distToMonday + 1);
      return { startStr, endStr, elapsedDays };
    }

    if (rangeType === 'month') {
      // 自然月 (所选月份 1 日 ~ 月末)，支持选择具体某年某月
      const [y, m] = selectedMonthStr.split('-').map(Number); // m: 1-12
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0); // 当月最后一天

      const startStr = formatDate(firstDay);
      const endStr = formatDate(lastDay);

      const isCurrentMonth = today.getFullYear() === y && today.getMonth() === m - 1;
      const elapsedDays = isCurrentMonth ? today.getDate() : lastDay.getDate();
      return { startStr, endStr, elapsedDays };
    }

    if (rangeType === 'all') {
      // 全部历史：起止 = 最早记录日 ~ 今天；日均按「有记录的天数」计算
      const dates = records.map(r => r.record_date).filter(Boolean);
      const distinctDays = new Set(dates).size;
      const startStr = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : formatDate(today);
      return { startStr, endStr: formatDate(today), elapsedDays: Math.max(1, distinctDays) };
    }

    return { startStr: formatDate(today), endStr: formatDate(today), elapsedDays: 1 };
  };

  const { startStr, endStr, elapsedDays } = getPeriodDateRange();

  // 筛选当前周期内记录
  const periodRecords = records.filter(r => {
    if (!r.record_date) return false;
    return r.record_date >= startStr && r.record_date <= endStr;
  });

  const periodTotalMinutes = periodRecords.reduce((sum, r) => sum + (r.duration_min || 0), 0);
  const avgDailyMinutes = elapsedDays > 0 ? Math.round(periodTotalMinutes / elapsedDays) : 0;

  // 各科在当前周期内分组求和
  const subjectMap = {};
  periodRecords.forEach(r => {
    subjectMap[r.subject_name] = (subjectMap[r.subject_name] || 0) + (r.duration_min || 0);
  });

  const subjectStats = Object.entries(subjectMap).map(([subject, minutes]) => ({
    subject,
    minutes
  })).sort((a, b) => b.minutes - a.minutes);

  // 科目颜色映射
  const subjectColors = {};
  (config.subjects || []).forEach(s => {
    subjectColors[s.name] = s.color;
  });

  // 生成趋势图数据 (近7天)
  const getTrendData = () => {
    const list = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatDate(d);
      const dayMins = records
        .filter(r => r.record_date === dateStr)
        .reduce((sum, r) => sum + (r.duration_min || 0), 0);

      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      list.push({
        date: dateStr,
        label: i === 0 ? '今天' : `周${weekdays[d.getDay()]}`,
        minutes: dayMins,
        isToday: i === 0
      });
    }
    return list;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '16px', paddingBottom: '32px' }}>
      
      {/* 时间筛选器 (日 / 周 / 月 / 全部) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setRangeType('day')}
          className={rangeType === 'day' ? 'btn-primary' : 'btn-outline'}
          style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
        >
          日
        </button>
        <button
          onClick={() => setRangeType('week')}
          className={rangeType === 'week' ? 'btn-primary' : 'btn-outline'}
          style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
        >
          周
        </button>
        <button
          onClick={() => setRangeType('month')}
          className={rangeType === 'month' ? 'btn-primary' : 'btn-outline'}
          style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
        >
          月
        </button>
        <button
          onClick={() => setRangeType('all')}
          className={rangeType === 'all' ? 'btn-primary' : 'btn-outline'}
          style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
        >
          全部
        </button>
      </div>

      {/* 当选日选择器 */}
      {rangeType === 'day' && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>查看日期：</span>
          <input
            type="date"
            value={selectedDayStr}
            onChange={(e) => setSelectedDayStr(e.target.value)}
            style={{ fontSize: '0.9rem', padding: '6px 12px' }}
          />
        </div>
      )}

      {/* 月份选择器 */}
      {rangeType === 'month' && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>查看月份：</span>
          <input
            type="month"
            value={selectedMonthStr}
            onChange={(e) => setSelectedMonthStr(e.target.value || formatDate(new Date()).slice(0, 7))}
            style={{ fontSize: '0.9rem', padding: '6px 12px' }}
          />
        </div>
      )}

      {/* 4 大核心指标卡片 (严格遵照第六节规范) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>全量累计次数</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {totalCount} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>次</span>
          </div>
        </div>

        <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>全量总学习时长</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary-blue)', marginTop: '4px' }}>
            {Math.floor(totalMinutesAll / 60)} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>h</span>
          </div>
        </div>

        <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>周期内日均专注</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)', marginTop: '4px' }}>
            {avgDailyMinutes} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>m/天</span>
          </div>
        </div>

        <div className="card" style={{ padding: '14px', marginBottom: 0 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>当前周期总时长</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {Math.floor(periodTotalMinutes / 60)}h {periodTotalMinutes % 60}m
          </div>
        </div>
      </div>

      {/* 经典科目时间圆环分布图卡片 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⭕ 各科目学习时间圆环分布图
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{startStr} ~ {endStr}</span>
        </div>
        <PieChart 
          subjectStats={subjectStats} 
          totalMinutes={periodTotalMinutes} 
          subjectColors={subjectColors} 
        />
      </div>

      {/* 近7天学习时长趋势柱状图 */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <TrendChart dailyTrendData={getTrendData()} />
      </div>

      {/* 连续打卡热力日历组件 */}
      <CalendarHeatmap records={records} />

    </div>
  );
}
