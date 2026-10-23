import React, { useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';

export default function EditExamDateModal({ currentDate, onSave, onClose }) {
  const [date, setDate] = useState(currentDate || '');

  const handleConfirm = () => {
    onSave(date);
    onClose();
  };

  const handleClear = () => {
    if (window.confirm('清除目标日？首页将不再显示倒计时。')) {
      onSave('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>目标日</h3>
          <button onClick={onClose} style={{ background: 'transparent', padding: '4px', color: 'var(--ink-3)' }}>
            <X size={19} />
          </button>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--ink-2)', lineHeight: 1.7, marginBottom: '16px' }}>
          设一个目标日，首页会显示还剩多少天。考期、截止日、阶段目标都可以；不想要倒计时也可以清除。
        </p>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ fontSize: '1rem', padding: '12px 14px', marginBottom: '20px' }}
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {currentDate && (
            <button onClick={handleClear} className="btn-outline" style={{ padding: '11px 12px' }} title="清除目标日">
              <Trash2 size={15} />
            </button>
          )}
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>
            取消
          </button>
          <button onClick={handleConfirm} className="btn-primary" style={{ flex: 1.3, padding: '12px' }} disabled={!date}>
            <Check size={16} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
