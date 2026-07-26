/**
 * Utility for parsing .gitignore rules and checking relative paths against gitignore specifications.
 */

/**
 * Converts a gitignore glob string line into a RegExp object.
 */
export function parseGitignoreLine(line, scopeDir = '') {
  let p = line.trim();
  if (!p || p.startsWith('#')) return null;

  const isNegated = p.startsWith('!');
  if (isNegated) {
    p = p.slice(1).trim();
  }

  const isDirectoryOnly = p.endsWith('/');
  if (isDirectoryOnly) {
    p = p.slice(0, -1);
  }

  const isAnchored = p.startsWith('/');
  if (isAnchored) {
    p = p.slice(1);
  }

  // Prepend scope directory if this .gitignore is in a subfolder
  const targetPattern = scopeDir ? `${scopeDir}/${p}` : p;

  // Escape regex special characters except * and ?
  let regexStr = targetPattern
    .replace(/[+^${}()|[\]\\]/g, '\\$&')
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '___GLOBSTAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/___GLOBSTAR___/g, '.*');

  if (isAnchored || scopeDir) {
    regexStr = '^' + regexStr;
  } else {
    // If not anchored, can match anywhere as path segment
    regexStr = '(?:^|/)' + regexStr;
  }

  regexStr += '(?:$|/)';

  try {
    return {
      regex: new RegExp(regexStr),
      isNegated,
      pattern: line
    };
  } catch (err) {
    return null;
  }
}

/**
 * Creates a combined gitignore matcher function from multiple .gitignore file entries.
 * entries: Array of { content: string, scopeDir: string }
 */
export function buildGitignoreMatcher(gitignoreEntries) {
  if (!gitignoreEntries || gitignoreEntries.length === 0) {
    return () => false;
  }

  const matchers = [];

  for (const entry of gitignoreEntries) {
    const lines = entry.content.split(/\r?\n/);
    for (const line of lines) {
      const parsed = parseGitignoreLine(line, entry.scopeDir);
      if (parsed) {
        matchers.push(parsed);
      }
    }
  }

  return function isIgnored(relativePath) {
    if (!relativePath) return false;

    // Remove leading slash if any
    const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;

    let ignored = false;
    for (const matcher of matchers) {
      if (matcher.regex.test(normalizedPath)) {
        ignored = !matcher.isNegated;
      }
    }
    return ignored;
  };
}
