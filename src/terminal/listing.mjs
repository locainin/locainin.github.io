import { intro } from './sequence.mjs';
import { resolveEntry } from './filesystem.mjs';

// Permission bits describe this virtual tree, never the host's actual files
function label(entry, long) {
  const directory = Boolean(entry.children);
  const name = `${entry.name}${directory && !['.', '..'].includes(entry.name) ? '/' : ''}`;
  if (!long) return name;
  const bytes = directory ? 0 : new TextEncoder().encode(entry.content).length;
  return `${directory ? 'drwxr-xr-x 2' : '-rw-r--r-- 1'} ${intro.name} ${intro.name} ${String(bytes).padStart(3)} ${name}`;
}

export function listDirectory(arguments_) {
  let all = false;
  let long = false;
  let options = true;
  const paths = [];
  const invalid = (detail) => ({ text: `ls: ${detail}\nUsage: ls [-al] [--all] [path]`, links: [] });

  for (const argument of arguments_) {
    if (options && argument === '--') { options = false; continue; }
    if (options && argument === '--all') { all = true; continue; }
    if (options && /^-[al]+$/.test(argument)) {
      all ||= argument.includes('a');
      long ||= argument.includes('l');
      continue;
    }
    if (options && argument.startsWith('-')) return invalid(`unsupported option: ${argument}`);
    paths.push(argument);
  }
  if (paths.length > 1) return invalid('too many paths');
  const { entry, error } = resolveEntry(paths[0] ?? '.');
  if (error) return invalid(`${paths[0]}: ${error}`);

  const entries = entry.children ? entry.children.filter(child => all || !child.name.startsWith('.')) : [entry];
  // Dot entries stay plain text so they cannot navigate outside a hosted site prefix
  const dots = all && entry.children ? [{ name: '.', children: [] }, { name: '..', children: [] }] : [];
  const files = entries.filter(child => !child.children);
  const directories = entries.filter(child => child.children);
  return {
    text: [...dots, ...files].map(entry => label(entry, long)).join(long ? '\n' : '  '),
    links: directories.map(entry => ({ label: label(entry, long), href: entry.href })),
    format: long ? 'long' : 'short',
  };
}
