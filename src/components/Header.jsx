import React from 'react';
import { FolderCode, FileText, Sparkles, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="header-container">
      <div className="header-content">
        <div className="logo-badge">
          <FolderCode className="logo-icon" size={28} />
          <span className="logo-title">Project2TXT</span>
        </div>
        <div className="header-text">
          <h1>快速本地文件夹转 TXT 服务</h1>
          <p>
            支持目录树可视化、极速多选、智能格式过滤与 UTF-8 编码合并打包，完美对接 AI Prompt 与代码文档。
          </p>
        </div>
      </div>
      <div className="header-features">
        <div className="feature-pill">
          <ShieldCheck size={14} />
          <span>本地纯前端解析 (无需上传服务器)</span>
        </div>
        <div className="feature-pill">
          <Sparkles size={14} />
          <span>支持多选/全选/拖拽</span>
        </div>
      </div>
    </header>
  );
}
