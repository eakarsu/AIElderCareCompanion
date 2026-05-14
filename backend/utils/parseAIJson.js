/**
 * 3-strategy JSON parser for AI responses.
 * Strategy 1: Direct JSON.parse
 * Strategy 2: Strip markdown fences (```json ... ```)
 * Strategy 3: Brace/bracket depth-tracking extraction (handles strings and escapes)
 *
 * Returns the parsed value, or { rawContent, parseError } on total failure.
 */
function parseAIJson(content) {
  if (!content || typeof content !== 'string') {
    return { rawContent: content, parseError: 'Empty or invalid content' };
  }

  // Strategy 1: direct parse
  try {
    return JSON.parse(content.trim());
  } catch (_) { /* fall through */ }

  // Strategy 2: strip markdown code fences
  try {
    let cleaned = content.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return JSON.parse(cleaned.trim());
  } catch (_) { /* fall through */ }

  // Strategy 3: brace/bracket extraction with string-aware depth tracking
  try {
    const text = content.trim();
    const startObj = text.indexOf('{');
    const startArr = text.indexOf('[');
    let start = -1;
    let openChar = '';
    let closeChar = '';
    if (startObj === -1 && startArr === -1) throw new Error('no JSON delimiter');
    if (startObj === -1 || (startArr !== -1 && startArr < startObj)) {
      start = startArr; openChar = '['; closeChar = ']';
    } else {
      start = startObj; openChar = '{'; closeChar = '}';
    }
    let depth = 0, end = -1, inString = false, escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === openChar) depth++;
      else if (ch === closeChar) {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end === -1) throw new Error('unbalanced delimiters');
    return JSON.parse(text.substring(start, end + 1));
  } catch (_) { /* fall through */ }

  return { rawContent: content, parseError: 'Could not parse as JSON' };
}

module.exports = { parseAIJson };
