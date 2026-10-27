import { intro } from './sequence.mjs';

// Replies describe this site and never pass input to a system shell
const replies = {
  help: 'ls · cat about.txt · cat interests.txt · sl · clear\nTry ls -a to look a little closer.',
  whoami: 'locainin\nSomewhere between a terminal and an anime tab.',
  pwd: '~',
  'cat interests.txt': 'Linux desktops. Systems code. Anime.\nYes, the other window is staying.',
  'cat .secret': 'The anime window is load-bearing.',
};
const directory = [
  { label: 'articles/', href: 'articles/' },
  { label: 'projects/', href: 'projects/' },
];

export function runCommand(input) {
  const command = input.trim().replace(/\s+/g, ' ');
  if (!command || command === 'clear') return null;
  if (command === 'sl') return { action: 'train', text: '', links: [] };
  if (command === 'cat about.txt') return { text: intro.about, links: [] };
  if (command === 'ls' || command === 'ls -a') {
    return { text: `about.txt  interests.txt${command === 'ls -a' ? '  .secret' : ''}`, links: directory };
  }
  // Own-key lookup keeps names such as toString from reaching inherited properties
  const text = Object.hasOwn(replies, command) ? replies[command] : `zsh: command not found: ${command}\nTry help.`;
  return { text, links: [] };
}
