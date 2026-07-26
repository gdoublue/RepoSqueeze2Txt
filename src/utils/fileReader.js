/**
 * Reads a single file as UTF-8 text using FileReader.
 */
export function readFileAsUtf8(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve('[Error: File not found]');
      return;
    }
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result || '');
    };

    reader.onerror = () => {
      resolve('[Error reading file as UTF-8]');
    };

    try {
      reader.readAsText(file, 'UTF-8');
    } catch (err) {
      resolve(`[Error: ${err.message}]`);
    }
  });
}

/**
 * Reads all selected files and constructs the consolidated TXT content.
 * 
 * Format:
 * 目录树:
 * <Ascii Directory Tree>
 * 
 * # <relativePath> ---start ---
 * <file content>
 * # <relativePath> ---end ---
 */
export async function generateConsolidatedTxt(selectedFileObjects, asciiTreeText, onProgress) {
  const chunks = [];

  if (asciiTreeText) {
    chunks.push(`文件夹目录树:\n${asciiTreeText}\n\n`);
  }

  let processedCount = 0;
  const totalCount = selectedFileObjects.length;

  for (const fileObj of selectedFileObjects) {
    const relativePath = fileObj.relativePath || fileObj.name;
    const file = fileObj.file;

    let content = '';
    if (file) {
      content = await readFileAsUtf8(file);
    } else {
      content = '[Empty or inaccessible file]';
    }

    // Standard format requested by user
    chunks.push(`# ${relativePath} ---start ---\n${content}\n# ${relativePath} ---end ---\n\n`);

    processedCount++;
    if (onProgress) {
      onProgress(processedCount, totalCount);
    }
  }

  const finalResult = chunks.join('');
  
  // Calculate line count, char count, and estimated tokens (~4 chars per token)
  const lineCount = finalResult.split('\n').length;
  const charCount = finalResult.length;
  const estimatedTokens = Math.ceil(charCount / 3.8);

  return {
    content: finalResult,
    lineCount,
    charCount,
    estimatedTokens
  };
}
