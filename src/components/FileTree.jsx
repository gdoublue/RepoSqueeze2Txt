import React from 'react';
import { FolderTree, ChevronsDown, ChevronsUp } from 'lucide-react';
import FileTreeNode from './FileTreeNode';

export default function FileTree({
  treeRootNode,
  selectedPathsSet,
  onTogglePath,
  onToggleMultiplePaths,
  searchQuery,
  expandedFolders,
  onExpandAllFolders,
  onCollapseAllFolders,
  onToggleFolderExpand
}) {
  if (!treeRootNode) return null;

  return (
    <div className="file-tree-card">
      <div className="file-tree-header">
        <div className="tree-title">
          <FolderTree size={18} />
          <span>目录结构树</span>
        </div>
        <div className="tree-actions">
          <button className="btn-icon-text" onClick={onExpandAllFolders} title="展开所有文件夹">
            <ChevronsDown size={14} />
            <span>展开全部</span>
          </button>
          <button className="btn-icon-text" onClick={onCollapseAllFolders} title="折叠所有文件夹">
            <ChevronsUp size={14} />
            <span>折叠全部</span>
          </button>
        </div>
      </div>

      <div className="file-tree-body">
        <FileTreeNode
          node={treeRootNode}
          selectedPathsSet={selectedPathsSet}
          onTogglePath={onTogglePath}
          onToggleMultiplePaths={onToggleMultiplePaths}
          searchQuery={searchQuery}
          expandedFolders={expandedFolders}
          onToggleFolderExpand={onToggleFolderExpand}
        />
      </div>
    </div>
  );
}
