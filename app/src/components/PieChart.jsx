import React, { useState } from 'react';

export default function PieChart({ subjectStats, totalMinutes, subjectColors }) {
  const [activeSubject, setActiveSubject] = useState(null);

  if (!totalMinutes || totalMinutes === 0 || !subjectStats || subjectStats.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '36px 16px',
        color: 'var(--text-sub)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>⭕</div>
        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>当前周期暂无学科时间分布</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          前往「学习计时」直接录入或开启计时，即可生成专属科目圆环分布图！
        </p>
      </div>
    );
  }

  // 过滤掉 0 分钟科目
  const validStats = subjectStats.filter(s => s.minutes > 0);

  // 计算 SVG 弧线切片
  let cumulativePercent = 0;
  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = validStats.map((item) => {
    const percent = item.minutes / totalMinutes;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    const endPercent = cumulativePercent;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = [
      `M ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `L 0 0`
    ].join(' ');

    const percentageInt = Math.round(percent * 100);

    return {
      name: item.subject,
      minutes: item.minutes,
      color: subjectColors[item.subject] || '#9AA5B1',
      percentage: percentageInt,
      pathData
    };
  });

  const selectedItem = activeSubject ? slices.find(s => s.name === activeSubject) : null;

  return (
    <div>
      {/* ===== 经典圆环分布图 (Donut Ring Chart) ===== */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justify: 'center',
        position: 'relative',
        margin: '16px 0 24px 0'
      }}>
        <div style={{ position: 'relative', width: '210px', height: '210px' }}>
          <svg viewBox="-1.15 -1.15 2.3 2.3" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            {slices.map((slice, i) => {
              const isSelected = activeSubject === slice.name;
              return (
                <path
                  key={i}
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="var(--bg-card)"
                  strokeWidth="0.03"
                  onClick={() => setActiveSubject(isSelected ? null : slice.name)}
                  onMouseEnter={() => setActiveSubject(slice.name)}
                  style={{
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                    cursor: 'pointer',
                    opacity: activeSubject && !isSelected ? 0.6 : 1
                  }}
                />
              );
            })}
            {/* 中间掏空形成圆环效果 (Inner Cutout Radius = 0.68) */}
            <circle cx="0" cy="0" r="0.68" fill="var(--bg-card)" />
          </svg>

          {/* 圆环中心数据呈现 */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
            padding: '12px'
          }}>
            {selectedItem ? (
              <div className="animate-fade-in">
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: selectedItem.color }}>
                  {selectedItem.name}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', margin: '2px 0' }}>
                  {Math.floor(selectedItem.minutes / 60)}h {selectedItem.minutes % 60}m
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sub)' }}>
                  占比 {selectedItem.percentage}%
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 500 }}>
                  周期专注总时长
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary-blue)', margin: '2px 0' }}>
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  点击圆环或点击下方图例
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== 各科目时长分布卡片列表 ===== */}
      <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
        📖 各学科时间投入明细：
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {slices.map((slice) => {
          const isSelected = activeSubject === slice.name;
          const h = Math.floor(slice.minutes / 60);
          const m = slice.minutes % 60;
          const timeText = h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;

          return (
            <div
              key={slice.name}
              onClick={() => setActiveSubject(isSelected ? null : slice.name)}
              style={{
                padding: '12px 14px',
                backgroundColor: isSelected ? 'var(--primary-blue-light)' : 'var(--bg-main)',
                borderRadius: 'var(--radius-md)',
                border: `1.5px solid ${isSelected ? slice.color : 'transparent'}`,
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: slice.color,
                    boxShadow: `0 2px 6px ${slice.color}60`
                  }} />
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{slice.name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
                    {timeText}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: slice.color }}>
                    ({slice.percentage}%)
                  </span>
                </div>
              </div>

              {/* 进度弧度条 */}
              <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${slice.percentage}%`,
                  backgroundColor: slice.color,
                  borderRadius: '3px',
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
