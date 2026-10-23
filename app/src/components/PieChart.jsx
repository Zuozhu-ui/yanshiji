import React, { useState } from 'react';

function hm(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m} 分钟`;
  return m ? `${h} 小时 ${m} 分` : `${h} 小时`;
}

function short(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h <= 0) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function PieChart({ subjectStats, totalMinutes, subjectColors }) {
  const [active, setActive] = useState(null);

  const valid = (subjectStats || []).filter((s) => s.minutes > 0);

  if (!totalMinutes || valid.length === 0) {
    return (
      <div className="donut-empty">
        <div className="donut-empty-ring" />
        <p>这个周期还没有记录</p>
        <span>去专注一次，这里就会长出你的时间分布。</span>
      </div>
    );
  }

  const R = 68;
  const C = 2 * Math.PI * R;
  let acc = 0;

  const slices = valid.map((s) => {
    const p = s.minutes / totalMinutes;
    const item = {
      subject: s.subject,
      minutes: s.minutes,
      percent: Math.round(p * 100),
      color: subjectColors[s.subject] || '#9AA5B1',
      dash: p * C,
      offset: acc * C,
    };
    acc += p;
    return item;
  });

  const current = slices.find((s) => s.subject === active);

  return (
    <div>
      <div className="donut-wrap">
        <svg viewBox="0 0 180 180" className="donut" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="90" cy="90" r={R} fill="none" stroke="var(--paper-2)" strokeWidth="16" />
          {slices.map((s) => {
            const on = active === s.subject;
            return (
              <circle
                key={s.subject}
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={on ? 20 : 16}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
                onClick={() => setActive(on ? null : s.subject)}
                style={{
                  cursor: 'pointer',
                  opacity: active && !on ? 0.42 : 1,
                  transition: 'opacity .2s ease, stroke-width .2s ease',
                }}
              />
            );
          })}
        </svg>

        <div className="donut-center">
          {current ? (
            <>
              <span className="donut-name" style={{ color: current.color }}>
                {current.subject}
              </span>
              <b>{hm(current.minutes)}</b>
              <span className="donut-pct">{current.percent}%</span>
            </>
          ) : (
            <>
              <span className="donut-name">本周期总计</span>
              <b>{hm(totalMinutes)}</b>
              <span className="donut-pct">点圆环看明细</span>
            </>
          )}
        </div>
      </div>

      <div className="legend">
        {slices.map((s) => {
          const on = active === s.subject;
          return (
            <button
              key={s.subject}
              className={`legend-row ${on ? 'on' : ''}`}
              onClick={() => setActive(on ? null : s.subject)}
            >
              <span className="legend-dot" style={{ background: s.color }} />
              <span className="legend-name">{s.subject}</span>
              <span className="legend-track">
                <span
                  className="legend-fill"
                  style={{ width: `${s.percent}%`, background: s.color }}
                />
              </span>
              <span className="legend-time">{short(s.minutes)}</span>
              <span className="legend-pct" style={{ color: s.color }}>
                {s.percent}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
