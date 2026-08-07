import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function EditLogModal({ record, subjects, onSave, onClose }) {
  const [date, setDate] = useState(record.record_date || '');
  const [subject, setSubject] = useState(record.subject_name || subjects[0]?.name || '数学');
  const [duration, setDuration] = useState(record.duration_min || 30);
  const [content, setContent] = useState(record.study_content || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const mins = parseInt(duration, 10);
    if (isNaN(mins) || mins < 1) return;

    onSave(record.record_id, {
      record_date: date,
      subject_name: subject,
      duration_min: mins,
      study_content: content
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>编辑学习记录</h3>
          <button onClick={onClose} style={{ background: 'transparent', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              日期
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              科目
            </label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map(s => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              时长 (分钟)
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              学习内容
            </label>
            <textarea
              rows="3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
              取消
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px' }}>
              <Check size={18} />
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
