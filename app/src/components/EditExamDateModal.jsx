import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';

export default function EditExamDateModal({ currentDate, onSave, onClose }) {
  const [selectedDate, setSelectedDate] = useState(currentDate || '');

  const handlePreset = (year) => {
    setSelectedDate(`${year}-12-20`);
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    onSave(selectedDate);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>设置考研目标日期</h3>
          <button onClick={onClose} style={{ background: 'transparent', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
          选择你的目标考试日期，系统将为你精确计算剩余天数。
        </p>

        {/* 快捷选项 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button 
            type="button"
            className="btn-outline"
            onClick={() => handlePreset(2026)}
            style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
          >
            2026年考研初试 (12-20)
          </button>
          <button 
            type="button"
            className="btn-outline"
            onClick={() => handlePreset(2027)}
            style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
          >
            2027年考研初试 (12-19)
          </button>
        </div>

        {/* 原生日历 Date picker */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            自定义选择日期
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ fontSize: '1rem', padding: '10px 14px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
            取消
          </button>
          <button onClick={handleConfirm} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
            <Check size={18} />
            确认保存
          </button>
        </div>
      </div>
    </div>
  );
}
