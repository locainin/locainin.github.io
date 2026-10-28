// History stays in memory and drops old commands after fifty submissions
export function createCommandHistory() {
  const entries = [];
  let cursor = null;
  let draft = '';

  return {
    record(input) {
      const command = input.trim();
      if (command && command !== entries.at(-1)) {
        entries.push(command);
        if (entries.length > 50) entries.shift();
      }
      cursor = null;
      draft = '';
    },
    previous(line) {
      if (!entries.length) return line;
      // The unfinished line returns after moving past the newest history entry
      if (cursor === null) { draft = line; cursor = entries.length; }
      cursor = Math.max(0, cursor - 1);
      return entries[cursor];
    },
    next(line) {
      if (cursor === null) return line;
      if (cursor < entries.length - 1) return entries[++cursor];
      cursor = null;
      return draft;
    },
  };
}
