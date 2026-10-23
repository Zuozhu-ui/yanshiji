import React from 'react';
import { Home, BarChart3, BookOpen, Settings, Timer } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings }) {
  const item = (id, label, Icon) => {
    const on = activeTab === id;
    return (
      <button key={id} className={`tab ${on ? 'on' : ''}`} onClick={() => setActiveTab(id)}>
        <Icon size={20} strokeWidth={on ? 2.2 : 1.7} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <nav className="tabbar">
      {item('home', '首页', Home)}
      {item('stats', '统计', BarChart3)}

      <button
        className={`fab ${activeTab === 'timer' ? 'on' : ''}`}
        onClick={() => setActiveTab('timer')}
        aria-label="开始计时"
      >
        <Timer size={24} strokeWidth={1.9} />
      </button>

      {item('log', '日志', BookOpen)}

      <button className="tab" onClick={onOpenSettings} aria-label="我的">
        <Settings size={20} strokeWidth={1.7} />
        <span>我的</span>
      </button>
    </nav>
  );
}
