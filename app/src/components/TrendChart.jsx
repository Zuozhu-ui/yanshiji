import React from 'react';

export default function TrendChart({ dailyTrendData }) {
  if (!dailyTrendData || dailyTrendData.length === 0) return null;

  const max = Math.max(...dailyTrendData.map((d) => d.minutes), 60);

  return (
    <div>
      <div className="card-head">
        <h3>近 7 天</h3>
        <span>分钟</span>
      </div>

      <div className="trend">
        {dailyTrendData.map((d) => {
          const h = Math.max(4, Math.round((d.minutes / max) * 100));
          return (
            <div className="trend-col" key={d.date} title={`${d.date} · ${d.minutes} 分钟`}>
              <span className="trend-val">{d.minutes > 0 ? d.minutes : ''}</span>
              <div className="trend-track">
                <div
                  className={`trend-bar ${d.isToday ? 'today' : ''} ${d.minutes === 0 ? 'zero' : ''}`}
                  style={{ height: `${h}%` }}
                />
              </div>
              <span className={`trend-label ${d.isToday ? 'today' : ''}`}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
