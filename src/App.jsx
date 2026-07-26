import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Header from './components/Header';
import FolderUploader from './components/FolderUploader';
import ExtensionFilterBar from './components/ExtensionFilterBar';
import FileTree from './components/FileTree';
import OutputPreview from './components/OutputPreview';
import { 
  buildFileTree, 
  generateAsciiTree, 
  isDefaultIgnored, 
  getAllFilePathsUnderNode 
} from './utils/treeBuilder';
import { generateConsolidatedTxt, readFileAsUtf8 } from './utils/fileReader';
import { buildGitignoreMatcher } from './utils/gitignoreParser';

export default function App() {
  const [allFiles, setAllFiles] = useState([]);
  const [isDefaultIgnoreActive, setIsDefaultIgnoreActive] = useState(true);
  const [isGitignoreActive, setIsGitignoreActive] = useState(true);
  const [gitignoreMatcher, setGitignoreMatcher] = useState(null);
  const [hasGitignore, setHasGitignore] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedExtensions, setSelectedExtensions] = useState(new Set());
  const [selectedPathsSet, setSelectedPathsSet] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  
  const [txtResult, setTxtResult] = useState({
    content: '',
    lineCount: 0,
    charCount: 0,
    estimatedTokens: 0
  });

  // Filter usable files
  const usableFiles = useMemo(() => {
    if (!allFiles || allFiles.length === 0) return [];
    
    return allFiles.filter(f => {
      const relPath = f.relativePath || f.name;

      // Check gitignore rules if active
      if (isGitignoreActive && gitignoreMatcher && gitignoreMatcher(relPath)) {
        return false;
      }

      // Check default ignore presets if active
      if (isDefaultIgnoreActive && isDefaultIgnored(relPath)) {
        return false;
      }

      return true;
    });
  }, [allFiles, isDefaultIgnoreActive, isGitignoreActive, gitignoreMatcher]);

  // Root folder name
  const rootFolderName = useMemo(() => {
    if (usableFiles.length === 0) return '';
    const firstPath = usableFiles[0].relativePath || usableFiles[0].name;
    return firstPath.split('/')[0] || 'My Folder';
  }, [usableFiles]);

  // Build tree node
  const treeRootNode = useMemo(() => {
    return buildFileTree(usableFiles);
  }, [usableFiles]);

  // Compute extension statistics
  const extensionStats = useMemo(() => {
    const stats = {};
    usableFiles.forEach((fileObj) => {
      const relPath = fileObj.relativePath || fileObj.name;
      const parts = relPath.split('.');
      const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'no_ext';
      stats[ext] = (stats[ext] || 0) + 1;
    });
    return stats;
  }, [usableFiles]);

  // FAST FIRST-PASS FILTERING UPON FOLDER UPLOAD
  const handleFolderLoaded = useCallback(async (rawFiles) => {
    setIsProcessing(true);

    try {
      // 1. First-pass scan for .gitignore files
      const gitignoreFiles = rawFiles.filter(f => {
        const name = f.name || '';
        const relPath = f.relativePath || '';
        return name === '.gitignore' || relPath.endsWith('/.gitignore');
      });

      let matcher = null;
      if (gitignoreFiles.length > 0) {
        setHasGitignore(true);
        setIsGitignoreActive(true);

        const entries = [];
        for (const gif of gitignoreFiles) {
          const text = await readFileAsUtf8(gif.file);
          const relPath = gif.relativePath || gif.name;
          const parts = relPath.split('/');
          parts.pop(); // remove '.gitignore'
          const scopeDir = parts.join('/');
          entries.push({ content: text, scopeDir });
        }

        matcher = buildGitignoreMatcher(entries);
        setGitignoreMatcher(() => matcher);
      } else {
        setHasGitignore(false);
        setGitignoreMatcher(null);
      }

      // 2. Early-drop pre-pass filtering: Drop ignored files BEFORE adding to state!
      const preFilteredFiles = rawFiles.filter(f => {
        const relPath = f.relativePath || f.name;

        // Skip gitignored files instantly
        if (matcher && matcher(relPath)) {
          return false;
        }

        // Skip heavy binary/build files instantly
        if (isDefaultIgnored(relPath)) {
          return false;
        }

        return true;
      });

      setAllFiles(preFilteredFiles);

      // Default expand root folders
      if (preFilteredFiles.length > 0) {
        const foldersToExpand = new Set();
        preFilteredFiles.forEach(f => {
          const parts = (f.relativePath || f.name).split('/');
          if (parts.length > 1) {
            foldersToExpand.add(parts[0]);
            if (parts.length > 2) {
              foldersToExpand.add(`${parts[0]}/${parts[1]}`);
            }
          }
        });
        setExpandedFolders(foldersToExpand);
      }
    } catch (err) {
      console.error('Error pre-filtering folder:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Update selected paths whenever usableFiles change
  useEffect(() => {
    if (usableFiles.length === 0) {
      setSelectedPathsSet(new Set());
      setSelectedExtensions(new Set());
      return;
    }

    const exts = new Set();
    const allPaths = new Set();

    usableFiles.forEach((f) => {
      const relPath = f.relativePath || f.name;
      const parts = relPath.split('.');
      const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'no_ext';
      exts.add(ext);
      allPaths.add(relPath);
    });

    setSelectedExtensions(exts);
    setSelectedPathsSet(allPaths);
  }, [usableFiles]);

  // Extension toggle callback
  const handleToggleExtension = useCallback((ext) => {
    setSelectedExtensions((prev) => {
      const next = new Set(prev);
      const isActivating = !next.has(ext);

      if (isActivating) {
        next.add(ext);
      } else {
        next.delete(ext);
      }

      setSelectedPathsSet((prevPaths) => {
        const nextPaths = new Set(prevPaths);
        usableFiles.forEach((fileObj) => {
          const relPath = fileObj.relativePath || fileObj.name;
          const parts = relPath.split('.');
          const fileExt = parts.length > 1 ? parts.pop().toLowerCase() : 'no_ext';

          if (fileExt === ext) {
            if (isActivating) {
              nextPaths.add(relPath);
            } else {
              nextPaths.delete(relPath);
            }
          }
        });
        return nextPaths;
      });

      return next;
    });
  }, [usableFiles]);

  const handleSelectAllExtensions = useCallback(() => {
    const allExts = new Set(Object.keys(extensionStats));
    setSelectedExtensions(allExts);

    const allPaths = new Set(usableFiles.map(f => f.relativePath || f.name));
    setSelectedPathsSet(allPaths);
  }, [extensionStats, usableFiles]);

  const handleDeselectAllExtensions = useCallback(() => {
    setSelectedExtensions(new Set());
    setSelectedPathsSet(new Set());
  }, []);

  const handleSelectAllFiles = useCallback(() => {
    const allPaths = new Set(usableFiles.map(f => f.relativePath || f.name));
    setSelectedPathsSet(allPaths);
    setSelectedExtensions(new Set(Object.keys(extensionStats)));
  }, [usableFiles, extensionStats]);

  const handleDeselectAllFiles = useCallback(() => {
    setSelectedPathsSet(new Set());
  }, []);

  // Path toggle handlers for individual tree nodes
  const handleTogglePath = useCallback((path, isChecked) => {
    setSelectedPathsSet((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  }, []);

  const handleToggleMultiplePaths = useCallback((paths, targetState) => {
    setSelectedPathsSet((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => {
        if (targetState) {
          next.add(p);
        } else {
          next.delete(p);
        }
      });
      return next;
    });
  }, []);

  // Folder Expand/Collapse
  const handleToggleFolderExpand = useCallback((folderPath) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  }, []);

  const handleExpandAllFolders = useCallback(() => {
    if (!treeRootNode) return;
    const allFolders = new Set();
    function collectFolders(node) {
      if (node.isFolder) {
        allFolders.add(node.relativePath);
        if (node.children) node.children.forEach(collectFolders);
      }
    }
    collectFolders(treeRootNode);
    setExpandedFolders(allFolders);
  }, [treeRootNode]);

  const handleCollapseAllFolders = useCallback(() => {
    setExpandedFolders(new Set());
  }, []);

  // Re-generate combined TXT whenever selected files or tree structure changes
  useEffect(() => {
    if (!usableFiles || usableFiles.length === 0 || selectedPathsSet.size === 0) {
      setTxtResult({
        content: '',
        lineCount: 0,
        charCount: 0,
        estimatedTokens: 0
      });
      return;
    }

    const selectedFileObjects = usableFiles.filter(f => 
      selectedPathsSet.has(f.relativePath || f.name)
    );

    const asciiTree = generateAsciiTree(treeRootNode, selectedPathsSet);

    generateConsolidatedTxt(selectedFileObjects, asciiTree).then((res) => {
      setTxtResult(res);
    });
  }, [usableFiles, selectedPathsSet, treeRootNode]);

  return (
    <div className="app-layout">
      <Header />

      <main className="main-content">
        {/* Upload Zone */}
        <section className="section-upload">
          <FolderUploader
            onFolderLoaded={handleFolderLoaded}
            loadedFolderName={rootFolderName}
            fileCount={usableFiles.length}
            isLoading={isProcessing}
          />
        </section>

        {usableFiles.length > 0 && (
          <>
            {/* Multi-Select & Format Filters */}
            <section className="section-filters">
              <ExtensionFilterBar
                extensionStats={extensionStats}
                selectedExtensions={selectedExtensions}
                onToggleExtension={handleToggleExtension}
                onSelectAllExtensions={handleSelectAllExtensions}
                onDeselectAllExtensions={handleDeselectAllExtensions}
                onSelectAllFiles={handleSelectAllFiles}
                onDeselectAllFiles={handleDeselectAllFiles}
                isDefaultIgnoreActive={isDefaultIgnoreActive}
                onToggleDefaultIgnore={() => {
                  setIsDefaultIgnoreActive(prev => !prev);
                }}
                hasGitignore={hasGitignore}
                isGitignoreActive={isGitignoreActive}
                onToggleGitignore={() => {
                  setIsGitignoreActive(prev => !prev);
                }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalFilesCount={usableFiles.length}
                selectedFilesCount={selectedPathsSet.size}
              />
            </section>

            {/* Split View: Tree on Left, Output Preview on Right */}
            <section className="section-split-view">
              <div className="left-pane">
                <FileTree
                  treeRootNode={treeRootNode}
                  selectedPathsSet={selectedPathsSet}
                  onTogglePath={handleTogglePath}
                  onToggleMultiplePaths={handleToggleMultiplePaths}
                  searchQuery={searchQuery}
                  expandedFolders={expandedFolders}
                  onExpandAllFolders={handleExpandAllFolders}
                  onCollapseAllFolders={handleCollapseAllFolders}
                  onToggleFolderExpand={handleToggleFolderExpand}
                />
              </div>

              <div className="right-pane">
                <OutputPreview
                  txtContent={txtResult.content}
                  stats={txtResult}
                  selectedCount={selectedPathsSet.size}
                  folderName={rootFolderName}
                />
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
