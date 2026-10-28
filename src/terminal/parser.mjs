// Read simple shell words without executing expansions, operators, or programs
export function parseCommand(input) {
  const tokens = [];
  let word = '';
  let started = false;
  let quote = '';
  let escaped = false;

  for (const character of input) {
    if (escaped) { word += character; escaped = false; started = true; continue; }
    if (character === '\\' && quote !== "'") { escaped = true; started = true; continue; }
    if (quote) {
      if (character === quote) quote = '';
      else word += character;
      continue;
    }
    if (character === '"' || character === "'") { quote = character; started = true; continue; }
    if (/[|;&<>`]/.test(character)) return { error: 'shell operators are not supported' };
    if (/\s/.test(character)) {
      if (started) { tokens.push(word); word = ''; started = false; }
    } else { word += character; started = true; }
  }

  // A partial word must not turn an unfinished command into a navigation
  if (quote) return { error: 'missing closing quote' };
  if (escaped) return { error: 'unfinished escape' };
  if (started) tokens.push(word);
  return { tokens };
}
