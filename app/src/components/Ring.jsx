import React, { useRef } from 'react';

let seq = 0;

/** 通用环形进度：可传 gradient 使用渐变描边 */
export default function Ring({
  size = 88,
  stroke = 7,
  value = 0,
  color = 'var(--accent)',
  track = 'var(--paper-2)',
  gradient,
  style,
  children,
}) {
  const idRef = useRef(null);
  if (!idRef.current) idRef.current = 'ringGrad' + ++seq;

  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  const center = size / 2;

  return (
    <div className="ring" style={{ width: size, height: size, ...style }}>
      <svg width={size} height={size}>
        {gradient && (
          <defs>
            <linearGradient id={idRef.current} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
        )}
        <circle cx={center} cy={center} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={gradient ? `url(#${idRef.current})` : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - v)}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      {children && <div className="ring-center">{children}</div>}
    </div>
  );
}
