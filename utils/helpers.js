/**
 * Parses a message text and identifies code blocks formatted with markdown-style backticks.
 * Returns an array of objects: { type: 'text' | 'code', content: string, language?: string }
 */
function parseMessageContent(text) {
  if (!text) return [];
  
  // Regex to match code blocks: ```language\ncode``` or ```\ncode```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  const result = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before the code block
    if (match.index > lastIndex) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Add the code block
    result.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2]
    });

    lastIndex = codeBlockRegex.lastIndex;
  }

  // Add remaining text after the last code block
  if (lastIndex < text.length) {
    result.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return result;
}