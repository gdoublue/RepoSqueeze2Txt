import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  FileImage, 
  File 
} from 'lucide-react';
import { getAllFilePathsUnderNode } from '../utils/treeBuilder';

function getFileIcon(extension) {
  switch (extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'cs':
    case 'go':
    case 'rs':
    case 'php':
    case 'html':
    case 'css':
    case 'scss':
    case 'vue':
      return <FileCode size={16} className="icon-code" />;
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'xml':
      return <FileJson size={16} className="icon-json" />;
    case 'md':
    case 'txt':
    case 'doc':
      return <FileText size={16} className="icon-text" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'gif':
    case 'webp':
      return <FileImage size={16} className="icon-image" />;
    default:
      return <File size={16} className="icon-file" />;
  }
}

export default function FileTreeNode({
  node,
  selectedPathsSet,
  onTogglePath,
  onToggleMultiplePaths,
  searchQuery,
  expandedFolders,
  onToggleFolderExpand
}) {
  if (!node) return null;

  const isFolder = node.isFolder;
  const path = node.relativePath;
  const isExpanded = expandedFolders.has(path);

  // Determine folder selection state (checked, unchecked, or indeterminate)
  let isChecked = false;
  let isIndeterminate = false;

  if (isFolder) {
    const allChildPaths = getAllFilePathsUnderNode(node);
    if (allChildPaths.length > 0) {
      const selectedChildrenCount = allChildPaths.filter(p => selectedPathsSet.has(p)).length;
      if (selectedChildrenCount === allChildPaths.length) {
        isChecked = true;
      } else if (selectedChildrenCount > 0) {
        isIndeterminate = true;
      }
    }
  } else {
    isChecked = selectedPathsSet.has(path);
  }

  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (isFolder) {
      const allChildPaths = getAllFilePathsUnderNode(node);
      // If currently checked or indeterminate -> deselect all, else select all
      const targetState = !(isChecked && !isIndeterminate);
      onToggleMultiplePaths(allChildPaths, targetState);
    } else {
      onTogglePath(path, !isChecked);
    }
  };

  const handleRowClick = () => {
    if (isFolder) {
      onToggleFolderExpand(path);
    } else {
      onTogglePath(path, !isChecked);
    }
  };

  // Filter check if search active
  if (searchQuery) {
    const lowerSearch = searchQuery.toLowerCase();
    if (isFolder) {
      const allChildPaths = getAllFilePathsUnderNode(node);
      const matchesChild = allChildPaths.some(p => p.toLowerCase().includes(lowerSearch));
      if (!matchesChild && !node.name.toLowerCase().includes(lowerSearch)) {
        return null;
      }
    } else {
      if (!node.name.toLowerCase().includes(lowerSearch) && !path.toLowerCase().includes(lowerSearch)) {
        return null;
      }
    }
  }

  return (
    <div className="tree-node-wrapper">
      <div 
        className={`tree-node-row ${isChecked ? 'selected-row' : ''}`}
        onClick={handleRowClick}
      >
        <div className="tree-node-left">
          {/* Arrow icon for folders */}
          {isFolder ? (
            <button
              type="button"
              className="btn-fold-toggle"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFolderExpand(path);
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <span className="tree-indent-spacer" />
          )}

          {/* Custom styled checkbox with indeterminate support */}
          <label className="checkbox-container" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isChecked}
              ref={(input) => {
                if (input) {
                  input.indeterminate = isIndeterminate;
                }
              }}
              onChange={handleCheckboxChange}
            />
            <span className="checkmark" />
          </label>

          {/* Node Icon & Name */}
          <span className="node-icon">
            {isFolder ? (
              isExpanded ? <FolderOpen size={16} className="icon-folder" /> : <Folder size={16} className="icon-folder" />
            ) : (
              getFileIcon(node.extension)
            )}
          </span>

          <span className="node-name">{node.name}</span>
        </div>

        {/* File Size or Folder Count meta */}
        <div className="tree-node-right">
          {isFolder ? (
            <span className="meta-badge folder-badge">
              {getAllFilePathsUnderNode(node).length} 个文件
            </span>
          ) : (
            <span className="meta-badge file-badge">
              {(node.size / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
      </div>

      {/* Render Folder Children */}
      {isFolder && (isExpanded || searchQuery) && node.children && node.children.length > 0 && (
        <div className="tree-children-container">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              selectedPathsSet={selectedPathsSet}
              onTogglePath={onTogglePath}
              onToggleMultiplePaths={onToggleMultiplePaths}
              searchQuery={searchQuery}
              expandedFolders={expandedFolders}
              onToggleFolderExpand={onToggleFolderExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}
