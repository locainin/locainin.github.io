import { locomotiveFrames } from './train-art.mjs';

export function trainAt(progress, columns = 80, rows = 18) {
  const grid = Array.from({ length: rows }, () => Array(columns).fill(' '));
  const position = Math.max(0, Math.min(1, progress));
  const engine = locomotiveFrames[Math.floor(position * 150) % locomotiveFrames.length];
  const x = Math.round(columns - position * (columns + 83));
  const y = rows - 11;
  const write = (row, column, text) => {
    if (row < 0 || row >= rows) return;
    for (let index = 0; index < text.length; index++) {
      const target = column + index;
      if (target >= 0 && target < columns) grid[row][target] = text[index];
    }
  };
  // Clip the same locomotive and tender used by the original ncurses program
  engine.forEach((line, index) => write(y + index, x, line));
  if (position > 0 && position < 1) {
    for (let puff = 0; puff < 7; puff++) {
      const age = (position * 8 + puff / 7) % 1;
      const smoke = age < .25 ? '(@)' : age < .6 ? '(   )' : '(    )';
      write(y - 1 - Math.floor(age * 6), x + 7 + Math.floor(age * 30), smoke);
    }
  }
  return grid.map((line) => line.join('')).join('\n');
}
