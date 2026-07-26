import React from 'react';
import { 
  CheckSquare, 
  Square, 
  Filter, 
  Search, 
  EyeOff, 
  GitBranch, 
  Layers 
} from 'lucide-react';

export default function ExtensionFilterBar({
  extensionStats,       // { js: count, tsx: count, ... }
  selectedExtensions,   // Set of extension names currently active
  onToggleExtension,    // (ext) => void
  onSelectAllExtensions,// () => void
  onDeselectAllExtensions, // () => void
  onSelectAllFiles,     // () => void
  onDeselectAllFiles,   // () => void
  isDefaultIgnoreActive,
  onToggleDefaultIgnore,
  hasGitignore,
  isGitignoreActive,
  onToggleGitignore,
  searchQuery,
  onSearchChange,
  totalFilesCount,
  selectedFilesCount
}) {
  const extensionEntries = Object.entries(extensionStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="filter-bar-container">
      {/* Top Row: Search & Global Actions */}
      <div className="filter-top-row">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="搜索文件名或路径..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button className="btn-clear-search" onClick={() => onSearchChange('')}>
              ×
            </button>
          )}
        </div>

        <div className="global-actions">
          <button className="btn-action" onClick={onSelectAllFiles} title="勾选所有可读文件">
            <CheckSquare size={14} />
            <span>全选文件</span>
          </button>
          <button className="btn-action" onClick={onDeselectAllFiles} title="取消勾选所有文件">
            <Square size={14} />
            <span>清空勾选</span>
          </button>

          {hasGitignore && (
            <button
              className={`btn-action gitignore-toggle ${isGitignoreActive ? 'active' : ''}`}
              onClick={onToggleGitignore}
              title="根据文件夹内的 .gitignore 规则忽略规则匹配的文件"
            >
              <GitBranch size={14} />
              <span>{isGitignoreActive ? '已应用 .gitignore 过滤规则' : '未启用 .gitignore 规则'}</span>
            </button>
          )}

          <button
            className={`btn-action ignore-toggle ${isDefaultIgnoreActive ? 'active' : ''}`}
            onClick={onToggleDefaultIgnore}
            title="排除 node_modules, .git, 格式图片等非文本/垃圾目录"
          >
            <EyeOff size={14} />
            <span>{isDefaultIgnoreActive ? '已自动排除常用依赖/二进制' : '包含所有系统与依赖文件'}</span>
          </button>
        </div>
      </div>

      {/* Format / Extension Quick Toggles */}
      {extensionEntries.length > 0 && (
        <div className="extension-toggles-section">
          <div className="extension-header">
            <span className="ext-title">
              <Filter size={13} />
              <span>按文件格式快速勾选 ({selectedFilesCount} / {totalFilesCount} 项选中)</span>
            </span>
            <div className="ext-quick-btns">
              <button onClick={onSelectAllExtensions} className="btn-text-link">全选格式</button>
              <span className="divider">|</span>
              <button onClick={onDeselectAllExtensions} className="btn-text-link">全不选格式</button>
            </div>
          </div>

          <div className="extension-chips-grid">
            {extensionEntries.map(([ext, count]) => {
              const isChecked = selectedExtensions.has(ext);
              const label = ext === 'no_ext' ? '无扩展名' : `.${ext}`;

              return (
                <button
                  key={ext}
                  type="button"
                  className={`ext-chip ${isChecked ? 'selected' : ''}`}
                  onClick={() => onToggleExtension(ext)}
                >
                  <span className="chip-check-indicator">{isChecked ? '✓' : ''}</span>
                  <span className="chip-label">{label}</span>
                  <span className="chip-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
