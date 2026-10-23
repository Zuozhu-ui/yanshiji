import React from 'react';
import { calculateExamCountdown } from '../services/storage';
import { BRAND, COPY } from '../brand';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function weekdayOf(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export default function CountdownCard({ examTargetDate, onOpenEditDate }) {
  const { days, isPast, expiredDays, hasTarget } = calculateExamCountdown(examTargetDate);

  if (!hasTarget) {
    return (
      <section className="hero">
        <div className="hero-cap">目标日</div>
        <button className="hero-empty" onClick={onOpenEditDate}>
          <b>{COPY.goalEmpty}</b>
          <span>{COPY.goalEmptyHint}</span>
        </button>
        <div className="hero-meta">
          <span>考期 / 截止日 / 阶段目标都可以</span>
          <button className="hero-edit" onClick={onOpenEditDate}>去设定</button>
        </div>
      </section>
    );
  }

  const weeks = Math.floor(days / 7);
  const rest = days % 7;

  return (
    <section className="hero">
      <div className="hero-cap">{isPast ? COPY.goalPastLabel : COPY.goalLabel}</div>

      <div className="hero-days">
        <b>{isPast ? expiredDays : days}</b>
        <i>{isPast ? '天前' : '天'}</i>
        <span className="seal">{BRAND.initial}</span>
      </div>

      <div className="hero-target">
        目标日期　{examTargetDate}　{weekdayOf(examTargetDate)}
      </div>

      <div className="hero-meta">
        <span>{isPast ? '这一段已经走完了，可以设定下一个目标' : `约 ${weeks} 周${rest ? ` ${rest} 天` : ''}`}</span>
        <button className="hero-edit" onClick={onOpenEditDate}>修改目标</button>
      </div>
    </section>
  );
}
