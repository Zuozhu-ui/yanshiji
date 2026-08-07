import React, { useState } from 'react';
import { X, Plus, Clock, Book } from 'lucide-react';
import { formatDate, saveAppConfig } from '../services/storage';

export default function ManualLogModal({ subjects, onSave, onClose }) {
  const [date, setDate] = useState(formatDate(new Date()));
  const [subjectMode, setSubjectMode] = useState('select'); // 'select' or 'custom'
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || '数学');
  const [customSubject, setCustomSubject] = useState('');
  const [duration, setDuration] = useState(60);
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const getFinalSubject = () => {
    if (subjectMode === 'custom') {
      return customSubject.trim() || '自定义科目';
    }
    return selectedSubject;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const mins = parseInt(duration, 10);
    if (isNaN(mins) || mins < 1) {
      setErrorMsg('时长至少为 1 分钟！');
      return;
    }
    if (mins > 1440) {
      if (!window.confirm('单次记录的时长超过了 24 小时 (1440分钟)，确认保存吗？')) {
        return;
      }
    }

    const finalSub = getFinalSubject();

    // 自动记入科目配置
    if (!subjects.some(s => s.name === finalSub)) {
      const colors = ['#4A90D9', '#E0705A', '#7B6CCF', '#4CB8A4', '#D9A05B', '#6B9E7A'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      saveAppConfig({
        subjects: [...subjects, { name: finalSub, color: randomColor }]
      });
    }

    onSave({
      record_date: date,
      subject_name: finalSub,
      duration_min: mins,
      study_content: content
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>手动补录学习记录</h3>
          <button onClick={onClose} style={{ background: 'transparent', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#FEF2F2',
              color: '#EF4444',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '12px'
            }}>
              {errorMsg}
            </div>
          )}

          {/* 日期选择 */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              补录日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* 科目选择与自定义 */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                学习科目
              </label>
              <button
                type="button"
                onClick={() => setSubjectMode(subjectMode === 'select' ? 'custom' : 'select')}
                style={{ background: 'none', color: 'var(--primary-blue)', fontSize: '0.78rem', fontWeight: 600 }}
              >
                {subjectMode === 'select' ? '＋ 手动输入自定义科目' : '选择已有科目'}
              </button>
            </div>

            {subjectMode === 'select' ? (
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                {subjects.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="请输入自定义科目名字 (如：民法学、新闻学、画图实验等)..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                required
              />
            )}
          </div>

          {/* 时长 (手动输入) */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              专注时长（分钟，支持直接手动输入修改）
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max="1440"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                {[30, 60, 90, 120].map(m => (
                  <button
                    key={m}
                    type="button"
                    className="btn-outline"
                    onClick={() => setDuration(m)}
                    style={{ padding: '6px 8px', fontSize: '0.75rem', flexShrink: 0 }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 学习内容 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              具体学习内容
            </label>
            <textarea
              rows="3"
              placeholder="例如：看真题视频解析、背单词、刷专业课错题..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
              取消
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>
              <Plus size={18} />
              保存记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
