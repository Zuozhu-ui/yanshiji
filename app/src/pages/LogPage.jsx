import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Filter, FileText, Save } from 'lucide-react';
import EditLogModal from '../components/EditLogModal';
import { getReflections, saveReflection } from '../services/storage';
import { COPY } from '../brand';

export default function LogPage({
  config,
  records,
  onUpdateRecord,
  onDeleteRecord,
  onOpenManual,
  lastAddedId,
}) {
  const [filterDate, setFilterDate] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [editingRecord, setEditingRecord] = useState(null);

  const [reflections, setReflections] = useState(getReflections());
  const [reflectionInput, setReflectionInput] = useState('');
  const [editingRefDate, setEditingRefDate] = useState(null);

  // 刚补录/刚保存的记录：高亮 + 顶部提示
  const [highlightId, setHighlightId] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!lastAddedId) return;
    setHighlightId(lastAddedId);
    setToast('已保存，最新记录排在最上面');
    const t1 = setTimeout(() => setHighlightId(null), 2800);
    const t2 = setTimeout(() => setToast(''), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [lastAddedId]);

  const colorOf = (name) => {
    const found = (config.subjects || []).find((s) => s.name === name);
    return found ? found.color : '#9AA5B1';
  };

  const filtered = records.filter((r) => (filterDate === 'ALL' ? true : r.record_date === filterDate));

  /**
   * 排序：日期倒序 → 同一天内「录入时间」倒序。
   * 这样手动补录的记录一定出现在当天最上面，而不是按虚拟的开始时间沉到中间。
   */
  const sorted = [...filtered].sort((a, b) => {
    if (a.record_date !== b.record_date) {
      return (b.record_date || '').localeCompare(a.record_date || '');
    }
    return (b.created_at || b.start_timestamp || 0) - (a.created_at || a.start_timestamp || 0);
  });

  const shown = sorted.slice(0, page * pageSize);
  const hasMore = shown.length < sorted.length;

  const handleDelete = (id) => {
    if (window.confirm('删除这条学习记录？删除后不可恢复。')) onDeleteRecord(id);
  };

  const handleSaveReflection = (dateStr) => {
    setReflections(saveReflection(dateStr, reflectionInput));
    setEditingRefDate(null);
    setReflectionInput('');
  };

  return (
    <div className="page">
      <div className="log-head">
        <h1 className="log-title">学习日志</h1>
        <button className="btn-primary" style={{ padding: '9px 13px', fontSize: 12.5 }} onClick={onOpenManual}>
          <Plus size={15} />
          {COPY.manualEntry}
        </button>
      </div>

      <div className="log-filter">
        <Filter size={14} color="var(--ink-3)" />
        <select
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">全部记录（{records.length} 条）</option>
          {[...new Set(records.map((r) => r.record_date))].sort().reverse().map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {filterDate !== 'ALL' && (
        <div className="reflection">
          <div className="reflection-head">
            <span>📝 {filterDate} 复盘</span>
            {editingRefDate !== filterDate && (
              <button
                className="hero-edit"
                onClick={() => {
                  setEditingRefDate(filterDate);
                  setReflectionInput(reflections[filterDate]?.content || '');
                }}
              >
                {reflections[filterDate] ? '编辑' : '写一句'}
              </button>
            )}
          </div>

          {editingRefDate === filterDate ? (
            <div>
              <textarea
                rows="3"
                placeholder="今天学得怎么样？有什么想记下来的？"
                value={reflectionInput}
                onChange={(e) => setReflectionInput(e.target.value)}
                style={{ marginBottom: '8px', fontSize: 13 }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setEditingRefDate(null)}>
                  取消
                </button>
                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => handleSaveReflection(filterDate)}>
                  <Save size={12} />
                  保存
                </button>
              </div>
            </div>
          ) : (
            <p className={reflections[filterDate] ? '' : 'placeholder'}>
              {reflections[filterDate]?.content || '这一天还没有复盘，点右上角写一句。'}
            </p>
          )}
        </div>
      )}

      {shown.length > 0 ? (
        <div className="log-list">
          {shown.map((r) => {
            const color = colorOf(r.subject_name);
            return (
              <article
                className={`log-item ${r.record_id === highlightId ? 'just-added' : ''}`}
                key={r.record_id}
                data-record-id={r.record_id}
              >
                <div className="log-item-top">
                  <span className="log-subject" style={{ color, borderColor: color, background: `${color}18` }}>
                    {r.subject_name}
                  </span>
                  <span className="log-date">{r.record_date}</span>
                  <span className="log-dur">{r.duration_min} 分</span>
                  <button className="log-icon" onClick={() => setEditingRecord(r)} aria-label="编辑">
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="log-icon danger"
                    onClick={() => handleDelete(r.record_id)}
                    aria-label="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <p className={r.study_content ? 'log-content' : 'log-content empty'}>
                  {r.study_content || '没有填写具体内容'}
                </p>
              </article>
            );
          })}

          {hasMore && (
            <button className="btn-secondary" style={{ width: '100%', padding: '12px', marginTop: 8, fontSize: 12.5 }} onClick={() => setPage((p) => p + 1)}>
              加载更多（{shown.length} / {sorted.length}）
            </button>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <FileText size={34} strokeWidth={1.4} color="var(--ink-4)" />
          <p>还没有记录</p>
          <span>点右上角「手动补录」，或者回到计时页专注一次。</span>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {editingRecord && (
        <EditLogModal
          record={editingRecord}
          subjects={config.subjects || []}
          onSave={onUpdateRecord}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}
