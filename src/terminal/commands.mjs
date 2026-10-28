import { listDirectory } from './listing.mjs';
import { parseCommand } from './parser.mjs';
import { resolveEntry } from './filesystem.mjs';

// Replies describe this site and never pass input to a system shell
const replies = {
  help: 'ls · cd articles · cd projects · cat about.txt · cat interests.txt · whoami · pwd · sl · clear',
  whoami: 'locainin\nSomewhere between a terminal and an anime tab.',
  pwd: '~',
};
const reply = (text) => ({ text, links: [] });

export function runCommand(input) {
  const parsed = parseCommand(input);
  if (parsed.error) return reply(`zsh: ${parsed.error}: ${input.trim()}`);
  const [name, ...arguments_] = parsed.tokens;
  if (name === undefined) return null;
  if (name === 'ls') return listDirectory(arguments_);

  if (name === 'cd' || name === 'cat') {
    const paths = arguments_[0] === '--' ? arguments_.slice(1) : arguments_;
    if (arguments_[0] !== '--' && paths.some(path => path.startsWith('-'))) return reply(`${name}: unsupported option\nUsage: ${name} ${name === 'cd' ? '[directory]' : 'file ...'}`);
    if (name === 'cd' && paths.length > 1) return reply('cd: too many arguments\nUsage: cd [directory]');
    if (name === 'cat' && !paths.length) return reply('cat: a file is required\nUsage: cat file ...');
    const resolved = (paths.length ? paths : ['~']).map(path => ({ path, ...resolveEntry(path) }));
    for (const { path, entry, error } of resolved) {
      if (error) return reply(`${name}: ${path}: ${error}`);
      if (name === 'cd' && !entry.children) return reply(`cd: ${path}: not a directory`);
      if (name === 'cat' && entry.children) return reply(`cat: ${path}: is a directory`);
    }
    // Navigation destinations come only from known site records, never from raw input
    if (name === 'cd') return { action: 'navigate', href: resolved[0].entry.href, text: '', links: [] };
    return reply(resolved.map(({ entry }) => entry.content).join('\n'));
  }

  if (name === 'clear' || name === 'sl' || Object.hasOwn(replies, name)) {
    if (arguments_.length) return reply(`${name}: too many arguments\nUsage: ${name}`);
    if (name === 'clear') return { action: 'clear', text: '', links: [] };
    if (name === 'sl') return { action: 'train', text: '', links: [] };
    return reply(replies[name]);
  }
  return reply(`zsh: command not found: ${name || "''"}`);
}
