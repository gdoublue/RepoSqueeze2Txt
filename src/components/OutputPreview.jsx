import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  Hash, 
  AlignLeft, 
  Cpu 
} from 'lucide-react';

export default function OutputPreview({ 
  txtContent, 
  stats, 
  selectedCount, 
  folderName 
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!txtContent) return;
    try {
      await navigator.clipboard.writeText(txtContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleDownload = () => {
    if (!txtContent) return;
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanFolderName = (folderName || 'folder').replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_');
    a.download = `${cleanFolderName}_codebase.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="output-preview-card">
      {/* Header Bar */}
      <div className="output-header">
        <div className="output-title">
          <FileText size={18} />
          <span>生成的 TXT 内容预览</span>
        </div>
        <div className="output-actions">
          <button 
            type="button" 
            className={`btn-primary ${copied ? 'btn-success' : ''}`}
            onClick={handleCopy}
            disabled={!txtContent}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? '已复制到剪贴板' : '一键复制 TXT'}</span>
          </button>

          <button 
            type="button" 
            className="btn-secondary"
            onClick={handleDownload}
            disabled={!txtContent}
          >
            <Download size={16} />
            <span>下载 TXT 文件</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <Hash size={14} className="stat-icon" />
          <span className="stat-label">文件数量:</span>
          <span className="stat-value">{selectedCount} 项</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <AlignLeft size={14} className="stat-icon" />
          <span className="stat-label">总行数:</span>
          <span className="stat-value">{stats.lineCount?.toLocaleString() || 0} 行</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <Sparkles size={14} className="stat-icon" />
          <span className="stat-label">总字符数:</span>
          <span className="stat-value">{stats.charCount?.toLocaleString() || 0} 字符</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item highlight">
          <Cpu size={14} className="stat-icon" />
          <span className="stat-label">预估 AI Token:</span>
          <span className="stat-value">~{stats.estimatedTokens?.toLocaleString() || 0} tokens</span>
        </div>
      </div>

      {/* Code Textarea Preview */}
      <div className="output-body">
        {txtContent ? (
          <textarea
            className="txt-preview-textarea"
            value={txtContent}
            readOnly
            spellCheck={false}
          />
        ) : (
          <div className="empty-preview">
            <p>请选择文件夹并勾选要合并的文件以生成 TXT 内容。</p>
          </div>
        )}
      </div>
    </div>
  );
}
