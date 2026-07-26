import React, { useRef, useState } from 'react';
import { UploadCloud, FolderPlus, FileCheck2, Loader2 } from 'lucide-react';
import { DEFAULT_IGNORE_PATTERNS, DEFAULT_IGNORE_EXTENSIONS } from '../utils/treeBuilder';

export default function FolderUploader({ onFolderLoaded, isLoading, loadedFolderName, fileCount }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Trigger file input dialog
  const handleClickSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle native file input change
  const handleInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const fileObjects = files.map((file) => ({
      file,
      name: file.name,
      relativePath: file.webkitRelativePath || file.name,
    }));

    onFolderLoaded(fileObjects);
  };

  // Handle Drag & Drop with webkitGetAsEntry recursive folder reader
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const entries = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          entries.push(entry);
        }
      }
    }

    if (entries.length === 0) return;

    const collectedFiles = [];

    // Helper to recursively traverse DirectoryEntry with EARLY DIRECTORY DROP
    async function readEntry(entry, path = '') {
      const nameLower = entry.name.toLowerCase();

      // Early drop ignored directory names at entry level!
      if (entry.isDirectory && DEFAULT_IGNORE_PATTERNS.includes(nameLower)) {
        return;
      }

      // Early drop binary extensions at entry level!
      if (entry.isFile) {
        const ext = nameLower.split('.').pop();
        if (ext && DEFAULT_IGNORE_EXTENSIONS.includes(ext)) {
          return;
        }

        return new Promise((resolve) => {
          entry.file((file) => {
            const relPath = path ? `${path}/${file.name}` : file.name;
            collectedFiles.push({
              file,
              name: file.name,
              relativePath: relPath
            });
            resolve();
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        const readEntries = () => {
          return new Promise((resolve) => {
            dirReader.readEntries(async (subEntries) => {
              if (subEntries.length === 0) {
                resolve();
              } else {
                for (const subEntry of subEntries) {
                  const newPath = path ? `${path}/${entry.name}` : entry.name;
                  await readEntry(subEntry, newPath);
                }
                // webkit reader may read in batches
                await readEntries();
                resolve();
              }
            });
          });
        };
        await readEntries();
      }
    }

    for (const entry of entries) {
      await readEntry(entry, '');
    }

    if (collectedFiles.length > 0) {
      onFolderLoaded(collectedFiles);
    }
  };

  return (
    <div
      className={`uploader-zone ${isDragging ? 'dragging' : ''} ${loadedFolderName ? 'has-folder' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClickSelect}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        webkitdirectory="true"
        directory="true"
        multiple
      />

      <div className="uploader-content">
        <div className="uploader-icon-box">
          {isLoading ? (
            <Loader2 className="icon-upload spin" size={36} />
          ) : loadedFolderName ? (
            <FileCheck2 className="icon-success" size={36} />
          ) : (
            <UploadCloud className="icon-upload" size={36} />
          )}
        </div>

        {isLoading ? (
          <div className="uploader-prompt">
            <h3>正在快速解析并过滤文件夹...</h3>
            <p>已自动忽略 node_modules、target、.jar 等构建与二进制文件</p>
          </div>
        ) : loadedFolderName ? (
          <div className="uploader-info">
            <span className="folder-name-tag">{loadedFolderName}</span>
            <span className="folder-meta-text">
              已读取 <strong>{fileCount}</strong> 个有效文件 (点击或拖拽可重新选择)
            </span>
          </div>
        ) : (
          <div className="uploader-prompt">
            <h3>点击或拖拽文件夹到此处</h3>
            <p>自动解析 .gitignore，智能过滤 jar/target/node_modules，零卡顿一键导出单文件 TXT</p>
          </div>
        )}

        <button 
          type="button" 
          className="btn-select-folder" 
          onClick={(e) => { e.stopPropagation(); handleClickSelect(); }}
          disabled={isLoading}
        >
          <FolderPlus size={16} />
          <span>{loadedFolderName ? '切换文件夹' : '选择本地文件夹'}</span>
        </button>
      </div>
    </div>
  );
}
