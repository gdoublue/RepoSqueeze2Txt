/**
 * Standard list of common ignored directory and file names.
 */
export const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.idea',
  '.vscode',
  '.ds_store',
  'dist',
  'build',
  'target',
  'out',
  'bin',
  '.gradle',
  '.mvn',
  'coverage',
  '.next',
  '.nuxt',
  '__pycache__',
  '.pytest_cache',
  'venv',
  '.venv'
];

export const DEFAULT_IGNORE_EXTENSIONS = [
  'jar', 'war', 'ear', 'class',
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp', 'bmp',
  'mp4', 'webm', 'ogg', 'mp3', 'wav',
  'zip', 'tar', 'gz', '7z', 'rar',
  'exe', 'dll', 'so', 'dylib', 'bin',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'ttf', 'woff', 'woff2', 'eot', 'otf',
  'sqlite', 'db'
];

/**
 * Check if a file path or extension matches default ignore rules.
 */
export function isDefaultIgnored(relativePath) {
  const parts = relativePath.split('/');
  for (const part of parts) {
    if (DEFAULT_IGNORE_PATTERNS.includes(part.toLowerCase())) {
      return true;
    }
  }
  const ext = relativePath.split('.').pop()?.toLowerCase();
  if (ext && DEFAULT_IGNORE_EXTENSIONS.includes(ext)) {
    return true;
  }
  return false;
}

/**
 * Normalizes file paths and builds a structured tree object.
 */
export function buildFileTree(files) {
  if (!files || files.length === 0) return null;

  const root = {
    id: 'root',
    name: 'root',
    relativePath: '',
    isFolder: true,
    children: [],
    filesCount: 0
  };

  const pathMap = { '': root };

  files.forEach((fileObj) => {
    // webkitRelativePath or custom relativePath
    const pathParts = (fileObj.relativePath || fileObj.name).split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!pathMap[currentPath]) {
        const node = {
          id: currentPath,
          name: part,
          relativePath: currentPath,
          isFolder: !isLast,
          parentPath: parentPath,
          children: !isLast ? [] : undefined,
          file: isLast ? fileObj.file : undefined,
          extension: isLast ? (part.includes('.') ? part.split('.').pop().toLowerCase() : 'no_ext') : undefined,
          size: isLast ? fileObj.file?.size || 0 : 0
        };

        pathMap[currentPath] = node;

        const parentNode = pathMap[parentPath] || root;
        if (parentNode.children) {
          parentNode.children.push(node);
        }
      }
    }
  });

  // Sort tree: Folders first, then files alphabetically
  function sortNodes(node) {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      node.children.forEach(sortNodes);
    }
  }

  sortNodes(root);

  // If there's a single top-level directory root wrapper, return its direct children or root
  if (root.children.length === 1 && root.children[0].isFolder) {
    return root.children[0];
  }

  return root;
}

/**
 * Generates ASCII directory tree representation from selected file paths.
 */
export function generateAsciiTree(treeNode, selectedPathsSet) {
  if (!treeNode) return '';

  let outputLines = [];

  function traverse(node, prefix = '', isLast = true, isRoot = false) {
    // Check if node or any of its children are selected
    const isSelected = isNodeSelectedOrHasSelectedChildren(node, selectedPathsSet);
    if (!isSelected && !isRoot) return;

    if (isRoot) {
      outputLines.push(`${node.name}/`);
    } else {
      const connector = isLast ? '└── ' : '├── ';
      const folderSuffix = node.isFolder ? '/' : '';
      outputLines.push(`${prefix}${connector}${node.name}${folderSuffix}`);
    }

    if (node.isFolder && node.children) {
      const visibleChildren = node.children.filter(child => 
        isNodeSelectedOrHasSelectedChildren(child, selectedPathsSet)
      );

      const nextPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
      visibleChildren.forEach((child, index) => {
        traverse(child, nextPrefix, index === visibleChildren.length - 1, false);
      });
    }
  }

  traverse(treeNode, '', true, true);
  return outputLines.join('\n');
}

/**
 * Helper to check if node itself or descendant file is in selected set.
 */
export function isNodeSelectedOrHasSelectedChildren(node, selectedPathsSet) {
  if (!node.isFolder) {
    return selectedPathsSet.has(node.relativePath);
  }
  if (!node.children) return false;
  return node.children.some(child => isNodeSelectedOrHasSelectedChildren(child, selectedPathsSet));
}

/**
 * Collect all file relative paths under a node.
 */
export function getAllFilePathsUnderNode(node) {
  const paths = [];
  function collect(n) {
    if (!n.isFolder) {
      paths.push(n.relativePath);
    } else if (n.children) {
      n.children.forEach(collect);
    }
  }
  collect(node);
  return paths;
}
